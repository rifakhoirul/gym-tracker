import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { getActiveWorkout, getPreference, getRoutineSummaries, type RoutineSummary } from '../src/db/database';
import { colors, radius, spacing } from '../src/theme';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<{ id: string; name: string } | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const onboardingComplete = await getPreference(db, 'onboarding_complete');
    if (onboardingComplete !== 'true') {
      router.replace('/onboarding');
      return;
    }

    const [nextRoutines, nextActiveWorkout] = await Promise.all([
      getRoutineSummaries(db),
      getActiveWorkout(db),
    ]);

    setRoutines(nextRoutines);
    setActiveWorkout(nextActiveWorkout);
    setReady(true);
  }, [db, router]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (!ready) {
    return <View style={styles.loading}><ActivityIndicator color={colors.lime} /></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>GYM TRACKER</Text>
      <Text style={styles.title}>Train with a clear plan.</Text>
      <Text style={styles.subtitle}>Your workouts stay saved on this device, even when you are offline.</Text>

      <View style={styles.pillRow}>
        <View style={styles.pillCard}>
          <Text style={styles.pillLabel}>ROUTINES</Text>
          <Text style={styles.pillValue}>{routines.length}</Text>
        </View>
        <View style={styles.pillCard}>
          <Text style={styles.pillLabel}>READY</Text>
          <Text style={styles.pillValue}>{routines.reduce((sum, routine) => sum + routine.exerciseCount, 0)}</Text>
        </View>
      </View>

      {activeWorkout ? (
        <Pressable style={styles.resumeCard} onPress={() => router.push(`/workout/${activeWorkout.id}`)}>
          <View>
            <Text style={styles.resumeLabel}>WORKOUT IN PROGRESS</Text>
            <Text style={styles.resumeTitle}>{activeWorkout.name}</Text>
          </View>
          <Text style={styles.resumeAction}>Resume →</Text>
        </Pressable>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Create your first routine</Text>
          <Text style={styles.emptyText}>Set up a plan, choose exercises, and start building momentum.</Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your routines</Text>
        <Text style={styles.sectionHint}>{routines.length} saved</Text>
      </View>

      {routines.length === 0 ? (
        <Pressable style={styles.primaryButton} onPress={() => router.push('/routine/new')}>
          <Text style={styles.primaryButtonText}>Create a routine</Text>
        </Pressable>
      ) : (
        routines.map((routine) => (
          <Pressable key={routine.id} style={styles.routineCard} onPress={() => router.push(`/routine/${routine.id}`)}>
            <View style={styles.routineIcon}><Text style={styles.routineIconText}>↗</Text></View>
            <View style={styles.routineText}>
              <Text style={styles.routineTitle}>{routine.name}</Text>
              <Text style={styles.routineMeta}>{routine.exerciseCount} exercises · Ready when you are</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))
      )}

      <View style={styles.actionsRow}>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/routine/new')}>
          <Text style={styles.primaryButtonText}>Create routine</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/settings')}>
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/progress')}>
          <Text style={styles.secondaryButtonText}>Progress</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/history')}>
          <Text style={styles.secondaryButtonText}>History</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.xl, paddingTop: 72, gap: spacing.lg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  eyebrow: { color: colors.lime, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 32, lineHeight: 38, fontWeight: '800', marginTop: 2 },
  subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 23, marginTop: -6 },
  pillRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  pillCard: { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  pillLabel: { color: colors.textSubtle, fontSize: 10, letterSpacing: 1, fontWeight: '800' },
  pillValue: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: spacing.xs },
  resumeCard: { backgroundColor: colors.lime, borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  resumeLabel: { color: colors.limeText, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  resumeTitle: { color: colors.limeText, fontSize: 18, fontWeight: '800', marginTop: 4 },
  resumeAction: { color: colors.limeText, fontSize: 15, fontWeight: '800' },
  emptyCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  emptyText: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: spacing.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sectionHint: { color: colors.textSubtle, fontSize: 13 },
  routineCard: { minHeight: 80, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  routineIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
  routineIconText: { color: colors.lime, fontSize: 22, fontWeight: '700' },
  routineText: { flex: 1 },
  routineTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  routineMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  chevron: { color: colors.textMuted, fontSize: 28, fontWeight: '300' },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  primaryButton: { flex: 1, minHeight: 52, borderRadius: radius.md, backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: colors.limeText, fontWeight: '800', fontSize: 15 },
  secondaryButton: { flex: 1, minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
