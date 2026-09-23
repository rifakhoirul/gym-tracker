# Gym Tracker

A mobile-first gym tracking app built with Expo and React Native. It lets users:

- choose a workout routine,
- start and resume workouts,
- log weight and reps per set,
- finish workouts and see training history,
- keep training data stored locally on-device with SQLite.

## Tech stack

- Expo
- React Native
- Expo Router
- Expo SQLite
- TypeScript

## Features

- Onboarding flow with unit preference (`kg` / `lb`)
- Routine list and workout start flow
- Active workout tracking with set-by-set logging
- Saved workout history and volume tracking
- Local persistence with SQLite, no backend required

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app:

   ```bash
   npx expo start
   ```

3. For web preview:

   ```bash
   npx expo start --web
   ```

## Project structure

```text
.
├── app/                  # Expo Router screens
├── src/
│   ├── db/
│   │   └── database.ts   # SQLite schema and data access
│   └── theme.ts         # shared colors and design tokens
├── App.tsx              # default Expo template file (not the active app entry)
├── app.json             # Expo app config
├── package.json         # project scripts and dependencies
├── tsconfig.json
├── .gitignore
└── README.md
```

## Notes

This app uses Expo Router for navigation and stores workout state in a local SQLite database. The app is designed for a device-first training workflow and is meant to stay offline-friendly.
