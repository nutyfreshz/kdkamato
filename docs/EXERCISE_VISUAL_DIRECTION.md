# Exercise Visual Direction

## Status

Abstract SVG Motion Card v0 prototype: **FAILED USER RECOGNITION GATE** on 2026-09-08.

RepDB replacement visual quality gate: **ACCEPTED AS GOOD ENOUGH FOR BASE LIBRARY** on 2026-09-08.

Current execution order:

1. Ship a first RepDB batch into the Program UI.
2. Continue to PRO implementation / validation.
3. Only after PRO version validation passes, fill the remaining visual gaps.

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

### Missing-exercise strategy — deferred until PRO validation passes

Do not spend time buying or producing the remaining gap assets before the PRO version has passed validation.

After PRO validation:

1. list the remaining exercise identities not adequately covered by RepDB;
2. group them into visually compatible generation batches;
3. generate a large **BEFORE / START sheet** containing multiple exercises;
4. generate a matching large **AFTER / FINISH sheet** for the same exercise order;
5. crop the large sheets deterministically into per-exercise assets;
6. QC every cropped exercise pair;
7. regenerate only failed groups / exercises until coverage is complete.

RepDB may be used as the product-format benchmark for consistency (clear pose, framing, recognizable equipment, clean start/finish presentation), but **RepDB images themselves must not be supplied to a generative model as input/reference/conditioning material** because the RepDB free-tier license prohibits generative-AI derivation.

If a non-generated licensed source is later cheaper or materially better for a specific missing exercise, it may still be considered, but it is not required before PRO validation.

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

Do not attempt AI restyling of licensed source images. Normalize licensed assets through layout/composition only so licensing stays clean and visual recognition is preserved.

## Acceptance gate

A user unfamiliar with the exercise name should be able to identify:
- which equipment is used,
- body setup,
- movement direction,
- start vs finish position,
within a few seconds.

Bulk gap-production remains deferred until the PRO version validation gate passes.
