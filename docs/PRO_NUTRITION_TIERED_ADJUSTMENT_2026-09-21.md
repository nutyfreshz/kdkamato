# PRO Nutrition Tiered Adjustment — 2026-09-21

Status: PATCHED_IN_REPO_NOT_DEPLOYED

## Approved policy

Replace the fixed `±100 kcal/day` PRO nutrition auto-adjustment with a tiered rule:

- Default material adjustment: `±200 kcal/day`
- Strong-signal adjustment: `±300 kcal/day`
- `±100 kcal/day` is no longer an executable PRO auto-write delta.

## Existing trigger bands retained

### FAT_LOSS

- Weekly weight change `> -0.20%`: reduce calories.
- Weekly weight change `< -1.00%`: increase calories.
- Otherwise: KEEP.

Strong-signal escalation to 300 kcal:

- `>= +0.10%/week`: `-300 kcal/day`
- `<= -1.50%/week`: `+300 kcal/day`

Otherwise the material adjustment is `±200 kcal/day`.

### MUSCLE_GAIN

- Weekly weight change `<= 0.00%`: increase calories.
- Weekly weight change `> +0.50%`: reduce calories.
- Otherwise: KEEP.

Strong-signal escalation to 300 kcal:

- `<= -0.25%/week`: `+300 kcal/day`
- `>= +0.75%/week`: `-300 kcal/day`

Otherwise the material adjustment is `±200 kcal/day`.

## Strong-signal requirements

All must be true:

- Nutrition adherence HIGH: at least 3 entries.
- Training adherence: at least 2 entries.
- Training adherence LOW count: 0.
- Recent `training_status = WORSE` count: 0.
- Latest recovery is not POOR.
- Previous recovery is not POOR.
- Weight trend reaches the strong threshold above.

If these conditions are not met but the existing material trigger is met, the system uses the default `±200 kcal/day`.

## Guardrails preserved

- One-variable rule remains active.
- Safety / pain / repeated issue signals retain higher authority.
- Recovery interventions retain higher authority.
- Schedule changes remain Human Review.
- Exact execution gate remains required.
- Snapshot/current Program stale guard remains required.
- Auto-write supports only the existing exact domains/actions.
- Auto nutrition envelope is capped at `±300 kcal` around the Free foundation band.
- If the proposed target exceeds the envelope, the route becomes Review Required instead of auto-write.

## Report behavior

Published AUTO ADAPT reports now state the actual calorie delta dynamically (`200` or `300 kcal/day`) rather than hard-coding `100 kcal/day`.

## Validation

### Static contract checks

PASS:

- Default 200 tier present.
- Strong 300 tier present.
- Validator allowlist is exactly `-300, -200, +200, +300`.
- Legacy `±100` execution is blocked.
- Auto envelope is `±300`.
- Dynamic report delta is enforced.
- One-variable rule remains present.

### Deterministic policy matrix

PASS:

- FAT_LOSS mild stall → -200
- FAT_LOSS strong weight gain → -300
- FAT_LOSS moderately fast loss → +200
- FAT_LOSS very fast loss with strong evidence → +300
- MUSCLE_GAIN no gain → +200
- MUSCLE_GAIN strong loss → +300
- MUSCLE_GAIN moderately fast gain → -200
- MUSCLE_GAIN very fast gain with strong evidence → -300
- Strong threshold + worse training signal → fallback to 200 tier
- In-range weight trend → KEEP

### Database E2E

Not run in this patch session because isolated project `dgazltepkniwqqbxvksp` remained in `COMING_UP/RESTORING` after restore was requested.

Production project `lmyofrjwmwhuppvejgfx` was not modified.

## Migration

`supabase/migrations/20260921062000_pro_nutrition_tiered_adjustment_v1.sql`
