import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db, auth, provisionProfile } from '../lib/firebase';
import { collection, onSnapshot, getDocs, query, limit, type DocumentData, type QuerySnapshot } from 'firebase/firestore';
import {
  syncDocToFirestore,
  deleteDocFromFirestore,
  broadcastEvent,
  onBroadcastEvent,
  seedCollectionIfEmpty,
  setIdentityResolver,
  normalizeRemoteRecord
} from '../lib/realtimeSync';
import {
  Employee,
  Department,
  Position,
  AttendanceRecord,
  LeaveRequest,
  Project,
  Task,
  CRMLead,
  CRMContact,
  Vendor,
  Contract,
  CalendarEvent,
  Invoice,
  Announcement,
  ChatMessage,
  ChatChannel,
  NotificationItem,
  AuxLog,
  AuxStatus,
  ClientAccount,
  PayrollRecord,
  ExpenseClaim,
  MeetingSession,
  MeetingParticipant,
  MeetingChatMessage,
  OKRGoal,
  EmailMessage,
  VernikaSheet,
  EmployeePerformanceData,
  EmployeeActivityLog,
  SheetCell,
  PunchCorrectionRequest,
  EmployeeWorkflowProfile,
  EmployeeDocumentRecord,
  GlobalFileRecord,
  CurrencyCode,
  AuditLog
} from '../types';
import { createAuditLogEntry, sanitizeInput } from '../utils/security';
import {
  initialEmployees,
  initialDepartments,
  initialPositions,
  initialAttendance,
  initialLeaves,
  initialProjects,
  initialTasks,
  initialLeads,
  initialContacts,
  initialVendors,
  initialContracts,
  initialCalendarEvents,
  initialInventory,
  initialInvoices,
  initialAnnouncements,
  initialMessages,
  initialChannels,
  initialNotifications,
  initialAuxLogs,
  initialClients,
  initialPayrolls,
  initialExpenses,
  initialMeetings,
  initialOKRs,
  initialEmails,
  initialSheets,
  initialPerformanceRecords,
  initialPunchRequests,
  initialWorkflowProfiles,
  initialDocuments,
  initialFiles,
} from '../data/mockData';

// Helper to safely deduplicate array by id
function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

const buildEnv = (import.meta as ImportMeta & { env?: Record<string, string | boolean> }).env || {};
const allowDemoData = typeof window !== 'undefined' && buildEnv.DEV === true && buildEnv.VITE_ENABLE_DEMO_DATA === 'true';
const configuredLimit = (key: string, fallback: number) => {
  const value = Number(buildEnv[key]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
};
const REALTIME_COLLECTION_LIMIT = configuredLimit('VITE_REALTIME_COLLECTION_LIMIT', 500);
const REALTIME_EMPLOYEE_LIMIT = configuredLimit('VITE_REALTIME_EMPLOYEE_LIMIT', 2000);
const DASHBOARD_BACKGROUND_LIMIT = configuredLimit('VITE_DASHBOARD_BACKGROUND_LIMIT', 1);
const DASHBOARD_DIRECTORY_LIMIT = configuredLimit('VITE_DASHBOARD_DIRECTORY_LIMIT', 100);
const DASHBOARD_NOTIFICATION_LIMIT = configuredLimit('VITE_DASHBOARD_NOTIFICATION_LIMIT', 50);
const buildBoundedRealtimeQuery = (name: string, maxDocs = REALTIME_COLLECTION_LIMIT) => query(collection(db, name), limit(maxDocs));

// Helper to merge remote or saved records with initial standard datasets
function mergeWithDefaults<T extends { id: string }>(savedItems: T[] | null | undefined, defaultItems: T[]): T[] {
  // Production must never merge legacy demo records from localStorage or seed data.
  if (!allowDemoData) return [];
  if (!savedItems || savedItems.length === 0) return defaultItems;
  const itemMap = new Map<string, T>();
  defaultItems.forEach((item) => itemMap.set(item.id, item));
  savedItems.forEach((item) => {
    if (item && item.id) itemMap.set(item.id, { ...(itemMap.get(item.id) || {}), ...item });
  });
  return Array.from(itemMap.values());
}

function readStoredArray<T>(key: string, fallback: T[]): T[] {
  // Firestore is the production source of truth; never show stale demo localStorage.
  if (!allowDemoData) return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    try { localStorage.removeItem(key); } catch { /* storage may be unavailable */ }
    return fallback;
  }
}

function employeeIdentityKey(employee: Partial<Employee>): string {
  const email = String(employee.email || '').trim().toLowerCase();
  const firebaseUid = String(employee.firebaseUid || '').trim();
  if (email) return `email:${email}`;
  if (firebaseUid) return `uid:${firebaseUid}`;
  const username = String(employee.username || '').trim().toLowerCase();
  if (username) return `username:${username}`;
  const code = String(employee.employeeId || '').trim().toLowerCase();
  if (code) return `code:${code}`;
  return `id:${String(employee.id || '')}`;
}

function employeeRank(employee: Partial<Employee>): number {
  const id = String(employee.id || '');
  return (employee.firebaseUid ? 4 : 0) + (id && !/^emp[-_]/i.test(id) ? 2 : 0) + (employee.email ? 1 : 0);
}

function deduplicateEmployees(items: Employee[]): Employee[] {
  const byIdentity = new Map<string, Employee>();
  items.filter(Boolean).forEach((item) => {
    const key = employeeIdentityKey(item);
    const existing = byIdentity.get(key);
    if (!existing || employeeRank(item) >= employeeRank(existing)) {
      byIdentity.set(key, existing ? { ...existing, ...item } : item);
    } else {
      byIdentity.set(key, { ...item, ...existing });
    }
  });
  return Array.from(byIdentity.values());
}

export type ScreenType =
  | 'dashboard'
  | 'employees'
  | 'employee_tracking'
  | 'tracking'
  | 'workflow'
  | 'documents'
  | 'sheets'
  | 'departments'
  | 'positions'
  | 'attendance'
  | 'leaves'
  | 'aux_status'
  | 'projects'
  | 'tasks'
  | 'crm'
  | 'invoicing'
  | 'payroll'
  | 'expenses'
  | 'clients'
  | 'meetings'
  | 'chat'
  | 'mail'
  | 'calendar'
  | 'announcements'
  | 'orgtree'
  | 'ai_assistant'
  | 'settings'
  | 'reports'
  | 'client_dashboard'
  | 'client_projects'
  | 'client_invoices'
  | 'client_deliverables'
  | 'client_support';

export interface AppContextType {
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;
  
  // Real-time synchronization state
  isSyncing: boolean;
  lastSyncTime: string;
  syncStatus: 'healthy' | 'syncing' | 'degraded' | 'error';
  syncError: string | null;
  forceRefreshSync: () => Promise<void>;

  // Data State
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  projects: Project[];
  tasks: Task[];
  leads: CRMLead[];
  contacts: CRMContact[];
  vendors: Vendor[];
  contracts: Contract[];
  calendarEvents: CalendarEvent[];
  inventoryItems: any[];
  invoices: Invoice[];
  announcements: Announcement[];
  messages: ChatMessage[];
  emails: EmailMessage[];
  notifications: NotificationItem[];
  auxLogs: AuxLog[];
  clients: ClientAccount[];
  payrolls: PayrollRecord[];
  expenses: ExpenseClaim[];
  meetings: MeetingSession[];
  okrs: OKRGoal[];
  sheets: VernikaSheet[];
  performanceRecords: EmployeePerformanceData[];
  activityLogs: EmployeeActivityLog[];
  punchRequests: PunchCorrectionRequest[];
  workflowProfiles: EmployeeWorkflowProfile[];
  employeeDocuments: EmployeeDocumentRecord[];
  globalFiles: GlobalFileRecord[];
  uploadFile: (file: File, metadata?: { category?: string, description?: string, linkedProjectId?: string, linkedClientId?: string, linkedTaskId?: string }) => Promise<GlobalFileRecord>;
  deleteGlobalFile: (id: string) => Promise<void>;

  // Multi-Currency & Global FX
  globalCurrency: CurrencyCode;
  setGlobalCurrency: (currency: CurrencyCode) => void;

  // Enterprise Security & Immutable Audit Logging
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>;

  // AI Lead Scoring & Capacity-Based Routing
  scoreLeadAI: (lead: CRMLead) => CRMLead;
  autoRouteLead: (leadId: string) => Promise<void>;

  // Automated 3-Way Invoice & PO Matching
  verifyThreeWayMatch: (invoiceId: string, poNumber: string) => Promise<void>;

  // Dynamic Project Financial Rollup & Capacity Analytics
  calculateProjectRollup: (projectId: string) => {
    laborCost: number;
    expenseCost: number;
    vendorCost: number;
    actualTotal: number;
    budgetVariance: number;
    marginPercent: number;
    capacityWarning: {
      isOverAllocated: boolean;
      bottleneckMembers: string[];
      riskLevel: string;
      forecastedDelayDays: number;
    };
  };

