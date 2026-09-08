# KDKAMATO PROGRAM APP BUILD STATUS

## v0.3

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

Current operating boundary:
- PRO cycle generates/surfaces review cases for professional review
- Email notification is reviewer-facing only and links back to `/consult`
- Email notification contains case-level operational summary, not full internal AI draft or user-facing final report
- Professional `APPROVE / MODIFY / REJECT` remains the human gate
- No automatic user Program change is allowed from the notification path

Deliberately deferred:
- automatic payment/subscription lifecycle
- native in-app Supabase Cron + transactional email provider; current reviewer notification uses the connected scheduled Gmail automation as MVP
- full real-world ADAPT/writeback acceptance until there is sufficient evidence or a controlled synthetic fixture is approved
- calorie/maintenance estimate until measurable-input algorithm is locked; no subjective activity multiplier guess

Security boundary:
- browser cannot self-upgrade tier
- browser cannot write generated programs directly
- privileged actions remain server/professional controlled
- internal AI draft is never exposed directly to customers
- repository contains no secret/service-role key or reviewer email credential
