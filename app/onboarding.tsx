import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { setPreference } from '../src/db/database';
import { colors, radius, spacing } from '../src/theme';

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');

  const continueToApp = async () => {
    await setPreference(db, 'unit', unit);
    await setPreference(db, 'onboarding_complete', 'true');
    router.replace('/');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>WELCOME TO GYM TRACKER</Text>
      <Text style={styles.title}>Build strength, one logged set at a time.</Text>
      <Text style={styles.body}>Choose how you want to record weight. You can change this later in Settings.</Text>
      <Text style={styles.label}>WEIGHT UNIT</Text>
      <View style={styles.unitRow}>
        {(['kg', 'lb'] as const).map((option) => <Pressable key={option} onPress={() => setUnit(option)} style={[styles.unit, unit === option && styles.unitSelected]}><Text style={[styles.unitText, unit === option && styles.unitTextSelected]}>{option.toUpperCase()}</Text></Pressable>)}
      </View>
      <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={continueToApp}><Text style={styles.primaryButtonText}>Continue</Text></Pressable>
      <Text style={styles.footer}>No account. No internet required. Your workouts stay on this device.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, padding: spacing.xl, paddingTop: 100 }, eyebrow: { color: colors.lime, fontSize: 12, letterSpacing: 1.1, fontWeight: '800' }, title: { color: colors.text, fontSize: 32, lineHeight: 39, fontWeight: '800', marginTop: spacing.md }, body: { color: colors.textMuted, fontSize: 16, lineHeight: 23, marginTop: spacing.md }, label: { color: colors.textSubtle, fontSize: 12, letterSpacing: 0.9, fontWeight: '800', marginTop: 48 }, unitRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }, unit: { flex: 1, height: 64, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }, unitSelected: { backgroundColor: colors.lime, borderColor: colors.lime }, unitText: { color: colors.text, fontSize: 18, fontWeight: '800' }, unitTextSelected: { color: colors.limeText }, primaryButton: { height: 52, backgroundColor: colors.lime, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.section }, primaryButtonText: { color: colors.limeText, fontSize: 16, fontWeight: '800' }, footer: { color: colors.textSubtle, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: spacing.lg },
});
