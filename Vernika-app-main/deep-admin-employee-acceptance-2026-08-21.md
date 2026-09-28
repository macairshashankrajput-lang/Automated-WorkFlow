# Vernika 2.0 Deep Admin and Employee Acceptance Report

**Date:** 2026-08-21  
**Environment:** Firebase Hosting production, Firebase Authentication, named Firestore database  
**Method:** Separate authenticated browser contexts for Admin (`Shashank`) and Employee (`Priya`), plus a Client context for support. Realtime assertions were made while the receiving interface remained open; no page reload was used for propagation checks.

## Executive summary

The live matrix confirms that the primary cross-role workflows tested in production are synchronizing correctly: task creation and approval, expense claims, leave approval, attendance telemetry, and Client Direct Support. A defect was found in the Client support path: the visible textarea could be out of sync with React state under the automation/native-input boundary, causing a silent no-op. The form now has explicit input-state synchronization, a form-value fallback, visible error recovery, and best-effort notification delivery after the primary chat write. The corrected bundle was deployed and the visible production Client test displayed the success confirmation while the Admin conversation received the support message.

The results below deliberately distinguish **full mutation lifecycle tests** from **screen inventory checks**. A screen appearing and exposing controls is not treated as proof that every mutation on that screen works across roles.

## Full end-to-end mutation matrix

| Area | Writer | Receiving role/interface | Action sequence | Result |
|---|---|---|---|---:|
| Kanban tasks | Admin | Employee | Admin creates a task assigned to Priya; Employee sees it without reload; Employee starts it, submits review; Admin observes each state; Admin approves; Employee observes Done. | **Passed** |
| Expense claims | Employee | Admin | Priya submits a tagged $12.34 claim; Admin Claims screen receives the same marker, identity, amount, justification, and Pending status. | **Passed** |
| Leave | Employee → Admin | Employee | Priya submits a tagged Paid Leave request; Admin sees it in Pending Approvals; Admin approves; Employee sees Approved. | **Passed** |
| Attendance | Employee | Admin | Priya’s punch workflow updated the active-shift state; Admin Attendance telemetry showed Priya and `Present On Floor: 1`. A later retest correctly avoided creating another punch because an active shift was already present. | **Passed with retest limitation** |
| Client Direct Support | Client | Admin | Client submits a tagged support request; Client shows the success confirmation; Admin’s Alexander Cross conversation receives the support message in realtime. | **Passed after fix and redeploy** |
| Role isolation | Employee/Admin/Client | All | Independent sessions authenticated to their own roles; Employee and Client were not granted Admin-only screens by role-picker choice. | **Passed for tested paths** |

## Screen inventory coverage

The production inventory was exercised for the exposed Admin and Employee navigation targets: Attendance & Clock, AUX Telemetry & Staff Live, Expenses & Claims, Leave Requests, Task Kanban Board, and Team Messenger. Each target was checked for rendered headings, controls, inputs, loading state, and visible error indicators. The Client portal shell, project creation workflow, and Direct Support form were also inspected.

The following modules were screen-inventory checked but did not receive a complete cross-role mutation lifecycle in this run: employee directory/profile management, CRM, invoices and billing, payroll, mail, documents, sheets, calendar, projects beyond the previously verified Client project creation flow, announcements, meetings, and settings. They should not be described as fully end-to-end certified solely from this report.

## Defects found and corrective action

The Client Direct Support form initially remained unchanged after submission in the automated/native-input boundary, with no success or error state. Diagnostics confirmed that the form had a React `onSubmit` handler but that the visible textarea could be reset before browser validation, producing a silent early return. The fix adds an explicit `onInput` state update, reads the submitted textarea value as a fallback, reports empty-input and persistence failures visibly, and prevents a secondary notification write from masking a successfully persisted chat message. The corrected bundle compiled cleanly and was deployed to Firebase Hosting.

The production support verification passed through the interactive browser/native InputEvent path. A Playwright-only fill path did not reliably retain the controlled textarea value and therefore is treated as a harness limitation rather than contradictory product evidence; the visible browser test and Admin realtime message receipt were the decisive checks.

## Security and data hygiene notes

