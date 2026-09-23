import type { SQLiteDatabase } from 'expo-sqlite';

export type RoutineSummary = {
  id: string;
  name: string;
  notes: string | null;
  exerciseCount: number;
  lastCompletedAt: string | null;
};

export type WorkoutSet = {
  id: string;
  setNumber: number;
  setType: 'warmup' | 'working';
  weight: number | null;
  reps: number | null;
  completed: number;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  position: number;
  targetWeight: number | null;
  targetReps: number | null;
  sets: WorkoutSet[];
};

export type WorkoutDetail = {
  id: string;
  name: string;
  status: 'in_progress' | 'completed';
  startedAt: string;
  completedAt: string | null;
  exercises: WorkoutExercise[];
};

export type HistoryItem = {
  id: string;
  name: string;
  startedAt: string;
  completedAt: string;
  completedSets: number;
  volume: number;
};

export type ExerciseOption = {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
};

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      muscle_group TEXT,
      equipment TEXT,
      is_custom INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS routine_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      routine_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      target_sets INTEGER NOT NULL DEFAULT 3,
      target_reps INTEGER,
      target_weight REAL,
      rest_seconds INTEGER NOT NULL DEFAULT 90,
      FOREIGN KEY (routine_id) REFERENCES routines(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      routine_id TEXT,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      workout_id TEXT NOT NULL,
      exercise_id TEXT,
      exercise_name TEXT NOT NULL,
      position INTEGER NOT NULL,
      target_reps INTEGER,
      target_weight REAL,
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );
    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY NOT NULL,
      workout_exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      set_type TEXT NOT NULL DEFAULT 'working',
      weight REAL,
      reps INTEGER,
      completed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id)
    );
    CREATE INDEX IF NOT EXISTS idx_workouts_status ON workouts(status);
    CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id);
    CREATE INDEX IF NOT EXISTS idx_sets_workout_exercise ON sets(workout_exercise_id);
  `);

  const exerciseCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM exercises');
  if ((exerciseCount?.count ?? 0) > 0) return;

  const createdAt = now();
  const exercises = [
    ['barbell-bench-press', 'Barbell bench press', 'Chest', 'Barbell'],
    ['lat-pulldown', 'Lat pulldown', 'Back', 'Cable machine'],
    ['barbell-squat', 'Barbell squat', 'Legs', 'Barbell'],
    ['romanian-deadlift', 'Romanian deadlift', 'Hamstrings', 'Barbell'],
    ['dumbbell-shoulder-press', 'Dumbbell shoulder press', 'Shoulders', 'Dumbbells'],
    ['cable-row', 'Seated cable row', 'Back', 'Cable machine'],
  ];

  for (const [exerciseId, name, muscleGroup, equipment] of exercises) {
    await db.runAsync(
      'INSERT INTO exercises (id, name, muscle_group, equipment, created_at) VALUES (?, ?, ?, ?, ?)',
      exerciseId,
      name,
      muscleGroup,
      equipment,
      createdAt,
    );
  }

  const routineId = 'starter-full-body';
  await db.runAsync(
    'INSERT INTO routines (id, name, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    routineId,
    'Starter full body',
    'A balanced routine to begin tracking your progress.',
    createdAt,
    createdAt,
  );

  const routineExercises = [
    ['starter-1', 'barbell-squat', 1, 3, 8, 40],
    ['starter-2', 'barbell-bench-press', 2, 3, 10, 30],
    ['starter-3', 'lat-pulldown', 3, 3, 10, 35],
  ];
  for (const [rowId, exerciseId, position, targetSets, targetReps, targetWeight] of routineExercises) {
    await db.runAsync(
      `INSERT INTO routine_exercises
       (id, routine_id, exercise_id, position, target_sets, target_reps, target_weight)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      rowId,
      routineId,
      exerciseId,
      position,
      targetSets,
      targetReps,
      targetWeight,
    );
  }
}

