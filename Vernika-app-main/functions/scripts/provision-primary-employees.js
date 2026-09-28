#!/usr/bin/env node
'use strict';

/**
 * Idempotently provision or repair Nistha and Aditya in Firebase Auth and
 * Firestore without storing passwords in the repository.
 *
 * Dry run (default; no network calls):
 *   node functions/scripts/provision-primary-employees.js
 *
 * Apply:
 *   VITE_FIREBASE_API_KEY='...' \
 *   NISTHA_PASSWORD='...' ADITYA_PASSWORD='...' \
 *   node functions/scripts/provision-primary-employees.js --apply
 *
 * The apply mode uses FIREBASE_CLI_ACCESS_TOKEN when provided, otherwise the
 * access token from ~/.config/configstore/firebase-tools.json. A Firebase
 * service-account key is not required.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0833693805';
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f';
const API_KEY = process.env.VITE_FIREBASE_API_KEY;
const APPLY = process.argv.includes('--apply');

const employees = [
  {
    key: 'nistha', email: 'nistha@vernika.io', passwordEnv: 'NISTHA_PASSWORD',
    name: 'Nistha Singh', username: 'nistha', role: 'department_head',
    department: 'Hr& workflow', position: 'HR & Workflow Specialist',
    isDepartmentHead: true, managedDepartment: 'Hr& workflow',
    grantableModules: ['dashboard', 'attendance', 'leaves', 'tasks', 'projects', 'chat', 'announcements', 'documents', 'aux_status', 'expenses', 'meetings', 'mail', 'calendar'],
    allowedModules: ['dashboard', 'attendance', 'leaves', 'tasks', 'projects', 'chat', 'announcements', 'documents', 'aux_status', 'expenses', 'meetings', 'mail', 'calendar', 'tracking'],
  },
  {
    key: 'aditya', email: 'aditya@vernika.io', passwordEnv: 'ADITYA_PASSWORD',
    name: 'Aditya Singh', username: 'aditya', role: 'employee',
    department: 'sales & marketing', position: 'Sales & Marketing Specialist',
    isDepartmentHead: false, managedDepartment: '', grantableModules: [],
    allowedModules: ['dashboard', 'attendance', 'leaves', 'projects', 'tasks', 'chat', 'announcements', 'aux_status', 'expenses', 'meetings', 'mail', 'calendar'],
  },
];

function cliToken() {
  if (process.env.FIREBASE_CLI_ACCESS_TOKEN) return process.env.FIREBASE_CLI_ACCESS_TOKEN;
  const tokenFile = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
  return JSON.parse(fs.readFileSync(tokenFile, 'utf8')).tokens.access_token;
}

function requiredPassword(profile) {
  const password = process.env[profile.passwordEnv];
  if (APPLY && (!password || password.length < 6)) throw new Error(`${profile.passwordEnv} must be supplied and contain at least 6 characters (Firebase Auth minimum).`);
  return password;
}

function firestoreValue(value) {
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (value === null || value === undefined) return { nullValue: 'NULL_VALUE' };
  return { stringValue: String(value) };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `${response.status} ${response.statusText}`;
    throw new Error(`${response.status} ${message}`);
  }
  return payload;
}

async function findOrRepairAuth(profile, token) {
  if (!API_KEY) throw new Error('VITE_FIREBASE_API_KEY is required in apply mode.');
  const publicCreate = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: profile.email, password: requiredPassword(profile), displayName: profile.name, returnSecureToken: true }),
  });
  const publicPayload = await publicCreate.json().catch(() => ({}));
  if (publicCreate.ok) return { uid: publicPayload.localId, action: 'created' };
  if (publicPayload?.error?.message !== 'EMAIL_EXISTS') {
    throw new Error(`Auth create failed for ${profile.email}: ${publicPayload?.error?.message || publicCreate.status}`);
  }

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const adminUrl = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`;
  let lookup;
  try {
    lookup = await requestJson(`${adminUrl}:lookup`, { method: 'POST', headers, body: JSON.stringify({ email: [profile.email] }) });
  } catch (error) {
    const legacyPassword = process.env.LEGACY_PASSWORD;
    if (legacyPassword) {
      const signIn = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, password: legacyPassword, returnSecureToken: true }),
      });
      const signInPayload = await signIn.json().catch(() => ({}));
      if (signIn.ok && signInPayload.idToken && signInPayload.localId) {
        await requestJson(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: signInPayload.idToken, password: requiredPassword(profile), returnSecureToken: false }),
        });
        return { uid: signInPayload.localId, action: 'updated-via-legacy-password' };
      }
    }
    throw new Error(`Auth lookup failed for ${profile.email}: ${error.message}. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_CLI_ACCESS_TOKEN with Identity Toolkit Admin access; alternatively provide LEGACY_PASSWORD if the account’s current password is known.`);
  }

  const existing = lookup.users?.[0];
  if (existing) {
    await requestJson(`${adminUrl}:update`, {
      method: 'POST', headers,
      body: JSON.stringify({ localId: existing.localId, email: profile.email, password: requiredPassword(profile), displayName: profile.name, disableUser: false, returnSecureToken: false }),
    });
    return { uid: existing.localId, action: 'updated' };
  }

  throw new Error(`Auth account ${profile.email} exists but could not be repaired. The Firebase CLI token cannot call Identity Toolkit Admin API in this environment; run with a service-account/admin token that has Firebase Authentication Admin access.`);
}

async function mergeEmployeeProfile(profile, uid, token) {
  const fields = {
    id: uid, firebaseUid: uid, name: profile.name, username: profile.username,
    email: profile.email, role: profile.role, department: profile.department,
    position: profile.position, title: profile.position,
    isDepartmentHead: profile.isDepartmentHead, managedDepartment: profile.managedDepartment,
    grantableModules: profile.grantableModules, allowedModules: profile.allowedModules,
    status: 'Active', loginEnabled: true, auxStatus: 'Available', joinedDate: '2026-08-21',
    provisionedBy: 'provision-primary-employees.js', updatedAt: new Date().toISOString(),
  };
  const body = { fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValue(value)])) };
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/employees/${uid}`;
  await requestJson(url, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

async function main() {
  console.log(`${APPLY ? 'APPLY mode' : 'DRY RUN'} for project=${PROJECT_ID}, database=${DATABASE_ID}`);
  if (!APPLY) {
    for (const profile of employees) console.log(`${profile.key}: would repair Auth ${profile.email} and merge employees/{authUid}; password supplied=${Boolean(process.env[profile.passwordEnv])}`);
    console.log('No changes made. Re-run with --apply and environment passwords to provision accounts.');
    return;
  }
  const token = cliToken();
  for (const profile of employees) {
    const { uid, action } = await findOrRepairAuth(profile, token);
    await mergeEmployeeProfile(profile, uid, token);
    console.log(`${profile.key}: ${action}; uid=${uid}; Auth repaired and employees/${uid} merged`);
  }
  console.log('Provisioning completed.');
}

main().catch((error) => { console.error(`Provisioning failed: ${error.message}`); process.exitCode = 1; });
