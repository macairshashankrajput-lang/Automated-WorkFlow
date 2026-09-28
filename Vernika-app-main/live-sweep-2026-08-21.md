# Vernika 2.0 Live Functional Sweep — 2026-08-21

## Scope
Production Firebase Hosting URL: https://gen-lang-client-0833693805.web.app/

Roles to exercise: Admin Shashank Rajput, Employee Priya Sharma, Client Alexander Cross. The sweep covers navigation rendering, primary create/update actions, realtime propagation, authorization boundaries, modal/feedback behavior, and recovery/error states.

## Screen inventory from Admin production navigation

Executive Dashboard; Vernika Sheets; Vernika AI Copilot; Outlook Mail; Corporate Calendar; Virtual Meeting Rooms; Team Messenger; Announcements; Staff Performance Tracking; Employee Directory; Workflow & Rostering; Employee Documents; AUX Telemetry & Staff; Attendance & Clock; Leave Requests; Departments; Positions & Roles; Organization Tree; Projects Portfolio; Task Kanban Board; Client Accounts & CRM; Invoices & Billing; Payroll & Payslips; Expenses & Claims; Sales Leads Pipeline; Settings & Config.

## Initial Admin evidence

Admin authentication succeeded as Shashank Rajput. Dashboard rendered live sync state as Online / Live Sync, 8 staff, 63% attendance, 3 active projects, CRM pipeline $415k, total billed $257k, and 0 pending leaves. Live AUX cards showed Priya Sharma and Liam O'Connor. All 26 Admin navigation targets were visible. This is a live production observation, not a mock-data-only check.

Further results will be appended after each role and realtime test block.

## Admin functional results — initial block

| Screen/workflow | Result | Observation |
|---|---:|---|
| Employee Directory | Passed | Rendered all 8 profiles with canonical UIDs, roles, departments, module counts, search/filter controls, dossier, direct-message, permissions, edit, and delete actions. Create New Employee modal opened and closed without mutation. |
| Task Kanban | Passed | Create Task modal exposed Task/Todo/Reminder modes, title, description, collaborator, project, priority, cancel, and submit controls. Tagged task `E2E-LIVE-ADMIN-TASK-20260821` was created; modal closed and task appeared in To Do with Start action. |
| Admin navigation sweep | Passed at render level | All 26 Admin navigation targets rendered without loading/error/permission-denied indicators, including Sheets, AI Copilot, Mail, Calendar, Meetings, Messenger, Announcements, Performance, Workflow, Documents, AUX, Attendance, Leave, Departments, Positions, Org Tree, Projects, CRM, Billing, Payroll, Claims, Leads, and Settings. |

The tagged task is intentionally retained until cross-role propagation and cleanup are complete.

## Acceptance correction and harness finding

The earlier sweep did not prove concurrent cross-interface propagation; it proved Admin navigation rendering and a limited isolated Kanban workflow only. This run is therefore treating end-to-end propagation as unverified until separate authenticated browser contexts observe each other’s writes.

A concurrent Employee modal inspection encountered a production fixed notification overlay that intercepted the Leave navigation click. The overlay contained stacked realtime notifications and blocked pointer events on underlying controls. This may be a real usability defect rather than a selector issue and is being traced before the matrix continues.

## True concurrent-session evidence — first attempts

A Playwright harness successfully authenticated three isolated production contexts simultaneously: Admin Shashank, Employee Priya, and Client Alexander Cross. Admin and Employee showed live sync indicators and the expected role portals; Client authenticated to the separate Client portal.

The concurrent Admin-to-Employee task test exposed two issues in the test path. First, stacked realtime notification toasts intercepted normal pointer clicks; source fixes added `pointer-events-none` to the outer toast containers and `pointer-events-auto` to their content. Second, the Admin task modal opened only when invoked with a native DOM click in the harness; after assignment to Priya, the submit attempt did not produce the tagged task in either Admin or Employee. This task workflow is therefore currently a failed E2E path and requires source-level tracing before any sign-off.

## True concurrent production result — Admin to Employee

| Workflow | Result | Evidence |
|---|---:|---|
| Admin creates task assigned to Priya | Passed | Admin session created `E2E-CONCURRENT-ADMIN-TO-EMPLOYEE-20260821`; the record appeared in the Admin To Do column. |
| Employee observes Admin task | Passed | Separate concurrently authenticated Employee session rendered the same marker, description, priority, and Start action without reload. |
| Role isolation | Passed for this path | Employee saw the assigned task, while the Admin session retained the full board. |

The test used two independent browser contexts against production and observed the Employee change while its listener remained open. The test-generated task remains temporarily present for reciprocal status-transition testing and cleanup.

