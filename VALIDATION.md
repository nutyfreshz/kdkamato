# Validation

## Local patch validation

- JS/JSX parser check: PASS
- Relative import resolution against patched + existing repository modules: PASS
- Required patch file completeness: PASS
- Production `npm run build`: not run in this sandbox because the live repository dependencies are not mounted here
- Apply script behavior: runs the production build automatically on the user's local repository when `node_modules` exists and restores patched files if the build fails

## Live content audit

Source: current `KDKAMATO_Web_Content` Google Sheet.

Observed published content at audit time:

- `MANGA_WEB`: 6 published episodes, EP1–EP6
- `ARTICLES_WEB`: 3 published articles

Localization drafts are included for the public-facing Manga metadata and Article title/summary layer.

Full long-form Article body rewriting is intentionally not written into the live Sheet in this patch because those bodies require a separate scientific-fidelity editorial pass and are already public content.
