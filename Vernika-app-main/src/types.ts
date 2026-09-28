export type UserRole = 'admin' | 'employee' | 'client' | 'supervisor' | 'hr_manager' | 'department_head';

export type AuxStatus = 
  | 'Available'
  | 'Break'
  | 'Lunch'
  | 'Meeting'
  | 'Training'
  | 'Wrap Up'
  | 'Offline'
  | 'Technical Issue'
  | 'In Call'
  | 'Short Break';

export interface FileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // Data URL or external link
  dataUrl?: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: string;
  folder?: string;
  category?: string;
  description?: string;
  linkedProjectId?: string;
  linkedClientId?: string;
  linkedTaskId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  title: string;
  avatar: string;
  status: 'Active' | 'Away' | 'On Leave' | 'Offline';
  joinedDate: string;
  phone: string;
  location: string;
  leavesBalance?: number;
  auxStatus?: AuxStatus;
  auxStartTime?: string;
  allowedModules?: string[];
  loginEnabled?: boolean;
  username?: string;
  password?: string;
  clientId?: string;
  clientCompany?: string;
  bio?: string;
  skills?: string[];
  isDepartmentHead?: boolean;
  managedDepartment?: string;
  grantableModules?: string[];
  canAssignProjects?: boolean;
  accessGrantedBy?: string;
  accessGrantVersion?: number;
}

export interface Employee {
  id: string;
  firebaseUid?: string;
  employeeId?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: UserRole;
  salary: number;
  joinDate: string;
  birthDate?: string; 
  workAnniversary?: string; 
  status: 'Active' | 'Probation' | 'On Leave' | 'Terminated';
  avatar: string;
  leavesBalance: number;
  performanceRating: number; 
  managerName: string;
  location: string;
  bio?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  bloodGroup?: string;
  address?: string;
  accountNumber?: string;
  skills?: string[];
  username?: string;
  password?: string;
  loginEnabled?: boolean;
  allowedModules?: string[];
  auxStatus?: AuxStatus;
  auxStartTime?: string;
  auxAdherenceScore?: number;
  canViewFullRoster?: boolean;
  employmentType?: 'Full Time' | 'Part Time' | 'Internship' | 'FTC';
  supervisorId?: string;
  supervisorName?: string;
  teamMemberIds?: string[];
  teamName?: string;
  interviewStatus?: 'Not Scheduled' | 'Scheduled' | 'In Progress' | 'Completed' | 'Selected' | 'Rejected';
  interviewerIds?: string[];
  applicationStatus?: 'Open' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Closed';
  referralEnabled?: boolean;
  isDepartmentHead?: boolean;
  managedDepartment?: string;
  grantableModules?: string[];
  canAssignProjects?: boolean;
  accessGrantedBy?: string;
  accessGrantVersion?: number;
}


export interface AuxLog {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar?: string;
  department: string;
  status: AuxStatus;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  reason?: string;
  timestamp: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  manager?: string;
  managerName?: string;
  managerEmail?: string;
  headCount?: number;
  employeesCount?: number;
  budget: number;
  openPositions?: number;
  description?: string;
  color?: string;
  headEmployeeId?: string;
  headEmployeeUid?: string;
  headEmployeeName?: string;
  projectIds?: string[];
  objectives?: string[];
  meetingCadence?: string;
  kpis?: { name: string; value: string; updatedAt: string }[];
}

export interface InterviewRecord {
  id: string;
  positionId?: string;
  candidateName: string;
  candidateEmail?: string;
  status: 'Applied' | 'Screening' | 'Scheduled' | 'Completed' | 'Selected' | 'Rejected';
  interviewerIds?: string[];
  scheduledAt?: string;
  notes?: string;
  referralSource?: string;
}

