# KDKAMATO Web Bilingual Content Columns

Patch v1.0 makes the website understand optional Thai and English columns while preserving the current fields as fallback.

## MANGA_WEB

Keep all existing columns. Add these columns when English editorial copy is ready:

- `Topic_TH`
- `Topic_EN`
- `Title_TH`
- `Title_EN`
- `Short_Description_TH`
- `Short_Description_EN`
- `Caption_TH`
- `Caption_EN`

Behavior:

- Thai mode prefers `*_TH`, then falls back to the current base field.
- English mode prefers `*_EN`, then falls back to the current base field.
- Existing publishing status, image path, page ordering, and asset source are unchanged.

## ARTICLES_WEB

Keep all existing columns. Add:

- `Topic_TH`
- `Topic_EN`
- `Title_TH`
- `Title_EN`
- `Summary_TH`
- `Summary_EN`
- `Body_MD_TH`
- `Body_MD_EN`

`References` remains language-neutral unless a later editorial need justifies separate versions.

## Editing workflow

For Manga and Articles, Google Sheet remains the live content store. Editing a localized field there changes what the website reads after its normal refresh/revalidation cycle. No additional CMS is required for this layer.

Static interface copy such as Home, navigation, LAB labels, and explanatory UI is bilingual in code in this patch. A dedicated visual editor for static interface copy is intentionally deferred until the wording stabilizes.
