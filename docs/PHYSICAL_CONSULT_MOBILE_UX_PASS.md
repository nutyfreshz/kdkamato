# Physical Consult Mobile UX Pass

Date: 2026-09-09
Status: PRODUCTION READY

## Problem

`/physical-consult/program` previously rendered every Active Program Exercise Feedback form fully expanded, creating excessive vertical scrolling on mobile during a gym consult.

## Change

The focused feedback page now uses a one-exercise-at-a-time accordion.

- Exercises remain visible as compact rows grouped by training day.
- Only one Exercise Feedback form is open at a time.
- Hidden forms stay mounted, so unfinished local field state is retained while switching exercises.
- Each row shows the exercise label and target without opening the form.
- Rows with feedback already recorded for the current day show `บันทึกวันนี้แล้ว`.
- The page shows `บันทึกวันนี้แล้ว X/Y ท่า` at the top.
- Copy clarifies that the Trainer does not need to fill every exercise.

## Scope

UI/navigation only. No backend semantics changed.

Unchanged:
- Exercise Memory authority
- LAB candidate ranking
- Physical Consult candidate-trial backend
- `save_my_exercise_response`
- `save_my_physical_consult_trial`
- Program writeback and C1 Squat auto-refresh
- authentication and tier rules

Backend stress tests were therefore intentionally not rerun.

## Validation

Commit: `069147db265cc485d1df22817d3089b90269b3dc`
Deployment: `dpl_2CSLLYvNzxBbJJRjRPWBu8TaZLuM`

- Next.js compile: PASS
- TypeScript: PASS
- page-data collection: PASS
- 22/22 static pages: PASS
- `/physical-consult/program` included in production build: PASS
- deployment state: READY
- `kdkamato.vercel.app` alias present: PASS
- aliasError: null

## Remaining validation

The accordion interaction itself still needs one authenticated browser click-through to confirm final mobile ergonomics. This deployment does not change the previously accepted Physical Consult backend behavior.
