import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { migrateDbIfNeeded } from '../src/db/database';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="gym-tracker.db" onInit={migrateDbIfNeeded}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
        <Stack.Screen name="routine/[id]" />
        <Stack.Screen name="workout/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="history" />
      </Stack>
    </SQLiteProvider>
  );
}