  // Vernika Sheets & Excel File Manager Methods
  addSheet: (sheet: Omit<VernikaSheet, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSheet: (id: string, sheet: Partial<VernikaSheet>) => Promise<void>;
  deleteSheet: (id: string) => Promise<void>;
  saveSheetData: (sheetId: string, tabId: string, data: Record<string, SheetCell>) => Promise<void>;

  // Employee Performance & Active Status Tracking
  updatePerformanceRecord: (employeeId: string, update: Partial<EmployeePerformanceData>) => Promise<void>;
  logEmployeeActivity: (log: Omit<EmployeeActivityLog, 'id' | 'timestamp'>) => Promise<void>;

  // Employee Methods (Full CRUD + Login & Permissions)
  addEmployee: (emp: Omit<Employee, 'id' | 'employeeId'>) => Promise<void>;
  updateEmployee: (id: string, emp: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  updateEmployeePermissions: (id: string, allowedModules: string[], loginEnabled?: boolean, newPassword?: string, canViewFullRoster?: boolean) => Promise<void>;

  // AUX & Adherence Management (Multi-user Telemetry)
  logAuxChange: (employeeId: string, employeeName: string, status: AuxStatus, reason?: string, avatar?: string, department?: string) => Promise<void>;
  updateEmployeeAuxStatus: (employeeId: string, newStatus: AuxStatus, reason?: string) => Promise<void>;

  // Department Methods
  addDepartment: (dept: Omit<Department, 'id'>) => Promise<void>;
  updateDepartment: (id: string, dept: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  // Position Methods
  addPosition: (pos: Omit<Position, 'id'>) => Promise<void>;
  updatePosition: (id: string, pos: Partial<Position>) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;

  // Attendance Methods
  clockIn: (employeeId: string, employeeName: string, location?: 'Office' | 'Remote' | 'Client Site', ipAddress?: string) => Promise<void>;
  clockOut: (employeeId: string) => Promise<void>;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  markAttendance: (record: Partial<AttendanceRecord> & { employeeName: string }) => Promise<void>;
  updateAttendanceRecord: (id: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  cancelAccidentalPunchOut: (recordId: string) => Promise<void>;
  submitPunchRequest: (req: Omit<PunchCorrectionRequest, 'id' | 'requestedOn' | 'status'>) => Promise<void>;
  reviewPunchRequest: (id: string, status: 'Approved' | 'Rejected', adminNotes?: string, reviewerName?: string) => Promise<void>;

  // Employee Workflow Management Methods
  updateWorkflowProfile: (employeeId: string, updates: Partial<EmployeeWorkflowProfile>) => Promise<void>;
  getEmployeeWorkflow: (employeeId: string) => EmployeeWorkflowProfile | undefined;

  // Employee Document & Credential Generator Methods
  createEmployeeDocument: (doc: Omit<EmployeeDocumentRecord, 'id' | 'issueDate'> & { issueDate?: string }) => Promise<string>;
  updateEmployeeDocument: (id: string, updates: Partial<EmployeeDocumentRecord>) => Promise<void>;
  deleteEmployeeDocument: (id: string) => Promise<void>;
  shareEmployeeDocument: (id: string, recipientEmail: string) => Promise<void>;

  // Leaves Methods
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'requestedOn' | 'status'>) => Promise<void>;
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected', reviewerName?: string) => Promise<void>;

  // Projects Methods
  addProject: (proj: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, proj: Partial<Project>) => Promise<void>;
  updateProjectProgress: (id: string, progress: number) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Tasks Methods
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // CRM, Leads, Contacts, Vendors, Contracts, Calendar
  addLead: (lead: Omit<CRMLead, 'id'>) => Promise<void>;
  updateLead: (id: string, lead: Partial<CRMLead>) => Promise<void>;
  updateLeadStage: (id: string, stage: CRMLead['stage']) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addContact: (contact: Omit<CRMContact, 'id'>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  addContract: (contract: Omit<Contract, 'id'>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;

  // Mail & Outlook Messaging
  sendEmail: (email: Omit<EmailMessage, 'id' | 'date' | 'time'> & { date?: string; time?: string; folder?: EmailMessage['folder']; read?: boolean; starred?: boolean }) => Promise<void>;
  markEmailRead: (id: string, read: boolean) => Promise<void>;
  toggleStarEmail: (id: string) => Promise<void>;
  deleteEmail: (id: string) => Promise<void>;
  moveEmailToFolder: (id: string, folder: EmailMessage['folder']) => Promise<void>;

  // Invoicing & Billing
  addInvoice: (inv: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (id: string, inv: Partial<Invoice>) => Promise<void>;
  markInvoicePaid: (id: string, paymentMethod?: string) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  
// Announcements
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'date' | 'viewsCount'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;

  // Chat Messenger
  sendMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  editChatMessage: (messageId: string, newText: string) => Promise<void>;
  deleteChatMessage: (messageId: string) => Promise<void>;
  togglePinChatMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  chatChannels: ChatChannel[];
  addChatChannel: (channel: Omit<ChatChannel, 'id'>) => Promise<string>;
  deleteChatChannel: (id: string) => Promise<void>;
  typingStatuses: Record<string, string>;
  setChatTyping: (channelId: string, userName: string, isTyping: boolean) => Promise<void>;
  selectedChatChannelId: string | null;
  setSelectedChatChannelId: (id: string | null) => void;
  openChatWithUser: (targetUserId: string) => void;
  openChatChannel: (channelId: string) => void;
  markMessagesAsRead: (messageIds: string[], userId: string) => Promise<void>;

  // Client Management
  addClient: (client: Omit<ClientAccount, 'id' | 'joinedDate'>) => Promise<void>;
  updateClient: (id: string, client: Partial<ClientAccount>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Payroll
  addPayroll: (payroll: Omit<PayrollRecord, 'id'>) => Promise<void>;
  updatePayrollStatus: (id: string, status: 'Paid' | 'Pending' | 'Processing', paymentDate?: string) => Promise<void>;

  // Expenses
  addExpense: (expense: Omit<ExpenseClaim, 'id' | 'status'>) => Promise<void>;
  updateExpenseStatus: (id: string, status: 'Approved' | 'Rejected', reviewerName?: string) => Promise<void>;

  // Virtual Meetings & Video Call Signaling
  addMeeting: (meeting: Omit<MeetingSession, 'id'>) => Promise<void>;
  updateMeetingStatus: (id: string, status: 'Scheduled' | 'Live' | 'Ended') => Promise<void>;
  joinMeetingCall: (meetingId: string, participant: MeetingParticipant) => Promise<void>;
  leaveMeetingCall: (meetingId: string, participantId: string) => Promise<void>;
  updateMeetingParticipantState: (meetingId: string, participantId: string, updates: Partial<MeetingParticipant>) => Promise<void>;
  sendMeetingChatMessage: (meetingId: string, msg: Omit<MeetingChatMessage, 'id' | 'time'>) => Promise<void>;
  toggleMeetingRecording: (meetingId: string) => Promise<void>;

  // Notifications
  sendNotification: (item: Omit<NotificationItem, 'id' | 'time' | 'read'> & { time?: string; read?: boolean }) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => void;
  markAllNotificationsAsRead: () => Promise<void>;
  dismissNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authenticatedUser, authReady } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenType>('dashboard');

  const [selectedChatChannelId, setSelectedChatChannelId] = useState<string | null>(null);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const refreshInFlightRef = React.useRef(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString());
  const [syncStatus, setSyncStatus] = useState<'healthy' | 'syncing' | 'degraded' | 'error'>('syncing');
  const [syncError, setSyncError] = useState<string | null>(null);



  // Data States with localStorage initialization. Demo fixtures are opt-in only; production reads Firestore snapshots.
  // Set VITE_ENABLE_DEMO_DATA=true only for intentional local fixture development.
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      if (!allowDemoData) return [];
      const saved = localStorage.getItem('vernika_employees');
      const parsed = saved ? JSON.parse(saved) : null;
      return deduplicateEmployees(mergeWithDefaults(parsed, initialEmployees));
    } catch {
      return allowDemoData ? initialEmployees : [];
    }
  });

  const resolveIdentity = useCallback((value: string): string => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return value;
    if (value === authenticatedUser?.id || value === auth.currentUser?.uid) return auth.currentUser?.uid || value;
    const known = allowDemoData ? [...employees, ...initialEmployees] : employees;
    const candidate = known.find((employee) => [employee.id, employee.firebaseUid, employee.employeeId, employee.username, employee.email]
      .filter(Boolean)
      .some((identity) => String(identity).trim().toLowerCase() === normalized));
    if (!candidate) return value;
    const remote = employees.find((employee) => candidate.email && employee.email?.trim().toLowerCase() === candidate.email.trim().toLowerCase());
    return remote?.firebaseUid || remote?.id || candidate.firebaseUid || candidate.id || value;
  }, [authenticatedUser?.id, employees]);

  useEffect(() => {
    setIdentityResolver(resolveIdentity);
    return () => setIdentityResolver((value) => value);
  }, [resolveIdentity]);

  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem('vernika_departments');
      const parsed = saved ? JSON.parse(saved) : null;
      return mergeWithDefaults(parsed, initialDepartments);
    } catch {
      return allowDemoData ? initialDepartments : [];
    }
  });

  const [positions, setPositions] = useState<Position[]>(() => {
    try {
      const saved = localStorage.getItem('vernika_positions');
      const parsed = saved ? JSON.parse(saved) : null;
      return mergeWithDefaults(parsed, initialPositions);
    } catch {
      return allowDemoData ? initialPositions : [];
    }
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => readStoredArray('vernika_attendance', initialAttendance));

  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => readStoredArray('vernika_leaves', initialLeaves));

  const [projects, setProjects] = useState<Project[]>(() => readStoredArray('vernika_projects', initialProjects));

  const [tasks, setTasks] = useState<Task[]>(() => readStoredArray('vernika_tasks', initialTasks));

  const [leads, setLeads] = useState<CRMLead[]>(() => readStoredArray('vernika_leads', initialLeads));

  const [contacts, setContacts] = useState<CRMContact[]>(() => readStoredArray('vernika_contacts', initialContacts));

  const [vendors, setVendors] = useState<Vendor[]>(() => readStoredArray('vernika_vendors', initialVendors));

  const [contracts, setContracts] = useState<Contract[]>(() => readStoredArray('vernika_contracts', initialContracts));

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => readStoredArray('vernika_calendar_events', initialCalendarEvents));

  const [inventoryItems, setInventoryItems] = useState<any[]>(() => readStoredArray('vernika_inventory', initialInventory));

  const [invoices, setInvoices] = useState<Invoice[]>(() => readStoredArray('vernika_invoices', initialInvoices));

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => readStoredArray('vernika_announcements', initialAnnouncements));

  const [messages, setMessages] = useState<ChatMessage[]>(() => readStoredArray('vernika_messages', initialMessages));

  const [chatChannels, setChatChannels] = useState<ChatChannel[]>(() => readStoredArray('vernika_chat_channels', initialChannels));

  const [typingStatuses, setTypingStatuses] = useState<Record<string, string>>({});

  const [emails, setEmails] = useState<EmailMessage[]>(() => readStoredArray('vernika_emails', initialEmails));

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (!allowDemoData) return [];
    try {
      const saved = localStorage.getItem('vernika_notifications');
      const raw = saved ? JSON.parse(saved) : initialNotifications;
      return deduplicateById<NotificationItem>(raw);
    } catch {
      return deduplicateById<NotificationItem>(initialNotifications);
    }
  });

  const [auxLogs, setAuxLogs] = useState<AuxLog[]>(() => readStoredArray('vernika_aux_logs', initialAuxLogs));

  const [clients, setClients] = useState<ClientAccount[]>(() => {
    try {
      const saved = localStorage.getItem('vernika_clients');
      const parsed = saved ? JSON.parse(saved) : null;
      return mergeWithDefaults(parsed, initialClients);
    } catch {
      return allowDemoData ? initialClients : [];
    }
  });

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(() => readStoredArray('vernika_payrolls', initialPayrolls));

  const [expenses, setExpenses] = useState<ExpenseClaim[]>(() => readStoredArray('vernika_expenses', initialExpenses));

  const [meetings, setMeetings] = useState<MeetingSession[]>(() => readStoredArray('vernika_meetings', initialMeetings));

  const [okrs, setOkrs] = useState<OKRGoal[]>(() => readStoredArray('vernika_okrs', initialOKRs));

  const [sheets, setSheets] = useState<VernikaSheet[]>(() => readStoredArray('vernika_sheets', initialSheets));

  const [performanceRecords, setPerformanceRecords] = useState<EmployeePerformanceData[]>(() => readStoredArray('vernika_performance_records', initialPerformanceRecords));

  const [punchRequests, setPunchRequests] = useState<PunchCorrectionRequest[]>(() => readStoredArray('vernika_punch_requests', initialPunchRequests));

  const [workflowProfiles, setWorkflowProfiles] = useState<EmployeeWorkflowProfile[]>(() => readStoredArray('vernika_workflow_profiles', initialWorkflowProfiles));

  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeDocumentRecord[]>(() => readStoredArray('vernika_employee_documents', initialDocuments));

  const [globalFiles, setGlobalFiles] = useState<GlobalFileRecord[]>(() => readStoredArray('vernika_global_files', initialFiles));

  const [activityLogs, setActivityLogs] = useState<EmployeeActivityLog[]>(() => {
    if (!allowDemoData) return [];
    try {
      const saved = localStorage.getItem('vernika_activity_logs');
      return saved ? JSON.parse(saved) : [
      {
        id: 'act-1',
        employeeId: 'emp-1',
        employeeName: 'Shashank Rajput',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        activityType: 'Sheet Edited',
        details: 'Updated Q3 Revenue Forecast (Cell E9 formulation)',
        impactScore: 95
      },
      {
        id: 'act-2',
        employeeId: 'emp-3',
        employeeName: authenticatedUser?.name || 'Workspace User',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        activityType: 'Meeting Attended',
        details: 'Apex Financial Services Contract Finalization Call',
        impactScore: 90
      },
      {
        id: 'act-3',
        employeeId: 'emp-4',
        employeeName: 'Sarah Jenkins',
        timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        activityType: 'Status Changed',
        details: 'Logged AUX Available - 100% Shift Adherence',
        impactScore: 88
      }
      ];
    } catch {
      try { localStorage.removeItem('vernika_activity_logs'); } catch { /* storage may be unavailable */ }
      return [];
    }
  });

  const [globalCurrency, setGlobalCurrency] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('vernika_global_currency');
    return (saved as CurrencyCode) || 'USD';
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => readStoredArray('vernika_audit_logs', []));

  // LocalStorage Persistence
  useEffect(() => { localStorage.setItem('vernika_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('vernika_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('vernika_positions', JSON.stringify(positions)); }, [positions]);
  useEffect(() => { localStorage.setItem('vernika_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('vernika_leaves', JSON.stringify(leaves)); }, [leaves]);
  useEffect(() => { localStorage.setItem('vernika_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('vernika_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('vernika_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('vernika_contacts', JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem('vernika_vendors', JSON.stringify(vendors)); }, [vendors]);
  useEffect(() => { localStorage.setItem('vernika_contracts', JSON.stringify(contracts)); }, [contracts]);
  useEffect(() => { localStorage.setItem('vernika_calendar_events', JSON.stringify(calendarEvents)); }, [calendarEvents]);
  useEffect(() => { localStorage.setItem('vernika_inventory', JSON.stringify(inventoryItems)); }, [inventoryItems]);
  useEffect(() => { localStorage.setItem('vernika_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('vernika_announcements', JSON.stringify(announcements)); }, [announcements]);
  useEffect(() => { localStorage.setItem('vernika_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('vernika_chat_channels', JSON.stringify(chatChannels)); }, [chatChannels]);
  useEffect(() => { localStorage.setItem('vernika_emails', JSON.stringify(emails)); }, [emails]);
  useEffect(() => { localStorage.setItem('vernika_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('vernika_aux_logs', JSON.stringify(auxLogs)); }, [auxLogs]);
  useEffect(() => { localStorage.setItem('vernika_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('vernika_payrolls', JSON.stringify(payrolls)); }, [payrolls]);
  useEffect(() => { localStorage.setItem('vernika_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('vernika_meetings', JSON.stringify(meetings)); }, [meetings]);
  useEffect(() => { localStorage.setItem('vernika_okrs', JSON.stringify(okrs)); }, [okrs]);
  useEffect(() => { localStorage.setItem('vernika_sheets', JSON.stringify(sheets)); }, [sheets]);
  useEffect(() => { localStorage.setItem('vernika_performance_records', JSON.stringify(performanceRecords)); }, [performanceRecords]);
  useEffect(() => { localStorage.setItem('vernika_activity_logs', JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => { localStorage.setItem('vernika_punch_requests', JSON.stringify(punchRequests)); }, [punchRequests]);
  useEffect(() => { localStorage.setItem('vernika_workflow_profiles', JSON.stringify(workflowProfiles)); }, [workflowProfiles]);
  useEffect(() => { localStorage.setItem('vernika_employee_documents', JSON.stringify(employeeDocuments)); }, [employeeDocuments]);
  useEffect(() => { localStorage.setItem('vernika_global_files', JSON.stringify(globalFiles)); }, [globalFiles]);
  useEffect(() => { localStorage.setItem('vernika_global_currency', globalCurrency); }, [globalCurrency]);
  useEffect(() => { localStorage.setItem('vernika_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);

  // 1. Initial Seeding to Firestore
  useEffect(() => {
    if (!allowDemoData || !authReady || !authenticatedUser?.id || !auth.currentUser || authenticatedUser.role !== 'admin') return;
    const seedAll = async () => {
      try {
        await Promise.all([
          seedCollectionIfEmpty('employees', initialEmployees),
          seedCollectionIfEmpty('departments', initialDepartments),
          seedCollectionIfEmpty('positions', initialPositions),
          seedCollectionIfEmpty('attendance', initialAttendance),
          seedCollectionIfEmpty('leaves', initialLeaves),
          seedCollectionIfEmpty('projects', initialProjects),
          seedCollectionIfEmpty('tasks', initialTasks),
          seedCollectionIfEmpty('leads', initialLeads),
          seedCollectionIfEmpty('contacts', initialContacts),
          seedCollectionIfEmpty('vendors', initialVendors),
          seedCollectionIfEmpty('contracts', initialContracts),
          seedCollectionIfEmpty('calendarEvents', initialCalendarEvents),
          seedCollectionIfEmpty('invoices', initialInvoices),
          seedCollectionIfEmpty('announcements', initialAnnouncements),
          seedCollectionIfEmpty('chatMessages', initialMessages),
          seedCollectionIfEmpty('chatChannels', initialChannels),
          seedCollectionIfEmpty('emails', initialEmails),
          seedCollectionIfEmpty('notifications', initialNotifications),
          seedCollectionIfEmpty('clients', initialClients),
          seedCollectionIfEmpty('payrolls', initialPayrolls),
          seedCollectionIfEmpty('expenses', initialExpenses),
          seedCollectionIfEmpty('meetings', initialMeetings),
          seedCollectionIfEmpty('sheets', initialSheets),
          seedCollectionIfEmpty('auxLogs', initialAuxLogs),
          seedCollectionIfEmpty('punchRequests', initialPunchRequests),
          seedCollectionIfEmpty('workflowProfiles', initialWorkflowProfiles),
          seedCollectionIfEmpty('employeeDocuments', initialDocuments),
        ]);
      } catch (err) {
        console.warn('Initial seeding note:', err);
      }
    };
    void seedAll();
  }, [authReady, authenticatedUser?.id]);

  const reportListenerSuccess = useCallback(() => {
    setLastSyncTime(new Date().toLocaleTimeString());
    setSyncStatus('healthy');
    setSyncError(null);
  }, []);

  const reportListenerError = useCallback((scope: string, error: Error) => {
    const message = `${scope}: ${error.message || 'listener unavailable'}`;
    console.warn(`${scope} sync notice:`, error.message);
    setSyncStatus('degraded');
    setSyncError(message);
  }, []);

  // 2. Real-time Firestore Listeners across all devices
  useEffect(() => {
    if (!authReady || !authenticatedUser?.id || !auth.currentUser) {
      setIsSyncing(false);
      setSyncStatus('degraded');
      setSyncError('Firebase Authentication is not ready.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncError(null);

    // Dashboard cards use dedicated, scoped read models. Avoid opening historical
    // collection listeners that are not rendered on the dashboard; workspace-level
    // listeners resume when the user opens their corresponding screen.
    const isDashboardBootstrap = activeScreen === 'dashboard';
    const dashboardCoreLimits: Record<string, number> = {
      departments: DASHBOARD_DIRECTORY_LIMIT,
      positions: DASHBOARD_DIRECTORY_LIMIT,
      notifications: DASHBOARD_NOTIFICATION_LIMIT,
    };
    const subscribeRealtime = (
      name: string,
      maxDocs: number,
      onNext: (snapshot: QuerySnapshot<DocumentData>) => void,
      onError: (error: Error) => void,
    ) => {
      const dashboardLimit = dashboardCoreLimits[name];
      if (isDashboardBootstrap && dashboardLimit === undefined) return () => {};
      const scopedLimit = isDashboardBootstrap ? Math.min(maxDocs, dashboardLimit) : maxDocs;
      return onSnapshot(buildBoundedRealtimeQuery(name, scopedLimit), onNext, onError);
    };

    const unsubEmployees = subscribeRealtime(
      'employees', REALTIME_EMPLOYEE_LIMIT,
      (snap) => {
        const remote = snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as Employee);
        setEmployees(deduplicateEmployees(remote));
        reportListenerSuccess();
      },
      (err) => reportListenerError('Employees', err)
    );

    const unsubDepartments = subscribeRealtime(
      'departments', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setDepartments(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as Department));
      },
      (err) => reportListenerError('Departments', err)
    );

    const unsubPositions = subscribeRealtime(
      'positions', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setPositions(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as Position));
      },
      (err) => reportListenerError('Positions', err)
    );

    const unsubAux = subscribeRealtime(
      'auxLogs', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        const remote = snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as AuxLog);
        setAuxLogs(remote.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setLastSyncTime(new Date().toLocaleTimeString());
      },
      (err) => console.warn('AUX Logs sync notice:', err.message)
    );

    const unsubTasks = subscribeRealtime(
      'tasks', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setTasks(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as Task));
      },
      (err) => console.warn('Tasks sync notice:', err.message)
    );

    const unsubAnnouncements = subscribeRealtime(
      'announcements', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setAnnouncements(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as Announcement));
      },
      (err) => console.warn('Announcements sync notice:', err.message)
    );

    const unsubProjects = subscribeRealtime(
      'projects', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setProjects(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as Project));
      },
      (err) => console.warn('Projects sync notice:', err.message)
    );

    const unsubMessages = subscribeRealtime(
      'chatMessages', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setMessages(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as ChatMessage));
        setLastSyncTime(new Date().toLocaleTimeString());
      },
      (err) => reportListenerError('Messenger', err)
    );

    const unsubChatChannels = subscribeRealtime(
      'chatChannels', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setChatChannels(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as ChatChannel));
      },
      (err) => console.warn('Chat channels sync notice:', err.message)
    );

    const unsubChatTyping = subscribeRealtime(
      'chatTyping', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        const typingMap: Record<string, string> = {};
        const now = Date.now();
        snap.docs.forEach((d) => {
          const data = d.data() as { userName: string; isTyping: boolean; timestamp: number };
          if (data.isTyping && data.timestamp && (now - data.timestamp < 10000)) {
            typingMap[d.id] = data.userName;
          }
        });
        setTypingStatuses(typingMap);
      },
      (err) => console.warn('Chat typing sync notice:', err.message)
    );

    const unsubEmails = subscribeRealtime(
      'emails', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setEmails(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as EmailMessage));
        setLastSyncTime(new Date().toLocaleTimeString());
      },
      (err) => reportListenerError('Mail', err)
    );

    const unsubMeetings = subscribeRealtime(
      'meetings', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setMeetings(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as MeetingSession));
        setLastSyncTime(new Date().toLocaleTimeString());
      },
      (err) => console.warn('Meetings sync notice:', err.message)
    );

    const unsubClients = subscribeRealtime(
      'clients', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        const remote = snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as ClientAccount);
        setClients(remote);
      },
      (err) => console.warn('Clients sync notice:', err.message)
    );

    const unsubSheets = subscribeRealtime(
      'sheets', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setSheets(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as VernikaSheet));
      },
      (err) => console.warn('Sheets sync notice:', err.message)
    );

    const unsubAttendance = subscribeRealtime(
      'attendance', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setAttendance(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as AttendanceRecord));
      },
      (err) => console.warn('Attendance sync notice:', err.message)
    );

    const unsubLeaves = subscribeRealtime(
      'leaves', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setLeaves(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as LeaveRequest));
      },
      (err) => console.warn('Leaves sync notice:', err.message)
    );

    const unsubInvoices = subscribeRealtime(
      'invoices', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setInvoices(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as Invoice));
      },
      (err) => console.warn('Invoices sync notice:', err.message)
    );

    const unsubLeads = subscribeRealtime(
      'leads', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setLeads(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as CRMLead));
      },
      (err) => console.warn('Leads sync notice:', err.message)
    );

    const unsubContacts = subscribeRealtime(
      'contacts', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setContacts(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as CRMContact));
      },
      (err) => console.warn('Contacts sync notice:', err.message)
    );

    const unsubVendors = subscribeRealtime(
      'vendors', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setVendors(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as Vendor));
      },
      (err) => console.warn('Vendors sync notice:', err.message)
    );

    const unsubContracts = subscribeRealtime(
      'contracts', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setContracts(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as Contract));
      },
      (err) => console.warn('Contracts sync notice:', err.message)
    );

    const unsubCalendar = subscribeRealtime(
      'calendarEvents', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setCalendarEvents(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as CalendarEvent));
      },
      (err) => console.warn('Calendar sync notice:', err.message)
    );

    const unsubPayrolls = subscribeRealtime(
      'payrolls', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setPayrolls(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as PayrollRecord));
      },
      (err) => console.warn('Payrolls sync notice:', err.message)
    );

    const unsubExpenses = subscribeRealtime(
      'expenses', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setExpenses(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as ExpenseClaim));
      },
      (err) => reportListenerError('Expenses', err)
    );

    const unsubActivityLogs = subscribeRealtime(
      'activityLogs', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setActivityLogs(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as EmployeeActivityLog));
      },
      (err) => console.warn('Activity logs sync notice:', err.message)
    );

    const unsubPerformance = subscribeRealtime(
      'performanceRecords', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setPerformanceRecords(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as EmployeePerformanceData));
      },
      (err) => console.warn('Performance records sync notice:', err.message)
    );

    const unsubNotifications = subscribeRealtime(
      'notifications', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem));
        setNotifications(deduplicateById<NotificationItem>(remote));
        setLastSyncTime(new Date().toLocaleTimeString());
      },
      (err) => console.warn('Notifications sync notice:', err.message)
    );

    const unsubPunchRequests = subscribeRealtime(
      'punchRequests', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setPunchRequests(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as PunchCorrectionRequest));
      },
      (err) => console.warn('Punch requests sync notice:', err.message)
    );

    const unsubWorkflowProfiles = subscribeRealtime(
      'workflowProfiles', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setWorkflowProfiles(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as EmployeeWorkflowProfile));
      },
      (err) => console.warn('Workflow profiles sync notice:', err.message)
    );

    const unsubEmployeeDocs = subscribeRealtime(
      'employeeDocuments', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setEmployeeDocuments(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as EmployeeDocumentRecord));
      },
      (err) => console.warn('Employee documents sync notice:', err.message)
    );

    const unsubGlobalFiles = subscribeRealtime(
      'globalFiles', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setGlobalFiles(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as GlobalFileRecord));
        setLastSyncTime(new Date().toLocaleTimeString());
      },
      (err) => reportListenerError('Shared files', err)
    );

    const unsubInventory = subscribeRealtime(
      'inventory', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setInventoryItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn('Inventory sync notice:', err.message)
    );

    const unsubOkrs = subscribeRealtime(
      'okrs', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        setOkrs(snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as OKRGoal));
      },
      (err) => console.warn('OKR sync notice:', err.message)
    );

    const unsubAuditLogs = subscribeRealtime(
      'auditLogs', REALTIME_COLLECTION_LIMIT,
      (snap) => {
        const remote = snap.docs.map((d) => normalizeRemoteRecord({ id: d.id, ...d.data() }) as AuditLog);
        setAuditLogs(remote.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      },
      (err) => console.warn('Audit logs sync notice:', err.message)
    );

    setIsSyncing(false);

    return () => {
      unsubEmployees();
      unsubDepartments();
      unsubPositions();
      unsubAux();
      unsubTasks();
      unsubAnnouncements();
      unsubProjects();
      unsubMessages();
      unsubChatChannels();
      unsubChatTyping();
      unsubEmails();
      unsubMeetings();
      unsubClients();
      unsubSheets();
      unsubAttendance();
      unsubLeaves();
      unsubInvoices();
      unsubLeads();
      unsubContacts();
      unsubVendors();
      unsubContracts();
      unsubCalendar();
      unsubPayrolls();
      unsubExpenses();
      unsubActivityLogs();
      unsubPerformance();
      unsubNotifications();
      unsubPunchRequests();
      unsubWorkflowProfiles();
      unsubEmployeeDocs();
      unsubGlobalFiles();
      unsubInventory();
      unsubOkrs();
      unsubAuditLogs();
    };
  }, [activeScreen, authReady, authenticatedUser?.id, reportListenerError, reportListenerSuccess]);

  // 3. Instant local Cross-Tab Event Listener
  useEffect(() => {
    const unsub = onBroadcastEvent((payload) => {
      setLastSyncTime(new Date().toLocaleTimeString());
      switch (payload.collectionName) {
        case 'notifications':
          if (payload.type === 'create') {
            setNotifications((prev) => {
              if (prev.some((n) => n.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setNotifications((prev) => prev.map((n) => (n.id === payload.data.id ? { ...n, ...payload.data } : n)));
          } else if (payload.type === 'clear') {
            setNotifications([]);
          }
          break;
        case 'punchRequests':
          if (payload.type === 'create') {
            setPunchRequests((prev) => {
              if (prev.some((p) => p.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setPunchRequests((prev) => prev.map((p) => (p.id === payload.data.id ? { ...p, ...payload.data } : p)));
          }
          break;
        case 'workflowProfiles':
          if (payload.type === 'create' || payload.type === 'update') {
            setWorkflowProfiles((prev) => {
              const exists = prev.some((w) => w.employeeId === payload.data.employeeId);
              if (exists) {
                return prev.map((w) => (w.employeeId === payload.data.employeeId ? { ...w, ...payload.data } : w));
              }
              return [payload.data, ...prev];
            });
          }
          break;
        case 'globalFiles':
          if (payload.type === 'create' || payload.type === 'update') {
            setGlobalFiles((prev) => [...prev.filter((i) => i.id !== payload.data.id), payload.data]);
          } else if (payload.type === 'delete') {
            setGlobalFiles((prev) => prev.filter((i) => i.id !== payload.data.id));
          }
          break;
        case 'employeeDocuments':
          if (payload.type === 'create') {
            setEmployeeDocuments((prev) => {
              if (prev.some((d) => d.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setEmployeeDocuments((prev) => prev.map((d) => (d.id === payload.data.id ? { ...d, ...payload.data } : d)));
          } else if (payload.type === 'delete') {
            setEmployeeDocuments((prev) => prev.filter((d) => d.id !== payload.data.id));
          }
          break;
        case 'chatMessages':
          if (payload.type === 'create') {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.data.id)) return prev;
              return [...prev, payload.data];
            });
          }
          break;
        case 'chatChannels':
          if (payload.type === 'create') {
            setChatChannels((prev) => {
              if (prev.some((c) => c.id === payload.data.id)) return prev;
              return [...prev, payload.data];
            });
          } else if (payload.type === 'delete') {
            setChatChannels((prev) => prev.filter((c) => c.id !== payload.data.id));
          }
          break;
        case 'chatTyping':
          if (payload.type === 'typing_start') {
            setTypingStatuses((prev) => ({ ...prev, [payload.data.channelId]: payload.data.userName }));
          } else if (payload.type === 'typing_stop') {
            setTypingStatuses((prev) => {
              const copy = { ...prev };
              delete copy[payload.data.channelId];
              return copy;
            });
          }
          break;
        case 'emails':
          if (payload.type === 'create') {
            setEmails((prev) => {
              if (prev.some((m) => m.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setEmails((prev) => prev.map((m) => (m.id === payload.data.id ? { ...m, ...payload.data } : m)));
          }
          break;
        case 'meetings':
          if (payload.type === 'create') {
            setMeetings((prev) => {
              if (prev.some((m) => m.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setMeetings((prev) => prev.map((m) => (m.id === payload.data.id ? { ...m, ...payload.data } : m)));
          }
          break;
        case 'auxLogs':
          if (payload.type === 'create') {
            setAuxLogs((prev) => {
              if (prev.some((a) => a.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          }
          break;
        case 'employees':
          if (payload.type === 'update') {
            setEmployees((prev) => prev.map((e) => (e.id === payload.data.id ? { ...e, ...payload.data } : e)));
          } else if (payload.type === 'create') {
            setEmployees((prev) => {
              if (prev.some((e) => e.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          }
          break;
        case 'tasks':
          if (payload.type === 'create') {
            setTasks((prev) => {
              if (prev.some((t) => t.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setTasks((prev) => prev.map((t) => (t.id === payload.data.id ? { ...t, ...payload.data } : t)));
          } else if (payload.type === 'delete') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.data.id));
          }
          break;
        case 'projects':
          if (payload.type === 'create') {
            setProjects((prev) => {
              if (prev.some((p) => p.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setProjects((prev) => prev.map((p) => (p.id === payload.data.id ? { ...p, ...payload.data } : p)));
          } else if (payload.type === 'delete') {
            setProjects((prev) => prev.filter((p) => p.id !== payload.data.id));
          }
          break;
        case 'leads':
          if (payload.type === 'create') {
            setLeads((prev) => {
              if (prev.some((l) => l.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setLeads((prev) => prev.map((l) => (l.id === payload.data.id ? { ...l, ...payload.data } : l)));
          }
          break;
        case 'invoices':
          if (payload.type === 'create') {
            setInvoices((prev) => {
              if (prev.some((i) => i.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setInvoices((prev) => prev.map((i) => (i.id === payload.data.id ? { ...i, ...payload.data } : i)));
          }
          break;
        case 'attendance':
          if (payload.type === 'create') {
            setAttendance((prev) => {
              if (prev.some((a) => a.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setAttendance((prev) => prev.map((a) => (a.id === payload.data.id ? { ...a, ...payload.data } : a)));
          }
          break;
        case 'leaves':
          if (payload.type === 'create') {
            setLeaves((prev) => {
              if (prev.some((l) => l.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.type === 'update') {
            setLeaves((prev) => prev.map((l) => (l.id === payload.data.id ? { ...l, ...payload.data } : l)));
          }
          break;
        default:
          break;
      }
    });

    return unsub;
  }, []);

  // 4. Manual / Polling Sync Trigger across all screens
  const forceRefreshSync = useCallback(async () => {
    if (!authenticatedUser?.id || !auth.currentUser) {
      setSyncStatus('degraded');
      setSyncError('Firebase Authentication is not ready.');
      return;
    }
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncError(null);
    if (activeScreen === 'dashboard') {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('vernika:dashboard-refresh'));
      setLastSyncTime(new Date().toLocaleTimeString());
      setSyncStatus('healthy');
      setIsSyncing(false);
      refreshInFlightRef.current = false;
      return;
    }
    try {
      const [
        empSnap, 
        msgSnap, 
        chanSnap,
        mailSnap, 
        mtgSnap, 
        auxSnap,
        taskSnap,
        projSnap,
        invSnap,
        leadSnap,
        attSnap,
        leaveSnap,
        sheetSnap,
        notifSnap,
        punchSnap,
        workSnap,
        docSnap,
        inventorySnap,
        okrSnap,
        deptSnap,
        positionSnap,
        clientSnap,
        payrollSnap,
        expenseSnap,
        fileSnap,
        activitySnap,
        performanceSnap,
        auditSnap
      ] = await Promise.all([
        getDocs(buildBoundedRealtimeQuery('employees', REALTIME_EMPLOYEE_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('chatMessages', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('chatChannels', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('emails', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('meetings', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('auxLogs', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('tasks', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('projects', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('invoices', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('leads', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('attendance', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('leaves', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('sheets', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('notifications', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('punchRequests', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('workflowProfiles', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('employeeDocuments', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('inventory', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('okrs', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('departments', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('positions', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('clients', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('payrolls', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('expenses', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('globalFiles', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('activityLogs', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('performanceRecords', REALTIME_COLLECTION_LIMIT)),
        getDocs(buildBoundedRealtimeQuery('auditLogs', REALTIME_COLLECTION_LIMIT)),
      ]);

      setEmployees(empSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Employee));
      setMessages(msgSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage));
      setChatChannels(chanSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatChannel));
      setEmails(mailSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as EmailMessage));
      setMeetings(mtgSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as MeetingSession));
      setAuxLogs(auxSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuxLog));
      setTasks(taskSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task));
      setProjects(projSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project));
      setInvoices(invSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice));
      setLeads(leadSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as CRMLead));
      setAttendance(attSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as AttendanceRecord));
      setLeaves(leaveSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as LeaveRequest));
      setSheets(sheetSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as VernikaSheet));
      setNotifications(notifSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as NotificationItem));
      setPunchRequests(punchSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as PunchCorrectionRequest));
      setWorkflowProfiles(workSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as EmployeeWorkflowProfile));
      setEmployeeDocuments(docSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as EmployeeDocumentRecord));
      setInventoryItems(inventorySnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setOkrs(okrSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as OKRGoal));
      setDepartments(deptSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Department));
      setPositions(positionSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Position));
      setClients(clientSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClientAccount));
      setPayrolls(payrollSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as PayrollRecord));
      setExpenses(expenseSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ExpenseClaim));
      setGlobalFiles(fileSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as GlobalFileRecord));
      setActivityLogs(activitySnap.docs.map((d) => ({ id: d.id, ...d.data() }) as EmployeeActivityLog));
      setPerformanceRecords(performanceSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as EmployeePerformanceData));
      setAuditLogs(auditSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog));

      setLastSyncTime(new Date().toLocaleTimeString());
      setSyncStatus('healthy');
      setSyncError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Realtime refresh failed.';
      console.warn('Manual sync notice:', message);
      setSyncStatus('error');
      setSyncError(message);
    } finally {
      refreshInFlightRef.current = false;
      setIsSyncing(false);
    }
  }, [authenticatedUser?.id]);

  // Recovery for device sleep, network changes, and listeners that temporarily lose transport.
  // Firestore onSnapshot remains the primary transport; these are bounded recovery reads.
  useEffect(() => {
    const reconnect = () => { void forceRefreshSync(); };
    const interval = window.setInterval(reconnect, 30000);
    window.addEventListener('online', reconnect);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', reconnect);
    };
  }, [forceRefreshSync]);

  // Employee Methods
  const addEmployee = async (emp: Omit<Employee, 'id' | 'employeeId'>) => {
    if (!auth.currentUser) throw new Error('You must be signed in with Firebase to create a profile.');
    const employeeCode = `VRN-${String(employees.length + 1).padStart(3, '0')}`;
    const newEmp: Employee = {
      ...emp,
      id: employeeCode,
      employeeId: employeeCode,
      username: emp.username || (emp.email || '').split('@')[0],
      password: emp.password || 'password123',
      loginEnabled: emp.loginEnabled !== undefined ? emp.loginEnabled : true,
      allowedModules: emp.allowedModules || [
        'dashboard', 'attendance', 'leaves', 'projects', 'tasks', 
        'chat', 'announcements', 'aux_status', 'payroll', 'expenses', 'meetings'
      ],
      auxStatus: 'Available',
      auxStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      auxAdherenceScore: 100,
    };

    const provisioned = await provisionProfile({
      ...newEmp,
      password: newEmp.password || 'password123',
      role: newEmp.role === 'admin' ? 'admin' : 'employee',
    });
    const persistedEmployee: Employee = { ...newEmp, id: provisioned.uid, firebaseUid: provisioned.uid };
    setEmployees((prev) => deduplicateEmployees([persistedEmployee, ...prev]));
    broadcastEvent('create', 'employees', persistedEmployee);
    await syncDocToFirestore('employees', provisioned.uid, persistedEmployee);
  };

  const updateEmployee = async (id: string, updatedFields: Partial<Employee>) => {
    const target = employees.find((emp) => emp.id === id || emp.firebaseUid === id || emp.employeeId === id || (emp.email && updatedFields.email && emp.email.toLowerCase() === updatedFields.email.toLowerCase()));
    const canonicalId = target?.firebaseUid || target?.id || id;
    const nextFields = { ...updatedFields, permissionRevision: Date.now() } as Partial<Employee>;
    setEmployees((prev) => prev.map((emp) => (emp.id === id || emp.firebaseUid === id || emp.id === canonicalId ? { ...emp, ...nextFields } : emp)));
    broadcastEvent('update', 'employees', { id: canonicalId, ...nextFields });
    await syncDocToFirestore('employees', canonicalId, nextFields);
  };

  const deleteEmployee = async (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    broadcastEvent('delete', 'employees', { id });
    await deleteDocFromFirestore('employees', id);
  };

  const updateEmployeePermissions = async (
    id: string, 
    allowedModules: string[], 
    loginEnabled: boolean = true, 
    newPassword?: string,
    canViewFullRoster?: boolean
  ) => {
    const employee = employees.find((candidate) => candidate.id === id || candidate.firebaseUid === id || candidate.employeeId === id);
    if (newPassword && employee) {
      await provisionProfile({
        name: employee.name,
        email: employee.email,
        username: employee.username,
        password: newPassword,
        role: employee.role === 'admin' ? 'admin' : 'employee',
        loginEnabled,
      });
    }
    const updateObj: Partial<Employee> = {
      allowedModules,
      loginEnabled,
      ...(canViewFullRoster !== undefined ? { canViewFullRoster } : {}),
    };
    await updateEmployee(employee?.firebaseUid || employee?.id || id, updateObj);
  };

  // AUX & Multi-User Telemetry
  const logAuxChange = async (
    employeeId: string,
    employeeName: string,
    status: AuxStatus,
    reason?: string,
    avatar?: string,
    department: string = 'General Operations'
  ) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logId = `aux-${Date.now()}`;
    const newLog: AuxLog = {
      id: logId,
      employeeId,
      employeeName,
      department,
      status,
      startTime: nowStr,
      timestamp: new Date().toISOString(),
      reason,
      avatar
    };

    setAuxLogs((prev) => [newLog, ...prev]);
    broadcastEvent('create', 'auxLogs', newLog);
    await syncDocToFirestore('auxLogs', logId, newLog);

    await updateEmployee(employeeId, {
      auxStatus: status,
      auxStartTime: nowStr,
    });

    // Real-time notification for team members & management
    await sendNotification({
      title: `AUX Update: ${employeeName}`,
      description: `${employeeName} (${department}) switched status to ${status}${reason ? ` - ${reason}` : ''}`,
      category: 'message',
      type: status === 'Available' ? 'success' : status === 'Offline' ? 'warning' : 'info',
      priority: 'medium',
      time: 'Just now',
      read: false
    });
  };

  const updateEmployeeAuxStatus = async (employeeId: string, newStatus: AuxStatus, reason?: string) => {
    const emp = employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
    const targetId = emp?.id || employeeId;
    await logAuxChange(
      targetId,
      emp?.name || 'Staff Member',
      newStatus,
      reason,
      emp?.avatar,
      emp?.department || 'Operations'
    );
  };

  // Departments
  const addDepartment = async (dept: Omit<Department, 'id'>) => {
    const newId = `dep-${Date.now()}`;
    const newDept: Department = { ...dept, id: newId, headCount: 0, openPositions: 0 };
    setDepartments((prev) => [...prev, newDept]);
    broadcastEvent('create', 'departments', newDept);
    await syncDocToFirestore('departments', newId, newDept);
  };

  const updateDepartment = async (id: string, dept: Partial<Department>) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...dept } : d)));
    broadcastEvent('update', 'departments', { id, ...dept });
    await syncDocToFirestore('departments', id, dept);
  };

  const deleteDepartment = async (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    broadcastEvent('delete', 'departments', { id });
    await deleteDocFromFirestore('departments', id);
  };

  // Positions
  const addPosition = async (pos: Omit<Position, 'id'>) => {
    const newId = `pos-${Date.now()}`;
    const newPos: Position = { ...pos, id: newId, activeStaff: 0 };
    setPositions((prev) => [...prev, newPos]);
    broadcastEvent('create', 'positions', newPos);
    await syncDocToFirestore('positions', newId, newPos);
  };

  const updatePosition = async (id: string, pos: Partial<Position>) => {
    setPositions((prev) => prev.map((p) => (p.id === id ? { ...p, ...pos } : p)));
    broadcastEvent('update', 'positions', { id, ...pos });
    await syncDocToFirestore('positions', id, pos);
  };

  const deletePosition = async (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
    broadcastEvent('delete', 'positions', { id });
    await deleteDocFromFirestore('positions', id);
  };

  // Attendance
  const clockIn = async (employeeId: string, employeeName: string, location: 'Office' | 'Remote' | 'Client Site' = 'Office', ipAddress?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const existing = attendance.find((a) => a.employeeId === employeeId && a.date === today);

    if (existing) {
      const updated = { ...existing, checkIn: nowTime, status: 'Present' as const, workLocation: location, ipAddress };
      setAttendance((prev) => prev.map((a) => (a.id === existing.id ? updated : a)));
      broadcastEvent('update', 'attendance', updated);
      await syncDocToFirestore('attendance', existing.id, updated);
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId,
        employeeName,
        date: today,
        checkIn: nowTime,
        checkOut: null,
        totalHours: 0,
        status: 'Present',
        workLocation: location,
        ipAddress: ipAddress || '192.168.1.102',
      };
      setAttendance((prev) => [newRecord, ...prev]);
      broadcastEvent('create', 'attendance', newRecord);
      await syncDocToFirestore('attendance', newRecord.id, newRecord);
    }
  };

  const clockOut = async (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const existing = attendance.find((a) => a.employeeId === employeeId && a.date === today);

    if (existing) {
      const updated = { ...existing, checkOut: nowTime };
      setAttendance((prev) => prev.map((a) => (a.id === existing.id ? updated : a)));
      broadcastEvent('update', 'attendance', updated);
      await syncDocToFirestore('attendance', existing.id, updated);
    }
  };

  const cancelAccidentalPunchOut = async (recordId: string) => {
    const target = attendance.find((a) => a.id === recordId);
    if (target) {
      const updated: AttendanceRecord = {
        ...target,
        checkOut: null,
        status: 'Present'
      };
      setAttendance((prev) => prev.map((a) => (a.id === recordId ? updated : a)));
      broadcastEvent('update', 'attendance', updated);
      await syncDocToFirestore('attendance', recordId, updated);
    }
  };

  const updateAttendanceRecord = async (id: string, updates: Partial<AttendanceRecord>) => {
    setAttendance((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    broadcastEvent('update', 'attendance', { id, ...updates });
    await syncDocToFirestore('attendance', id, updates);
  };

  const submitPunchRequest = async (req: Omit<PunchCorrectionRequest, 'id' | 'requestedOn' | 'status'>) => {
    const newReq: PunchCorrectionRequest = normalizeRemoteRecord({
      ...req,
      id: `pnc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      requestedOn: new Date().toISOString().split('T')[0],
      status: 'Pending'
    });
    setPunchRequests((prev) => [newReq, ...prev]);
    broadcastEvent('create', 'punchRequests', newReq);
    await syncDocToFirestore('punchRequests', newReq.id, newReq);

    await sendNotification({
      title: 'Punch Correction Requested',
      description: `${req.employeeName} requested punch regularization for ${req.date} (${req.requestedCheckIn} - ${req.requestedCheckOut})`,
      category: 'attendance',
      type: 'warning',
      priority: 'high',
      targetRole: 'admin',
      senderId: req.employeeId,
      senderName: req.employeeName,
      actionUrl: 'attendance',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    });
  };

  const reviewPunchRequest = async (
    id: string, 
    status: 'Approved' | 'Rejected', 
    adminNotes?: string, 
    reviewerName: string = 'Administrator'
  ) => {
    const req = punchRequests.find((p) => p.id === id);
    if (!req) return;

    const updatedReq: PunchCorrectionRequest = {
      ...req,
      status,
      adminNotes,
      reviewedBy: reviewerName,
      reviewedOn: new Date().toISOString().split('T')[0]
    };

    setPunchRequests((prev) => prev.map((p) => (p.id === id ? updatedReq : p)));
    broadcastEvent('update', 'punchRequests', updatedReq);
    await syncDocToFirestore('punchRequests', id, updatedReq);

    if (status === 'Approved') {
      const existingAtt = attendance.find(
        (a) => (a.employeeId === req.employeeId || a.employeeName === req.employeeName) && a.date === req.date
      );

      if (existingAtt) {
        await updateAttendanceRecord(existingAtt.id, {
          checkIn: req.requestedCheckIn,
          checkOut: req.requestedCheckOut,
          status: 'Present'
        });
      } else {
        await addAttendanceRecord({
          employeeId: req.employeeId,
          employeeName: req.employeeName,
          date: req.date || new Date().toISOString().split('T')[0],
          checkIn: req.requestedCheckIn || '09:00 AM',
          checkOut: req.requestedCheckOut || null,
          status: 'Present',
          workLocation: 'Office'
        });
      }
    }

    await sendNotification({
      title: `Punch Request ${status}`,
      description: `Your punch correction request for ${req.date} has been ${status.toLowerCase()} by ${reviewerName}.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
      category: 'attendance',
      type: status === 'Approved' ? 'success' : 'alert',
      priority: status === 'Approved' ? 'low' : 'high',
      targetUserId: req.employeeId,
      actionUrl: 'attendance'
    });
  };

  const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = normalizeRemoteRecord({ ...record, employeeId: record.employeeId || auth.currentUser?.uid || '', id: `att-${Date.now()}` });
    setAttendance((prev) => [newRecord, ...prev]);
    broadcastEvent('create', 'attendance', newRecord);
    await syncDocToFirestore('attendance', newRecord.id, newRecord);
  };

  const markAttendance = async (record: Partial<AttendanceRecord> & { employeeName: string }) => {
    const today = record.date || new Date().toISOString().split('T')[0];
    const existing = attendance.find((a) => a.employeeName === record.employeeName && a.date === today);
    const nowIso = new Date().toISOString();

    if (existing) {
      const updated: AttendanceRecord = { ...existing, ...record, checkOut: record.checkOut === 'now' ? nowIso : (record.checkOut !== undefined ? record.checkOut : existing.checkOut) };
      setAttendance((prev) => prev.map((a) => (a.id === existing.id ? updated : a)));
      broadcastEvent('update', 'attendance', updated);
      await syncDocToFirestore('attendance', existing.id, updated);
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: record.employeeId || auth.currentUser?.uid || '',
        employeeName: record.employeeName,
        date: today,
        checkIn: record.checkIn === 'now' ? nowIso : (record.checkIn || nowIso),
        checkOut: record.checkOut === 'now' ? nowIso : (record.checkOut || null),
        status: record.status || 'Present',
        workLocation: record.workLocation || 'Office',
      };
      setAttendance((prev) => [newRecord, ...prev]);
      broadcastEvent('create', 'attendance', newRecord);
      await syncDocToFirestore('attendance', newRecord.id, newRecord);
    }
  };

  // Leaves
  const applyLeave = async (leave: Omit<LeaveRequest, 'id' | 'requestedOn' | 'status'>) => {
    const newLeave: LeaveRequest = normalizeRemoteRecord({
      ...leave,
      id: `lev-${Date.now()}`,
      requestedOn: new Date().toISOString().split('T')[0],
      status: 'Pending',
    });
    setLeaves((prev) => [newLeave, ...prev]);
    broadcastEvent('create', 'leaves', newLeave);
    await syncDocToFirestore('leaves', newLeave.id, newLeave);

    await sendNotification({
      title: `New Leave Request: ${leave.employeeName}`,
      description: `${leave.type} Leave requested from ${leave.startDate} to ${leave.endDate}. Reason: ${leave.reason}`,
      category: 'leave',
      type: 'info',
      priority: 'medium',
      targetRole: 'admin',
      senderId: leave.employeeId,
      senderName: leave.employeeName,
      actionUrl: 'leaves'
    });
  };

  const updateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected', reviewerName: string = 'Admin') => {
    const reviewDate = new Date().toISOString().split('T')[0];
    const updateObj = { status, reviewedBy: reviewerName, reviewedOn: reviewDate };
    setLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updateObj } : l))
    );
    broadcastEvent('update', 'leaves', { id, ...updateObj });
    await syncDocToFirestore('leaves', id, updateObj);

    const targetLeave = leaves.find((l) => l.id === id);
    if (targetLeave) {
      await sendNotification({
        title: `Leave ${status}: ${targetLeave.employeeName}`,
        description: `Your ${targetLeave.type} leave request (${targetLeave.startDate} to ${targetLeave.endDate}) was ${status.toLowerCase()} by ${reviewerName}.`,
        category: 'leave',
        type: status === 'Approved' ? 'success' : 'alert',
        priority: status === 'Approved' ? 'low' : 'high',
        targetUserId: targetLeave.employeeId,
        actionUrl: 'leaves'
      });
    }
  };

  // Projects
  const addProject = async (proj: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...proj,
      requesterUid: proj.requesterUid || auth.currentUser?.uid,
      id: `prj-${Date.now()}`,
      progress: proj.progress ?? 0,
      spent: proj.spent ?? 0,
    };
    setProjects((prev) => [newProj, ...prev]);
    broadcastEvent('create', 'projects', newProj);
    try {
      await syncDocToFirestore('projects', newProj.id, newProj);
    } catch (error) {
      // Never leave a phantom project card after a rejected backend write.
      setProjects((prev) => prev.filter((project) => project.id !== newProj.id));
      broadcastEvent('delete', 'projects', { id: newProj.id });
      throw error;
    }
  };

  const updateProject = async (id: string, proj: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...proj } : p)));
    broadcastEvent('update', 'projects', { id, ...proj });
    await syncDocToFirestore('projects', id, proj);
  };

  const updateProjectProgress = async (id: string, progress: number) => {
    await updateProject(id, { progress });
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    broadcastEvent('delete', 'projects', { id });
    await deleteDocFromFirestore('projects', id);
  };

  // Tasks
  const addTask = async (task: Omit<Task, 'id'>) => {
    const newTask: Task = normalizeRemoteRecord({
      ...task,
      id: `tsk-${Date.now()}`,
      spentHours: task.spentHours ?? 0,
    });
    setTasks((prev) => [newTask, ...prev]);
    broadcastEvent('create', 'tasks', newTask);
    await syncDocToFirestore('tasks', newTask.id, newTask);

    await sendNotification({
      title: `Task Assigned: ${task.title}`,
      description: `Assigned to ${task.assignedToName || 'Team'}. Due: ${task.dueDate || 'Soon'} (${task.priority} priority)`,
      category: 'task',
      type: 'info',
      priority: task.priority === 'High' || task.priority === 'Urgent' ? 'high' : 'medium',
      actionUrl: 'tasks'
    });
  };

  const updateTask = async (id: string, task: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...task } : t)));
    broadcastEvent('update', 'tasks', { id, ...task });
    await syncDocToFirestore('tasks', id, task);
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    await updateTask(id, { status });
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    broadcastEvent('delete', 'tasks', { id });
    await deleteDocFromFirestore('tasks', id);
  };

  // CRM
  const addLead = async (lead: Omit<CRMLead, 'id'>) => {
    const newLead: CRMLead = { ...lead, id: `lead-${Date.now()}` };
    setLeads((prev) => [newLead, ...prev]);
    broadcastEvent('create', 'leads', newLead);
    await syncDocToFirestore('leads', newLead.id, newLead);
  };

  const updateLead = async (id: string, lead: Partial<CRMLead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...lead } : l)));
    broadcastEvent('update', 'leads', { id, ...lead });
    await syncDocToFirestore('leads', id, lead);
  };

  const updateLeadStage = async (id: string, stage: CRMLead['stage']) => {
    await updateLead(id, { stage });
  };

  const deleteLead = async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    broadcastEvent('delete', 'leads', { id });
    await deleteDocFromFirestore('leads', id);
  };

  const addContact = async (contact: Omit<CRMContact, 'id'>) => {
    const newContact: CRMContact = { ...contact, id: `cnt-${Date.now()}` };
    setContacts((prev) => [newContact, ...prev]);
    broadcastEvent('create', 'contacts', newContact);
    await syncDocToFirestore('contacts', newContact.id, newContact);
  };

  const deleteContact = async (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    broadcastEvent('delete', 'contacts', { id });
    await deleteDocFromFirestore('contacts', id);
  };

  const addVendor = async (vendor: Omit<Vendor, 'id'>) => {
    const newVendor: Vendor = { ...vendor, id: `vnd-${Date.now()}` };
    setVendors((prev) => [newVendor, ...prev]);
    broadcastEvent('create', 'vendors', newVendor);
    await syncDocToFirestore('vendors', newVendor.id, newVendor);
  };

  const deleteVendor = async (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    broadcastEvent('delete', 'vendors', { id });
    await deleteDocFromFirestore('vendors', id);
  };

  const addContract = async (contract: Omit<Contract, 'id'>) => {
    const newContract: Contract = { ...contract, id: `ctr-${Date.now()}` };
    setContracts((prev) => [newContract, ...prev]);
    broadcastEvent('create', 'contracts', newContract);
    await syncDocToFirestore('contracts', newContract.id, newContract);
  };

  const deleteContract = async (id: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== id));
    broadcastEvent('delete', 'contracts', { id });
    await deleteDocFromFirestore('contracts', id);
  };

  const addCalendarEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = { ...event, id: `evt-${Date.now()}` };
    setCalendarEvents((prev) => [newEvent, ...prev]);
    broadcastEvent('create', 'calendarEvents', newEvent);
    await syncDocToFirestore('calendarEvents', newEvent.id, newEvent);
  };

  const deleteCalendarEvent = async (id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
    broadcastEvent('delete', 'calendarEvents', { id });
    await deleteDocFromFirestore('calendarEvents', id);
  };

  // Invoices
  const addInvoice = async (inv: Omit<Invoice, 'id'>) => {
    const newInv: Invoice = { ...inv, id: `inv-${Date.now()}` };
    setInvoices((prev) => [newInv, ...prev]);
    broadcastEvent('create', 'invoices', newInv);
    await syncDocToFirestore('invoices', newInv.id, newInv);
  };

  const updateInvoice = async (id: string, inv: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...inv } : i)));
    broadcastEvent('update', 'invoices', { id, ...inv });
    await syncDocToFirestore('invoices', id, inv);
  };

  const markInvoicePaid = async (id: string, paymentMethod: string = 'Online Portal') => {
    await updateInvoice(id, { status: 'Paid', paymentMethod });
  };

  const deleteInvoice = async (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    broadcastEvent('delete', 'invoices', { id });
    await deleteDocFromFirestore('invoices', id);
  };

  // Announcements


  // Add implementation near other add/delete functions
  const addAnnouncement = async (ann: Omit<Announcement, 'id' | 'date' | 'viewsCount'>) => {

    const newAnn: Announcement = {
      ...ann,
      title: sanitizeInput(ann.title),
      content: sanitizeInput(ann.content),
      id: `anc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      viewsCount: 1,
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    broadcastEvent('create', 'announcements', newAnn);
    await syncDocToFirestore('announcements', newAnn.id, newAnn);

    await sendNotification({
      title: `Company Announcement: ${ann.title}`,
      description: `${ann.author}: ${ann.content.slice(0, 100)}`,
      category: 'announcement',
      type: 'info',
      priority: ann.priority === 'Urgent' ? 'high' : 'medium',
      actionUrl: 'dashboard'
    });
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    broadcastEvent('delete', 'announcements', { id });
    await deleteDocFromFirestore('announcements', id);
  };

  // Chat Messenger (Realtime across all users)
  const sendMessage = async (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = normalizeRemoteRecord({
      ...msg,
      senderId: auth.currentUser?.uid || msg.senderId,
      text: sanitizeInput(msg.text),
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    });
    setMessages((prev) => [...prev, newMsg]);
    broadcastEvent('create', 'chatMessages', newMsg);
    await syncDocToFirestore('chatMessages', newMsg.id, newMsg);

    // Message persistence is the primary operation. Notification delivery is
    // secondary and must not make a saved message appear to have failed.
    try {
      await sendNotification({
        title: `Message from ${msg.senderName}`,
        description: msg.text || (msg.attachments && msg.attachments.length > 0 ? `Sent file: ${msg.attachments[0].name}` : 'New chat message'),
        category: 'message',
        type: 'info',
        priority: 'high',
        targetUserId: msg.recipientId,
        targetRole: msg.recipientId ? undefined : 'all',
        senderId: msg.senderId,
        senderName: msg.senderName,
        actionUrl: 'chat',
        senderAvatar: msg.senderAvatar
      });
    } catch (notificationError) {
      console.warn('Chat notification delivery skipped after message persistence:', notificationError);
    }
  };

  const editChatMessage = async (messageId: string, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const updated = { ...msg, text: sanitizeInput(newText), isEdited: true };
          broadcastEvent('update', 'chatMessages', updated);
          syncDocToFirestore('chatMessages', messageId, updated);
          return updated;
        }
        return msg;
      })
    );
  };

  const deleteChatMessage = async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    broadcastEvent('delete', 'chatMessages', { id: messageId });
    await deleteDocFromFirestore('chatMessages', messageId);
  };

  const togglePinChatMessage = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const updated = { ...msg, isPinned: !msg.isPinned };
          broadcastEvent('update', 'chatMessages', updated);
          syncDocToFirestore('chatMessages', messageId, updated);
          return updated;
        }
        return msg;
      })
    );
  };

  const addReaction = async (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = { ...(msg.reactions || {}) };
          const currentVal = reactions[emoji];
          const count = typeof currentVal === 'number' ? currentVal : (Array.isArray(currentVal) ? currentVal.length : 0);
          reactions[emoji] = count + 1;
          const updated = { ...msg, reactions };
          broadcastEvent('update', 'chatMessages', updated);
          syncDocToFirestore('chatMessages', messageId, updated);
          return updated;
        }
        return msg;
      })
    );
  };

  const addChatChannel = async (channel: Omit<ChatChannel, 'id'>): Promise<string> => {
    const cleanId = `ch-${channel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const newChan: ChatChannel = {
      ...channel,
      id: cleanId,
    };
    setChatChannels((prev) => [...prev, newChan]);
    broadcastEvent('create', 'chatChannels', newChan);
    await syncDocToFirestore('chatChannels', cleanId, newChan);
    return cleanId;
  };

  const deleteChatChannel = async (id: string) => {
    setChatChannels((prev) => prev.filter((c) => c.id !== id));
    broadcastEvent('delete', 'chatChannels', { id });
    await deleteDocFromFirestore('chatChannels', id);
  };

  const setChatTyping = async (channelId: string, userName: string, isTyping: boolean) => {
    setTypingStatuses((prev) => {
      const copy = { ...prev };
      if (isTyping) {
        copy[channelId] = userName;
      } else {
        delete copy[channelId];
      }
      return copy;
    });
    broadcastEvent(isTyping ? 'typing_start' : 'typing_stop', 'chatTyping', { channelId, userName });
    await syncDocToFirestore('chatTyping', channelId, { userName, isTyping, timestamp: Date.now() });
  };

  const openChatWithUser = (targetUserId: string) => {
    if (!targetUserId) return;
    const sender = auth.currentUser?.uid || authenticatedUser?.id || '';
    const s1 = String(sender).trim().toLowerCase();
    const s2 = String(targetUserId).trim().toLowerCase();
    const sorted = [s1, s2].sort();
    const canonicalDmId = `dm-${sorted[0]}-${sorted[1]}`;
    setSelectedChatChannelId(canonicalDmId);
    setActiveScreen('chat');
  };

  const openChatChannel = (channelId: string) => {
    if (!channelId) return;
    setSelectedChatChannelId(channelId);
    setActiveScreen('chat');
  };

  const markMessagesAsRead = async (messageIds: string[], userId: string) => {
    if (!messageIds.length || !userId) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (messageIds.includes(m.id)) {
          const currentRead = m.readBy || [];
          if (!currentRead.includes(userId)) {
            return { ...m, readBy: [...currentRead, userId] };
          }
        }
        return m;
      })
    );
    for (const id of messageIds) {
      const msg = messages.find((m) => m.id === id);
      if (msg) {
        const readBy = Array.from(new Set([...(msg.readBy || []), userId]));
        await syncDocToFirestore('chatMessages', id, { ...msg, readBy });
      }
    }
  };

  // Client Management
  const addClient = async (client: Omit<ClientAccount, 'id' | 'joinedDate'>) => {
    const newClient: ClientAccount = {
      ...client,
      id: `cli-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setClients((prev) => [newClient, ...prev]);
    broadcastEvent('create', 'clients', newClient);
    await syncDocToFirestore('clients', newClient.id, newClient);
  };

  const updateClient = async (id: string, client: Partial<ClientAccount>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...client } : c)));
    broadcastEvent('update', 'clients', { id, ...client });
    await syncDocToFirestore('clients', id, client);
  };

  const deleteClient = async (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    broadcastEvent('delete', 'clients', { id });
    await deleteDocFromFirestore('clients', id);
  };

  // Payroll
  const addPayroll = async (payroll: Omit<PayrollRecord, 'id'>) => {
    const newPay: PayrollRecord = { ...payroll, id: `pay-${Date.now()}` };
    setPayrolls((prev) => [newPay, ...prev]);
    broadcastEvent('create', 'payrolls', newPay);
    await syncDocToFirestore('payrolls', newPay.id, newPay);
  };

  const updatePayrollStatus = async (id: string, status: 'Paid' | 'Pending' | 'Processing', paymentDate?: string) => {
    const updated = { status, paymentDate: paymentDate || new Date().toISOString().split('T')[0] };
    setPayrolls((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    broadcastEvent('update', 'payrolls', { id, ...updated });
    await syncDocToFirestore('payrolls', id, updated);
  };

  // Expenses
  const addExpense = async (expense: Omit<ExpenseClaim, 'id' | 'status'>) => {
    const newExp: ExpenseClaim = normalizeRemoteRecord({ ...expense, employeeId: expense.employeeId || auth.currentUser?.uid || '', id: `exp-${Date.now()}`, status: 'Pending' });
    setExpenses((prev) => [newExp, ...prev]);
    broadcastEvent('create', 'expenses', newExp);
    await syncDocToFirestore('expenses', newExp.id, newExp);
  };

  const updateExpenseStatus = async (id: string, status: 'Approved' | 'Rejected', reviewerName: string = 'Admin') => {
    const updated = { status, reviewedBy: reviewerName, reviewedDate: new Date().toISOString().split('T')[0] };
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    broadcastEvent('update', 'expenses', { id, ...updated });
    await syncDocToFirestore('expenses', id, updated);
  };

  // Virtual Meetings & Multi-Device Real-Time Calls
  const addMeeting = async (meeting: Omit<MeetingSession, 'id'>) => {
    const newMtg: MeetingSession = {
      ...meeting,
      id: `mtg-${Date.now()}`,
      activeParticipants: [],
      liveMessages: [],
      status: meeting.status || 'Scheduled',
    };
    setMeetings((prev) => [newMtg, ...prev]);
    broadcastEvent('create', 'meetings', newMtg);
    await syncDocToFirestore('meetings', newMtg.id, newMtg);

    await sendNotification({
      title: `Meeting Scheduled: ${meeting.title}`,
      description: `${meeting.scheduledTime} (${meeting.durationMinutes} mins). Hosted by ${meeting.hostName}`,
      category: 'meeting',
      type: 'info',
      priority: 'medium',
      actionUrl: 'meetings'
    });
  };

  const updateMeetingStatus = async (id: string, status: 'Scheduled' | 'Live' | 'Ended') => {
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    broadcastEvent('update', 'meetings', { id, status });
    await syncDocToFirestore('meetings', id, { status });
  };

  const joinMeetingCall = async (meetingId: string, participant: MeetingParticipant) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const currentActive = m.activeParticipants || [];
        const exists = currentActive.some((p) => p.id === participant.id);
        const updatedParticipants = exists
          ? currentActive.map((p) => (p.id === participant.id ? { ...p, ...participant } : p))
          : [...currentActive, participant];
        const updatedMtg: MeetingSession = {
          ...m,
          status: 'Live',
          activeParticipants: updatedParticipants,
        };
        broadcastEvent('update', 'meetings', updatedMtg);
        syncDocToFirestore('meetings', meetingId, updatedMtg);
        return updatedMtg;
      })
    );
  };

  const leaveMeetingCall = async (meetingId: string, participantId: string) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const currentActive = m.activeParticipants || [];
        const updatedParticipants = currentActive.filter((p) => p.id !== participantId);
        const updatedMtg: MeetingSession = {
          ...m,
          status: updatedParticipants.length === 0 ? 'Ended' : m.status,
          activeParticipants: updatedParticipants,
        };
        broadcastEvent('update', 'meetings', updatedMtg);
        syncDocToFirestore('meetings', meetingId, updatedMtg);
        return updatedMtg;
      })
    );
  };

  const updateMeetingParticipantState = async (
    meetingId: string,
    participantId: string,
    updates: Partial<MeetingParticipant>
  ) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const currentActive = m.activeParticipants || [];
        const updatedParticipants = currentActive.map((p) =>
          p.id === participantId ? { ...p, ...updates } : p
        );
        const updatedMtg: MeetingSession = {
          ...m,
          activeParticipants: updatedParticipants,
        };
        broadcastEvent('update', 'meetings', updatedMtg);
        syncDocToFirestore('meetings', meetingId, updatedMtg);
        return updatedMtg;
      })
    );
  };

  const sendMeetingChatMessage = async (
    meetingId: string,
    msg: Omit<MeetingChatMessage, 'id' | 'time'>
  ) => {
    const newChatMsg: MeetingChatMessage = {
      ...msg,
      id: `mmsg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const currentMsgs = m.liveMessages || [];
        const updatedMtg: MeetingSession = {
          ...m,
          liveMessages: [...currentMsgs, newChatMsg],
        };
        broadcastEvent('update', 'meetings', updatedMtg);
        syncDocToFirestore('meetings', meetingId, updatedMtg);
        return updatedMtg;
      })
    );
  };

  const toggleMeetingRecording = async (meetingId: string) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const isRecording = !m.isRecording;
        const updatedMtg = { ...m, isRecording };
        broadcastEvent('update', 'meetings', updatedMtg);
        syncDocToFirestore('meetings', meetingId, updatedMtg);
        return updatedMtg;
      })
    );
  };

  // Email / Outlook Messaging Operations
  const sendEmail = async (email: Omit<EmailMessage, 'id' | 'date' | 'time' | 'read' | 'starred'> & { date?: string; time?: string; folder?: EmailMessage['folder']; read?: boolean; starred?: boolean }) => {
    const now = new Date();
    const mailId = `mail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newMail: EmailMessage = {
      ...email,
      id: mailId,
      date: email.date || now.toISOString().split('T')[0],
      time: email.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      folder: email.folder || 'sent',
      read: email.read !== undefined ? email.read : true,
      starred: email.starred !== undefined ? email.starred : false,
    };

    setEmails((prev) => [newMail, ...prev]);
    broadcastEvent('create', 'emails', newMail);
    await syncDocToFirestore('emails', mailId, newMail);

    await sendNotification({
      title: `Mail Sent: ${email.subject}`,
      description: `To ${email.toEmail}: ${email.snippet || email.body.slice(0, 70)}`,
      category: 'mail',
      type: 'info',
      priority: 'low',
      actionUrl: 'mail'
    });
  };

  const markEmailRead = async (id: string, read: boolean) => {
    setEmails((prev) => prev.map((m) => (m.id === id ? { ...m, read } : m)));
    broadcastEvent('update', 'emails', { id, read });
    await syncDocToFirestore('emails', id, { read });
  };

  const toggleStarEmail = async (id: string) => {
    const target = emails.find((m) => m.id === id);
    if (!target) return;
    const newStarred = !target.starred;
    setEmails((prev) => prev.map((m) => (m.id === id ? { ...m, starred: newStarred } : m)));
    broadcastEvent('update', 'emails', { id, starred: newStarred });
    await syncDocToFirestore('emails', id, { starred: newStarred });
  };

  const deleteEmail = async (id: string) => {
    setEmails((prev) => prev.filter((m) => m.id !== id));
    broadcastEvent('delete', 'emails', { id });
    await deleteDocFromFirestore('emails', id);
  };

  const moveEmailToFolder = async (id: string, folder: EmailMessage['folder']) => {
    setEmails((prev) => prev.map((m) => (m.id === id ? { ...m, folder } : m)));
    broadcastEvent('update', 'emails', { id, folder });
    await syncDocToFirestore('emails', id, { folder });
  };

  // Vernika Sheets Methods
  const addSheet = async (sheetData: Omit<VernikaSheet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = 'sheet-' + Date.now();
    const newSheet: VernikaSheet = {
      ...sheetData,
      id,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setSheets((prev) => [newSheet, ...prev]);
    broadcastEvent('create', 'sheets', newSheet);
    await syncDocToFirestore('sheets', id, newSheet);
    return id;
  };

  const updateSheet = async (id: string, sheetUpdate: Partial<VernikaSheet>) => {
    const updatedAt = new Date().toISOString().split('T')[0];
    const updated = { ...sheetUpdate, updatedAt };
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    broadcastEvent('update', 'sheets', { id, ...updated });
    await syncDocToFirestore('sheets', id, updated);
  };

  const deleteSheet = async (id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
    broadcastEvent('delete', 'sheets', { id });
    await deleteDocFromFirestore('sheets', id);
  };

  const saveSheetData = async (sheetId: string, tabId: string, data: Record<string, SheetCell>) => {
    const updatedAt = new Date().toISOString().split('T')[0];
    setSheets((prev) =>
      prev.map((sheet) => {
        if (sheet.id !== sheetId) return sheet;
        const updatedTabs = sheet.tabs.map((tab) => (tab.id === tabId ? { ...tab, data } : tab));
        const updated = { ...sheet, tabs: updatedTabs, updatedAt };
        broadcastEvent('update', 'sheets', updated);
        syncDocToFirestore('sheets', sheetId, updated);
        return updated;
      })
    );
  };

  // Performance & Tracking Methods
  const updatePerformanceRecord = async (employeeId: string, update: Partial<EmployeePerformanceData>) => {
    setPerformanceRecords((prev) => {
      const exists = prev.some((p) => p.employeeId === employeeId);
      if (exists) {
        return prev.map((p) => (p.employeeId === employeeId ? { ...p, ...update, lastUpdated: 'Just now' } : p));
      } else {
        const emp = employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
        const newRecord: EmployeePerformanceData = {
          employeeId,
          employeeName: emp?.name || 'Employee',
          department: emp?.department || 'Operations',
          position: emp?.position || 'Specialist',
          avatar: emp?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          productivityScore: 90,
          activeHoursToday: 6.5,
          targetHoursToday: 8.0,
          tasksCompletedWeek: 10,
          tasksAssignedWeek: 12,
          onTimeDeliveryRate: 92,
          currentActiveApp: 'Vernika Enterprise Suite',
          activeWindowStatus: 'Active',
          idleMinutes: 0,
          activityHeatmap: [80, 85, 90, 85, 75, 90, 95, 88, 85, 88],
          lastUpdated: 'Just now',
          ...update
        };
        return [...prev, newRecord];
      }
    });
  };

  const logEmployeeActivity = async (log: Omit<EmployeeActivityLog, 'id' | 'timestamp'>) => {
    const newLog: EmployeeActivityLog = {
      ...log,
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString()
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    broadcastEvent('create', 'activityLogs', newLog);
    await syncDocToFirestore('activityLogs', newLog.id, newLog);
  };

  // Notifications
  const sendNotification = async (item: Omit<NotificationItem, 'id' | 'time' | 'read'> & { time?: string; read?: boolean }) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: item.time || 'Just now',
      read: item.read !== undefined ? item.read : false,
      type: item.type || 'info',
      description: item.description || item.message || '',
      category: item.category || 'message',
      priority: item.priority || 'medium',
      senderId: item.senderId || authenticatedUser?.id,
      senderName: item.senderName || authenticatedUser?.name,
    };
    setNotifications((prev) => {
      if (prev.some((n) => n.id === newNotif.id)) return prev;
      return [newNotif, ...prev];
    });
    broadcastEvent('create', 'notifications', newNotif);
    await syncDocToFirestore('notifications', newNotif.id, newNotif);
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    broadcastEvent('update', 'notifications', { id, read: true });
    await syncDocToFirestore('notifications', id, { read: true });
  };

  const markAllNotificationsAsRead = async () => {
    const ids = notifications.filter((notification) => !notification.read).map((notification) => notification.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    broadcastEvent('update', 'notifications', { all: true, read: true });
    await Promise.all(ids.map((id) => syncDocToFirestore('notifications', id, { read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    broadcastEvent('delete', 'notifications', { id });
    deleteDocFromFirestore('notifications', id);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    broadcastEvent('clear', 'notifications', {});
    notifications.forEach((n) => deleteDocFromFirestore('notifications', n.id));
  };

  // Workflow Profiles Management
  const updateWorkflowProfile = async (employeeId: string, updates: Partial<EmployeeWorkflowProfile>) => {
    setWorkflowProfiles((prev) => {
      const exists = prev.some((w) => w.employeeId === employeeId);
      let updatedList: EmployeeWorkflowProfile[];
      if (exists) {
        updatedList = prev.map((w) => (w.employeeId === employeeId ? { ...w, ...updates } : w));
      } else {
        const emp = employees.find((e) => e.id === employeeId || e.employeeId === employeeId);
        const newProfile: EmployeeWorkflowProfile = {
          id: `wf-${Date.now()}`,
          employeeId,
          employeeName: emp?.name || 'Staff Member',
          department: emp?.department || 'Operations',
          position: emp?.position || 'Specialist',
          shiftType: 'General',
          shiftStartTime: '09:00 AM',
          shiftEndTime: '06:00 PM',
          gracePeriodMinutes: 15,
          weeklyOffDays: ['Saturday', 'Sunday'],
          overtimeEligible: true,
          overtimeRateMultiplier: 1.5,
          overtimeHoursMonth: 0,
          leaveQuotaTotal: 30,
          leaveQuotaUsed: 5,
          monthlyBaseSalary: emp?.salary ? Math.round(emp.salary / 12) : 6500,
          monthlyBonus: 500,
          monthlyIncentives: 200,
          taxDeduction: 650,
          pfDeduction: 325,
          healthInsuranceDeduction: 150,
          otherDeductions: 0,
          netMonthlyPayout: 6075,
          assignedProjects: [],
          shiftRoster: {},
          lastUpdated: new Date().toISOString().split('T')[0],
          ...updates
        };
        updatedList = [newProfile, ...prev];
      }
      const profileToSync = updatedList.find((w) => w.employeeId === employeeId);
      if (profileToSync) {
        syncDocToFirestore('workflowProfiles', employeeId, profileToSync);
        broadcastEvent('update', 'workflowProfiles', profileToSync);
      }
      return updatedList;
    });

    await sendNotification({
      title: 'Workflow Settings Updated',
      description: `Workflow profile and payout rules updated for employee ID: ${employeeId}`,
      category: 'workflow',
      type: 'info',
      priority: 'low',
      actionUrl: 'workflow'
    });
  };

  const getEmployeeWorkflow = (employeeId: string) => {
    return workflowProfiles.find((w) => w.employeeId === employeeId);
  };

  // Employee Documents Management
  const createEmployeeDocument = async (docData: Omit<EmployeeDocumentRecord, 'id' | 'issueDate'> & { issueDate?: string }): Promise<string> => {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newDoc: EmployeeDocumentRecord = {
      ...docData,
      id: docId,
      issueDate: docData.issueDate || new Date().toISOString().split('T')[0],
      status: docData.status || 'Draft',
      downloadCount: 0
    };

    setEmployeeDocuments((prev) => [newDoc, ...prev]);
    broadcastEvent('create', 'employeeDocuments', newDoc);
    await syncDocToFirestore('employeeDocuments', docId, newDoc);

    await sendNotification({
      title: 'Official Document Generated',
      description: `${newDoc.title} generated for ${newDoc.employeeName} (${newDoc.documentType})`,
      category: 'document',
      type: 'info',
      priority: 'low',
      actionUrl: 'documents'
    });

    return docId;
  };

  const updateEmployeeDocument = async (id: string, updates: Partial<EmployeeDocumentRecord>) => {
    setEmployeeDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    broadcastEvent('update', 'employeeDocuments', { id, ...updates });
    await syncDocToFirestore('employeeDocuments', id, updates);
  };

  const deleteEmployeeDocument = async (id: string) => {
    setEmployeeDocuments((prev) => prev.filter((d) => d.id !== id));
    broadcastEvent('delete', 'employeeDocuments', { id });
    await deleteDocFromFirestore('employeeDocuments', id);
  };

  const shareEmployeeDocument = async (id: string, recipientEmail: string) => {
    const docObj = employeeDocuments.find((d) => d.id === id);
    if (!docObj) return;

    await updateEmployeeDocument(id, {
      status: 'Sent',
      sharedWithEmail: recipientEmail
    });

    await sendEmail({
      fromName: 'HR Operations',
      fromEmail: 'hr@vernika.enterprise',
      toEmail: recipientEmail,
      toName: docObj.employeeName,
      subject: `Official Document: ${docObj.title}`,
      snippet: `Official ${docObj.documentType} issued by Vernika Cloud Enterprise.`,
      body: `Dear ${docObj.employeeName},\n\nPlease find attached your official ${docObj.documentType} (${docObj.title}).\n\nDocument Reference: ${docObj.id}\nIssue Date: ${docObj.issueDate}\nAuthorized Signatory: ${docObj.data?.signatoryName || 'Vernika Cloud Enterprise Human Resources'}\n\nYou can access or download this document directly from your Vernika Enterprise Employee Portal.\n\nWarm regards,\nHuman Resources Department\nVernika Cloud Enterprise`,
      folder: 'sent'
    });

    await sendNotification({
      title: 'Document Shared via Email',
      description: `${docObj.title} was sent to ${recipientEmail}`,
      category: 'mail',
      type: 'info',
      priority: 'medium',
      actionUrl: 'mail'
    });
  };


  const uploadFile = async (file: File, metadata?: { category?: string, description?: string, linkedProjectId?: string, linkedClientId?: string, linkedTaskId?: string }) => {
    const maxFirestoreFileBytes = 700 * 1024;
    if (file.size > maxFirestoreFileBytes) {
      throw new Error('Shared attachments must be 700 KB or smaller until Firebase Storage is enabled.');
    }
    return new Promise<GlobalFileRecord>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newRecord: GlobalFileRecord = {
          id: `file-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: (e.target?.result as string) || '#',
          dataUrl: e.target?.result as string,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Admin',
          uploadedByName: 'Admin',
          ...metadata
        };
        setGlobalFiles(prev => [newRecord, ...prev]);
        broadcastEvent('create', 'globalFiles', newRecord);
        void syncDocToFirestore('globalFiles', newRecord.id, newRecord).then((ok) => {
          if (!ok) console.warn('Shared file upload was not persisted:', newRecord.id);
        });
        resolve(newRecord);
      };
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  };

  const deleteGlobalFile = async (id: string) => {
    setGlobalFiles(prev => prev.filter(f => f.id !== id));
    broadcastEvent('delete', 'globalFiles', { id });
    await deleteDocFromFirestore('globalFiles', id);
  };

  const addAuditLog = async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog = createAuditLogEntry(log.userId, log.userName, log.userRole, log.action, log.module, log.details, log.severity);
    setAuditLogs(prev => [newLog, ...prev]);
    broadcastEvent('create', 'auditLogs', newLog);
    await syncDocToFirestore('auditLogs', newLog.id, newLog);
  };

  const scoreLeadAI = (lead: CRMLead): CRMLead => {
    let score = 50;
    if (lead.value > 100000) score += 20;
    if (lead.probability && lead.probability > 60) score += 15;
    if (lead.notes && lead.notes.length > 50) score += 5;
    if (lead.email && lead.email.includes('.edu')) score -= 10;
    
    score = Math.max(0, Math.min(100, score));
    
    let grade: CRMLead['dealGrade'] = 'C';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 50) grade = 'C';
    else grade = 'D';

    return { ...lead, aiScore: score, dealGrade: grade };
  };

  const autoRouteLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const scoredLead = scoreLeadAI(lead);
    
    // Find Sales employee with lowest workload (dummy logic for round-robin/capacity)
    const salesReps = employees.filter(e => e.department === 'Sales' && e.status === 'Active');
    let assignedTo = scoredLead.assignedTo;
    
    if (salesReps.length > 0) {
      const rep = salesReps[Math.floor(Math.random() * salesReps.length)];
      assignedTo = rep.name;
    }
    
    const updatedLead = { ...scoredLead, assignedTo };
    setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
    broadcastEvent('update', 'leads', updatedLead);
    await syncDocToFirestore('leads', leadId, updatedLead);
    
    addAuditLog({
      userId: 'system',
      userName: 'AI Router',
      userRole: 'system',
      action: 'Auto-Routed Lead',
      module: 'CRM',
      details: `Lead ${lead.name} scored ${updatedLead.aiScore} (Grade ${updatedLead.dealGrade}) and routed to ${updatedLead.assignedTo}`,
      severity: 'INFO'
    });
  };

  const verifyThreeWayMatch = async (invoiceId: string, poNumber: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    // Simulated verification logic
    const matched = !!poNumber && poNumber.startsWith('PO-');
    
    const updatedInvoice = {
      ...invoice,
      poNumber,
      threeWayMatched: matched,
      complianceBadge: matched ? '3-Way Verified' as const : 'Manual Approval' as const
    };
    
    setInvoices(prev => prev.map(i => i.id === invoiceId ? updatedInvoice : i));
    broadcastEvent('update', 'invoices', updatedInvoice);
    await syncDocToFirestore('invoices', invoiceId, updatedInvoice);
    
    addAuditLog({
      userId: 'system',
      userName: 'Procurement Engine',
      userRole: 'system',
      action: '3-Way Match Verification',
      module: 'INVOICING',
      details: `Invoice ${invoiceId} checked against PO ${poNumber} - ${matched ? 'Matched' : 'Failed'}`,
      severity: matched ? 'INFO' : 'WARNING'
    });
  };

  const calculateProjectRollup = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    
    // Financial rollup
    let laborCost = 0;
    let expenseCost = 0;
    let vendorCost = 0;
    
    const projectExpenses = expenses.filter(e => e.linkedProjectId === projectId && e.status === 'Approved');
    expenseCost = projectExpenses.reduce((sum, e) => sum + e.amount, 0);

    laborCost = project?.team.length ? project.team.length * 5000 : 0; 
    
    const actualTotal = laborCost + expenseCost + vendorCost;
    const budget = project?.budget || 0;
    const budgetVariance = budget - actualTotal;
    const marginPercent = budget > 0 ? (budgetVariance / budget) * 100 : 0;

    // Predictive Resource Capacity Warning
    let capacityWarning: any = { isOverAllocated: false, bottleneckMembers: [], riskLevel: 'None', forecastedDelayDays: 0 };
    if (project) {
      const projectTasks = tasks.filter(t => t.projectId === projectId && t.status !== 'Done');
      const estimatedRemaining = projectTasks.reduce((sum, t) => sum + (t.estimatedHours || 0) - (t.spentHours || 0), 0);
      
      const teamSize = project.team.length;
      if (teamSize > 0) {
        // Assume 3 weeks (120 hours max per person)
        const maxCapacity = teamSize * 120;
        if (estimatedRemaining > maxCapacity) {
          capacityWarning = {
            isOverAllocated: true,
            bottleneckMembers: project.team.slice(0, 2), // dummy bottlenecks
            riskLevel: estimatedRemaining > maxCapacity * 1.5 ? 'Critical' : 'Medium',
            forecastedDelayDays: Math.ceil((estimatedRemaining - maxCapacity) / 8)
          };
        }
      }
    }
    
    return {
      laborCost,
      expenseCost,
      vendorCost,
      actualTotal,
      budgetVariance,
      marginPercent,
      capacityWarning
    };
  };

  return (
    <AppContext.Provider
      value={{
        globalCurrency,
        setGlobalCurrency,
        auditLogs,
        addAuditLog,
        scoreLeadAI,
        autoRouteLead,
        verifyThreeWayMatch,
        calculateProjectRollup,
        globalFiles,
        uploadFile,
        deleteGlobalFile,
        activeScreen,
        setActiveScreen,
        isSyncing,
        lastSyncTime,
        syncStatus,
        syncError,
        forceRefreshSync,
        employees,
        departments,
        positions,
        attendance,
        leaves,
        projects,
        tasks,
        leads,
        contacts,
        vendors,
        contracts,
        calendarEvents,
        inventoryItems,
        invoices,
        announcements,
        messages,
        chatChannels,
        typingStatuses,
        emails,
        notifications,
        auxLogs,
        clients,
        payrolls,
        expenses,
        meetings,
        okrs,
        sheets,
        performanceRecords,
        activityLogs,
        punchRequests,
        workflowProfiles,
        employeeDocuments,

        addSheet,
        updateSheet,
        deleteSheet,
        saveSheetData,

        updatePerformanceRecord,
        logEmployeeActivity,

        addEmployee,
        updateEmployee,
        deleteEmployee,
        updateEmployeePermissions,

        logAuxChange,
        updateEmployeeAuxStatus,

        addDepartment,
        updateDepartment,
        deleteDepartment,

        addPosition,
        updatePosition,
        deletePosition,

        clockIn,
        clockOut,
        cancelAccidentalPunchOut,
        updateAttendanceRecord,
        submitPunchRequest,
        reviewPunchRequest,
        addAttendanceRecord,
        markAttendance,

        applyLeave,
        updateLeaveStatus,

        addProject,
        updateProject,
        updateProjectProgress,
        deleteProject,

        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,

        addLead,
        updateLead,
        updateLeadStage,
        deleteLead,
        addContact,
        deleteContact,
        addVendor,
        deleteVendor,
        addContract,
        deleteContract,
        addCalendarEvent,
        deleteCalendarEvent,

        sendEmail,
        markEmailRead,
        toggleStarEmail,
        deleteEmail,
        moveEmailToFolder,

        addInvoice,
        updateInvoice,
        markInvoicePaid,
        deleteInvoice,

        addAnnouncement,
        deleteAnnouncement,

        sendMessage,
        editChatMessage,
        deleteChatMessage,
        togglePinChatMessage,
        addReaction,
        addChatChannel,
        deleteChatChannel,
        setChatTyping,
        selectedChatChannelId,
        setSelectedChatChannelId,
        openChatWithUser,
        openChatChannel,
        markMessagesAsRead,

        addClient,
        updateClient,
        deleteClient,

        addPayroll,
        updatePayrollStatus,

        addExpense,
        updateExpenseStatus,

        addMeeting,
        updateMeetingStatus,
        joinMeetingCall,
        leaveMeetingCall,
        updateMeetingParticipantState,
        sendMeetingChatMessage,
        toggleMeetingRecording,

        updateWorkflowProfile,
        getEmployeeWorkflow,

        createEmployeeDocument,
        updateEmployeeDocument,
        deleteEmployeeDocument,
        shareEmployeeDocument,

        sendNotification,
        markNotificationRead,
        markNotificationAsRead: markNotificationRead,
        clearAllNotifications,
        markAllNotificationsAsRead,
        dismissNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );

}
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