export interface JobRole {
  id: string;
  title: string;
  department: string;
  minSalary: number;
  maxSalary: number;
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
  activeStaff: number;
  openings?: number;
  hiringStatus?: 'Open' | 'Paused' | 'Closed';
  interviewerIds?: string[];
  interviewStatus?: string;
  applicationIds?: string[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  totalHours?: number;
  hoursWorked?: number;
  overtime?: number;
  notes?: string;
  status: 'Present' | 'Late' | 'Half Day' | 'Absent' | 'On Leave';
  workLocation?: 'Office' | 'Remote' | 'Client Site';
  ipAddress?: string;
  photoCaptured?: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  type: 'Annual' | 'Sick' | 'Casual' | 'Maternity' | 'Unpaid' | 'Paid Leave';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedOn?: string;
  appliedOn?: string;
  reviewedBy?: string;
  reviewedOn?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId?: string;
  authorRole?: string;
  targetDepartment?: string;
  date: string;
  type?: 'Company' | 'Department' | 'Team' | 'Urgent' | string;
  priority?: 'Normal' | 'High' | 'Critical' | 'Urgent' | 'Important' | string;
  pinned?: boolean;
  viewsCount?: number;
}

export interface ProjectComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  clientId?: string;
  requesterUid?: string;
  description: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  progress?: number;
  deadline: string;
  budget: number;
  spent?: number;
  currency?: CurrencyCode;
  team: string[];
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  deliverables?: { title: string; status: 'Pending' | 'Approved' | 'Revision'; dueDate: string; link?: string; value?: number; invoiced?: boolean }[];
  category?: string;
  comments?: ProjectComment[];
  financialRollup?: {
    laborCost: number;
    expenseCost: number;
    vendorCost: number;
    actualTotal: number;
    marginPercent: number;
  };
  capacityWarning?: {
    isOverAllocated: boolean;
    bottleneckMembers: string[];
    riskLevel: 'None' | 'Low' | 'Medium' | 'Critical';
    forecastedDelayDays?: number;
  };
}

export interface Task {
  id: string;
  taskType?: 'task' | 'todo' | 'reminder';
  projectId?: string;
  projectName?: string;
  title: string;
  description?: string;
  assignedToId?: string;
  assignedToName?: string;
  assignedToAvatar?: string;
  team?: string[];
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Todo' | 'In Progress' | 'Review' | 'Done';
  dueDate?: string;
  estimatedHours?: number;
  spentHours?: number;
  blockedBy?: string[]; // Task IDs that must complete first
  isBlocked?: boolean;
  blockerReason?: string;
  comments?: ProjectComment[];
}

export interface CRMContact {
  id: string;
  name: string;
  title?: string;
  company: string;
  industry?: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Lead' | 'Customer' | 'Prospect' | string;
  accountManager?: string;
  totalRevenue?: number;
  lastContact?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  period?: string;
  month?: string;
  year?: string | number;
  baseSalary?: number;
  basicSalary?: number;
  allowances?: number;
  bonuses?: number;
  deductions: number;
  tax?: number;
  netPay?: number;
  netSalary?: number;
  status: 'Draft' | 'Approved' | 'Paid' | 'Processing' | 'Pending' | string;
  paymentDate?: string;
  paymentMethod?: string;
}

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title?: string;
  notes?: string;
  date: string;
  category: 'Travel' | 'Meals' | 'Equipment' | 'Software' | 'Other' | string;
  amount: number;
  description?: string;
  receiptUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
  reviewedBy?: string;
  reviewedDate?: string;
  linkedProjectId?: string;
}

export interface MeetingSession {
  id: string;
  title: string;
  hostId?: string;
  hostName: string;
  hostEmail?: string;
  department?: string;
  date?: string;
  time?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  status: 'Scheduled' | 'Live' | 'Ended';
  recordingUrl?: string;
  isRecording?: boolean;
  transcript?: string;
  summary?: string;
  meetingLink?: string;
  meetingType?: string;
  participants: (MeetingParticipant | string)[];
  activeParticipants?: MeetingParticipant[];
  liveMessages?: any[];
}

export interface MeetingParticipant {
  id: string;
  name: string;
  avatar?: string;
  role?: 'Host' | 'Presenter' | 'Attendee' | string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHandRaised?: boolean;
  isScreenSharing?: boolean;
  joinedAt?: string;
  joinTime?: string;
  leaveTime?: string;
}

export interface MeetingChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp?: string;
  time?: string;
}

export interface OKRGoal {
  id: string;
  title: string;
  owner?: string;
  ownerName?: string;
  department: string;
  quarter?: string; // e.g., "Q3 2026"
  targetQuarter?: string;
  progress: number; // 0-100
  status: 'On Track' | 'At Risk' | 'Off Track' | 'Completed';
  keyResults: {
    title: string;
    target: number;
    current: number;
    unit: string;
  }[];
}

