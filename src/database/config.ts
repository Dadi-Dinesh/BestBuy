export interface DatabaseConfig {
  adapter: 'mock' | 'postgres' | 'mysql' | 'sqlite';
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    adapter: (process.env.DATA_ADAPTER as DatabaseConfig['adapter']) || 'mock',
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
    database: process.env.DATABASE_NAME || 'bestbuy_db',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    ssl: process.env.DATABASE_SSL === 'true',
  };
}
