import { Pool } from 'pg';

export function createPostgresPool(connectionString?: string) {
  if (!connectionString) throw new Error('DATABASE_URL is required when DATA_ADAPTER is postgres.');
  let url: URL;
  try {
    url = new URL(connectionString);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.username || !url.pathname.slice(1)) {
      throw new Error();
    }
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
  return new Pool({
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    ssl: { rejectUnauthorized: true },
    enableChannelBinding: true,
    connectionTimeoutMillis: 8000,
    application_name: 'BestBuy',
    max: 5,
  });
}
