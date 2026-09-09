# KDKAMATO PROGRAM APP BUILD STATUS

## v0.5

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
- PRO Program page reads `get_my_pro_exercise_suggestions` directly; LAB evidence does not auto-swap the Active Program
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
- Normal Sign out now uses Supabase local-session scope so signing out on a Trainer device does not sign the user out of their other devices
- Production builds for the Physical Consult and LAB wording changes completed successfully

Current operating boundary:
- PRO cycle generates/surfaces review cases for professional review
- Email notification is reviewer-facing only and links back to `/consult`
- Email notification contains case-level operational summary, not full internal AI draft or user-facing final report
- Professional `APPROVE / MODIFY / REJECT` remains the human gate
- No automatic user Program change is allowed from LAB, Exercise Memory, notification, or screening paths
- Controlled backend acceptance is complete; real-world adaptations continue to be observed under normal Human Gate operation
- A Trainer using Physical Consult access is operationally acting within the user's own authenticated session; the backend continues to see the same `auth.uid()` and existing user-owned data paths

Deliberately deferred:
- automatic payment/subscription lifecycle
- native in-app Supabase Cron + transactional email provider; current reviewer notification uses the connected scheduled Gmail automation as MVP
- calorie/maintenance estimate until measurable-input algorithm is locked; no subjective activity multiplier guess
- re-enabling Q3/Q5/C2 as independent PRO recommendation evidence until their result codes encode genuinely distinct direction-sensitive information
- widening `save_my_exercise_response` to accept Physical Consult candidate exercises that are not in the Active Program; the current RPC intentionally accepts only exercises in the user's Active Program
- Supabase leaked-password protection because it is available on Pro Plan and above while the current organization remains on Free

Security boundary:
- browser cannot self-upgrade tier
- browser cannot write generated programs directly
- privileged actions remain server/professional controlled
- internal AI draft is never exposed directly to customers
- repository contains no secret/service-role key or reviewer email credential
- signed-in user SECURITY DEFINER RPCs were reviewed as intentional self-service endpoints and retain `auth.uid()` / tier / ownership / input guards as applicable
- Physical Consult password setup requires at least 10 characters in the client UI; changing the Supabase plan solely to enable leaked-password protection is not currently justified

Validation note:
- The Google/OAuth → add Email+Password method is supported by the Supabase Auth contract and the application build is Production READY.
- A real user's credential was not changed merely to test this feature; live credential handoff should be exercised during an actual authorized Physical Consult or a dedicated test account.
