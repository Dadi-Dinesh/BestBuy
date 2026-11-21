import { MockDatabaseAdapter } from '../database/adapters/MockDatabaseAdapter';
import { getDatabaseAdapter } from '../database';

export { MockDatabaseAdapter };

export function getMockAdapter() {
  return getDatabaseAdapter();
}

export type DataAdapter = ReturnType<typeof getMockAdapter>;
