# Vernika 2.0 Three-Role End-to-End Test Matrix

The test uses isolated run IDs and only creates documents marked `testRun: true`. Every generated document must be deleted after verification. The three sessions are Admin, Employee, and Client.

| Domain | Admin action | Employee action | Client action | Cross-role verification |
|---|---|---|---|---|
| Identity and session | Login, profile read, role enforcement, logout/relogin | Login, profile read, admin denial | Login, isolated portal read | No role switching or privilege escalation |
| Employees and org | Create/update/permission review | Read own profile and permitted directory | Must not read employee administration | UID/email deduplication |
| AUX and attendance | Observe/update authorized AUX; review punches | Clock in/out and AUX update | No access | Admin receives employee updates |
| Leaves and claims | Approve/reject leave and expense claim | Submit leave and claim | No access | Status transitions propagate |
| Projects and tasks | Create project and task, assign employee/client | Read assigned work and update allowed task state | Read assigned client project | Assignment and status propagation |
| Chat and channels | Create channel/send direct message | Send direct message/channel message | Send permitted client message | Bidirectional realtime delivery |
| Mail and notifications | Send mail and notification | Receive/read permitted mail and notification | Receive client-scoped notification | Delivery and read state |
| CRM and pipeline | Create lead/contact/deal stage | No unauthorized CRM write | No unauthorized CRM write | Admin-only boundary |
| Billing and invoicing | Create invoice/payroll/expense status | Read permitted payslip/claims | Read client invoice and status | Financial status propagation |
| Meetings and calendar | Create meeting/event | Join/update permitted participant state | Join client meeting if permitted | Participant and chat sync |
| Documents and sheets | Create shared document/sheet | Read/edit permitted document/sheet | Read client-scoped deliverable | Version/update visibility |
| Announcements and dashboard | Publish announcement and inspect metrics | Receive announcement and dashboard data | Receive client-scoped announcements | KPI/event refresh |
| Security and recovery | Test denied writes and session timeout | Test denied admin writes | Test tenant isolation | No duplicate events, clean reconnect |

Success requires authenticated writes to reach the intended listeners, forbidden writes to return `permission-denied`, no blank-page crash, no duplicate canonical identities, and complete cleanup of generated test documents.
