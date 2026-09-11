# KDKAMATO PRO Consult — ChatGPT Operator Runbook

## Purpose

This runbook defines the owner-side PRO Consult workflow. The operator interface is the dedicated ChatGPT PRO Consult room in the KDKAMATO project. There is no owner/admin PRO Consult page on the public website.

## Authority

- Website user submits a PRO Consult request from `/consult`.
- Backend creates one consult meeting plus one professional review queue item.
- Each request has a short operator code: `PC-XXXXXXXX` derived from the meeting UUID.
- Owner notification is sent to `brosci.bnbh@gmail.com` when email delivery is configured.
- ChatGPT retrieves and prepares the user context from Supabase.
- Accepting an appointment changes the meeting to `SCHEDULED` but does **not** consume the monthly consult entitlement.
- Entitlement is consumed only when the consult is actually used/completed under the existing consult entitlement authority.

## Operator commands

### 1. List pending cases

User can say:

`list pending consults`

ChatGPT must retrieve current `REQUESTED` and `SCHEDULED` consult requests from Supabase and return a short queue ordered newest first.

### 2. Open a request

User can say:

`open PC-XXXXXXXX`

ChatGPT must resolve the request code and prepare a concise Consult Package containing:

- Request code and status
- User request/reason
- User identity reference and login email
- Goal/baseline
- Active Program version and relevant training items
- Nutrition profile and current nutrition target
- Recent Progress entries
- Recent LAB results
- Exercise Memory
- Any obvious conflicts between actual response, LAB prediction, and current Program
- Data confidence / missing information that matters before consult

Do not expose raw internal IDs unless needed for troubleshooting.

### 3. Prepare the consult

After opening a case, ChatGPT should summarize:

1. What the user is asking for
2. Current Program context
3. What changed recently
4. Training evidence
5. Nutrition evidence
6. LAB / Exercise Memory evidence
7. Important uncertainty or missing data
8. Suggested questions to ask during the consult
9. Changes that should **not** be made yet without real evidence

Authority remains:

`ACTUAL_RESPONSE > MOVEMENT_TOLERANCE > GOAL_FIT > LAB_PREDICTION > GENERIC_RECOMMENDATION`

and:

`ONE BIOLOGICAL SIGNAL ≠ MULTIPLE VOTES JUST BECAUSE IT APPEARED IN MULTIPLE TOOLS`

### 4. Accept appointment

User can say for example:

`accept PC-XXXXXXXX 2026-09-14 19:00`

Default timezone is `Asia/Bangkok` unless user explicitly says otherwise.

ChatGPT must:

1. Confirm the request still exists and is schedulable.
2. Update the consult meeting to `SCHEDULED` with the requested datetime.
3. Update the linked professional review queue to `SCHEDULED` when present.
4. Retrieve the user's login email.
5. Send the appointment confirmation email through the connected Gmail account.
6. Only after Gmail confirms the send, mark `user_notified_at` in Supabase.
7. Report request code, appointment datetime, email recipient, and notification result.

The acceptance email should contain:

- Subject: `ยืนยันนัด PRO Consult · PC-XXXXXXXX`
- Request code
- Confirmed date/time in Thailand time
- Short confirmation that the request has been accepted
- Reminder that details remain available in KDKAMATO PRO Review

Do not send email before the appointment is successfully written to Supabase.
Do not mark `user_notified_at` if the email send fails.

### 5. Reschedule

User can say:

`reschedule PC-XXXXXXXX to 2026-09-15 20:00`

Use the same acceptance sequence. A successful reschedule resets notification state before sending the new confirmation, then marks it again only after email success.

## Email notification on new request

Website request flow calls the `kdk-consult-email` Supabase Edge Function.

Admin email content must contain:

- Request code
- User reason
- Instruction: open the ChatGPT PRO Consult room and type `open PC-XXXXXXXX`

It must not link to or depend on a website owner/admin console.

## ChatGPT ↔ Supabase operator contract

The ChatGPT room should use the private operator functions in Supabase:

- `private.chatgpt_list_consult_requests()`
- `private.chatgpt_get_consult_case(text)`
- `private.chatgpt_schedule_consult(text, timestamptz)`
- `private.chatgpt_mark_user_notified(text)`

These functions are owner/operator infrastructure and must not be granted to normal authenticated website users.

## Human gates

Appointment scheduling is an explicit owner instruction and is therefore a valid human approval.

Material Program changes after a consult must continue through the existing professional review / versioned Program writeback authority. ChatGPT must not silently apply a material Program change just because an appointment was accepted.

## Completion status

A request moves conceptually:

`REQUESTED → SCHEDULED → CONSULT USED / PROFESSIONAL REVIEW → COMPLETED`

This runbook covers request intake, preparation, and scheduling. Existing PRO professional-review authority continues to control final report publication and material Program writeback.
