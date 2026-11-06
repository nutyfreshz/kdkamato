# Approved Thai UI copy — 6 November 2026

The owner approved the review Sheet's `edit_text`, correcting Manga to **มังงะ**. This release applies 637 revised entries; the other 855 entries retain their approved wording. All 1,492 text IDs stay unchanged in `docs/ui-copy/approved-2026-11-06.json` and the review Sheet.

Review: https://docs.google.com/spreadsheets/d/1Cze2M_dMWGj75m-KRlJXe8ciHrALBIOuG6NUguGFe_g/edit

Source baseline: `04bd6f3fffda615bcdc7ee639020c2439e878955`. Every edited source range was checked against its exact original text before replacement. Inline elements, variable expressions and their order were preserved, then the rewritten UI text was checked against the approved catalog.

Scope:

- 653 source occurrences in 63 website and Edge Function files.
- 35 content-index cells: 17 in ARTICLES_WEB and 18 in MANGA_WEB. Article bodies and manga image lettering are outside the UI-copy catalog.
- 35 display literals in three private database functions. Signatures, ownership, grants, search paths and security modes are unchanged. All three definitions were read back and matched exactly after migration.
- Edge Functions: `kdk-free-program` v8, `kdk-consult-email` v3 and `kdk-pro-exception-email` v3; JWT verification remains enabled. No email was sent as a test.

Validation before website release: 48 existing Journey/progress tests passed; program-engine synthetic tests passed; TypeScript and production build passed; no obsolete มังงา spelling remains in application source. The Google Sheet's edit_text spelling and all review statuses were read back and verified.

This release changes presentation text, not evaluation thresholds, workout calculations or database access rules. Previously saved reports and programs are historical snapshots and are not rewritten. Full browser sign-in/save testing across all demo accounts is not claimed by this copy release.
