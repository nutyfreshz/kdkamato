# KDKAMATO PROGRAM APP BUILD STATUS

## v0.7

Completed:
- Next.js App Router shell: Home / Program / Lab / Progress / Account
- Supabase SSR auth foundation
- Minimum onboarding writes only client-safe baseline/nutrition inputs
- Live Supabase schema readback completed
- Live privileged RPC contract resolved: `persist_free_program_version`
- Live Edge Function deployed: `kdk-free-program`
- Preview is generated server-side from stored foundation inputs
- Activate Program persists an immutable/versioned ACTIVE Free program through privileged server path
- Program page reads ACTIVE program + training items + nutrition target from Supabase
- Progress Quick Check writes low-friction observations under RLS
- Progress summary uses live `get_my_progress_summary` RPC
- FREE → PRO remains admin/server controlled; no payment automation added
- PRO review UI is available at `/consult`
- Live PRO Edge Functions deployed: `kdk-pro-review-package` and `kdk-pro-action`
- Atomic professional-action RPC security contract validated before use
- Exercise Fit real SQUAT save/readback bridge validated end-to-end through candidate ranking and Exercise Memory
- PRO Program page reads `get_my_pro_exercise_suggestions` directly
- PRO reviewer notification cadence configured for the 1st and 15th at 08:00 Asia/Bangkok
- Reviewer email recipient configured outside the repository; no address or mail credential is stored in source control
- LAB UX simplified into Core decision tools + Quick measurement checks with shared measurement reuse
- C1 landing language aligned to its actual role: anatomy-informed hypothesis / priority comparison, not a causal verdict
- LAB result save scope restricted to measurements owned by the current tool/result
- PRO LAB recommendation evidence deduplicated by biological evidence family (`20260909025335_pro_lab_evidence_family_dedupe`)
- Preference-only Exercise Feedback guard validated and fixed (`20260909030427_exercise_memory_preference_only_guard`)
- Controlled PRO Adaptive Loop A–F acceptance PASS using rollback-only synthetic fixtures plus prior real KEEP validation
- ADAPT writeback/version integrity PASS: immutable vNext, prior Active archived, exactly one ACTIVE Program, atomic invalid-writeback failure
- Safety/uncertainty routing PASS through Human Review (`CONFLICTING_SIGNALS`)
- Post-test Production readback confirmed zero synthetic fixture residue
- Physical Consult access uses the same user account: an OAuth/Google user can set or change an Email+Password credential from Account, allowing an authorized Trainer to use the user's existing account without logging the user's Gmail into the Trainer device
- Physical Consult access does not create a Trainer role, Trainer user, delegation model, or parallel user state
- Normal Sign out uses Supabase local-session scope so signing out on a Trainer device does not sign the user out of their other devices
- C1 Squat high-confidence LAB targeted auto-refresh deployed (`20260909042027_c1_targeted_lab_auto_refresh`)
- C1 Squat auto-refresh supports both FREE and PRO Active Programs and creates an immutable vNext while archiving the prior Active version
- Auto-refresh changes only the relevant `QUAD_COMPOUND` exercise set; non-target training items and nutrition targets are preserved
- Directional automation requires a derived `FEMUR_TIBIA` signal with at least a 5% directional margin; this is an automation-confidence guard, not a biological cutoff
- Longer-direction C1 uses the V2 priority set `HACK_SQUAT → LEG_PRESS → SMITH_SQUAT`; shorter-direction C1 uses `SMITH_SQUAT → HACK_SQUAT → LEG_PRESS`
- Existing aligned Quad exercises are preserved and only missing higher-priority directional candidates replace out-of-set exercises, preventing unnecessary whole-program regeneration
- Exercise Memory remains higher authority than LAB: a `CONFIRMED_GOOD_FIT` current exercise or `DEPRIORITIZED` proposed exercise blocks the automatic swap
- Quick Checks, C2 Squat Setup, C3 Physique Goal, C1 Bench, and C1 Deadlift remain suggestion/context only and cannot auto-refresh the Program under this policy
- LAB → Program UX outcome contract deployed (`20260909064155_lab_program_ux_outcome_contract`)
- `save_my_lab_result` now records the backend Program decision under reserved `_system.program_outcome` on that LAB result without adding a new table, column, or public RPC
- Incoming LAB payloads cannot spoof the reserved `_system` namespace
- C1 Squat save UX now maps backend outcomes into five user-facing states: `UPDATED`, `ALREADY_FIT`, `NOT_ENOUGH_EVIDENCE`, `REAL_RESPONSE_OVERRIDES`, and `NO_PROGRAM`
- Non-auto-refresh LAB tools remain a neutral context-only save state instead of implying that the Program should have changed
- UPDATED UX compares the pre-save Active Program with the new version and displays the actual exercise change as `old exercise → new exercise`
- Program page compares the current auto-refreshed version with the archived previous version and repeats the actual exercise change, why it changed, what stayed unchanged, and that actual response remains higher authority
- Exercise cards changed by LAB are marked `UPDATED FROM LAB`
- Five-state outcome contract passed rollback-only synthetic tests for all five states, followed by a post-deploy Production-function readback test
- Production frontend build passed compile, TypeScript, page-data collection, and static generation; deployment is READY on `kdkamato.vercel.app`

