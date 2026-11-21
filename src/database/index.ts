import { IDatabaseAdapter } from './IDatabaseAdapter';
import { DatabaseConfig, getDatabaseConfig } from './config';
import { MockDatabaseAdapter } from './adapters/MockDatabaseAdapter';
import { PostgresDatabaseAdapter } from './adapters/PostgresDatabaseAdapter';

let cachedAdapter: IDatabaseAdapter | null = null;

export function getDatabaseAdapter(overrideConfig?: Partial<DatabaseConfig>): IDatabaseAdapter {
  if (cachedAdapter && !overrideConfig) {
    return cachedAdapter;
  }

  const config = { ...getDatabaseConfig(), ...overrideConfig };

  switch (config.adapter) {
    case 'postgres':
      cachedAdapter = new PostgresDatabaseAdapter(config);
      break;
    case 'mock':
    default:
      cachedAdapter = new MockDatabaseAdapter();
      break;
  }

  return cachedAdapter;
}

export * from './IDatabaseAdapter';
export * from './config';
