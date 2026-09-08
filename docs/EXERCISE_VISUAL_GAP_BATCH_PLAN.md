# KDKAMATO Exercise Visual Gap Batch Plan

Status: READY AFTER PRO VALIDATION PASS
Date: 2026-09-08

## Purpose

Prepare the RepDB-missing exercise visuals without generating images yet.

The production method is locked as:

1. Generate one large START / BEFORE sheet per batch.
2. Generate one matching large FINISH / AFTER sheet using the exact same exercise order, camera family, figure design, equipment design, scale and framing.
3. Deterministically crop each sheet into individual exercise assets.
4. QC each exercise pair independently.
5. Regenerate only failed batches / cells as needed.
6. Integrate accepted assets through the existing KDKAMATO exercise visual shell.

RepDB remains a human-facing format benchmark only. RepDB imagery must not be supplied to a generative model.

## Sheet Contract

- 3 x 2 grid = 6 exercises per sheet.
- Same exercise order in START and FINISH sheets.
- One exercise per cell.
- Full athlete + required equipment visible.
- Neutral clean background.
- Consistent technical fitness illustration style across all batches.
- No text, numbers, labels, arrows, logos or UI baked into the generated art.
- START/FINISH labels, arrows, Setup/Move/Avoid and KDKAMATO UI remain deterministic overlays.
- Camera angle should make the movement immediately recognizable and remain as similar as practical between START and FINISH.
- Athlete/equipment must not cross cell boundaries.
- Preserve sufficient margin for deterministic crop.

## Batch A — Machine / Cable Upper

1. MACHINE_ROW — Machine Row
2. MACHINE_PULLOVER — Machine Pullover
3. CABLE_PULLOVER — Cable Pullover
4. OVERHEAD_CABLE_EXTENSION — Overhead Cable Extension
5. MACHINE_DIP — Machine Dip
6. CABLE_Y_RAISE — Cable Y Raise

Outputs:
- `GAP_A_START_SHEET`
- `GAP_A_FINISH_SHEET`

## Batch B — Dumbbell / Bench / Body-supported

1. SIDE_LYING_DB_EXTERNAL_ROTATION — Side-Lying Dumbbell External Rotation
2. INCLINE_BENCH_Y_RAISE — Incline Bench Y Raise
3. PRONE_Y_RAISE — Prone Y Raise
4. DB_SQUEEZE_PRESS — Dumbbell Squeeze Press
5. DB_REAR_DELT_ROW — Dumbbell Rear-Delt Row
6. SLIDER_LEG_CURL — Slider Leg Curl

Outputs:
- `GAP_B_START_SHEET`
- `GAP_B_FINISH_SHEET`

## Batch C — Band Pull / Reposture

1. BAND_EXTERNAL_ROTATION — Band External Rotation
2. BAND_STRAIGHT_ARM_PULLDOWN — Band Straight-Arm Pulldown
3. BAND_FACE_PULL — Band Face Pull
4. BAND_Y_RAISE — Band Y Raise
5. BAND_LAT_PULLDOWN — Band Lat Pulldown
6. BAND_ROW — Band Row

Outputs:
- `GAP_C_START_SHEET`
- `GAP_C_FINISH_SHEET`

## Batch D — Band Isolation / Lower

1. BAND_REAR_DELT_FLY — Band Rear-Delt Fly
2. BAND_HIGH_ROW — Band High Row
3. BAND_FLY — Band Fly
4. BAND_LATERAL_RAISE — Band Lateral Raise
5. BAND_LEG_EXTENSION — Band Leg Extension
6. BAND_LEG_CURL — Band Leg Curl

Outputs:
- `GAP_D_START_SHEET`
- `GAP_D_FINISH_SHEET`

## Expected Production Count

- Missing exercises: 24
- Large START sheets: 4
- Large FINISH sheets: 4
- Planned image-generation sheets: 8 total
- Final cropped exercise pairs: 24 START + 24 FINISH

## QC Gate per Exercise

PASS only when:

- exercise identity is obvious without reading its name;
- equipment type is correct;
- START and FINISH represent the intended ROM endpoints;
- body orientation and joint positions are plausible;
- no anatomical artifacts materially confuse instruction;
- crop is clean and independent from neighboring cells;
- START and FINISH retain consistent person/equipment/camera identity;
- quality is acceptable beside the RepDB-based main library after KDKAMATO shell normalization.

Any failed exercise remains unavailable rather than shipping a misleading visual.
