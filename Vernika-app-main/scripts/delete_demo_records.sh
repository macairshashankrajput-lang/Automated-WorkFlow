#!/usr/bin/env bash
set -euo pipefail
PROJECT="gen-lang-client-0833693805"
DATABASE="ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f"
# These paths are generated from src/data/mockData.ts. The delivery admin emp-1 is preserved.
paths=(
  departments/dept-1 departments/dept-2 departments/dept-3 departments/dept-4 departments/dept-5 departments/dept-6
  positions/pos-1 positions/pos-2 positions/pos-3 positions/pos-4 positions/pos-5 positions/pos-6 positions/pos-7
  employees/emp-2 employees/emp-3 employees/emp-4 employees/emp-5 employees/emp-6 employees/emp-7 employees/emp-8
  clients/cli-1 clients/cli-2 clients/cli-3
  auxLogs/aux-log-1 auxLogs/aux-log-2 auxLogs/aux-log-3 auxLogs/aux-log-4 auxLogs/aux-log-5 auxLogs/aux-log-6
  attendance/att-1 attendance/att-2 attendance/att-3 attendance/att-4 attendance/att-5 attendance/att-6 attendance/att-7 attendance/att-8
  leaves/lev-1 leaves/lev-2 leaves/lev-3 leaves/lev-4 leaves/lev-5 leaves/lev-6 leaves/lev-7
  projects/prj-1 projects/prj-2 projects/prj-3
  tasks/tsk-1 tasks/tsk-2 tasks/tsk-3 tasks/tsk-4 tasks/tsk-5 tasks/tsk-6
  leads/lead-1 leads/lead-2 leads/lead-3
  invoices/inv-1 invoices/inv-2 invoices/inv-3 invoices/inv-4
  announcements/anc-1 announcements/anc-2
  chatChannels/ch-general chatChannels/ch-engineering chatChannels/ch-product chatChannels/ch-sales chatChannels/dm-emp-1-emp-4 chatChannels/dm-emp-1-emp-2 chatChannels/dm-emp-1-cli-1
  chatMessages/msg-1 chatMessages/msg-2 chatMessages/msg-3 chatMessages/msg-4 chatMessages/msg-5
  payrolls/pay-1 payrolls/pay-2 payrolls/pay-3
  expenses/exp-1 expenses/exp-2 expenses/exp-3
  meetings/mtg-1 meetings/mtg-2 meetings/mtg-3
  okrs/okr-1 okrs/okr-2
  notifications/notif-1 notifications/notif-2 notifications/notif-3
  contacts/cnt-1 contacts/cnt-2 contacts/cnt-3 contacts/cnt-4
  vendors/vnd-1 vendors/vnd-2 vendors/vnd-3
  contracts/ctr-1 contracts/ctr-2 contracts/ctr-3
  calendarEvents/evt-1 calendarEvents/evt-2 calendarEvents/evt-3 calendarEvents/evt-4 calendarEvents/evt-5 calendarEvents/evt-6 calendarEvents/evt-7
  emails/mail-1 emails/mail-2 emails/mail-3 emails/mail-4 emails/mail-5
  sheets/sheet-1 sheets/sheet-2 sheets/sheet-3
  punchRequests/pr-1 punchRequests/pr-2
  workflowProfiles/wf-emp-1 workflowProfiles/wf-emp-4 workflowProfiles/wf-emp-5
  employeeDocuments/doc-1 employeeDocuments/doc-2 employeeDocuments/doc-3
)
printf '%s\n' "${paths[@]}" | xargs -P 8 -n 1 -I {} bash -c 'firebase firestore:delete "$1" --project "$2" --database "$3" --force >/dev/null' _ {} "$PROJECT" "$DATABASE"
printf 'Deleted %s identified demo documents; preserved employees/emp-1.\n' "${#paths[@]}"
