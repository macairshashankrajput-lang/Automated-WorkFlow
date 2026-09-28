const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf-8');

const mapping = [
  { match: '  type: string;\\n  size: number;\\n  url: string; // Data URL or external link', name: 'FileRecord' },
  { match: '  email: string;\\n  role: UserRole;\\n  department: string;', name: 'User' },
  { match: '  employeeId: string;\\n  name: string;\\n  role: string;', name: 'Employee' },
  { match: '  employeeId: string;\\n  employeeName: string;\\n  date: string;\\n  status: \\'Present\\' | \\'Absent\\' | \\'Late\\' | \\'Half Day\\';', name: 'AttendanceRecord' },
  { match: '  name: string;\\n  code\\?: string;\\n  managerId: string;\\n  managerName: string;', name: 'Department' },
  { match: '  title: string;\\n  department: string;\\n  description\\?: string;\\n  openings: number;', name: 'JobPosting' },
  { match: '  employeeId: string;\\n  employeeName: string;\\n  type: \\'Vacation\\' | \\'Sick\\' | \\'Personal\\' | \\'Unpaid\\';', name: 'LeaveRequest' },
  { match: '  employeeId: string;\\n  employeeName: string;\\n  date: string;\\n  requestType: \\'Check In\\' | \\'Check Out\\';', name: 'PunchCorrectionRequest' },
  { match: '  authorId: string;\\n  authorName: string;\\n  content: string;\\n  date: string;\\n  pinned\\?: boolean;', name: 'Announcement' },
  { match: '  name: string;\\n  client: string;\\n  status: \\'Active\\' | \\'Completed\\' | \\'On Hold\\';', name: 'Project' },
  { match: '  taskType\\?: \\'task\\' | \\'todo\\' | \\'reminder\\';\\n  projectId\\?: string;\\n  projectName\\?: string;\\n  title: string;', name: 'Task' },
  { match: '  name: string;\\n  company: string;\\n  industry?: string;', name: 'ClientAccount' },
  { match: '  employeeId: string;\\n  employeeName: string;\\n  department: string;\\n  period\\?: string;\\n  month\\?: string;', name: 'PayrollRecord' },
  { match: '  employeeId: string;\\n  employeeName: string;\\n  date: string;\\n  category: \\'Travel\\' | \\'Meals\\' | \\'Equipment\\' | \\'Other\\';', name: 'ExpenseClaim' },
  { match: '  title: string;\\n  hostId: string;\\n  hostName: string;\\n  date: string;', name: 'MeetingSession' },
  { match: '  name: string;\\n  avatar\\?: string;\\n  role\\?: \\'Host\\' | \\'Presenter\\' | \\'Attendee\\';', name: 'MeetingParticipant' },
  { match: '  meetingId: string;\\n  senderId: string;\\n  senderName: string;\\n  senderAvatar\\?: string;', name: 'MeetingChatMessage' },
  { match: '  title: string;\\n  owner: string;\\n  ownerName?: string;\\n  progress: number;', name: 'OKRGoal' },
  { match: '  subject: string;\\n  sender: string;\\n  senderEmail: string;\\n  toEmail\\?: string;', name: 'EmailMessage' },
  { match: '  value\\?: string \\| number;\\n  raw\\?: string;\\n  format\\?: \\'text\\' \\| \\'number\\' \\| \\'currency\\' \\| \\'percent\\' \\| \\'date\\' \\| \\'percentage\\';', name: 'SheetCell' },
  { match: '  name\\?: string;\\n  title\\?: string;\\n  description\\?: string;\\n  category\\?: string;\\n  ownerId: string;', name: 'VernikaSheet' },
  { match: '  employeeId: string;\\n  employeeName: string;\\n  department?: string;\\n  position?: string;\\n  rating: number;\\n  feedback: string;', name: 'EmployeePerformanceData' },
  { match: '  employeeId: string;\\n  employeeName: string;\\n  status: AuxStatus;\\n  startTime: string;\\n  duration: number; // in minutes', name: 'AuxLog' },
  { match: '  employeeId: string;\\n  employeeName: string;\\n  documentType: \\'ID\\' | \\'Contract\\' | \\'Certificate\\' | \\'Tax\\' | \\'Other\\';', name: 'EmployeeDocumentRecord' },
  { match: '  employeeId: string;\\n  employeeName\\?: string;\\n  department\\?: string;\\n  position\\?: string;\\n  dailyTasksLimit\\?: number;', name: 'EmployeeWorkflowProfile' },
  { match: '  employeeId: string;\\n  employeeName: string;\\n  action: string;\\n  activityType\\?: string;\\n  module: string;', name: 'EmployeeActivityLog' },
  { match: '  name: string;\\n  company: string;\\n  email: string;\\n  phone: string;\\n  source\\?: string;\\n  value: number;', name: 'CRMLead' },
  { match: '  name: string;\\n  title: string;\\n  company: string;\\n  email: string;\\n  phone: string;\\n  lastContact: string;', name: 'CRMContact' },
  { match: '  name: string;\\n  category: string;\\n  contactPerson: string;\\n  email: string;\\n  phone: string;\\n  status: \\'Active\\' | \\'Pending\\' | \\'Inactive\\';', name: 'Vendor' },
  { match: '  title: string;\\n  party: string;\\n  partyName\\?: string;\\n  partyType\\?: \\'Client\\' | \\'Vendor\\' | \\'Employee\\';', name: 'Contract' },
  { match: '  title: string;\\n  date: string;\\n  time\\?: string;\\n  type: \\'Meeting\\' | \\'Review\\' | \\'Call\\' | \\'Reminder\\' | \\'Holiday\\' | \\'Birthday\\' | \\'Work Anniversary\\';', name: 'CalendarEvent' },
  { match: '  clientName: string;\\n  clientId: string;\\n  amount: number;\\n  date: string;\\n  dueDate: string;\\n  status: \\'Paid\\' | \\'Pending\\' | \\'Overdue\\' | \\'Draft\\';', name: 'Invoice' },
  { match: '  title: string;\\n  content: string;\\n  category\\?: string;\\n  priority?: \\'Low\\' | \\'Normal\\' | \\'High\\' | \\'Urgent\\';', name: 'NotificationItem' },
  { match: '  channelId: string;\\n  senderId: string;\\n  senderName: string;\\n  senderAvatar: string;\\n  senderRole: string;\\n  recipientId\\?: string; // For DMs', name: 'ChatMessage' },
  { match: '  name: string;\\n  description\\?: string;\\n  type: \\'public\\' | \\'private\\' | \\'dm\\';', name: 'ChatChannel' },
  { match: '  userId: string;\\n  title: string;\\n  content: string;\\n  createdAt: string;', name: 'AiChatMessage' },
  { match: '  name: string;\\n  size: number;\\n  type: string;\\n  dataUrl: string;\\n  uploadDate: string;\\n  uploadedBy\\?: string;', name: 'GlobalFileRecord' }
];

for (const m of mapping) {
  // Regex to match "export interface  {\n" followed by the match string
  const regex = new RegExp(\`export interface\\\\s*\\\\{\\\\n\` + m.match);
  if (regex.test(content)) {
    content = content.replace(regex, \`export interface \${m.name} {\\n\` + m.match.replace(/\\\\n/g, '\\n').replace(/\\\\\\?/g, '?').replace(/\\\\\\|/g, '|').replace(/\\\\'/g, "'"));
  } else {
    console.log('Missed:', m.name);
  }
}

fs.writeFileSync('src/types.ts', content);
console.log('Restored interface names');
