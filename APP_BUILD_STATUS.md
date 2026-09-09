# KDKAMATO PROGRAM APP BUILD STATUS

## v0.9

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
- `save_my_lab_result` records the backend Program decision under reserved `_system.program_outcome` on that LAB result without adding a new table, column, or public RPC
- Incoming LAB payloads cannot spoof the reserved `_system` namespace
- C1 Squat save UX maps backend outcomes into five user-facing states: `UPDATED`, `ALREADY_FIT`, `NOT_ENOUGH_EVIDENCE`, `REAL_RESPONSE_OVERRIDES`, and `NO_PROGRAM`
- Non-auto-refresh LAB tools remain a neutral context-only save state instead of implying that the Program should have changed
- UPDATED UX compares the pre-save Active Program with the new version and displays the actual exercise change as `old exercise → new exercise`
- Program page compares the current auto-refreshed version with the archived previous version and repeats the actual exercise change, why it changed, what stayed unchanged, and that actual response remains higher authority
- Exercise cards changed by LAB are marked `UPDATED FROM LAB`
- Five-state outcome contract passed rollback-only synthetic tests for all five states, followed by a post-deploy Production-function readback test
- C2 product audit completed: the old four-control scenario explorer was replaced by `Squat Setup Trial` ruleset v1.2, which prioritizes two one-variable-at-a-time comparisons instead of asking the user to interpret multiple setup controls
- C2 keeps Front / High-Bar / Low-Bar as the user's chosen movement rather than claiming anthropometry can select the best variant automatically
- For clearly longer femur-to-tibia direction, C2 prioritizes medium-vs-wide stance comparison first, then flat-vs-small heel elevation; otherwise heel comparison comes first and stance comparison is secondary
- C2 can reuse Knee-to-Wall measurements and flags a left-right difference ≥1.5 cm for repeat measurement before using asymmetry to guide setup; no diagnosis or absolute mobility cutoff is inferred
- C2 remains suggestion/trial guidance only and does not gain independent PRO voting or Program auto-refresh authority
- C3 product audit completed: the Physique Goal tool was demoted from Core to `EXPLORE` because its current shoulder/waist scenario is direct math rather than a sufficiently grounded prescription or Program decision
- C3 remains available as `Physique Scenario Explorer`; it explicitly states that hypothetical shoulder/waist deltas are not equivalent in difficulty/time and cannot prescribe muscle gain or waist reduction
- LAB landing now has 2 Core decision tools, 1 Explore scenario tool, and the existing 5 Quick Checks, reducing overclaim and keeping the decision tools focused on actionable next steps
- Production frontend build for the C2/C3 product audit passed compile, TypeScript, page-data collection, and static generation; deployment is READY on `kdkamato.vercel.app`
- Physical Consult candidate-trial evidence path deployed (`20260909091759_physical_consult_candidate_trials`) instead of weakening the existing Active-Program response contract
- Off-program Physical Consult observations are stored in the private `physical_consult_exercise_trials` context and feed the same Exercise Memory authority model as Program responses
- `save_my_physical_consult_trial` is PRO-only, binds writes to `auth.uid()`, accepts only a current V2 LAB candidate from the user's latest relevant Exercise Fit result, rejects arbitrary exercise keys, and routes exercises already in Active Program back to standard Program feedback
- Exercise Memory now evaluates the most recent combined Program responses + Physical Consult trial observations while preserving the preference-only guard; two positive substantive observations can confirm fit, while LIKE-only observations cannot
- Immediate Physical Consult candidate trial intentionally asks only observable session signals (performance comparison, control/tolerance, preference, optional Trainer note); Recovery is not requested during the same-session trial because it cannot yet be observed
- Physical Consult now has a dedicated same-account workflow: `/login?physical=1` → `/physical-consult` → LAB C1/C2 → off-program LAB candidate trial → focused Active Program feedback → local-device sign out
- Dedicated Physical Consult Login is Email + Password only, does not expose Google login or signup, and redirects directly into the consult session on successful login
- PRO Home and Account surfaces now provide explicit entry points into Physical Consult, while LAB pages opened with `?consult=1` provide a return path to the consult session after saving
- Focused `/physical-consult/program` displays Active Program exercises with Exercise Feedback directly instead of requiring the Trainer to expand details for each exercise in the full Program view
- Physical Consult end-session action still uses local Supabase sign-out scope, so the Trainer device session is closed without signing the user out on other devices
- Physical Consult candidate-trial regression PASS: PRO/current-candidate gate, arbitrary exercise rejection, FREE rejection, positive-response confirmation, and preference-only guard; synthetic fixture residue after rollback is zero
- Production unauthenticated route checks confirmed HTTP 200 and correct Physical Consult mode for `/login?physical=1` and login-required handling for `/physical-consult`

