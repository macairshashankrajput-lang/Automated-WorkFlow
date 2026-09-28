const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

admin.initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const db = getFirestore(admin.app(), 'ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f');
const auth = admin.auth();

function cleanString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function assertAdmin(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Firebase Authentication is required.');
  }
  if (request.auth.token.admin === true) return;
  return db.doc(`admins/${request.auth.uid}`).get().then((snapshot) => {
    if (!snapshot.exists) {
      throw new HttpsError('permission-denied', 'Administrator authorization is required.');
    }
  });
}

exports.provisionProfile = onCall(async (request) => {
  await assertAdmin(request);

  const input = request.data || {};
  const email = cleanString(input.email).toLowerCase();
  const password = cleanString(input.password);
  const name = cleanString(input.name);
  const requestedRole = cleanString(input.role, 'employee').toLowerCase();
  const role = requestedRole === 'admin' ? 'admin' : requestedRole === 'client' ? 'client' : 'employee';

  if (!email || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'A valid email address is required.');
  }
  if (!name) {
    throw new HttpsError('invalid-argument', 'A profile name is required.');
  }
  if (password && password.length < 8) {
    throw new HttpsError('invalid-argument', 'Passwords must contain at least 8 characters.');
  }
  if (role === 'admin' && request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Only a custom-claim administrator can provision another administrator.');
  }

  let firebaseUser;
  try {
    firebaseUser = await auth.getUserByEmail(email);
    const update = { displayName: name, disabled: input.loginEnabled === false };
    if (password) update.password = password;
    firebaseUser = await auth.updateUser(firebaseUser.uid, update);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    if (!password) {
      throw new HttpsError('invalid-argument', 'A password is required when creating a new profile.');
    }
    firebaseUser = await auth.createUser({
      email,
      password,
      displayName: name,
      disabled: input.loginEnabled === false,
    });
  }

  if (role === 'admin') {
    await auth.setCustomUserClaims(firebaseUser.uid, { admin: true });
    await db.doc(`admins/${firebaseUser.uid}`).set({
      uid: firebaseUser.uid,
      email,
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  const { password: _password, ...profileData } = input;
  const profile = {
    ...profileData,
    id: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    email,
    name,
    role,
    username: cleanString(input.username, email.split('@')[0]),
    loginEnabled: input.loginEnabled !== false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    provisionedByUid: request.auth.uid,
  };

  const collectionName = role === 'client' ? 'clients' : 'employees';
  await db.doc(`${collectionName}/${firebaseUser.uid}`).set(profile, { merge: true });

  return {
    uid: firebaseUser.uid,
    email,
    role,
    collection: collectionName,
    created: !firebaseUser.metadata.creationTime || firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime,
  };
});

const { copyAndMergeDocument, upsertRows } = require('./workspace');

const WORKSPACE_CONFIG = {
  spreadsheetId: '1IUhKLwiXsDqdQEsML9zu4kcYXE1taQsRcVeG8-T1inc',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1IUhKLwiXsDqdQEsML9zu4kcYXE1taQsRcVeG8-T1inc/edit',
  templates: {
    offer_letter: '1E2KWDpbu9z0eVy_4Ikx5EqOAyrO3niypk7ujVXlbY7Q',
    experience_letter: '1yYxSmmmBfjCJjo3NY6Yp_zxPxCjyXMakw1sUGoJh-2M',
    relieving_letter: '1YaBJlftb1TvyHYC8uoaOEmABEXSJ1yznv92xe3oxnKI',
    payslip: '1GtoCm1PvTc7az0Hs4ns7KZtWcDKF5B7uCF6F2aS6JM0',
    promotion_letter: '1wFZcST-g0gk0KYjMHrLk-aRpLb65KKozu-zTty7oibo',
    internship_offer: '1AUnHMNZlBxqD58K3V73979eCFPJnE-x6TWt1M-56nno',
  },
};

async function writeWorkspaceAudit(request, action, entityId, result, metadata = {}) {
  await db.collection('applicationLogs').add({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    actorUid: request.auth?.uid || null,
    actorRole: 'admin',
    action,
    entityType: 'google_workspace',
    entityId: entityId || null,
    source: 'firebase_function',
    result,
    metadataRedacted: metadata,
  });
}

exports.getWorkspaceConfig = onCall(async (request) => {
  await assertAdmin(request);
  return { ...WORKSPACE_CONFIG, secretValuesIncluded: false };
});

exports.generateWorkspaceDocument = onCall(async (request) => {
  await assertAdmin(request);
  const input = request.data || {};
  const documentType = cleanString(input.documentType).toLowerCase();
  const templateId = cleanString(input.templateId) || WORKSPACE_CONFIG.templates[documentType];
  const employeeName = cleanString(input.employeeName, 'Employee');
  const title = cleanString(input.title, `Vernika — ${documentType} — ${employeeName}`);
  if (!templateId || !WORKSPACE_CONFIG.templates[documentType]) {
    throw new HttpsError('invalid-argument', 'Unsupported or missing Google Docs template.');
  }
  try {
    const file = await copyAndMergeDocument({
      templateId,
      title,
      mergeData: input.mergeData || {},
      parentFolderId: cleanString(input.parentFolderId) || undefined,
    });
    await writeWorkspaceAudit(request, 'google_document_generated', file.id, 'success', { documentType, employeeName });
    return { documentId: file.id, name: file.name, webViewLink: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`, documentType };
  } catch (error) {
    await writeWorkspaceAudit(request, 'google_document_generated', null, 'failed', { documentType, error: error.message });
    throw new HttpsError('internal', 'Google document generation failed.');
  }
});

exports.syncWorkspaceSheet = onCall(async (request) => {
  await assertAdmin(request);
  const input = request.data || {};
  const spreadsheetId = cleanString(input.spreadsheetId, WORKSPACE_CONFIG.spreadsheetId);
  const sheetName = cleanString(input.sheetName);
  if (!sheetName) throw new HttpsError('invalid-argument', 'A sheet name is required.');
  try {
    const result = await upsertRows({ spreadsheetId, sheetName, rows: Array.isArray(input.rows) ? input.rows : [] });
    await writeWorkspaceAudit(request, 'google_sheet_sync', spreadsheetId, 'success', { sheetName, rowsWritten: result.rowsWritten, direction: cleanString(input.direction, 'firebase_to_sheets') });
    return result;
  } catch (error) {
    await writeWorkspaceAudit(request, 'google_sheet_sync', spreadsheetId, 'failed', { sheetName, error: error.message });
    throw new HttpsError('internal', 'Google Sheet synchronization failed.');
  }
});

const crypto = require('crypto');
const WORKSPACE_SHEET_COLLECTIONS = Object.freeze({
  Employees: 'employees',
  Departments: 'departments',
  Positions: 'positions',
  Projects: 'projects',
  Tasks: 'tasks',
  Attendance: 'attendance',
  Leaves: 'leaves',
  Claims: 'expenses',
  Mail: 'emails',
  Messenger: 'chatMessages',
  CRM: 'leads',
  Billing: 'invoices',
  Payroll: 'payrolls',
  Documents: 'employeeDocuments',
  'Application Logs': 'applicationLogs',
  Notifications: 'notifications',
  'AUX Logs': 'auxLogs',
  Clients: 'clients',
  Meetings: 'meetings',
  'Activity Logs': 'activityLogs',
});

const WORKSPACE_HEADERS = Object.freeze({
  Employees: ['id', 'employeeId', 'firebaseUid', 'name', 'email', 'username', 'department', 'position', 'role', 'employmentType', 'status', 'managerName', 'supervisorId', 'supervisorName', 'isDepartmentHead', 'managedDepartment', 'allowedModules', 'grantableModules', 'canAssignProjects', 'loginEnabled', 'updatedAt'],
  Departments: ['id', 'name', 'code', 'managerName', 'headEmployeeId', 'headEmployeeName', 'budget', 'headCount', 'employeesCount', 'openPositions', 'description', 'updatedAt'],
  Positions: ['id', 'title', 'department', 'level', 'minSalary', 'maxSalary', 'openings', 'hiringStatus', 'interviewerIds', 'interviewStatus', 'applicationIds', 'activeStaff', 'updatedAt'],
  Messenger: ['id', 'senderId', 'senderName', 'recipientId', 'recipientName', 'channelId', 'text', 'timestamp', 'readBy'],
  'Activity Logs': ['id', 'employeeId', 'employeeName', 'activityType', 'details', 'impactScore', 'timestamp'],
});

function serializableRecord(data) {
  const result = {};
  Object.entries(data || {}).forEach(([key, value]) => {
    if (!/(password|secret|token|private|apikey|credential)/i.test(key)) result[key] = value?.toDate ? value.toDate().toISOString() : value;
  });
  return result;
}

async function refreshWorkspaceCollection(collectionName, sheetName) {
  const snapshot = await db.collection(collectionName).limit(5000).get();
  const rows = snapshot.docs.map((item) => serializableRecord({ id: item.id, ...item.data() }));
  const keys = new Set(WORKSPACE_HEADERS[sheetName] || []);
  rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
  const headers = Array.from(keys);
  return upsertRows({ spreadsheetId: WORKSPACE_CONFIG.spreadsheetId, sheetName, rows, headers });
}

async function refreshAllWorkspaceSheets() {
  const results = [];
  for (const [sheetName, collectionName] of Object.entries(WORKSPACE_SHEET_COLLECTIONS)) {
    results.push(await refreshWorkspaceCollection(collectionName, sheetName));
  }
  return results;
}

exports.syncAllWorkspaceSheets = onCall(async (request) => {
  await assertAdmin(request);
  try {
    const results = await refreshAllWorkspaceSheets();
    await writeWorkspaceAudit(request, 'google_sheet_full_refresh', WORKSPACE_CONFIG.spreadsheetId, 'success', { sheets: results.length });
    return { ok: true, results };
  } catch (error) {
    await writeWorkspaceAudit(request, 'google_sheet_full_refresh', WORKSPACE_CONFIG.spreadsheetId, 'failed', { error: error.message });
    throw new HttpsError('internal', 'Google Sheet full refresh failed.');
  }
});

for (const [sheetName, collectionName] of Object.entries(WORKSPACE_SHEET_COLLECTIONS)) {
  exports[`sync${collectionName.charAt(0).toUpperCase()}${collectionName.slice(1)}ToWorkspace`] = onDocumentWritten(`${collectionName}/{recordId}`, async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;
    const data = after.data() || {};
    if (data.lastEditedSource === 'google_sheets') return;
    try {
      await refreshWorkspaceCollection(collectionName, sheetName);
    } catch (error) {
      console.error(`Workspace sync failed for ${collectionName}:`, error.message);
    }
  });
}


function constantTimeEqual(left, right) {
  const a = Buffer.from(left || '', 'utf8');
  const b = Buffer.from(right || '', 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function safeSheetKey(key) {
  return typeof key === 'string' && /^[A-Za-z][A-Za-z0-9_ -]{0,80}$/.test(key) && !/(password|secret|token|private|apikey|api_key|credential)/i.test(key);
}

exports.workspaceSyncWebhook = onRequest({ region: 'us-central1', invoker: 'public' }, async (request, response) => {
  if (request.method !== 'POST') return response.status(405).json({ error: 'POST required.' });
  const secret = process.env.VERNIKA_SYNC_SECRET;
  if (!secret) return response.status(503).json({ error: 'Workspace sync secret is not configured.' });
  const rawBody = request.rawBody ? request.rawBody.toString('utf8') : JSON.stringify(request.body || {});
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!constantTimeEqual(expected, request.get('X-Vernika-Signature'))) return response.status(401).json({ error: 'Invalid workspace signature.' });

  const payload = request.body || {};
  const collection = WORKSPACE_SHEET_COLLECTIONS[cleanString(payload.sheetName)];
  if (!collection || !Array.isArray(payload.headers) || !Array.isArray(payload.rowValues)) return response.status(400).json({ error: 'Unsupported sheet payload.' });
  const update = {};
  payload.headers.forEach((header, index) => {
    const key = cleanString(header);
    if (safeSheetKey(key) && index < payload.rowValues.length) update[key] = payload.rowValues[index];
  });
  const id = cleanString(update.id || update.ID || update.uid || update.firebaseUid);
  if (!id || id.length > 180) return response.status(400).json({ error: 'A valid row id is required.' });
  delete update.password;
  delete update.passwordHash;
  delete update.apiKey;
  delete update.secret;
  delete update.privateKey;
  delete update.token;
  await db.doc(`${collection}/${id}`).set({ ...update, updatedAt: admin.firestore.FieldValue.serverTimestamp(), lastEditedSource: 'google_sheets' }, { merge: true });
  await db.collection('applicationLogs').add({ timestamp: admin.firestore.FieldValue.serverTimestamp(), actorRole: 'google_workspace', action: 'sheet_edit_applied', entityType: collection, entityId: id, sheetName: payload.sheetName, result: 'success' });
  return response.json({ ok: true, collection, id });
});
