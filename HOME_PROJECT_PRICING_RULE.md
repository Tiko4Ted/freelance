# Home project pricing rule

Home projects are task-based work. The payout is earned from approved task completion, never from tracked time.

## Invariants

- Every project shown in the home Featured projects area uses `TASK_1` payout eligibility.
- Home project cards display pricing as `per task` only. They must never display `/hr`, `/hour`, hourly ranges, or an hours-based payout label.
- Featured home project payouts stay within the `$50 - $100 per task` range. The current seeded roles use `$50`, `$75`, and `$100 per task`.
- The home payment summary counts completed tasks, not logged hours.
- `hourlyMinCents` and `hourlyMaxCents` may remain in the shared schema for legacy roles and admin compatibility, but they are not a pricing source for home task projects.

When adding or changing a home project, update the task payout data and the home card copy together. If a role is not task-based, it must not be placed on home.