Current operating boundary:
- PRO cycle generates/surfaces review cases for professional review
- Email notification is reviewer-facing only and links back to `/consult`
- Email notification contains case-level operational summary, not full internal AI draft or user-facing final report
- Professional `APPROVE / MODIFY / REJECT` remains the human gate for PRO review-driven adaptations
- C1 Squat is the only current LAB exception allowed to modify an Active Program automatically, and only through the constrained high-confidence targeted-refresh policy above
- LAB auto-refresh cannot override higher-authority actual response / Exercise Memory evidence
- C1 auto-refresh never regenerates unrelated Program components; it creates an immutable targeted vNext with an audit record
- C2 is an evidence-supported trial-priority UX only; it does not claim to identify a uniquely correct Squat variant or setup before real training response
- C3 is explicitly an optional scenario/math exploration surface, not a Core decision tool and not a Program authority source
- A Trainer using Physical Consult access is operationally acting within the user's own authenticated session; the backend continues to see the same `auth.uid()` and existing user-owned data paths
- Physical Consult trial data is a distinct actual-response evidence context, not a fake Active-Program response; it can influence Exercise Memory but does not automatically mutate the Program
- The Physical Consult trial path is PRO-only and restricted to current LAB-generated candidates; standard Active-Program feedback remains the canonical path for exercises already in the Program

Deliberately deferred:
- automatic payment/subscription lifecycle
- native in-app Supabase Cron + transactional email provider; current reviewer notification uses the connected scheduled Gmail automation as MVP
- calorie/maintenance estimate until measurable-input algorithm is locked; no subjective activity multiplier guess
- re-enabling Q3/Q5/C2 as independent PRO recommendation evidence until their result codes encode genuinely distinct direction-sensitive information
- C1 Bench Program auto-refresh: current C1 only measures height + arm span, both Bench result directions currently map to the same V2 ordering (`MACHINE_CHEST_PRESS → SMITH_BENCH_PRESS → DB_BENCH_PRESS`), and available evidence supports anthropometry affecting Bench performance/biomechanics more strongly than it supports selecting one of those three exercise variants automatically
- C1 Deadlift Program auto-refresh: current C1 has only one conservative-geometry result and does not measure torso/sitting-height ratio; available evidence shows meaningful technique differences between deadlift variants and some anthropometric association with conventional-vs-sumo performance, but not enough from the current input set to justify auto-swapping `SMITH_RDL / HIP_EXTENSION_45 / ROMANIAN_DEADLIFT`
- any future promotion of C3 back to Core until it produces a real downstream decision or Program handoff rather than ratio arithmetic alone
- Supabase leaked-password protection because it is available on Pro Plan and above while the current organization remains on Free
- authenticated browser/click usability validation of a real Physical Consult handoff until an authorized real consult or a dedicated test account is selected; no real user's credential should be changed merely for acceptance testing

Security boundary:
- browser cannot self-upgrade tier
- browser cannot write arbitrary generated programs directly
- the C1 automatic write path is a private helper invoked only from the validated self-service LAB save RPC; direct execute was revoked from `public`, `anon`, and `authenticated`
- privileged professional actions remain server/professional controlled
- internal AI draft is never exposed directly to customers
- repository contains no secret/service-role key or reviewer email credential
- signed-in user SECURITY DEFINER RPCs were reviewed as intentional self-service endpoints and retain `auth.uid()` / tier / ownership / input guards as applicable
- `save_my_physical_consult_trial` is an intentional fifth authenticated SECURITY DEFINER self-service endpoint; it adds PRO + current-LAB-candidate + same-user guards and does not expose the private trial table directly
- Physical Consult password setup requires at least 10 characters in the client UI; changing the Supabase plan solely to enable leaked-password protection is not currently justified

Validation note:
- The Google/OAuth → add Email+Password method is supported by the Supabase Auth contract and the application build is Production READY.
- A real user's credential was not changed merely to test Physical Consult access; live credential handoff should be exercised during an actual authorized Physical Consult or a dedicated test account.
- C1 targeted auto-refresh was validated with synthetic users inside transactions that were rolled back; no real user's Program or LAB result was used for acceptance testing.
- Bench/Deadlift auto-refresh expansion was explicitly evidence-gated after reviewing current V2 rules plus published Bench and Deadlift anthropometry/biomechanics literature; no Program automation was added where the present inputs do not support a distinct direction-sensitive exercise choice.
- LAB → Program UX outcome behavior was validated with synthetic users inside rollback transactions and one post-deploy function readback; no real user's Program was altered for acceptance.
- C2 v1.2 trial order was constrained to evidence-supported comparisons: stance-width effects interact with anthropometry, heel elevation changes ankle/knee ROM, and neither finding is used to claim one universally best Squat style.
- Physical Consult candidate-trial backend behavior was validated with rollback-only synthetic fixtures; no real user's Exercise Memory or Program was altered for acceptance testing.
- Production build and unauthenticated route-level validation pass; authenticated end-to-end trainer interaction with a real account has not yet been click-tested.
