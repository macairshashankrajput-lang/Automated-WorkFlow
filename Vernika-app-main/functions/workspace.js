const { google } = require('googleapis');

const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
];

function getWorkspaceAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    let credentials;
    try {
      credentials = JSON.parse(raw);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    }
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Workspace service account credentials are incomplete.');
    }
    return new google.auth.GoogleAuth({ credentials, scopes: WORKSPACE_SCOPES });
  }
  return new google.auth.GoogleAuth({ scopes: WORKSPACE_SCOPES });
}

function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function sanitizeMergeData(input) {
  return Object.fromEntries(Object.entries(input || {}).filter(([key]) => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)).map(([key, value]) => [key, normalizeValue(value)]));
}

async function copyAndMergeDocument({ templateId, title, mergeData, parentFolderId }) {
  if (!templateId) throw new Error('A Google Docs template ID is required.');
  const auth = getWorkspaceAuth();
  const drive = google.drive({ version: 'v3', auth });
  const docs = google.docs({ version: 'v1', auth });
  const copied = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: title,
      ...(parentFolderId ? { parents: [parentFolderId] } : {}),
    },
    fields: 'id,name,webViewLink,parents',
  });
  const documentId = copied.data.id;
  const requests = Object.entries(sanitizeMergeData(mergeData)).map(([key, value]) => ({
    replaceAllText: {
      containsText: { text: `{{${key}}}`, matchCase: true },
      replaceText: value,
    },
  }));
  if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
  const file = await drive.files.get({ fileId: documentId, fields: 'id,name,webViewLink,parents' });
  return file.data;
}

async function upsertRows({ spreadsheetId, sheetName, rows, headers }) {
  if (!spreadsheetId || !sheetName) throw new Error('Spreadsheet ID and sheet name are required.');
  const auth = getWorkspaceAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const safeHeaders = Array.isArray(headers) ? headers.map(normalizeValue) : [];
  const values = (rows || []).map(row => Array.isArray(row)
    ? row.map(normalizeValue)
    : (safeHeaders.length ? safeHeaders.map(key => normalizeValue(row?.[key])) : Object.values(row).map(normalizeValue)));
  if (safeHeaders.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [safeHeaders] },
    });
  }
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${sheetName}!A2:ZZ` });
  if (values.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  }
  return { spreadsheetId, sheetName, rowsWritten: values.length };
}

module.exports = { WORKSPACE_SCOPES, copyAndMergeDocument, upsertRows };
