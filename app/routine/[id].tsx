import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { getRoutineSummaries, startWorkoutFromRoutine, type RoutineSummary } from '../../src/db/database';
import { colors, radius, spacing } from '../../src/theme';

export default function RoutineScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<RoutineSummary | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => { void getRoutineSummaries(db).then((items) => setRoutine(items.find((item) => item.id === id) ?? null)); }, [db, id]);
  const start = async () => { if (!id) return; setStarting(true); const workoutId = await startWorkoutFromRoutine(db, id); router.replace(`/workout/${workoutId}`); };
  if (!routine) return <View style={styles.loading}><ActivityIndicator color={colors.lime} /></View>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>ROUTINE</Text><Text style={styles.title}>{routine.name}</Text><Text style={styles.body}>{routine.notes ?? 'A saved workout template.'}</Text>
    <View style={styles.detailCard}><Text style={styles.detailMetric}>{routine.exerciseCount}</Text><Text style={styles.detailLabel}>EXERCISES</Text><Text style={styles.detailCopy}>You can adjust weights and repetitions while you train.</Text></View>
    <Pressable disabled={starting} style={[styles.button, starting && styles.disabled]} onPress={() => void start()}><Text style={styles.buttonText}>{starting ? 'Starting…' : 'Start workout'}</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: spacing.xl, paddingTop: 68, gap: spacing.lg }, loading: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }, back: { color: colors.lime, fontSize: 16, fontWeight: '700' }, eyebrow: { color: colors.textSubtle, fontSize: 12, letterSpacing: 1, fontWeight: '800', marginTop: spacing.lg }, title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: -8 }, body: { color: colors.textMuted, fontSize: 16, lineHeight: 23, marginTop: -6 }, detailCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, marginTop: spacing.lg }, detailMetric: { color: colors.lime, fontSize: 34, fontWeight: '800' }, detailLabel: { color: colors.textSubtle, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 2 }, detailCopy: { color: colors.textMuted, lineHeight: 21, fontSize: 14, marginTop: spacing.md }, button: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center', marginTop: 'auto' }, buttonText: { color: colors.limeText, fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.6 } });
