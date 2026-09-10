# Physical Consult Mobile UX Pass

Date: 2026-09-09
Status: PRODUCTION ACCEPTED

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
- After Save, the recorded-today counter and exercise status refresh immediately.

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

Backend stress tests were therefore intentionally not rerun for the UI-only fixes.

## Build Validation

Initial mobile UX commit: `069147db265cc485d1df22817d3089b90269b3dc`
Initial deployment: `dpl_2CSLLYvNzxBbJJRjRPWBu8TaZLuM`

- Next.js compile: PASS
- TypeScript: PASS
- page-data collection: PASS
- 22/22 static pages: PASS
- `/physical-consult/program` included in production build: PASS
- deployment state: READY
- `kdkamato.vercel.app` alias present: PASS
- aliasError: null

## Authenticated Production E2E Acceptance

Date: 2026-09-10
Dedicated QA account only.

Final UX fix commit: `c7db831804c076830658c5ba90327ed9c193b2da`
Production deployment: `dpl_3knbXaozjEcadFVzYxuzrtnc9mHr`

Authenticated browser flow:

`/login?physical=1` → `/physical-consult` → C1/C2 → off-program LAB candidate trial → Exercise Memory → `/physical-consult/program` Active Program feedback → local-device sign out

Acceptance results:
- Physical Consult E2E: PASS
- Dedicated QA login: PASS
- C1/C2 navigation: PASS
- off-program LAB candidate trial: PASS; DB Bench saved successfully
- Exercise Memory update: PASS; DB Bench reached `CONFIRMED_GOOD_FIT`
- Active Program feedback: PASS; Hack Squat response persisted and Exercise Memory updated
- local-device sign out: PASS; returned to `/login`
- Program mutation boundary: PASS; exactly one Active Program remained at v1
- post-save `บันทึกวันนี้แล้ว` counter/status refresh: PASS
- deployment state: READY
- production alias: `kdkamato.vercel.app`
- aliasError: null

Dedicated QA account is intentionally retained for continuing regression QA. Its data is test-only.

## Remaining validation

None for the current Physical Consult v0.9 acceptance scope. Reopen E2E validation only when auth/session flow, Physical Consult RPC behavior, evidence semantics, candidate eligibility, or Program writeback policy changes.
