# Vernika 2.0 Google Workspace Integration

## Private workbook

- **Workbook:** Vernika 2.0 — Private Admin Operations
- **Spreadsheet ID:** `1IUhKLwiXsDqdQEsML9zu4kcYXE1taQsRcVeG8-T1inc`
- **URL:** https://docs.google.com/spreadsheets/d/1IUhKLwiXsDqdQEsML9zu4kcYXE1taQsRcVeG8-T1inc/edit
- **Owner:** `macair.shashankrajput@gmail.com`
- **Admin-only access:** enforced by the application role check; do not share the workbook with employees or clients.

Tabs are named `Employees`, `Departments`, `Projects`, `Tasks`, `Attendance`, `Leaves`, `Claims`, `Mail`, `Messenger`, `CRM`, `Billing`, `Payroll`, `Documents`, `Notifications`, `AUX Logs`, `Clients`, `Meetings`, `Activity Logs`, `Application Logs`, `Sync Queue`, and `API Inventory`.

## HR Docs templates

| Document | Google Docs template ID |
|---|---|
| Offer letter | `1E2KWDpbu9z0eVy_4Ikx5EqOAyrO3niypk7ujVXlbY7Q` |
| Experience letter | `1yYxSmmmBfjCJjo3NY6Yp_zxPxCjyXMakw1sUGoJh-2M` |
| Relieving letter | `1YaBJlftb1TvyHYC8uoaOEmABEXSJ1yznv92xe3oxnKI` |
| Payslip | `1GtoCm1PvTc7az0Hs4ns7KZtWcDKF5B7uCF6F2aS6JM0` |
| Promotion letter | `1wFZcST-g0gk0KYjMHrLk-aRpLb65KKozu-zTty7oibo` |
| Internship offer | `1AUnHMNZlBxqD58K3V73979eCFPJnE-x6TWt1M-56nno` |

The Firebase callable `generateWorkspaceDocument` copies a template into Drive, replaces `{{merge_field}}` placeholders, and writes an audit record to `applicationLogs`.

## Configuration inventory

| Service | Variable / identifier | Used in | Classification |
|---|---|---|---|
| Firebase client | `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` | `firebase-applet-config.json`, `src/lib/firebase.ts` | Client configuration; API key is not an Admin credential |
| Firebase Functions | `GOOGLE_SERVICE_ACCOUNT_JSON` | `functions/workspace.js` | **Secret; never place in Sheets or Git** |
| Firebase Functions | `VERNIKA_SYNC_SECRET` | `functions/index.js`, `google-apps-script/Code.gs` | **Secret HMAC key; never place in Sheets or Git** |
| Supabase | `SUPABASE_URL`, `SUPABASE_KEY` / publishable key | `supabase-applet-config.json`, `src/lib/firebase.ts` | Publishable client configuration where applicable; service-role keys remain secret |
| Google Workspace | OAuth client ID | local CLI / deployment configuration | Identifier only |
| Google Workspace | OAuth client secret and refresh token | encrypted local credential store / deployment secret store | **Secret; never place in Sheets or Git** |
| Google Apps Script | `VERNIKA_SYNC_SECRET` Script Property | bound script `Code.gs` | **Secret; set via Script Properties** |

The `API Inventory` tab contains this metadata, code locations, scopes, rotation notes, and redacted identifiers only. It deliberately excludes passwords, private keys, refresh tokens, service-role keys, and secret values.

## Apps Script bridge

`google-apps-script/Code.gs` provides `setupVernikaBridge`, `onVernikaEdit`, `reconcileVernikaWorkbook`, professional formatting, audit logging, and signed webhook delivery. The bridge should be bound to the private workbook, then run `setupVernikaBridge` once as the Admin. Set `VERNIKA_SYNC_SECRET` in Apps Script Project Settings → Script Properties to the same value configured in Firebase Functions. The retry queue replays the original `headers` and `rowValues` payload, and header-row edits are ignored.

The webhook endpoint is `workspaceSyncWebhook`. It verifies HMAC signatures, maps approved sheet names to Firestore collections, requires a row ID, blocks credential-like fields, updates only the identified record, and writes an audit log. `Messenger` correctly maps to the app’s `chatMessages` collection. Firestore `onDocumentWritten` triggers refresh the corresponding sheet after application changes while ignoring records marked `lastEditedSource: google_sheets`, preventing sync loops. The admin-only `syncAllWorkspaceSheets` callable refreshes all mapped tabs on demand and writes stable headers.

## Deployment requirements

1. Store `GOOGLE_SERVICE_ACCOUNT_JSON` and `VERNIKA_SYNC_SECRET` in the Firebase Functions secret/environment configuration.
2. Deploy the Functions bundle and verify `workspaceSyncWebhook` returns `503` when the sync secret is intentionally absent, rather than accepting unsigned edits.
3. Bind `google-apps-script/Code.gs` and `appsscript.json` to the private workbook, set the same HMAC secret as a Script Property, and run `setupVernikaBridge` once.
4. Test an Admin-only document generation call, an Admin full-workbook refresh, a spreadsheet edit, a rejected unsigned webhook, and an employee/client attempt to open the workbook.
5. Verify an app-side write to Employees, Departments, Positions, Messenger, Claims, and Leaves appears in the corresponding sheet, then edit a sheet row and verify the same Firestore record and all subscribed app windows update.
6. Rotate the uploaded service-account key before production because it was shared during setup.
