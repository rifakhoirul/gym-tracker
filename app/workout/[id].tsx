import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { addSet, completeWorkout, getPreference, getWorkoutDetail, saveSet, type WorkoutDetail, type WorkoutExercise, type WorkoutSet } from '../../src/db/database';
import { colors, radius, spacing } from '../../src/theme';

function SetRow({ set, unit, onSave }: { set: WorkoutSet; unit: string; onSave: (weight: number | null, reps: number | null, completed: boolean) => Promise<void> }) {
  const [weight, setWeight] = useState(set.weight?.toString() ?? '');
  const [reps, setReps] = useState(set.reps?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const parse = (value: string) => value.trim() === '' ? null : Number(value);
  const persist = async (complete: boolean) => {
    const nextWeight = parse(weight); const nextReps = parse(reps);
    if (complete && (!nextWeight || !nextReps || nextWeight <= 0 || nextReps <= 0)) { Alert.alert('Add weight and reps', 'Enter values greater than zero before completing this set.'); return; }
    setSaving(true); await onSave(nextWeight, nextReps, complete); setSaving(false);
  };
  return <View style={[styles.setRow, set.completed === 1 && styles.setRowComplete]}>
    <Text style={styles.setNumber}>{set.setNumber}</Text>
    <View style={styles.inputGroup}><TextInput value={weight} onChangeText={setWeight} onBlur={() => void persist(false)} keyboardType="decimal-pad" editable={!saving && set.completed !== 1} placeholder="0" placeholderTextColor={colors.textSubtle} style={styles.numericInput} /><Text style={styles.inputLabel}>{unit}</Text></View>
    <View style={styles.inputGroup}><TextInput value={reps} onChangeText={setReps} onBlur={() => void persist(false)} keyboardType="number-pad" editable={!saving && set.completed !== 1} placeholder="0" placeholderTextColor={colors.textSubtle} style={styles.numericInput} /><Text style={styles.inputLabel}>reps</Text></View>
    <Pressable disabled={saving || set.completed === 1} onPress={() => void persist(true)} style={[styles.completeButton, set.completed === 1 && styles.completedButton]}><Text style={[styles.completeButtonText, set.completed === 1 && styles.completedButtonText]}>{set.completed === 1 ? '✓' : 'Done'}</Text></Pressable>
  </View>;
}

function ExerciseCard({ exercise, unit, onChanged }: { exercise: WorkoutExercise; unit: string; onChanged: () => Promise<void> }) {
  const db = useSQLiteContext();
  const add = async () => { await addSet(db, exercise.id, exercise.targetWeight, exercise.targetReps); await onChanged(); };
  const save = async (setId: string, weight: number | null, reps: number | null, completed: boolean) => { await saveSet(db, setId, weight, reps, completed); await onChanged(); };
  return <View style={styles.exerciseCard}>
    <View style={styles.exerciseHeader}><View><Text style={styles.exerciseName}>{exercise.exerciseName}</Text><Text style={styles.exerciseHint}>Target {exercise.targetReps ?? '—'} reps · {exercise.targetWeight ?? '—'} {unit}</Text></View><Text style={styles.workingBadge}>WORKING</Text></View>
    <View style={styles.tableHead}><Text style={styles.tableSet}>SET</Text><Text style={styles.tableWeight}>WEIGHT</Text><Text style={styles.tableReps}>REPS</Text></View>
    {exercise.sets.map((set) => <SetRow key={set.id} set={set} unit={unit} onSave={(weight, reps, completed) => save(set.id, weight, reps, completed)} />)}
    <Pressable onPress={() => void add()} style={styles.addSet}><Text style={styles.addSetText}>+ Add set</Text></Pressable>
  </View>;
}

export default function ActiveWorkoutScreen() {
  const db = useSQLiteContext(); const router = useRouter(); const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null); const [unit, setUnit] = useState('kg'); const [finishing, setFinishing] = useState(false);
  const load = useCallback(async () => { if (!id) return; const [detail, savedUnit] = await Promise.all([getWorkoutDetail(db, id), getPreference(db, 'unit')]); setWorkout(detail); setUnit(savedUnit ?? 'kg'); }, [db, id]);
  useEffect(() => { void load(); }, [load]);
  const finish = async () => { if (!id) return; try { setFinishing(true); await completeWorkout(db, id); router.replace('/history'); } catch (error) { Alert.alert('Keep going', error instanceof Error ? error.message : 'Unable to finish this workout.'); } finally { setFinishing(false); } };
  if (!workout) return <View style={styles.loading}><Text style={styles.loadingText}>Loading workout…</Text></View>;
  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.topBar}><Pressable onPress={() => router.replace('/')}><Text style={styles.exit}>Exit</Text></Pressable><Text style={styles.inProgress}>IN PROGRESS</Text><Pressable disabled={finishing} onPress={() => void finish()}><Text style={styles.finish}>{finishing ? 'Saving…' : 'Finish'}</Text></Pressable></View>
    <Text style={styles.eyebrow}>ACTIVE WORKOUT</Text><Text style={styles.title}>{workout.name}</Text><Text style={styles.subtitle}>Log each set as you train. Completed sets save automatically.</Text>
    {workout.exercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} unit={unit} onChanged={load} />)}
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: spacing.xl, paddingTop: 64, gap: spacing.lg }, loading: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }, loadingText: { color: colors.textMuted },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, exit: { color: colors.textMuted, fontSize: 15, fontWeight: '700' }, inProgress: { color: colors.lime, fontSize: 11, letterSpacing: 1, fontWeight: '800' }, finish: { color: colors.lime, fontSize: 15, fontWeight: '800' }, eyebrow: { color: colors.textSubtle, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: spacing.md }, title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: -8 }, subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: -7 },
  exerciseCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm, marginTop: spacing.sm }, exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }, exerciseName: { color: colors.text, fontSize: 18, fontWeight: '800' }, exerciseHint: { color: colors.textMuted, fontSize: 13, marginTop: 4 }, workingBadge: { color: colors.lime, fontSize: 10, letterSpacing: 0.8, fontWeight: '800', paddingTop: 3 },
  tableHead: { flexDirection: 'row', paddingHorizontal: spacing.sm, marginTop: spacing.sm }, tableSet: { width: 34, color: colors.textSubtle, fontSize: 10, letterSpacing: 0.7, fontWeight: '800' }, tableWeight: { flex: 1, color: colors.textSubtle, fontSize: 10, letterSpacing: 0.7, fontWeight: '800' }, tableReps: { flex: 1, color: colors.textSubtle, fontSize: 10, letterSpacing: 0.7, fontWeight: '800' },
  setRow: { minHeight: 60, borderRadius: radius.md, backgroundColor: colors.surfaceRaised, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, gap: spacing.sm }, setRowComplete: { backgroundColor: '#25402E' }, setNumber: { width: 26, color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' }, inputGroup: { flex: 1, flexDirection: 'row', alignItems: 'baseline', borderBottomColor: colors.border, borderBottomWidth: 1 }, numericInput: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '800', paddingVertical: 8, minWidth: 0 }, inputLabel: { color: colors.textSubtle, fontSize: 11, marginLeft: 2 }, completeButton: { minWidth: 52, height: 40, borderRadius: radius.sm, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }, completeButtonText: { color: colors.limeText, fontSize: 12, fontWeight: '800' }, completedButton: { backgroundColor: colors.success }, completedButtonText: { color: '#102716', fontSize: 18 }, addSet: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs }, addSetText: { color: colors.lime, fontSize: 14, fontWeight: '800' },
});
