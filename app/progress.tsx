import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { getExerciseProgress, getHistory, type ExerciseProgress } from '../src/db/database';
import { colors, radius, spacing } from '../src/theme';

export default function ProgressScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [items, setItems] = useState<ExerciseProgress[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);

  const load = useCallback(async () => {
    const [nextItems, nextHistory] = await Promise.all([getExerciseProgress(db), getHistory(db)]);
    setItems(nextItems);
    setHistoryCount(nextHistory.length);
    setTotalVolume(nextHistory.reduce((sum, item) => sum + Number(item.volume || 0), 0));
  }, [db]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const topLift = useMemo(() => items.reduce<ExerciseProgress | null>((best, item) => {
    if (!item.bestWeight) return best;
    if (!best || !best.bestWeight || item.bestWeight > best.bestWeight) return item;
    return best;
  }, null), [items]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Home</Text></Pressable>
      <Text style={styles.eyebrow}>PROGRESS</Text>
      <Text style={styles.title}>Strength trends</Text>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No progress yet</Text>
          <Text style={styles.emptyCopy}>Complete a few workouts and your best lifts will show up here.</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Top lift</Text>
              <Text style={styles.summaryValue}>{topLift?.bestWeight ? `${Math.round(topLift.bestWeight)} kg` : '—'}</Text>
              <Text style={styles.summaryMeta}>{topLift?.exerciseName ?? 'Not set yet'}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Sessions</Text>
              <Text style={styles.summaryValue}>{historyCount}</Text>
              <Text style={styles.summaryMeta}>Completed</Text>
            </View>
          </View>

          <View style={styles.volumeCard}>
            <Text style={styles.summaryLabel}>Total volume</Text>
            <Text style={styles.volumeValue}>{Math.round(totalVolume)} kg</Text>
            <Text style={styles.summaryMeta}>Across all finished workouts</Text>
          </View>

          {items.map((item) => (
            <View key={item.exerciseName} style={styles.card}>
              <Text style={styles.exerciseName}>{item.exerciseName}</Text>
              <View style={styles.row}>
                <Text style={styles.value}>{item.bestWeight ? `${Math.round(item.bestWeight)} kg` : '—'}</Text>
                <Text style={styles.meta}>{item.totalSets} logged sets</Text>
              </View>
              <Text style={styles.meta}>Last seen {item.lastCompletedAt ? new Date(item.lastCompletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'n/a'}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.xl, paddingTop: 68, gap: spacing.md },
  back: { color: colors.lime, fontSize: 16, fontWeight: '700' },
  eyebrow: { color: colors.textSubtle, fontSize: 12, letterSpacing: 1, fontWeight: '800', marginTop: spacing.lg },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: -7 },
  empty: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xxl, alignItems: 'center', marginTop: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyCopy: { color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginTop: spacing.sm },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  summaryLabel: { color: colors.textSubtle, fontSize: 11, letterSpacing: 1, fontWeight: '800' },
  summaryValue: { color: colors.lime, fontSize: 24, fontWeight: '800', marginTop: spacing.sm },
  summaryMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  volumeCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  volumeValue: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  exerciseName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.sm },
  value: { color: colors.lime, fontSize: 24, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
});
