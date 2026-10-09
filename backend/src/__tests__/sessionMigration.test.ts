import { pool } from '../config/database';
import { migrateSessions } from '../config/sessionMigration';

test('migration completes atomically under a database lock and releases the client', async () => {
  const query = jest.fn().mockResolvedValue({});
  const release = jest.fn();
  jest.spyOn(pool, 'connect').mockImplementation(async () => ({ query, release }) as never);
  await migrateSessions();
  expect(query.mock.calls[0][0]).toBe('BEGIN');
  expect(query.mock.calls[1][0]).toContain('pg_advisory_xact_lock');
  expect(query.mock.calls[2][0]).toContain('CREATE TABLE IF NOT EXISTS sesiones_refresh');
  expect(query.mock.calls[3][0]).toBe('COMMIT');
  expect(release).toHaveBeenCalledTimes(1);
});

test('migration failure rolls back and propagates instead of accepting API traffic', async () => {
  const query = jest.fn().mockResolvedValue({});
  query.mockResolvedValueOnce({}).mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('DDL rejected'));
  const release = jest.fn();
  jest.spyOn(pool, 'connect').mockImplementation(async () => ({ query, release }) as never);
  await expect(migrateSessions()).rejects.toThrow('DDL rejected');
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(release).toHaveBeenCalledTimes(1);
});
