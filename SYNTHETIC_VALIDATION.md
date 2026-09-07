# KDKAMATO FREE ENGINE v1.1 — SYNTHETIC VALIDATION

Validation date: 2026-09-07
Runtime test: `supabase/functions/kdk-free-program/synthetic-test.mjs`

## Matrix

4 Goals × 6 Focuses × 3 Experience Levels × 3 Equipment Profiles × 4 Session Durations × 5 Training-Day Options

Focuses:
- BALANCED
- CHEST
- BACK
- ARMS
- LEGS
- REPOSTURE

Total generated programs: **4,320**

Final result: **0 failures**

## Assertions

The test rejects the engine if any profile violates these conditions:

- program builds successfully;
- same inputs remain deterministic;
- 2–6 requested training days are preserved;
- at least one training item is produced;
- per-day exercise count stays inside the Session Duration guardrail;
- per-day working sets stay inside the Session Duration guardrail;
- no duplicate exercise exists inside one training day;
- sets stay in the approved 2–4 starting range;
- rep ranges and RIR remain valid;
- every exercise has a stable professional-visual key placeholder;
- every exercise has a NEXT progression trigger;
- Energy Estimate opens only when measurable inputs are sufficient;
- Chest / Back / Arms / Legs focus creates a meaningful dose increase over Balanced;
- Reposture creates additional upper-back / shoulder-support training exposure;
- Reposture retains dedicated `POSTURE_ACCESSORY`, `EXTERNAL_ROTATION`, and `LOWER_TRAP` roles;
- Reposture works for Full Gym / Limited Gym / Home Basic;
- behind-neck pulling is not selected as a generic Reposture default.

## Reposture sample — Experienced / Full Gym / 4 days / 60 min

Observed weekly direct-set accounting in validation sample:

- Chest: 8
- Back: 12
- Shoulders / rear-delt-support bucket: 9
- Rotator Cuff: 4
- Lower Trap / scapular: 4
- Quads: 10
- Hamstrings: 8
- Calves: 6
- Core: 4
- Biceps: 3

Example Day 1 includes:

- Machine Chest Press
- Lat Pulldown
- Chest-Supported Row
- Incline Machine Press
- Cable Lateral Raise
- Cable Face Pull
- Cable External Rotation

The Reposture path preserves the bodybuilding program and reallocates accessory budget toward upper-back / rear-delt / rotator-cuff / lower-trap work rather than becoming a rehabilitation template.

## Exercise-selection policy note

`Wide-Grip Cable Upright Row` exists only as a tolerance-sensitive candidate/alternative with a controlled shoulder-height range. Behind-neck pulling is intentionally excluded from the generic FREE default; lower-trap work uses Cable / Incline / Prone Y-Raise patterns instead.
