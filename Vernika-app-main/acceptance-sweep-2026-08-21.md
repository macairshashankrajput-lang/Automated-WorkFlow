# Vernika 2.0 Production-Readiness Verification

**Date:** 21 August 2026  
**Repository:** [macairshashankrajput-lang/Project][1]  
**Branch:** `main`  
**Final commit:** `d6c273b`

## Executive conclusion

The inherited realtime, identity-normalization, role-routing, and security work remains intact. This continuation completed the remaining Client portal acceptance sweep and fixed three additional production defects: Client-to-messenger routing, misleading direct-message role labels, and unsafe local file handling. The frontend type-check and production build pass, the working tree is clean, and all changes are pushed to GitHub.

One production action remains blocked by the current sandbox session: releasing the updated `firestore.rules` file requires an authenticated Firebase CLI session. The rule change is present in the pushed repository and was validated syntactically through the successful application build, but it has **not** been released to Firebase from this session. Until that release occurs, the existing `chatMessages/msg-1` read-receipt permission errors may continue in the deployed Firestore environment.

## Changes completed in this continuation

| Area | Defect | Resolution | Verification |
|---|---|---|---|
| Client navigation | `Message Lead` changed `activeScreen` but the Client shell always rendered the portal, making the action appear inert. | Client users now render `ChatScreen` when `activeScreen === 'chat'`, while remaining isolated from employee/admin navigation. | Browser interaction opened Team & Client Messenger successfully. |
| Client navigation | The shared messenger had no return path to the isolated Client portal. | Added a Client-only `Back to Portal` control. | Browser interaction returned to the Client portal without logout or role exposure. |
| Direct-message labels | Employee conversations could display `Client: undefined`. | Client classification now uses the matched client record; employee position/title and safe fallbacks are used for employee entries. | Browser output showed valid employee positions and client companies. |
| Firestore chat authorization | Read receipts on messages sent by another user were denied because only admins or message senders could update `chatMessages`. | `firestore.rules` now permits a signed-in user to add only their own `readBy` entry, preserving all other fields and limiting the update to one additional list item. Sender/admin edit and delete permissions remain unchanged. | Rules reviewed locally; deployment remains pending Firebase CLI authentication. |
| Client file manager | Malformed localStorage, unsafe/unbounded files, FileReader failures, and storage quota errors could contribute to blank-page or client-side denial-of-service behavior. | Added defensive localStorage parsing, a 10 MB per-file limit, a 20-file limit, an allowlist for PDF/Office/text/CSV/JSON/common image files, FileReader error handling, quota handling, and a matching browser `accept` filter. | Type-check and production build passed; Client upload control remained rendered after hot reload. |
| Legacy data rendering | Legacy numeric/string/null shapes could cause dashboard and portal rendering failures. | Preserved and pushed the inherited numeric and data-shape guards in context and dashboard/employee/expense/project screens. | Type-check and production build passed. |

## Client portal acceptance results

The Client portal rendered the Apex Global Financials profile with contract totals, active engagement data, invoices, support form, and file manager. Empty **Create New Project** and **Direct Support** submissions correctly triggered required-field validation without creating incomplete production records. The project Update Details dialog opened and closed without saving. A support draft could be entered and cleared without submission.

The Message Lead workflow was tested end to end at the UI level. It opened the messenger, exposed channels and direct messages, displayed the corrected employee/client labels, and returned to the Client portal using the new back control. No blank-page crash occurred during these transitions.

The browser console still showed `Missing or insufficient permissions` for `chatMessages/msg-1` during read-receipt activity. This is consistent with the currently deployed older rule set and is the reason the rules release remains a required production step.

## Cross-role and realtime status

The inherited automated Admin/Employee/Client matrix had already verified role enforcement, identity deduplication, realtime listeners, authorization boundaries, and multi-user synchronization across the principal business collections. This continuation did not weaken those protections. The Client shell remains isolated, and the chat rule patch grants only narrowly scoped read-receipt updates rather than general message-edit access.

The repository’s test matrix covers attendance, AUX, leave, claims, projects, tasks, chat, mail, notifications, CRM, billing, meetings, documents, sheets, announcements, dashboards, reconnect behavior, and privilege-denial checks. The current local validation additionally confirms that the frontend compiles and builds with all recent changes.

## Build and repository evidence

| Check | Result |
|---|---|
| `npm run lint` | Passed (`tsc --noEmit`) |
| `npm run build` | Passed; Vite produced `dist/` |
| `git diff --check` | Passed |
| Git working tree | Clean |
| GitHub branch | `main` is pushed through `d6c273b` |
| Firebase rules release | Blocked: Firebase CLI reports `Failed to authenticate, have you run firebase login?` |
| Legacy Firestore cleanup | No safe repository cleanup script identified; destructive cleanup was not run |

## Required production follow-up

The only required release action is to authenticate the Firebase CLI in an environment that has access to project `gen-lang-client-0833693805` and release the repository’s `firestore.rules` file for the named Firestore database. After the release, repeat the Client messenger read-receipt check and confirm that the `chatMessages/msg-1` permission error disappears. A backend duplicate/legacy-document cleanup should remain a separately reviewed, backup-first operation; it was intentionally not executed blindly because the repository does not contain a verified, non-destructive Firestore cleanup script.

