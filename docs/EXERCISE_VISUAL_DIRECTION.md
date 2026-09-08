# Exercise Visual Direction

## Status

Abstract SVG Motion Card v0 prototype: **FAILED USER RECOGNITION GATE** on 2026-09-08.

RepDB replacement visual quality gate: **ACCEPTED AS GOOD ENOUGH FOR BASE LIBRARY** on 2026-09-08.

RepDB Batch 01: **SHIPPED**. The first reviewed start/finish pairs are integrated into the Program exercise-detail flow when a mapped exercise appears.

Remaining missing-exercise visual production is **DEFERRED UNTIL THE REAL PRO PILOT / VERSION VALIDATION PASSES**.

## Failure reason for abstract SVG v0

The user could not reliably understand the exercise/movement from the simplified human + equipment abstraction. This format must not be scaled or shipped.

## Accepted replacement direction

Use a visually recognizable technical exercise card:

1. Realistic or high-fidelity illustrated human figure.
2. Recognizable gym equipment silhouette/model.
3. Separate START and FINISH frames instead of ghosted overlays where source media supports it.
4. One clear movement arrow between frames.
5. Minimal labels only: SETUP / MOVE / AVOID.
6. Exercise identity must be obvious without reading the title first.
7. Mobile-first readability.

## Source hierarchy

### Primary — RepDB

Use RepDB as the main exercise visual library when a direct or defensible semantic match exists.

Why:
- consistent flat illustration style,
- start/peak assets,
- commercially usable in-app with attribution,
- broad coverage of the current KDKAMATO exercise catalog.

Important license constraints:
- visible RepDB attribution is required for the free tier,
- do not redistribute RepDB as a dataset,
- do not use RepDB images as generative-AI reference / conditioning / style-transfer input.

### Remaining gaps — grouped original generation after PRO validation

Do not buy or mix another production source by default. After the real PRO pilot/version validation passes, fill remaining gaps with original grouped generation.

Production method:
1. Group missing exercises by compatible visual/equipment family.
2. Generate one large BEFORE / START sheet containing multiple exercises.
3. Generate one matching large AFTER / FINISH sheet for the same exercise order and visual family.
4. Deterministically crop each exercise frame pair into individual assets.
5. QC every exercise for identity, equipment, pose correctness, and start/finish consistency.
6. Regenerate only failed groups/exercises and repeat until the gap set is complete.

RepDB may be used only as a human-facing format benchmark for composition consistency. **Do not feed RepDB imagery into a generative model** because its license prohibits generative-AI derivation/reference use.

## Format normalization rule

Source art may differ, but the KDKAMATO presentation shell must stay consistent.

Every exercise visual should be normalized into one Motion Card system:
- fixed card aspect ratio,
- fixed figure scale / safe area,
- consistent background treatment,
- START / FINISH labeling,
- consistent movement arrow treatment,
- SETUP / MOVE / AVOID copy area,
- mobile-first sizing,
- source attribution handled centrally where required.

## Acceptance gate

A user unfamiliar with the exercise name should be able to identify:
- which equipment is used,
- body setup,
- movement direction,
- start vs finish position,
within a few seconds.

Bulk missing-exercise production may proceed only after the real PRO pilot/version validation passes and only from assets that pass this recognition gate.
