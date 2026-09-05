# KDKAMATO LAB 3C5Q Web Patch v1.2

Source authority: `KDKAMATO_LAB_LAUNCH_HANDOFF_3C5Q_v1.1.md`

This is the single combined patch. It includes the previous 3C5Q implementation, the `/lab/[tool]` async params route hotfix, and the v1.1 LAB UX/product changes.

## Apply

1. Open this patch folder.
2. Copy `app/`, `components/`, and `lib/` into the root of the existing KDKAMATO website.
3. Allow overwrite/merge when Windows asks.
4. Run the existing Git push `.bat` from the website root.
5. Wait for Vercel to deploy.

## v1.1 changes included

- LAB landing cards now lead with user questions, not technical metric names.
- First-visit tools are grouped by intent: training vs physique.
- Q3 Frame Snapshot is removed from launch and replaced by Knee-to-Wall Ankle Mobility Check.
- `/lab/knee-to-wall` added.
- `/lab/frame-analysis` now redirects back to `/lab` instead of remaining a launch tile.
- Measurement values reuse `sessionStorage` across compatible tools in the same browser session.
- C1 → C2/Q4/Q5, Q1 → C3, Q3 → C2 context reuse is enabled.
- Results show plain-language headline first and technical metric second.
- Measurement fields explain why each input is needed before technical detail.
- No live AI interpretation; deterministic calculation/rules only.
- Raw anthropometric values are not attached to analytics events by this patch.
- Dynamic route uses `await params`, preventing the Next.js 404 observed on `/lab/squat-geometry`.

## Expected routes

- `/lab`
- `/lab/exercise-fit`
- `/lab/squat-geometry`
- `/lab/knee-to-wall`
- `/lab/physique-goal`
- `/lab/v-taper`
- `/lab/ffmi`
- `/lab/ape-index`
- `/lab/femur-tibia`

## Smoke test after deploy

1. Open `/lab/squat-geometry` and confirm it no longer returns 404.
2. Enter Height/Arm Span in C1, open Q4 and confirm the values are reused.
3. Enter Femur/Tibia in Q5, open C2 and confirm the values are reused.
4. Enter Knee-to-Wall left/right, open C2 and confirm the imported context note appears.
5. Enter Shoulder/Waist in Q1, open C3 and confirm the values are reused.
6. Confirm first result is plain Thai language and technical metric appears second.
7. Confirm `/lab/frame-analysis` redirects to `/lab`.
