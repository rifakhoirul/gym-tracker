import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { createExercise, createRoutine, getExercises, type ExerciseOption } from '../../src/db/database';
import { colors, radius, spacing } from '../../src/theme';

export default function NewRoutineScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [routineName, setRoutineName] = useState('');
  const [notes, setNotes] = useState('');
  const [exerciseOptions, setExerciseOptions] = useState<ExerciseOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  const [customMuscleGroup, setCustomMuscleGroup] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const items = await getExercises(db);
      setExerciseOptions(items);
    })();
  }, [db]);

  const available = useMemo(() => exerciseOptions.filter((exercise) => !selected.includes(exercise.id)), [exerciseOptions, selected]);

  const toggleExercise = (exerciseId: string) => {
    setSelected((prev) => prev.includes(exerciseId) ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId]);
  };

  const addCustomExercise = async () => {
    const name = customName.trim();
    if (!name) {
      Alert.alert('Exercise name required', 'Please enter a name for the custom exercise.');
      return;
    }

    const createdId = await createExercise(db, {
      name,
      muscleGroup: customMuscleGroup.trim() || null,
      equipment: customEquipment.trim() || null,
    });

    setSelected((prev) => [...prev, createdId]);
    setCustomName('');
    setCustomMuscleGroup('');
    setCustomEquipment('');
    const refreshed = await getExercises(db);
    setExerciseOptions(refreshed);
  };

  const saveRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Routine name required', 'Give your routine a name before saving.');
      return;
    }

    if (selected.length === 0) {
      Alert.alert('No exercises selected', 'Add at least one exercise to this routine.');
      return;
    }

    setSaving(true);
    try {
      const routineId = await createRoutine(db, routineName, notes, selected);
      router.replace(`/routine/${routineId}`);
    } catch (error) {
      Alert.alert('Unable to save routine', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
      <Text style={styles.eyebrow}>NEW ROUTINE</Text>
      <Text style={styles.title}>Build your plan</Text>

      <View style={styles.card}>
        <Text style={styles.label}>ROUTINE NAME</Text>
        <TextInput value={routineName} onChangeText={setRoutineName} placeholder="Leg day" placeholderTextColor={colors.textSubtle} style={styles.input} />

        <Text style={styles.label}>NOTES</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Focus on form and progressive overload" placeholderTextColor={colors.textSubtle} multiline style={[styles.input, styles.textArea]} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Selected exercises</Text>
        {selected.length === 0 ? <Text style={styles.emptyText}>No exercises selected yet.</Text> : null}
        {exerciseOptions.filter((exercise) => selected.includes(exercise.id)).map((exercise) => (
          <Pressable key={exercise.id} onPress={() => toggleExercise(exercise.id)} style={styles.choiceRowSelected}>
            <Text style={styles.choiceText}>{exercise.name}</Text>
            <Text style={styles.choiceAction}>Remove</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add exercise</Text>
        {available.length === 0 ? <Text style={styles.emptyText}>All exercises are already selected.</Text> : null}
        {available.map((exercise) => (
          <Pressable key={exercise.id} onPress={() => toggleExercise(exercise.id)} style={styles.choiceRow}>
            <Text style={styles.choiceText}>{exercise.name}</Text>
            <Text style={styles.choiceAction}>Add</Text>
          </Pressable>
        ))}

        <Text style={[styles.label, styles.sectionGap]}>CUSTOM EXERCISE</Text>
        <TextInput value={customName} onChangeText={setCustomName} placeholder="Barbell hip thrust" placeholderTextColor={colors.textSubtle} style={styles.input} />
        <View style={styles.inlineRow}>
          <TextInput value={customMuscleGroup} onChangeText={setCustomMuscleGroup} placeholder="Muscle group" placeholderTextColor={colors.textSubtle} style={[styles.input, styles.inlineInput]} />
          <TextInput value={customEquipment} onChangeText={setCustomEquipment} placeholder="Equipment" placeholderTextColor={colors.textSubtle} style={[styles.input, styles.inlineInput]} />
        </View>
        <Pressable style={styles.secondaryButton} onPress={() => void addCustomExercise()}>
          <Text style={styles.secondaryButtonText}>Save custom exercise</Text>
        </Pressable>
      </View>

      <Pressable disabled={saving} style={[styles.primaryButton, saving && styles.disabled]} onPress={() => void saveRoutine()}>
        <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save routine'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.xl, paddingTop: 68, gap: spacing.lg, paddingBottom: 80 },
  back: { color: colors.lime, fontSize: 16, fontWeight: '700' },
  eyebrow: { color: colors.textSubtle, fontSize: 12, letterSpacing: 1, fontWeight: '800', marginTop: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: -6 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  label: { color: colors.textSubtle, fontSize: 11, letterSpacing: 0.8, fontWeight: '800' },
  input: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: 16 },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  choiceRow: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  choiceRowSelected: { backgroundColor: '#1B3529', borderRadius: radius.md, borderWidth: 1, borderColor: colors.success, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  choiceText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  choiceAction: { color: colors.lime, fontSize: 12, fontWeight: '800' },
  inlineRow: { flexDirection: 'row', gap: spacing.sm },
  inlineInput: { flex: 1 },
  sectionGap: { marginTop: spacing.md },
  secondaryButton: { minHeight: 48, backgroundColor: colors.surfaceRaised, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  primaryButton: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.lime, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: colors.limeText, fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.6 },
});
