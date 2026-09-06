import { getDriveClient, getSheetsClient, hasGoogleCredentials } from './google';

const SHEET_ID = process.env.KDKAMATO_WEB_CONTENT_SHEET_ID || '1GA2U8TzHjjUmdE0cTgpKYZ0g0ZnvjadO93nzf1gtsn0';
const LIVE_STATUS = process.env.KDKAMATO_CONTENT_STATUS || 'PUBLISHED';

function rowsToObjects(values = []) {
  if (!values.length) return [];
  const [headers, ...rows] = values;
  return rows
    .filter((row) => row.some((cell) => String(cell || '').trim() !== ''))
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])));
}

async function sheetRows(range) {
  const sheets = getSheetsClient();
  if (!sheets) return [];
  const result = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
  return rowsToObjects(result.data.values || []);
}

export function extractDriveId(value = '') {
  const text = String(value);
  const matches = [
    text.match(/\/folders\/([a-zA-Z0-9_-]+)/),
    text.match(/\/d\/([a-zA-Z0-9_-]+)/),
    text.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  ];
  for (const match of matches) if (match?.[1]) return match[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(text) ? text : null;
}

async function listFolderImages(folderRef) {
  const folderId = extractDriveId(folderRef);
  const drive = getDriveClient();
  if (!drive || !folderId) return [];

  const result = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id,name,mimeType,modifiedTime)',
    orderBy: 'name_natural',
    pageSize: 100
  });

  return (result.data.files || [])
    .filter((file) => file.mimeType?.startsWith('image/'))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((file) => ({
      id: file.id,
      name: file.name,
      url: `/api/drive-image?id=${encodeURIComponent(file.id)}`
    }));
}

function normalizeBoolean(value) {
  return ['true', '1', 'yes', 'y'].includes(String(value).trim().toLowerCase());
}

function byNewest(a, b) {
  const dateA = Date.parse(a.Publish_Date || '') || 0;
  const dateB = Date.parse(b.Publish_Date || '') || 0;
  if (dateA !== dateB) return dateB - dateA;
  const epA = Number(String(a.Episode_ID || '').replace(/\D/g, '')) || 0;
  const epB = Number(String(b.Episode_ID || '').replace(/\D/g, '')) || 0;
  return epB - epA;
}

async function hydrateManga(row) {
  const pages = await listFolderImages(row.Final_Asset_Folder);
  const cover = pages.find((p) => p.name === row.Cover_File) || pages[0] || null;
  return {
    ...row,
    Featured: normalizeBoolean(row.Featured),
    pages,
    cover,
    pageCount: Number(row.Page_Count) || pages.length
  };
}

export async function getManga({ limit = 12, status = LIVE_STATUS } = {}) {
  if (!hasGoogleCredentials()) return [];
  const rows = await sheetRows('MANGA_WEB!A:Z');
  const selected = rows
    .filter((row) => String(row.Status).toUpperCase() === String(status).toUpperCase())
    .sort(byNewest)
    .slice(0, limit);
  return Promise.all(selected.map(hydrateManga));
}

export async function getMangaBySlug(slug) {
  const rows = await sheetRows('MANGA_WEB!A:Z');
  const row = rows.find((item) => item.Slug === slug && String(item.Status).toUpperCase() === String(LIVE_STATUS).toUpperCase());
  return row ? hydrateManga(row) : null;
}

export async function getArticles({ limit = 12, status = LIVE_STATUS } = {}) {
  if (!hasGoogleCredentials()) return [];
  const rows = await sheetRows('ARTICLES_WEB!A:Z');
  return rows
    .filter((row) => String(row.Status).toUpperCase() === String(status).toUpperCase())
    .sort(byNewest)
    .slice(0, limit)
    .map((row) => ({ ...row, Featured: normalizeBoolean(row.Featured) }));
}

export async function getArticleBySlug(slug) {
  const rows = await sheetRows('ARTICLES_WEB!A:Z');
  return rows.find((row) => row.Slug === slug && String(row.Status).toUpperCase() === String(LIVE_STATUS).toUpperCase()) || null;
}
