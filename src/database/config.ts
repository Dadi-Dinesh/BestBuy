export interface DatabaseConfig {
  adapter: 'mock' | 'postgres';
  url?: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  const adapter = process.env.DATA_ADAPTER || 'mock';
  if (adapter !== 'mock' && adapter !== 'postgres') throw new Error('Choose mock or postgres in DATA_ADAPTER.');
  return { adapter, url: process.env.DATABASE_URL };
}
