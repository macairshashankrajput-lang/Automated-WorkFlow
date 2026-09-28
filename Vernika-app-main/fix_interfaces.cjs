const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf-8');

const dict = {
  'url: string; // Data URL': 'FileRecord',
  'email: string;\n  role: UserRole;': 'User',
  'employeeId: string;\n  name: string;\n  role: string;': 'Employee',
  "status: 'Present' | 'Absent'": 'AttendanceRecord',
  'managerId: string;\n  managerName: string;': 'Department',
  'openings: number;': 'JobPosting',
  "type: 'Vacation' | 'Sick'": 'LeaveRequest',
  "requestType: 'Check In'": 'PunchCorrectionRequest',
  'pinned?: boolean;': 'Announcement',
  "client: string;\n  status: 'Active' | 'Completed'": 'Project',
  "taskType?: 'task' | 'todo' | 'reminder';": 'Task',
  'industry?: string;\n  totalRevenue?: number;': 'ClientAccount',
  'month?: string;\n  year?: string;': 'PayrollRecord',
  "category: 'Travel' | 'Meals'": 'ExpenseClaim',
  'hostId: string;\n  hostName: string;\n  date: string;\n  time: string;\n  status:': 'MeetingSession',
  "role?: 'Host' | 'Presenter' | 'Attendee';": 'MeetingParticipant',
  'meetingId: string;\n  senderId: string;\n  senderName: string;\n  senderAvatar?: string;': 'MeetingChatMessage',
  'owner: string;\n  ownerName?: string;\n  progress: number;': 'OKRGoal',
  'senderEmail: string;\n  toEmail?: string;': 'EmailMessage',
  "format?: 'text' | 'number' | 'currency'": 'SheetCell',
  'category?: string;\n  ownerId: string;\n  ownerName: string;\n  createdAt: string;\n  updatedAt: string;\n  sharedWith: any[]; \n  starred?: boolean;\n  activeEditors?: any[];\n  activeTabId?: string;\n  tags?: string[];': 'VernikaSheet',
  'rating: number;\n  feedback: string;': 'EmployeePerformanceData',
  'status: AuxStatus;\n  startTime: string;\n  duration: number;': 'AuxLog',
  "documentType: 'ID' | 'Contract'": 'EmployeeDocumentRecord',
  'dailyTasksLimit?: number;\n  activeProjectsLimit?: number;': 'EmployeeWorkflowProfile',
  'action: string;\n  activityType?: string;\n  module: string;': 'EmployeeActivityLog',
  'source?: string;\n  value: number;': 'CRMLead',
  'lastContact: string;': 'CRMContact',
  'contactPerson: string;\n  email: string;\n  phone: string;\n  status:': 'Vendor',
  "partyType?: 'Client' | 'Vendor' | 'Employee';": 'Contract',
  "type: 'Meeting' | 'Review' | 'Call'": 'CalendarEvent',
  "status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';": 'Invoice',
  "priority?: 'Low' | 'Normal' | 'High' | 'Urgent';": 'NotificationItem',
  'channelId: string;\n  senderId: string;\n  senderName: string;\n  senderAvatar: string;': 'ChatMessage',
  "type: 'public' | 'private' | 'dm';": 'ChatChannel',
  'userId: string;\n  title: string;\n  content: string;\n  createdAt: string;': 'AiChatMessage',
  'dataUrl: string;\n  uploadDate: string;\n  uploadedBy?: string;': 'GlobalFileRecord'
};

const blocks = content.split('export interface  {\n');
let out = blocks[0];
for (let i = 1; i < blocks.length; i++) {
  let matched = false;
  for (const [key, name] of Object.entries(dict)) {
    if (blocks[i].includes(key)) {
      out += 'export interface ' + name + ' {\n' + blocks[i];
      matched = true;
      break;
    }
  }
  if (!matched) {
    console.log('UNMATCHED BLOCK:', blocks[i].substring(0, 100));
    out += 'export interface UNKNOWN {\n' + blocks[i];
  }
}

fs.writeFileSync('src/types.ts', out);
console.log('Restored interface names via heuristics');
