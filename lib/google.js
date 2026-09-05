import { google } from 'googleapis';

function privateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
}

export function hasGoogleCredentials() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && privateKey());
}

export function getGoogleAuth() {
  if (!hasGoogleCredentials()) return null;

  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey(),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly'
    ]
  });
}

export function getSheetsClient() {
  const auth = getGoogleAuth();
  return auth ? google.sheets({ version: 'v4', auth }) : null;
}

export function getDriveClient() {
  const auth = getGoogleAuth();
  return auth ? google.drive({ version: 'v3', auth }) : null;
}
