import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { getHistory, type HistoryItem } from '../src/db/database';
import { colors, radius, spacing } from '../src/theme';

export default function HistoryScreen() {
  const db = useSQLiteContext(); const router = useRouter(); const [items, setItems] = useState<HistoryItem[]>([]);
  const load = useCallback(async () => setItems(await getHistory(db)), [db]); useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Home</Text></Pressable><Text style={styles.eyebrow}>TRAINING LOG</Text><Text style={styles.title}>Workout history</Text>
    {items.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No completed workouts yet</Text><Text style={styles.emptyCopy}>Finish a workout and your training history will appear here.</Text><Pressable style={styles.emptyButton} onPress={() => router.replace('/')}><Text style={styles.emptyButtonText}>Start a workout</Text></Pressable></View> : items.map((item) => <View key={item.id} style={styles.card}><Text style={styles.cardDate}>{new Date(item.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text><View style={styles.cardBody}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardMeta}>{item.completedSets} sets · {Math.round(item.volume)} kg volume</Text></View><Text style={styles.complete}>✓</Text></View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, content: { padding: spacing.xl, paddingTop: 68, gap: spacing.md }, back: { color: colors.lime, fontSize: 16, fontWeight: '700' }, eyebrow: { color: colors.textSubtle, fontSize: 12, letterSpacing: 1, fontWeight: '800', marginTop: spacing.lg }, title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: -7, marginBottom: spacing.md }, card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, cardDate: { color: colors.lime, fontSize: 13, fontWeight: '800', width: 48 }, cardBody: { flex: 1 }, cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' }, cardMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 }, complete: { color: colors.success, fontSize: 20, fontWeight: '800' }, empty: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xxl, alignItems: 'center', marginTop: spacing.lg }, emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' }, emptyCopy: { color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginTop: spacing.sm }, emptyButton: { backgroundColor: colors.lime, borderRadius: radius.md, minHeight: 48, paddingHorizontal: spacing.lg, justifyContent: 'center', marginTop: spacing.lg }, emptyButtonText: { color: colors.limeText, fontWeight: '800' } });
