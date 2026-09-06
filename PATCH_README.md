# KDKAMATO WEB TH/EN + Public Thai Rewrite Patch v1.0

## Purpose

This patch addresses two things together:

1. Thai is the default website language and EN can be switched from the header.
2. Public-facing Thai is rewritten for readers who are not already familiar with KDKAMATO terminology.

The rule is: reduce language complexity, not scientific depth.

## Scope completed

- Home page static copy
- Descent / hidden-mechanism sequence
- Manga library UI and Manga reader UI
- Knowledge library UI and Article reader UI
- KDKAMATO LAB landing page
- All current LAB tool instructions, measurement help, result blocks, privacy copy, and major deterministic result explanations
- Training placeholder page, without inventing Free/Paid material before source-manuscript review
- TH / EN switch, Thai default
- Optional `*_TH` / `*_EN` Google Sheet fields for dynamic Manga and Article content

## Important content behavior

Technical terms are not removed when they carry real value. They are introduced after or beside understandable language.

Examples:

- `Ape Index` stays as the technical name, but the reader first sees how arm span compares with height.
- `ankle dorsiflexion` is explained as the ability to let the knee travel forward while the heel stays down.
- `Femur / Tibia` remain useful anatomy terms, but Thai explains that they are the thigh and lower-leg segments.
- Geometry models are described as position models, not diagnosis or exact joint-angle calculations.

## Architecture decision

No Sanity/CMS was added in v1.0.

Reason: the site already uses Google Sheet as a live content store for Manga and Articles. Adding a second content system now would create unnecessary maintenance before the wording is stable.

Dynamic Manga/Article localization can be edited in the existing Google Sheet by adding the columns listed in `BILINGUAL_CONTENT_COLUMNS.md`.

A visual editor for static interface copy can be added later if it still provides enough value after the Thai copy stabilizes.

## Apply

Place this patch folder directly inside the local KDKAMATO website repository, next to `package.json`, then run:

`APPLY_KDKAMATO_WEB_TH_EN_PATCH_v1.0.bat`

The script:

1. verifies that the parent folder is the website repository
2. backs up every file that will be replaced
3. copies the patch files into the repository
4. runs `npm run build` when `node_modules` is available
5. automatically restores the backup if that build fails

It does NOT push to GitHub or deploy production automatically.

After local review/build passes, use the existing `upload_kdkamato_github.bat` workflow to publish.
