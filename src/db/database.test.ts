import { getPreference } from './database';
import type { SQLiteDatabase } from 'expo-sqlite';

describe('database getPreference', () => {
  it('returns the value when preference exists', async () => {
    const mockDb = {
      getFirstAsync: jest.fn().mockResolvedValue({ value: 'kg' }),
    } as unknown as SQLiteDatabase;

    const result = await getPreference(mockDb, 'unit');

    expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT value FROM preferences WHERE key = ?', 'unit');
    expect(result).toBe('kg');
  });

  it('returns null when preference does not exist', async () => {
    const mockDb = {
      getFirstAsync: jest.fn().mockResolvedValue(null),
    } as unknown as SQLiteDatabase;

    const result = await getPreference(mockDb, 'unit');

    expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT value FROM preferences WHERE key = ?', 'unit');
    expect(result).toBeNull();
  });

  it('returns null when preference row exists but has no value', async () => {
    const mockDb = {
      getFirstAsync: jest.fn().mockResolvedValue({}),
    } as unknown as SQLiteDatabase;

    const result = await getPreference(mockDb, 'unit');

    expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT value FROM preferences WHERE key = ?', 'unit');
    expect(result).toBeNull();
  });
});