export async function getPreference(db: SQLiteDatabase, key: string) {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM preferences WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setPreference(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    `INSERT INTO preferences (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

export async function getExercises(db: SQLiteDatabase): Promise<ExerciseOption[]> {
  return db.getAllAsync<ExerciseOption>(`
    SELECT id, name, muscle_group AS muscleGroup, equipment
    FROM exercises
    WHERE archived = 0
    ORDER BY name ASC
  `);
}

export async function createExercise(
  db: SQLiteDatabase,
  input: { name: string; muscleGroup?: string | null; equipment?: string | null },
) {
  const trimmedName = input.name.trim();
  if (!trimmedName) throw new Error('Exercise name is required.');

  const exerciseId = id('exercise');
  await db.runAsync(
    `INSERT INTO exercises (id, name, muscle_group, equipment, is_custom, archived, created_at)
     VALUES (?, ?, ?, ?, 1, 0, ?)`,
    exerciseId,
    trimmedName,
    input.muscleGroup?.trim() || null,
    input.equipment?.trim() || null,
    now(),
  );

  return exerciseId;
}

export async function createRoutine(
  db: SQLiteDatabase,
  name: string,
  notes: string | null,
  exerciseIds: string[],
) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Routine name is required.');
  if (exerciseIds.length === 0) throw new Error('Add at least one exercise to the routine.');

  const routineId = id('routine');
  const createdAt = now();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO routines (id, name, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      routineId,
      trimmedName,
      notes?.trim() || null,
      createdAt,
      createdAt,
    );

    for (let index = 0; index < exerciseIds.length; index += 1) {
      const exerciseId = exerciseIds[index];
      const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM exercises WHERE id = ?', exerciseId);
      if (!existing) continue;

      await db.runAsync(
        `INSERT INTO routine_exercises
         (id, routine_id, exercise_id, position, target_sets, target_reps, target_weight, rest_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id('routine-exercise'),
        routineId,
        exerciseId,
        index + 1,
        3,
        null,
        null,
        90,
      );
    }
  });

  return routineId;
}

export async function getRoutineSummaries(db: SQLiteDatabase): Promise<RoutineSummary[]> {
  return db.getAllAsync<RoutineSummary>(`
    SELECT r.id, r.name, r.notes, COUNT(re.id) AS exerciseCount,
      MAX(w.completed_at) AS lastCompletedAt
    FROM routines r
    LEFT JOIN routine_exercises re ON re.routine_id = r.id
    LEFT JOIN workouts w ON w.routine_id = r.id AND w.status = 'completed'
    GROUP BY r.id
    ORDER BY r.updated_at DESC
  `);
}

export async function getActiveWorkout(db: SQLiteDatabase) {
  return db.getFirstAsync<{ id: string; name: string }>(
    "SELECT id, name FROM workouts WHERE status = 'in_progress' ORDER BY started_at DESC LIMIT 1",
  );
}

