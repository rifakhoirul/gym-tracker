import { createExercise } from './database';
import { SQLiteDatabase } from 'expo-sqlite';

describe('database', () => {
  describe('createExercise', () => {
    it('throws an error if the name is empty', async () => {
      const mockDb = {} as SQLiteDatabase;
      await expect(createExercise(mockDb, { name: '   ' })).rejects.toThrow('Exercise name is required.');
      await expect(createExercise(mockDb, { name: '' })).rejects.toThrow('Exercise name is required.');
    });
  });
});