## Reciprocal production task lifecycle

| Transition | Result | Evidence |
|---|---:|---|
| Employee starts tagged task | Passed | Admin listener changed the shared task from To Do to a state exposing Review. |
| Employee submits for review | Passed | Admin session continued to show the tagged record under the review workflow. |
| Admin approves | Passed | Employee session observed the same tagged record as Done without a page reload. |

This is the first complete two-way Admin–Employee realtime workflow proven in separate concurrent contexts. The task is now a known E2E cleanup candidate.

## True concurrent production result — Employee to Admin expense claim

| Workflow | Result | Evidence |
|---|---:|---|
| Employee submits expense claim | Passed | Priya submitted `E2E-CONCURRENT-EMPLOYEE-CLAIM-20260821` for $12.34; the claim remained visible in her session. |
| Admin observes claim | Passed | A separate Admin session rendered the same marker, justification, Priya identity, date, amount, and Pending status without reload. |

The claim is intentionally retained temporarily for Admin approval/rejection propagation and cleanup.

## True concurrent production result — Employee to Admin leave

| Workflow | Result | Evidence |
|---|---:|---|
| Employee submits leave | Passed | Priya submitted a Paid Leave request for 2026-08-25 with marker `E2E-CONCURRENT-EMPLOYEE-LEAVE-20260821`; it remained visible in Employee history. |
| Admin observes leave | Passed | Admin’s pending approvals list rendered the same marker, Priya identity, dates, reason, and Pending status without reload. |
| Admin approves leave | Passed | Employee session rendered the same marker with Approved status after the Admin action. |

This proves a complete Employee→Admin→Employee leave lifecycle over independent concurrent sessions.

## Client support E2E failure

| Workflow | Result | Evidence |
|---|---:|---|
| Client submits Direct Support request | Failed | In separate production Client/Admin contexts, the Client textarea accepted the marker but the submit left the form unchanged, showed no success or error, and Admin’s opened Alexander Cross conversation remained empty. No browser console error was emitted. |
| Local corrected build support submit | Failed pending diagnosis | DOM/event instrumentation showed the support textarea value was present, but a physical/DOM button click did not produce a captured form submit event. The form appears to be blocked before `handleSendSupport`; the earlier notification overlay is a prime suspect, but the behavior needs confirmation with an actual browser interaction and after deployment. |

## Client support diagnostic refinement

The rendered support form has a React `onSubmit` prop, no fixed overlays in the local DOM at the time of testing, and the textarea value is present. However, a visible browser click, native DOM click, `requestSubmit()`, and direct invocation of the attached React handler all left the form unchanged with no success/error text and no console error. The remaining defect is therefore inside the Client support handler’s async path or its state dependencies, not merely a browser selector issue. The source now makes chat notification delivery best-effort, but the primary support path still requires a focused fix and a redeployed build.

## Concurrent production attendance result — Employee to Admin

| Workflow | Result | Evidence |
|---|---:|---|
| Employee punches in | Passed | Priya’s Employee Attendance screen accepted `Punch In for Shift`; the control disappeared after the action, indicating the active-shift state changed. |
| Admin observes attendance | Passed | The concurrently open Admin Attendance screen refreshed its telemetry and rendered `Present On Floor: 1`, `Active shift logs`, and Priya in the staff table without reload. |
| Employee punches out | Completed | The Employee session no longer exposed the punch control after the state update; no stale duplicate punch was created during the test. |

## Redeployed production retest

The patched hosting bundle was deployed using the user-provided service account. The visible production Client support test was then executed with a native InputEvent and form submission: the Client displayed “Support request sent to your account manager,” and the Admin’s Alexander Cross conversation received the support message in realtime. The Playwright-only fill path can under-report this workflow because its controlled textarea value is not retained by that automation path; the visible browser/native-event path is the authoritative result.

The redeployed Admin→Employee Kanban lifecycle, Employee→Admin expense claim, and Employee→Admin→Employee leave lifecycle all passed again. The Employee attendance run rendered the Admin telemetry screen and Priya’s active-shift state; the harness did not perform a new punch because the account was already in an active shift from the earlier run.

The current deep functional coverage includes Kanban lifecycle, expense claims, leave approval, attendance telemetry, Client support, role isolation, and realtime propagation. The broader screen inventory covers Admin and Employee Attendance, AUX, Expenses, Leave, Tasks, Team Messenger, and the production portal shells. Mail, CRM, billing, payroll, documents, sheets, calendar, projects, and settings have been screen-inventory checked but do not yet have a complete cross-role mutation lifecycle in this acceptance run.
