import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { getExerciseProgress, type ExerciseProgress } from '../src/db/database';
import { colors, radius, spacing } from '../src/theme';

export default function ProgressScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [items, setItems] = useState<ExerciseProgress[]>([]);

  const load = useCallback(async () => {
    const nextItems = await getExerciseProgress(db);
    setItems(nextItems);
  }, [db]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

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
        items.map((item) => (
          <View key={item.exerciseName} style={styles.card}>
            <Text style={styles.exerciseName}>{item.exerciseName}</Text>
            <View style={styles.row}>
              <Text style={styles.value}>{item.bestWeight ? `${Math.round(item.bestWeight)} kg` : '—'}</Text>
              <Text style={styles.meta}>{item.totalSets} logged sets</Text>
            </View>
            <Text style={styles.meta}>Last seen {item.lastCompletedAt ? new Date(item.lastCompletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'n/a'}</Text>
          </View>
        ))
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
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  exerciseName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.sm },
  value: { color: colors.lime, fontSize: 24, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 6 },
});