Current operating boundary:
- PRO cycle generates/surfaces review cases for professional review
- Email notification is reviewer-facing only and links back to `/consult`
- Email notification contains case-level operational summary, not full internal AI draft or user-facing final report
- Professional `APPROVE / MODIFY / REJECT` remains the human gate for PRO review-driven adaptations
- C1 Squat is the only current LAB exception allowed to modify an Active Program automatically, and only through the constrained high-confidence targeted-refresh policy above
- LAB auto-refresh cannot override higher-authority actual response / Exercise Memory evidence
- C1 auto-refresh never regenerates unrelated Program components; it creates an immutable targeted vNext with an audit record
- A Trainer using Physical Consult access is operationally acting within the user's own authenticated session; the backend continues to see the same `auth.uid()` and existing user-owned data paths

Deliberately deferred:
- automatic payment/subscription lifecycle
- native in-app Supabase Cron + transactional email provider; current reviewer notification uses the connected scheduled Gmail automation as MVP
- calorie/maintenance estimate until measurable-input algorithm is locked; no subjective activity multiplier guess
- re-enabling Q3/Q5/C2 as independent PRO recommendation evidence until their result codes encode genuinely distinct direction-sensitive information
- C1 Bench Program auto-refresh: current C1 only measures height + arm span, both Bench result directions currently map to the same V2 ordering (`MACHINE_CHEST_PRESS → SMITH_BENCH_PRESS → DB_BENCH_PRESS`), and available evidence supports anthropometry affecting Bench performance/biomechanics more strongly than it supports selecting one of those three exercise variants automatically
- C1 Deadlift Program auto-refresh: current C1 has only one conservative-geometry result and does not measure torso/sitting-height ratio; available evidence shows meaningful technique differences between deadlift variants and some anthropometric association with conventional-vs-sumo performance, but not enough from the current input set to justify auto-swapping `SMITH_RDL / HIP_EXTENSION_45 / ROMANIAN_DEADLIFT`
- widening `save_my_exercise_response` to accept Physical Consult candidate exercises that are not in the Active Program; after C1 targeted refresh, an automatically inserted C1 Squat candidate becomes part of Active Program and can use the existing response path normally
- Supabase leaked-password protection because it is available on Pro Plan and above while the current organization remains on Free

Security boundary:
- browser cannot self-upgrade tier
- browser cannot write arbitrary generated programs directly
- the C1 automatic write path is a private helper invoked only from the validated self-service LAB save RPC; direct execute was revoked from `public`, `anon`, and `authenticated`
- privileged professional actions remain server/professional controlled
- internal AI draft is never exposed directly to customers
- repository contains no secret/service-role key or reviewer email credential
- signed-in user SECURITY DEFINER RPCs were reviewed as intentional self-service endpoints and retain `auth.uid()` / tier / ownership / input guards as applicable
- Physical Consult password setup requires at least 10 characters in the client UI; changing the Supabase plan solely to enable leaked-password protection is not currently justified

Validation note:
- The Google/OAuth → add Email+Password method is supported by the Supabase Auth contract and the application build is Production READY.
- A real user's credential was not changed merely to test Physical Consult access; live credential handoff should be exercised during an actual authorized Physical Consult or a dedicated test account.
- C1 targeted auto-refresh was validated with synthetic users inside transactions that were rolled back; no real user's Program or LAB result was used for acceptance testing.
- Bench/Deadlift auto-refresh expansion was explicitly evidence-gated after reviewing current V2 rules plus published Bench and Deadlift anthropometry/biomechanics literature; no Program automation was added where the present inputs do not support a distinct direction-sensitive exercise choice.
- LAB → Program UX outcome behavior was validated with synthetic users inside rollback transactions and one post-deploy function readback; no real user's Program was altered for acceptance.
