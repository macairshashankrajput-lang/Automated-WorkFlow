# Vernika 2.0 Gap and Production-Readiness Report

## Scope and evidence

This audit covered the screen registry in `src/App.tsx`, route visibility in `src/components/layout/Sidebar.tsx`, Firestore listeners and mutations in `src/context/AppContext.tsx`, authentication and role resolution in `src/context/AuthContext.tsx`, Firestore rules, Firebase Functions, the Google Workspace bridge, the private workbook, and a browser smoke test of the authenticated Admin portal.

## Critical findings

| Priority | Finding | Evidence | Impact | Status |
|---|---|---|---|---|
| P0 | Workspace Firebase Functions are not deployed at the configured endpoint | `POST https://us-central1-gen-lang-client-0833693805.cloudfunctions.net/getWorkspaceConfig` returned HTTP 404 | Google Sheets refresh, document generation, and workbook auto-update cannot work live | External deployment blocker |
| P0 | Firebase CLI has no authorized deployment account in the sandbox | `firebase deploy --only hosting` returned `Failed to authenticate, have you run firebase login?` | Current repository cannot be promoted to live Firebase from this environment | External deployment blocker |
| P0 | Apps Script bridge is source-ready but not confirmed bound or trigger-authorized | `Code.gs` is present, but bound project creation previously failed with insufficient scopes | Sheets-to-Firestore updates cannot be certified | External authorization blocker |
| P1 | Required server-side Workspace secrets are absent from the deployment environment | `GOOGLE_SERVICE_ACCOUNT_JSON` and `VERNIKA_SYNC_SECRET` are not available | Docs/Sheets API access and HMAC webhook validation cannot run | External secret blocker |
| P1 | Admin Workspace panel previously hid the workbook control when `getWorkspaceConfig` failed | Browser showed `internal [0]` and no workbook controls before fallback | Admin could not discover or trigger synchronization | Fixed in current repository; requires frontend deployment |
| P1 | Positions were missing from the backend sheet mapping | `WORKSPACE_SHEET_COLLECTIONS` contained Departments but not Positions | Position & Role data could never reach the workbook through full refresh or triggers | Fixed in current repository; Apps Script now creates the tab |
| P1 | Application Logs were not in the backend sheet mapping | `applicationLogs` was written by Functions but not mapped to a workbook tab | Workspace audit records were not synchronized | Fixed in current repository |
| P1 | Managed workbook tabs were not created by `setupVernikaBridge` | Apps Script formatted existing tabs only | A missing tab caused `values.update` to fail | Fixed in current repository with `ensureManagedSheets` |

## End-to-end feature gaps

| Area | Verified state |
|---|---|
| Authentication | Admin login works locally with the provided test profile. Canonical Firebase claims are used for Admin status, and a requested role is rejected when it does not match the resolved profile. Live production authentication was not fully revalidated because the current Firebase deployment cannot be promoted from the sandbox. |
| Admin navigation | All 26 visible Admin navigation destinations rendered non-empty content in a sequential browser smoke test. This is a rendering test, not proof that every create/update/delete action succeeds against production Firestore. |
| Realtime listeners | AppContext subscribes to a broad set of collections, including employees, departments, positions, messages, emails, meetings, attendance, leaves, invoices, payroll, expenses, documents, notifications, and audit logs. Listener errors are only logged to the console; the UI does not expose a collection-level sync failure state. `isSyncing` is set false immediately after listeners are registered rather than after first successful snapshots. |
| Claims | The frontend uses the `expenses` collection for expense claims, while Firestore rules also contain `claims` and `claimRequests` paths. This is a schema ambiguity that must be standardized before production migration or external clients may write/read a different collection than the UI. |
| Documents | Local document creation persists to Firestore, but Google Docs generation depends on the undeployed callable and service-account secret. It is not live-certified. |
| Mail and Messenger | Both have Firestore mutations and listeners. Their live end-to-end delivery is not certified because production deployment and multi-account testing are blocked. |
| Meetings | Camera/video behavior contains a simulated-video fallback when device permission is unavailable. This is acceptable for a demo but must be clearly separated from a production video provider if real calls are required. |
| File management | `FileManager` stores files in browser localStorage. It is not a multi-device or server-backed file workflow. |
| Demo/mock state | Localhost intentionally seeds initial data and localStorage fixtures. Production hostnames disable this path, but local testing can still write fixtures into the configured Firestore when an Admin is authenticated. This must be isolated to a Firebase emulator or a separate development project. |
| Notifications | Firestore notifications are subscribed in real time, but failures are only console warnings and popup behavior depends on current-tab state. Cross-device notification delivery is not production-certified. |
| Sheets | The separate Vernika Sheets UI is an in-app spreadsheet model persisted to Firestore; it is not the same as the private Google workbook. The Google workbook integration requires the backend and Apps Script deployment described above. |

## Security findings

The Firestore rules correctly use Firebase Auth and custom Admin claims for administrator operations, and employee self-updates are field-limited. However, most reads are allowed for any signed-in user, and several owner-based write rules rely on user-controlled ownership fields. Hierarchical department-head limits are enforced in the employee permission update helper, but the application still needs a complete production rules review for every collection that should be restricted by department or module. Frontend `allowedModules` is not a substitute for Firestore rules.

## Fixes applied during this audit

The Admin Workspace fallback now keeps the private workbook link, Docs templates, and `Refresh all tabs` control visible if the configuration callable is missing. The Firebase Workspace map now includes `Positions` and `Application Logs`. The Apps Script bridge now creates missing managed tabs, including `Positions`, before installing triggers and formatting the workbook. Static validation passed after these changes: TypeScript checking, Vite production build, Firebase Functions syntax, Workspace helper syntax, Apps Script syntax through a temporary JavaScript copy, and Git whitespace validation.

## Production exit criteria

Vernika should not be marked production-ready until the current branch is deployed to Firebase, the two server-side secrets are configured, `setupVernikaBridge` has run successfully against the private workbook, and a two-session test proves App → Firestore → Sheets and Sheets → webhook → Firestore → subscribed second session for Employees, Departments, Positions, Messenger, Claims/Expenses, Leaves, and Tasks. The claims collection naming must also be finalized, and local demo seeding must use an emulator or separate project rather than any shared production database.