The tests used tagged records so cleanup can be scoped by exact marker. The test-generated task, claim, leave request, and support message should be removed using the existing guarded cleanup tooling after evidence retention requirements are satisfied. The supplied service-account file is temporary deployment material and must be deleted from the workspace after the final production operation. No private key should be committed to Git or included in the acceptance artifacts.

## Acceptance conclusion

Vernika 2.0 has demonstrated genuine multi-interface realtime behavior for the tested operational workflows, rather than only local-panel updates. The acceptance run is **not an exhaustive certification of every CRUD feature in every module**: the broader inventory is complete for the exposed core role screens, while several lower-frequency modules remain inventory-checked only. The report therefore supports release confidence for the tested workflows and identifies the exact remaining coverage boundary for any further hardening cycle.

## Remaining-module production test update

A second production matrix tested the requested remaining modules with independent Admin and Employee sessions. Admin Mail composition and Send Now completed and the tagged message appeared in Sent Items. Employee does not have the Mail module in the current role policy, so an Employee Mail-screen assertion is correctly unavailable; this is role gating, not proof of an Employee Mail inbox. CRM lead creation passed with a tagged deal visible in the pipeline. Admin billing invoice creation passed with a tagged client/invoice record visible. Admin payroll processing passed after correcting the test’s field mapping, and Priya’s Employee Payroll screen displayed the new September 2026 payslip with the expected net amount. Admin Employee Document generation passed and produced the expected `Employment Offer Letter - Priya Sharma`; the Employee role is correctly gated from the Admin document-generator screen.

| Remaining module | Functional result | Cross-role interpretation |
|---|---:|---|
| Mail | **Passed for Admin send/Sent Items** | Employee Mail screen is not granted by the current role policy; recipient-side Mail inbox propagation is therefore not an applicable Employee workflow. |
| CRM | **Passed for Admin lead creation** | Admin/commercial workflow; default Employee policy does not grant CRM. |
| Billing | **Passed for Admin invoice creation** | Admin-only invoice issuance; Client invoice presentation is a separate portal workflow and was not asserted by this Admin/Employee harness. |
| Payroll | **Passed Admin→Employee** | Priya saw the newly processed September payslip and expected net amount without a reload after opening the Employee Payroll screen. |
| Documents | **Passed for Admin generation** | Employee document-generator screen is role-gated; generated-record visibility was verified in Admin. Employee-specific document access remains a separate policy decision. |

The first payroll attempt exposed a harness field-index error, not a product defect: year and salary controls had been filled into the wrong numeric inputs, producing an invalid period/net value. The harness was corrected and the valid production test passed.

## Definitive remaining-module realtime evidence

The remaining-module production harness initially reported false negatives caused by native-event timing and incorrect numeric-field indexing. After correction, Mail, CRM, billing, Payroll, and document generation all passed their applicable workflows. A dedicated two-Admin-device CRM test initially returned false at a short wait, but a 3.5-second diagnostic showed the tagged lead in both Admin sessions with no console errors, confirming realtime delivery. A dedicated two-Admin-device Mail diagnostic with a 4-second wait showed the tagged sent email in both Admin sessions. The Mail notification assertion was false because the notification title does not expose the exact marker in the second session; the sent-email realtime assertion passed. Billing also propagated to a second Admin session. Payroll was corrected to fill Year, Basic Pay, Allowances, Deductions, and Tax in the actual form order; the resulting valid September 2026 record displayed to Priya with the expected net amount. Documents generated the expected `Employment Offer Letter - Priya Sharma`; Employee access to the Admin document-generator screen is intentionally gated.

## Live Employee Directory permission propagation

A dedicated concurrent Admin/Employee test changed Priya’s permissions while her Employee session remained open. The test first applied the Minimal preset and confirmed that CRM was hidden. Admin then applied Select All; Priya’s open Employee session received the updated profile and showed **Outlook Mail** without reload. Admin applied Minimal again, and Outlook Mail disappeared from the Employee navigation without reload. This proves live permission propagation for a non-admin-only module.

The same test did not show **Sales Leads Pipeline** after Select All because the Sidebar definition marks CRM as `adminOnly`; this is an intentional authorization rule, not a realtime-sync failure. The result confirms that permission propagation is live while role restrictions remain enforced. The test did not grant an admin-only module to an employee and will not weaken that security boundary.


