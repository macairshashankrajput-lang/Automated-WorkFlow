# Vernika P1/P2 Remediation Report

## Scope

The known P0 deployment blockers were intentionally deferred as requested. This pass addressed actionable P1 and P2 code issues in shared files, realtime status reporting, manual refresh coverage, attachment persistence, Firestore payload safety, and login UI accessibility.

## Changes completed

| Severity | Issue | Remediation |
|---|---|---|
| P1 | File Manager used browser-only localStorage | Replaced it with the existing Firestore-backed `globalFiles`, `uploadFile`, and `deleteGlobalFile` workflow. Attachments now appear through realtime listeners across authorized sessions. |
| P1 | Shared file uploads could exceed Firestore document limits | Added a 700 KB maximum for the current Firestore base64 implementation and propagate read/upload failures to the UI. The UI no longer claims to support 10 MB files through a Firestore document. |
| P1 | Google Workspace mappings omitted Position & Role and Application Logs | These mappings were added in the prior audit pass, and Apps Script now creates missing managed tabs before installing triggers. |
| P1 | Claims schema ambiguity | The application’s active UI and Workspace mapping use `expenses` as the canonical expense-claim collection. Legacy `claims` and `claimRequests` rule paths remain for backward compatibility and require a later data migration decision. |
| P2 | Header always displayed optimistic Live Sync | Header now displays Healthy, Syncing, Degraded Sync, or Sync Error states and includes the actual error in the refresh tooltip. |
| P2 | Manual refresh omitted departments, positions, clients, payroll, expenses, global files, activity logs, performance, and audit logs | Manual refresh now fetches and updates all of those collections in addition to the existing collections. |
| P2 | Manual refresh failures were console-only and could create unhandled promise rejections | Refresh failures now update shared error state without rethrowing into header/background event handlers. |
| P2 | Listener failures were not surfaced for key business modules | Employees, Departments, Positions, Messenger, Mail, Expenses, and Shared Files listener errors now update the visible sync-health state. |
| P2 | Login role cards were non-semantic clickable divs | Admin, Employee, and Client role selectors are now keyboard-accessible buttons with `aria-pressed` state. |

## Validation

The following checks passed after the changes: TypeScript checking, Vite production build, Firebase Functions syntax checking, Workspace helper syntax checking, Apps Script syntax checking through a temporary JavaScript copy, and Git whitespace validation. Browser verification confirmed the login screen renders the three role selectors as interactive buttons.

## Deferred P0 blockers

Firebase Workspace Functions remain undeployed in the live environment, Firebase CLI authentication is unavailable in the sandbox, and the service-account/HMAC deployment values plus bound Apps Script authorization are still unavailable. Therefore, the actual production App → Firestore → Sheets and Sheets → webhook → Firestore round trip remains unverified even though the repository implementation and local validation are improved.
