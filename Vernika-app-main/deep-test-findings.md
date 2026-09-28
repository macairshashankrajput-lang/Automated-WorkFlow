# Vernika Deep-Test Findings

Date: 2026-08-21

## Browser smoke test

The local authenticated Admin portal successfully rendered the application shell and all 26 visible navigation destinations without a blank page during sequential browser navigation. The Admin Settings screen displayed a Google Workspace tab. After the live `getWorkspaceConfig` call returned an internal error, the fallback fix displayed the private workbook link, six Docs template links, and the `Refresh all tabs` control with a clear deployment-status warning.

## Live Workspace probe

The private workbook API query succeeded and confirmed the existing workbook tabs: Employees, Departments, Projects, Tasks, Attendance, Leaves, Claims, Mail, Messenger, CRM, Billing, Payroll, Documents, Application Logs, Sync Queue, and API Inventory.

The deployed `getWorkspaceConfig` endpoint returned HTTP 404, confirming that the Workspace Firebase Functions are not deployed at the configured endpoint. Firebase CLI deployment also returned `Failed to authenticate` because no Firebase CLI account is authorized in the sandbox. `GOOGLE_SERVICE_ACCOUNT_JSON` and `VERNIKA_SYNC_SECRET` are not present in the deployment environment.

## Static checks

TypeScript checking, Vite production build, Firebase Functions syntax validation, Workspace helper syntax validation, Apps Script syntax validation through a temporary `.js` copy, and Git whitespace validation passed after the latest fixes.

## Code fixes verified

The Admin Workspace fallback keeps the workbook/sync control visible when the backend function is unavailable. Firestore trigger code, stable workbook headers, credential filtering, loop prevention, Messenger-to-`chatMessages` mapping, Apps Script retry payload restoration, Department reporting tree, persisted department-head metadata, scoped grants, and full role selector preservation are present in the current repository.