export interface EmailMessage {
  id: string;
  subject: string;
  sender?: string;
  recipient?: string;
  fromName?: string;
  fromEmail?: string;
  fromAvatar?: string;
  toName?: string;
  toEmail?: string;
  ccEmails?: string[];
  body: string;
  snippet?: string;
  date: string;
  time?: string;
  isRead?: boolean;
  read?: boolean;
  starred?: boolean;
  important?: boolean;
  hasAttachments?: boolean;
  category?: 'primary' | 'work' | 'client' | 'updates' | 'system' | string;
  folder: 'Inbox' | 'Sent' | 'Drafts' | 'Trash' | 'Archive' | 'Spam' | string;
  labels?: string[];
  attachments?: { name: string; size: string; url?: string; type?: string }[];
}

export interface SheetCell {
  value?: string | number;
  raw?: string;
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'percentage';
  formula?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  textColor?: string;
  bgColor?: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    backgroundColor?: string;
  };
}

export interface SheetTab {
  id: string;
  name: string;
  rowCount?: number;
  colCount?: number;
  data: Record<string, SheetCell>;
}

export interface VernikaSheet {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  createdAt: string;
  updatedAt: string;
  sharedWith?: any[]; 
  starred?: boolean;
  activeEditors?: any[];
  collaborators?: { userId: string; userName: string; permission: 'view' | 'edit' }[];
  assignedToId?: string;
  assignedToName?: string;
  sharedInChannels?: string[];
  sharedViaEmail?: string[];
  activeTabId?: string;
  tags?: string[];
  tabs: SheetTab[];
}

export interface EmployeePerformanceData {
  id?: string;
  employeeId: string;
  employeeName: string;
  avatar?: string;
  department?: string;
  position?: string;
  activeWindowStatus?: 'Active' | 'Idle' | 'In Meeting' | 'Offline' | 'On Break' | string;
  idleMinutes?: number;
  activeHoursToday?: number;
  targetHoursToday?: number;
  currentActiveApp?: string;
  lastUpdated?: string;
  productivityScore?: number;
  activityHeatmap?: number[];
  month?: string;
  tasksCompleted?: number;
  tasksCompletedWeek?: number;
  tasksAssignedWeek?: number;
  onTimeDeliveryRate?: number;
  qualityScore?: number;
  attendanceRate?: number;
  managerNotes?: string;
}

export interface EmployeeActivityLog {
  id: string;
  employeeId: string;
  employeeName: string;
  action?: string;
  activityType?: string;
  module?: string;
  timestamp: string;
  ipAddress?: string;
  details?: any;
  impactScore?: number;
}

export interface PunchCorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  date?: string;
  requestType?: string;
  originalRecordId?: string;
  originalCheckIn?: string;
  originalCheckOut?: string | null;
  proposedCheckIn?: string;
  proposedCheckOut?: string | null;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  requestedOn: string;
  adminNotes?: string;
  approvedBy?: string;
  reviewedBy?: string;
  reviewedOn?: string;
}

export interface EmployeeWorkflowProfile {
  id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  position?: string;
  dailyTasksLimit?: number;
  activeProjectsLimit?: number;
  preferredWorkingHours?: string;
  timezone?: string;
  automatedRemindersEnabled?: boolean;
  customTags?: string[];
  shiftRoster?: Record<string, string>;
  shiftType?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  gracePeriodMinutes?: number;
  overtimeEligible?: boolean;
  overtimeRateMultiplier?: number;
  overtimeHoursMonth?: number;
  weeklyOffDays?: string[];
  monthlyBaseSalary?: number;
  monthlyBonus?: number;
  monthlyIncentives?: number;
  taxDeduction?: number;
  pfDeduction?: number;
  healthInsuranceDeduction?: number;
  otherDeductions?: number;
  netMonthlyPayout?: number;
  leaveQuotaTotal?: number;
  leaveQuotaUsed?: number;
  assignedProjects?: any[];
  lastUpdated?: string;
}

export interface EmployeeDocumentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  docType?: 'Offer Letter' | 'NDA' | 'Salary Slip' | 'Experience Letter' | 'Relieving Letter' | 'Warning Letter' | string;
  documentType?: string;
  position?: string;
  department?: string;
  data?: any;
  title: string;
  issueDate: string;
  issuedBy?: string;
  status: 'Active' | 'Archived' | 'Revoked' | 'Issued' | string;
  content?: string; // Markdown or HTML representation of the doc
  signatures?: { name: string; date: string }[];
  downloadCount?: number;
  sharedWithEmail?: string;
}