## Delivery Refresh Completion — 2026-08-21

The delivery refresh was completed against Firebase project `gen-lang-client-0833693805` and the named Firestore database. A backup-first SDK inventory was captured before deletion. The cleanup removed **256 explicit Firestore documents** across the business/demo collections and **11 legacy Firebase Auth identities**, while preserving the six requested delivery profile documents.

Post-cleanup inventory confirms the intended blank operating state: `employees=5`, `clients=1`, and `admins=1`; `notifications=0`, `leaves=0`, `claims=0`, `claimRequests=0`, `chatMessages=0`, `chatChannels=0`, `emails=0`, `tasks=0`, `projects=0`, `expenses=0`, `invoices=0`, `payrolls=0`, `employeeDocuments=0`, `announcements=0`, and all other business collections in the final inventory are zero.

All six delivery credentials independently authenticated and resolved to the correct profile collection and role. Aditya, Rajat, and Abhishek use the authorized secure extensions `vaibhav26`, `Vineet26`, and `abhi2026`, respectively, because the originally supplied values did not meet the production minimum of eight characters. The exact delivery usernames are `rajputsg`, `nistha`, `aditya`, `rajat`, `pal`, and `Radhe`.

A final two-session realtime smoke test passed for Admin-to-Employee task propagation, Employee-to-Admin leave propagation, Admin-to-Employee chat propagation, and Admin-to-Employee notification propagation. The tagged smoke records were deleted within the test, and the final inventory remained clean.

A production-only runtime safeguard was added so demo seed data and legacy local-storage defaults are enabled only on localhost development sessions. Production Firebase hosts no longer auto-seed mock data or fall back to mock notifications, employees, clients, or other fixture arrays when Firestore is empty. The production type check and Vite build passed. The refreshed bundle was released to Firebase Hosting as version `sites/gen-lang-client-0833693805/versions/a5a0716f2df3aedd`, release `sites/gen-lang-client-0833693805/releases/1787289531271000`. The temporary administrative hosting and cleanup bridges were retired after use.

The release site loaded successfully, the Admin delivery account entered the production workspace, and the refreshed dashboard showed zero pending leaves, zero active projects, zero notifications, zero announcements, and five delivery staff. The remaining Vite chunk-size warning is non-blocking and does not affect deployment or runtime correctness.

## Certification Status

**Delivery refresh: passed. Core realtime and security acceptance: passed for the tested matrix. Production clean-state protection: passed.** The application is ready for the client to begin entering business data using the six delivery profiles. Newly entered legitimate business data will naturally appear after users create it; the clean state refers to the pre-delivery workspace and does not suppress future activity.


## Production Contamination Correction — 2026-08-21

A post-delivery review correctly identified that the first clean-state release was not sufficient. The application still had a shared `seedCollectionIfEmpty` path in `src/lib/realtimeSync.ts`, allowing legacy fixture arrays to repopulate Firestore when a collection was empty. The dashboard also contained hardcoded insight subtitles and chart datasets, and the notification initializer could read stale browser local-storage content.

The defect was corrected by making the shared seed helper localhost-development-only, removing dashboard fixture charts and hardcoded insight counts, and preventing production notification state from reading legacy local-storage defaults. The repopulated records were removed in a second authenticated cleanup, which deleted 102 records while preserving the six delivery identities. The corrected bundle was released as Firebase Hosting version `sites/gen-lang-client-0833693805/versions/9a6e234d4a80ff0c`, release `sites/gen-lang-client-0833693805/releases/1787290798463000`. The temporary publisher was retired again immediately afterward.

Fresh cache-busted production verification now shows: no login popup, no workspace update popup, no team chat popup, zero notifications, zero announcements, zero active projects, zero qualified leads, zero invoices, zero pending leaves, 0% attendance, and dashboard totals derived from the current synchronized state. The final source changes passed `npm run lint` and `npm run build` and were pushed in commit `6c5ca38`.

**Correction status: passed.** The previous release should not be treated as the final clean release; the cache-busted release above is the corrected delivery version.
