import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { getPreference, setPreference } from '../src/db/database';
import { colors, radius, spacing } from '../src/theme';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const savedUnit = await getPreference(db, 'unit');
      setUnit((savedUnit === 'lb' ? 'lb' : 'kg'));
    })();
  }, [db]);

  const saveUnit = async (nextUnit: 'kg' | 'lb') => {
    setSaving(true);
    try {
      await setPreference(db, 'unit', nextUnit);
      setUnit(nextUnit);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
      <Text style={styles.eyebrow}>SETTINGS</Text>
      <Text style={styles.title}>Preferences</Text>

      <View style={styles.card}>
        <Text style={styles.label}>WEIGHT UNIT</Text>
        <View style={styles.unitRow}>
          {(['kg', 'lb'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => void saveUnit(option)}
              style={[styles.unit, unit === option && styles.unitSelected]}
              disabled={saving}
            >
              <Text style={[styles.unitText, unit === option && styles.unitTextSelected]}>{option.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, padding: spacing.xl, paddingTop: 68 },
  back: { color: colors.lime, fontSize: 16, fontWeight: '700' },
  eyebrow: { color: colors.textSubtle, fontSize: 12, letterSpacing: 1, fontWeight: '800', marginTop: spacing.lg },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: -6 },
  card: { marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  label: { color: colors.textSubtle, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  unitRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  unit: { flex: 1, height: 64, backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  unitSelected: { backgroundColor: colors.lime, borderColor: colors.lime },
  unitText: { color: colors.text, fontSize: 18, fontWeight: '800' },
  unitTextSelected: { color: colors.limeText },
});