export async function startWorkoutFromRoutine(db: SQLiteDatabase, routineId: string) {
  const routine = await db.getFirstAsync<{ name: string }>('SELECT name FROM routines WHERE id = ?', routineId);
  if (!routine) throw new Error('Routine not found.');

  const activeWorkout = await getActiveWorkout(db);
  if (activeWorkout) return activeWorkout.id;

  const workoutId = id('workout');
  const startedAt = now();
  const exercises = await db.getAllAsync<{
    exerciseId: string;
    exerciseName: string;
    position: number;
    targetReps: number | null;
    targetWeight: number | null;
  }>(`
    SELECT re.exercise_id AS exerciseId, e.name AS exerciseName, re.position,
      re.target_reps AS targetReps, re.target_weight AS targetWeight
    FROM routine_exercises re
    JOIN exercises e ON e.id = re.exercise_id
    WHERE re.routine_id = ?
    ORDER BY re.position ASC
  `, routineId);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO workouts (id, routine_id, name, status, started_at) VALUES (?, ?, ?, ?, ?)',
      workoutId,
      routineId,
      routine.name,
      'in_progress',
      startedAt,
    );
    for (const exercise of exercises) {
      await db.runAsync(
        `INSERT INTO workout_exercises
         (id, workout_id, exercise_id, exercise_name, position, target_reps, target_weight)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id('workout-exercise'),
        workoutId,
        exercise.exerciseId,
        exercise.exerciseName,
        exercise.position,
        exercise.targetReps,
        exercise.targetWeight,
      );
    }
  });

  return workoutId;
}

export async function getWorkoutDetail(db: SQLiteDatabase, workoutId: string): Promise<WorkoutDetail | null> {
  const workout = await db.getFirstAsync<{
    id: string;
    name: string;
    status: 'in_progress' | 'completed';
    startedAt: string;
    completedAt: string | null;
  }>(`
    SELECT id, name, status, started_at AS startedAt, completed_at AS completedAt
    FROM workouts WHERE id = ?
  `, workoutId);
  if (!workout) return null;

  const exercises = await db.getAllAsync<Omit<WorkoutExercise, 'sets'>>(`
    SELECT id, exercise_id AS exerciseId, exercise_name AS exerciseName, position,
      target_weight AS targetWeight, target_reps AS targetReps
    FROM workout_exercises WHERE workout_id = ? ORDER BY position ASC
  `, workoutId);

  const withSets = await Promise.all(exercises.map(async (exercise) => ({
    ...exercise,
    sets: await db.getAllAsync<WorkoutSet>(`
      SELECT id, set_number AS setNumber, set_type AS setType, weight, reps, completed
      FROM sets WHERE workout_exercise_id = ? ORDER BY set_number ASC
    `, exercise.id),
  })));

  return { ...workout, exercises: withSets };
}

export async function addSet(db: SQLiteDatabase, workoutExerciseId: string, targetWeight: number | null, targetReps: number | null) {
  const latest = await db.getFirstAsync<{ setNumber: number; weight: number | null; reps: number | null }>(`
    SELECT set_number AS setNumber, weight, reps FROM sets
    WHERE workout_exercise_id = ? ORDER BY set_number DESC LIMIT 1
  `, workoutExerciseId);
  const setId = id('set');
  await db.runAsync(
    `INSERT INTO sets (id, workout_exercise_id, set_number, weight, reps)
     VALUES (?, ?, ?, ?, ?)`,
    setId,
    workoutExerciseId,
    (latest?.setNumber ?? 0) + 1,
    latest?.weight ?? targetWeight,
    latest?.reps ?? targetReps,
  );
  return setId;
}

export async function saveSet(db: SQLiteDatabase, setId: string, weight: number | null, reps: number | null, completed: boolean) {
  await db.runAsync(
    'UPDATE sets SET weight = ?, reps = ?, completed = ? WHERE id = ?',
    weight,
    reps,
    completed ? 1 : 0,
    setId,
  );
}

export async function completeWorkout(db: SQLiteDatabase, workoutId: string) {
  const completedSet = await db.getFirstAsync<{ count: number }>(`
    SELECT COUNT(*) AS count FROM sets s
    JOIN workout_exercises we ON we.id = s.workout_exercise_id
    WHERE we.workout_id = ? AND s.completed = 1
  `, workoutId);
  if ((completedSet?.count ?? 0) === 0) throw new Error('Complete at least one set before finishing.');
  await db.runAsync("UPDATE workouts SET status = 'completed', completed_at = ? WHERE id = ?", now(), workoutId);
}

export async function getHistory(db: SQLiteDatabase): Promise<HistoryItem[]> {
  return db.getAllAsync<HistoryItem>(`
    SELECT w.id, w.name, w.started_at AS startedAt, w.completed_at AS completedAt,
      COUNT(s.id) AS completedSets,
      COALESCE(SUM(CASE WHEN s.set_type = 'working' THEN s.weight * s.reps ELSE 0 END), 0) AS volume
    FROM workouts w
    LEFT JOIN workout_exercises we ON we.workout_id = w.id
    LEFT JOIN sets s ON s.workout_exercise_id = we.id AND s.completed = 1
    WHERE w.status = 'completed'
    GROUP BY w.id
    ORDER BY w.completed_at DESC
  `);
}
