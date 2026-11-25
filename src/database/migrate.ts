import { indiaCatalogue } from '../data/indiaCatalogue';
import { config } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createPostgresPool } from './postgres';

export async function migrate() {
  const pool = createPostgresPool(process.env.DATABASE_URL);
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('bestbuy:schema-migrations'))");
      await client.query('CREATE SCHEMA IF NOT EXISTS bestbuy');
      await client.query(`CREATE TABLE IF NOT EXISTS bestbuy.schema_migrations (
        version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
      )`);
      for (const [version,file] of [[1,'001_initial.sql'],[2,'002_india.sql'],[3,'003_marketplace_identity.sql']] as const) {
        const applied=await client.query('SELECT 1 FROM bestbuy.schema_migrations WHERE version=$1',[version]);
        if (applied.rowCount) continue;
        await client.query(await readFile(resolve(__dirname,'../../../src/database/migrations',file),'utf8'));
        if (version===2) for (const car of indiaCatalogue) {
          await client.query('INSERT INTO bestbuy.india_catalogue(id,details) VALUES ($1,$2)',[car.id,car]);
        }
        await client.query('INSERT INTO bestbuy.schema_migrations(version) VALUES ($1)',[version]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally { client.release(); }
  } finally { await pool.end(); }
}

if (require.main === module) {
  config({ path: process.env.BESTBUY_ENV_FILE || '.env', quiet: true });
  migrate().then(
    () => console.log('BestBuy database schema is current.'),
    (error: { code?: string }) => {
      console.error('BestBuy migration failed.', error.code ?? 'Check database configuration and access.');
      process.exitCode = 1;
    },
  );
}
