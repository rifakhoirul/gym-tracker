import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getWorkoutSessionSummary, type WorkoutSessionSummary } from '../../src/db/database';
import { colors, radius, spacing } from '../../src/theme';

export default function WorkoutSummaryScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const [summary, setSummary] = useState<WorkoutSessionSummary | null>(null);

  useEffect(() => {
    if (!workoutId) return;
    void (async () => {
      const next = await getWorkoutSessionSummary(db, workoutId);
      setSummary(next);
    })();
  }, [db, workoutId]);

  if (!summary) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading summary…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
      <Text style={styles.title}>{summary.name}</Text>

      <View style={styles.summaryRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Sets</Text>
          <Text style={styles.statValue}>{summary.totalSets}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Exercises</Text>
          <Text style={styles.statValue}>{summary.completedExercises}</Text>
        </View>
      </View>

      <View style={styles.volumeCard}>
        <Text style={styles.statLabel}>Volume</Text>
        <Text style={styles.volumeValue}>{Math.round(summary.volume)} kg</Text>
        <Text style={styles.meta}>Logged across this workout</Text>
      </View>

      <View style={styles.footerCard}>
        <Text style={styles.meta}>Started {new Date(summary.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        <Text style={styles.meta}>Finished {summary.completedAt ? new Date(summary.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => router.replace('/history')}>
        <Text style={styles.primaryButtonText}>View history</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.xl, paddingTop: 72, gap: spacing.lg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  loadingText: { color: colors.textMuted, fontSize: 16 },
  eyebrow: { color: colors.lime, fontSize: 12, letterSpacing: 1.2, fontWeight: '800' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: -6 },
  summaryRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  statLabel: { color: colors.textSubtle, fontSize: 11, letterSpacing: 1, fontWeight: '800' },
  statValue: { color: colors.lime, fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
  volumeCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  volumeValue: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
  footerCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 6 },
  meta: { color: colors.textMuted, fontSize: 13 },
  primaryButton: { minHeight: 52, backgroundColor: colors.lime, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.limeText, fontSize: 16, fontWeight: '800' },
});