export interface ClientAccount {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  avatar?: string;
  projects: string[];
  totalBilled: number;
  totalPaid: number;
  status: 'Active' | 'Inactive' | 'Pending' | 'Onboarding' | string;
  accountManager: string;
  allowedModules?: string[];
  username?: string;
  password?: string;
  joinedDate: string;
  address?: string;
  industry?: string;
  website?: string;
  notes?: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AED' | 'SGD' | 'CAD' | 'AUD';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: 'AUTH' | 'CRM' | 'PROJECTS' | 'INVOICING' | 'PAYROLL' | 'ATTENDANCE' | 'EXPENSES' | 'SETTINGS' | 'DOCUMENTS' | string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';
  ipAddress?: string;
}

export interface CRMLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  currency?: CurrencyCode;
  stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  assignedTo: string;
  probability?: number;
  expectedCloseDate?: string;
  lastContactDate?: string;
  notes?: string;
  source?: string;
  aiScore?: number; // 0-100 AI Predictive Score
  dealGrade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  riskFactor?: 'Low' | 'Medium' | 'High';
  attribution?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    cpa?: number;
  };
  qualificationFactors?: string[];
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Under Review';
  rating: number;
  activeContracts: number;
  annualSpend?: number;
}

export interface Contract {
  id: string;
  title: string;
  party: string;
  partyName?: string;
  partyType?: string;
  type: 'Client SOW' | 'Vendor Agreement' | 'NDA' | 'Employment' | string;
  value: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Draft' | 'Terminated' | string;
  autoRenew?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  type: 'Meeting' | 'Call' | 'Review' | 'Reminder' | 'Birthday' | 'Work Anniversary' | 'Holiday' | string;
  location?: string;
  description?: string;
  status: 'Confirmed' | 'Tentative' | 'Cancelled' | string;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  clientName: string;
  client?: string;
  clientEmail?: string;
  clientId?: string;
  amount?: number;
  subtotal?: number;
  tax: number;
  total: number;
  currency?: CurrencyCode;
  exchangeRate?: number;
  poNumber?: string;
  threeWayMatched?: boolean;
  matchedMilestoneId?: string;
  matchedPoId?: string;
  complianceBadge?: '3-Way Verified' | 'PO Matched' | 'Manual Approval' | 'Audit Pending';
  date?: string;
  issueDate?: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Sent';
  items: { id?: string; description: string; quantity: number; rate?: number; unitPrice?: number; amount?: number; total?: number }[];
  notes?: string;
  paymentMethod?: string;
  paymentDate?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

export interface Position {
  id: string;
  title: string;
  department: string;
  level?: string;
  salaryRange?: string;
  minSalary?: number;
  maxSalary?: number;
  description?: string;
  activeStaff?: number;
  openings?: number;
  hiringStatus?: 'Open' | 'Paused' | 'Closed';
  interviewerIds?: string[];
  interviewStatus?: string;
  applicationIds?: string[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole?: string;
  text: string;
  timestamp: string;
  createdAt?: string;
  time?: string;
  attachments?: { name: string; url: string; type: string; size?: string }[];
  recipientId?: string; // For DMs
  isPinned?: boolean;
  replyToId?: string;
  replyTo?: { id: string; senderName: string; text: string };
  isEdited?: boolean;
  readBy?: string[];
  voiceNote?: { duration: string; waveform: number[]; audioUrl?: string };
  reactions?: Record<string, string[] | number>;
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'dm' | 'channel' | string;
  members?: string[]; // User IDs
  participants?: string[];
  unreadCount?: number;
  createdAt?: string;
  createdBy?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  targetUserId?: string;
  targetRole?: string;
  targetDepartment?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  title: string;
  message?: string;
  description?: string;
  type?: 'task' | 'message' | 'system' | 'leave' | 'invoice' | 'project' | 'alert' | 'success' | 'warning' | 'info' | string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | string;
  category?: string;
  read: boolean;
  timestamp?: string;
  time?: string;
  linkToScreen?: string;
  linkScreen?: string;
  actionUrl?: string;
  actionData?: any;
}

// Adding missing export for AppContext types
export type { FileRecord as GlobalFileRecord };
export type NotificationItem = Notification;
