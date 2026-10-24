## 2023-10-27 - Undo Completed Sets
**Learning:** Preventing users from modifying a completed workout set can lead to frustrating typo lock-ins. An "Undo" toggle significantly improves the UX of form-like components in active sessions.
**Action:** Always provide an 'undo' or edit toggle for submitted data states within an active session (e.g., workout sets), rather than permanently locking the row. Added `accessibilityRole="button"` and `accessibilityLabel` based on the completion state for screen readers.