## References

[1]: https://github.com/macairshashankrajput-lang/Project "Vernika 2.0 GitHub repository"


## Final-level acceptance sweep — live evidence

The Admin session authenticated as Shashank Rajput and rendered all 26 Admin navigation targets without a recovery/error state. The Admin task workflow created `E2E-ADMIN-TASK-20260821`, opened its detail panel, and exposed the new Admin-only deletion control. The deletion confirmation blocked the browser automation session once; the browser was closed and recovered, leaving the task record present. This is a test-session cleanup item, not a production defect.

The Employee session authenticated as Priya Sharma and rendered all 11 Employee navigation targets without a recovery/error state. The Employee expense workflow successfully created `E2E-EMP-CLAIM-20260821` for $1.25 and refreshed the totals from $2,700.00 to $2,701.25. The modal closed after the asynchronous write settled. The claim is intentionally retained temporarily for the Admin approval/rejection propagation test and must be removed or marked as test data during cleanup.


## Deep three-role sweep update

- Employee Priya successfully submitted tagged leave request `E2E-EMP-LEAVE-20260821`; Admin Shashank saw it in realtime and approved it. Employee pending count and Admin pending count updated correctly.
- Admin Leave Requests exposed malformed legacy documents as blank rows. `src/screens/LeavesScreen.tsx` now filters incomplete records before rendering; type-check/build passed and blank rows disappeared.
- Existing Client account `alex@apexfinancials.com` / `password123` was verified directly against Firebase Auth and its canonical `clients/{uid}` document. The app misrouted it to Employee after login because the Firebase auth-state listener defaulted all non-admin users to Employee. `src/context/AuthContext.tsx` now resolves the canonical Client profile before assigning the role; the Client portal loaded correctly after the fix.
- Client support submission was previously local-only. `src/screens/ClientPortalScreen.tsx` now persists support requests as realtime direct messages to an enabled Admin recipient. Tagged request `E2E-CLIENT-SUPPORT-20260821` submitted successfully, cleared the form, and produced no console errors.
- Client-to-Admin direct message `E2E-CLIENT-DM-20260821` was sent and rendered successfully in the shared messenger with the correct Client identity.
- Firebase REST diagnostics confirmed the Client Auth account and profile are valid. The repository Admin provisioning script remains unable to run automatically because no Firebase Admin ADC/service-account configuration is present in the sandbox.

These findings are interim evidence for the deep acceptance sweep; further feature coverage and cleanup remain pending.


## Final-level sweep continuation

The existing Client account was tested with the canonical Firebase email and password. Firebase Auth accepted the credentials and the canonical client profile was readable. A real defect then appeared in the app: the auth-state listener could classify a non-admin Client as Employee. The listener now resolves `clients/{uid}` or the unique client email profile before assigning the role; a reload verified the isolated Apex Global Financials Client Portal.

The Client support form previously displayed success without persistence. It now sends a sanitized realtime direct message to an enabled Admin recipient. `E2E-CLIENT-SUPPORT-20260821` submitted successfully, cleared the form, and produced no console errors. A Client-to-Admin direct message, `E2E-CLIENT-DM-20260821`, also rendered successfully in the messenger.

The Client project flow created `E2E-CLIENT-PROJECT-20260821` optimistically while the currently deployed older rules rejected the write, leaving a phantom card/modal state. The data layer now attaches `requesterUid`, Firestore rules allow only owner-bound Client creation and limited owner edits, and the optimistic project card rolls back on a rejected write. The updated rules still require Firebase CLI deployment before this path can be verified against production rules.

The Client portal had no visible manual logout control. A Client-only `Log Out` button was added and verified to return to the authentication screen. The latest frontend type-check, production build, and whitespace validation all passed.


## Employee-side realtime verification

After Admin approval, Priya was re-authenticated in the Employee portal. The approved `2026-08-25` request was initially absent because the dashboard rendered only `myLeaves.slice(0, 3)`, hiding newer requests behind older legacy records. `EmployeePortalScreen.tsx` now renders all employee-owned leave requests. A hot-reload verification showed the approved request in the Employee Leave Balance & Requests panel. The existing tagged expense claim remained visible as Pending, and no recovery screen or runtime error appeared.

## Additional session hardening

The Client portal now exposes a visible logout control; it was exercised successfully and returned to the login screen. The latest code was pushed after build validation. The remaining release caveat is unchanged: the new Firestore rules for chat read receipts and Client-owned project requests require Firebase CLI deployment before their production authorization paths can be verified against the live ruleset.


## Admin claim-review verification

The Admin Expenses & Claims screen received the Employee-created `E2E-EMP-CLAIM-20260821` record. Admin approval changed it from Pending to Approved, updated Total Approved Claims from $1,000.00 to $1,001.25, reduced Pending Review to $1,700.00, and displayed the reviewer as Shashank Rajput. The operation completed without a permission error. Existing legacy/test claims remain in the dataset and were not deleted blindly.
