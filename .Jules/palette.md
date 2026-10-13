## 2023-10-13 - Toggleable Set Completion
**Learning:** Preventing users from easily undoing a "Done" action on a workout set leads to frustrating typo lock-ins, as they cannot edit their weight/reps once submitted.
**Action:** Always provide a way to toggle or undo completion states within an active session rather than permanently disabling the action button.

## 2023-10-13 - Accessibility for Icon-only states
**Learning:** When a button's text visually changes to an icon (like "✓") upon completion, screen readers lose context without dynamic accessibility labels.
**Action:** Always add `accessibilityRole="button"` and a dynamic `accessibilityLabel` that updates based on the button's state to provide clear context for screen reader users.
