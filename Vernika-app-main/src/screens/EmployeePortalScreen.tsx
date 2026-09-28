import React, { useEffect, useMemo, useState } from 'react';
import { 
  Activity, 
  Clock, 
  CheckSquare, 
  FolderKanban, 
  Calendar, 
  DollarSign, 
  Receipt, 
  MessageSquare, 
  Bell, 
  User, 
  MapPin, 
  Camera, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ArrowRight,
  TrendingUp,
  FileText,
  Download,
  Coffee,
  Laptop,
  Users,
  AlertTriangle,
  Play,
  Pause,
  Mail,
  CalendarDays,
  Sparkles,
  Network,
  Lock,
  FileSpreadsheet,
  Edit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { where } from 'firebase/firestore';
import { aggregateOrEmpty, useAggregateStats, usePaginatedQuery } from '../lib/useFirestoreReadModels';
import { AttendanceRecord, AuxStatus, EmailMessage, ExpenseClaim, LeaveRequest, PayrollRecord, Task } from '../types';
import { Modal } from '../components/common/Modal';

export const EmployeePortalScreen: React.FC = () => {
  const { user, setAuxStatus } = useAuth();
  const { 
    updateTaskStatus, 
    clockIn, 
    clockOut, 
    applyLeave,
    addExpense,
    setActiveScreen,
    logAuxChange,
    updateEmployee,
    uploadFile
  } = useApp();

  const userModules = Array.isArray(user?.allowedModules) ? user.allowedModules : [
    'dashboard', 'mail', 'calendar', 'meetings', 'chat', 'sheets', 
    'attendance', 'leaves', 'projects', 'tasks', 'announcements', 
    'aux_status', 'payroll', 'expenses', 'ai_assistant'
  ];

  const isAllowed = (moduleId: string) => userModules.includes(moduleId);
  const employeeId = user?.id || '';
  const employeeEmail = user?.email || '';
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const ownTaskConstraints = useMemo(() => [where('assignedToId', '==', employeeId)], [employeeId]);
  const ownAttendanceConstraints = useMemo(() => [where('employeeId', '==', employeeId), where('date', '==', todayStr)], [employeeId, todayStr]);
  const ownLeaveConstraints = useMemo(() => [where('employeeId', '==', employeeId)], [employeeId]);
  const ownPayrollConstraints = useMemo(() => [where('employeeId', '==', employeeId)], [employeeId]);
  const ownExpenseConstraints = useMemo(() => [where('employeeId', '==', employeeId)], [employeeId]);
  const ownEmailConstraints = useMemo(() => [where('toEmail', '==', employeeEmail)], [employeeEmail]);
  const { items: myTaskPage } = usePaginatedQuery<Task>({ collectionName: 'tasks', queryKey: `employee-tasks:${employeeId}`, constraints: ownTaskConstraints, pageSize: 8, enabled: Boolean(employeeId) });
  const { items: myAttendancePage } = usePaginatedQuery<AttendanceRecord>({ collectionName: 'attendance', queryKey: `employee-attendance:${employeeId}:${todayStr}`, constraints: ownAttendanceConstraints, pageSize: 2, enabled: Boolean(employeeId) });
  const { items: myLeavePage } = usePaginatedQuery<LeaveRequest>({ collectionName: 'leaves', queryKey: `employee-leaves:${employeeId}`, constraints: ownLeaveConstraints, pageSize: 8, enabled: Boolean(employeeId) });
  const { items: myPayrollPage } = usePaginatedQuery<PayrollRecord>({ collectionName: 'payrolls', queryKey: `employee-payroll:${employeeId}`, constraints: ownPayrollConstraints, pageSize: 6, enabled: Boolean(employeeId) });
  const { items: myExpensePage } = usePaginatedQuery<ExpenseClaim>({ collectionName: 'expenses', queryKey: `employee-expenses:${employeeId}`, constraints: ownExpenseConstraints, pageSize: 8, enabled: Boolean(employeeId) });
  const { items: myEmailPage } = usePaginatedQuery<EmailMessage>({ collectionName: 'emails', queryKey: `employee-emails:${employeeEmail}`, constraints: ownEmailConstraints, pageSize: 25, enabled: Boolean(employeeEmail) });
  const aggregateSpecs = useMemo(() => [
    { key: 'tasks', collectionName: 'tasks', constraints: ownTaskConstraints },
    { key: 'leaves', collectionName: 'leaves', constraints: ownLeaveConstraints },
    { key: 'expenses', collectionName: 'expenses', constraints: ownExpenseConstraints, sumFields: ['amount'] },
  ], [ownExpenseConstraints, ownLeaveConstraints, ownTaskConstraints]);
  const { values: employeeStats } = useAggregateStats(aggregateSpecs, `employee-dashboard:${employeeId}`, { enabled: Boolean(employeeId), refreshIntervalMs: 60_000 });
  const unreadEmailCount = myEmailPage.filter((mail) => String(mail.folder || '').toLowerCase() === 'inbox' && !(mail.read ?? mail.isRead ?? false)).length;

  // AUX Status Local & Real-time State
  const currentAux: AuxStatus = user?.auxStatus || 'Available';
  const [auxDurationSeconds, setAuxDurationSeconds] = useState(140);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingAux, setPendingAux] = useState<AuxStatus | null>(null);
  const [auxReason, setAuxReason] = useState('');

  // Edit My Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editSkills, setEditSkills] = useState(Array.isArray(user?.skills) ? user.skills.join(', ') : typeof user?.skills === 'string' ? user.skills : '');

  useEffect(() => {
    if (!user) return;
    setEditAvatar(user.avatar || '');
    setEditPhone(user.phone || '');
    setEditBio(user.bio || '');
    setEditSkills(Array.isArray(user.skills) ? user.skills.join(', ') : typeof user.skills === 'string' ? user.skills : '');
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await updateEmployee(user.id, {
      avatar: editAvatar,
      phone: editPhone,
      bio: editBio,
      skills: editSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
    });
    setShowProfileModal(false);
  };

  // Clock In / Attendance State
  const userAttendanceToday = myAttendancePage[0];
  const [clockLocation, setClockLocation] = useState<'Office' | 'Remote' | 'Client Site'>('Office');
  const [cameraActive, setCameraActive] = useState(false);

  // Modals for Employee Submissions
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('Annual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseClaim['category']>('Meals');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Live Timer for AUX Duration
  useEffect(() => {
    const timer = setInterval(() => {
      setAuxDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAuxClick = (newStatus: AuxStatus) => {
    if (newStatus === currentAux) return;
    setPendingAux(newStatus);
    setShowReasonModal(true);
  };

  const confirmAuxChange = async () => {
    if (!pendingAux || !user) return;
    setAuxStatus(pendingAux, auxReason);
    setAuxDurationSeconds(0);
    
    // Log to Firestore so admin and staff see it instantly
    await logAuxChange(
      user.id,
      user.name,
      pendingAux,
      auxReason || `Switched status to ${pendingAux}`,
      user.avatar,
      user.department
    );

    setShowReasonModal(false);
    setPendingAux(null);
    setAuxReason('');
  };

  const handleClockIn = async () => {
    if (!user) return;
    setCameraActive(true);
    setTimeout(async () => {
      await clockIn(user.id, user.name, clockLocation, '192.168.1.108');
      setCameraActive(false);
    }, 600);
  };

  const handleClockOut = async () => {
    if (!user) return;
    await clockOut(user.id);
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !leaveStart || !leaveEnd) return;
    const daysCount = Math.max(1, Math.round((new Date(leaveEnd).getTime() - new Date(leaveStart).getTime()) / (1000 * 3600 * 24)) + 1);
    await applyLeave({
      employeeId: user.id,
      employeeName: user.name,
      department: user.department,
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      days: daysCount,
      reason: leaveReason,
    });
    setShowLeaveModal(false);
    setLeaveReason('');
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !expenseTitle || !expenseAmount) return;
    await addExpense({
      employeeId: user.id,
      employeeName: user.name,
      department: user.department,
      title: expenseTitle,
      description: expenseTitle,
      category: expenseCategory,
      amount: parseFloat(expenseAmount),
      date: new Date().toISOString().split('T')[0],
      notes: expenseNotes,
    });
    setShowExpenseModal(false);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseNotes('');
  };

  // Dashboard lists intentionally keep only a small, realtime first page. Full history remains available in each workspace screen.
  const myTasks = myTaskPage;
  const myLeaves = myLeavePage;
  const myPayrolls = myPayrollPage;
  const myExpenses = myExpensePage;
  const taskCount = aggregateOrEmpty(employeeStats, 'tasks').count;
  const leaveCount = aggregateOrEmpty(employeeStats, 'leaves').count;
  const expenseStats = aggregateOrEmpty(employeeStats, 'expenses', ['amount']);
  const expenseTotal = expenseStats.sums.amount || 0;

  const auxColors: Record<AuxStatus, { bg: string; text: string; ring: string }> = {
    'Available': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/40' },
    'In Call': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', ring: 'ring-cyan-500/40' },
    'Short Break': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', ring: 'ring-yellow-500/40' },
    'Break': { bg: 'bg-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500/40' },
    'Lunch': { bg: 'bg-orange-500/20', text: 'text-orange-400', ring: 'ring-orange-500/40' },
    'Meeting': { bg: 'bg-purple-500/20', text: 'text-purple-400', ring: 'ring-purple-500/40' },
    'Training': { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500/40' },
    'Wrap Up': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', ring: 'ring-indigo-500/40' },
    'Offline': { bg: 'bg-slate-500/20', text: 'text-slate-400', ring: 'ring-slate-500/40' },
    'Technical Issue': { bg: 'bg-rose-500/20', text: 'text-rose-400', ring: 'ring-rose-500/40' },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Employee Identity & Interactive Real-Time AUX Telemetry Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-500 transition-all"
              />
              <button 
                onClick={() => setShowProfileModal(true)}
                className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                currentAux === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30">
                  Staff Specialist
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {user?.title} • {user?.department}
              </p>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Manage Profile & Picture</span>
              </button>
            </div>
          </div>

          {/* Current Live AUX Badge & Ticking Duration */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 transition-colors">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Live Status Timer</p>
              <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatDuration(auxDurationSeconds)}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 ${auxColors[currentAux].bg} ${auxColors[currentAux].text}`}>
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{currentAux}</span>
            </div>
          </div>
        </div>

        {/* Real-time AUX Quick Switch Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Change Your Working AUX Status</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {(['Available', 'Break', 'Lunch', 'Meeting', 'Training', 'Wrap Up', 'Technical Issue'] as AuxStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleAuxClick(st)}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  currentAux === st
                    ? `${auxColors[st].bg} ${auxColors[st].text} ring-1 ${auxColors[st].ring} font-bold shadow-xs`
                    : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {st === 'Available' && <Laptop className="w-3.5 h-3.5" />}
                {st === 'Break' && <Coffee className="w-3.5 h-3.5" />}
                {st === 'Lunch' && <Coffee className="w-3.5 h-3.5" />}
                {st === 'Meeting' && <Users className="w-3.5 h-3.5" />}
                {st === 'Training' && <TrendingUp className="w-3.5 h-3.5" />}
                {st === 'Wrap Up' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {st === 'Technical Issue' && <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{st}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Collaboration Launcher Bar - Dynamic to Employee Permissions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              My Allowed Workspace Apps ({userModules.length} Active)
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Live Real-time Synced</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {isAllowed('mail') && (
              <button
                type="button"
                onClick={() => setActiveScreen('mail')}
                className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/25 transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition truncate">Outlook Mail</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{unreadEmailCount > 0 ? `${unreadEmailCount} Unread` : 'Inbox'}</p>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            )}

            {isAllowed('calendar') && (
              <button
                type="button"
                onClick={() => setActiveScreen('calendar')}
                className="p-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">Calendar</p>
                    <p className="text-[9px] text-slate-400 truncate">Events & Sync</p>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            )}

            {isAllowed('meetings') && (
              <button
                type="button"
                onClick={() => setActiveScreen('meetings')}
                className="p-2.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-purple-300 transition truncate">Video Rooms</p>
                    <p className="text-[9px] text-slate-400 truncate">Live Calls</p>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-purple-400 group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            )}

            {isAllowed('chat') && (
              <button
                type="button"
                onClick={() => setActiveScreen('chat')}
                className="p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition truncate">Messenger</p>
                    <p className="text-[9px] text-slate-400 truncate">Team Channels</p>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            )}

            {isAllowed('sheets') && (
              <button
                type="button"
                onClick={() => setActiveScreen('sheets')}
                className="p-2.5 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-teal-300 transition truncate">Sheets</p>
                    <p className="text-[9px] text-slate-400 truncate">Workbooks</p>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-teal-400 group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            )}

            {isAllowed('tasks') && (
              <button
                type="button"
                onClick={() => setActiveScreen('tasks')}
                className="p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">Sprint Board</p>
                    <p className="text-[9px] text-slate-400 truncate">{taskCount} Tasks</p>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Punch Clock + My Tasks + Leave Status */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Geofenced Attendance Punch Card */}
          {isAllowed('attendance') ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Daily Punch Clock & Geofence</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Record check-in and check-out times</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  userAttendanceToday ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                }`}>
                  {userAttendanceToday ? 'Checked In' : 'Not Checked In'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Shift Date</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Punch In Time</p>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1">{userAttendanceToday?.checkIn || '--:--'}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Punch Out Time</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{userAttendanceToday?.checkOut || '--:--'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                <div className="w-full sm:w-auto flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-300 transition-colors">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <select
                    value={clockLocation}
                    onChange={(e: any) => setClockLocation(e.target.value)}
                    className="bg-transparent text-slate-900 dark:text-white focus:outline-hidden w-full cursor-pointer"
                  >
                    <option value="Office" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Office (HQ San Francisco)</option>
                    <option value="Remote" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Remote (Home / Travel)</option>
                    <option value="Client Site" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Client On-Site Deployment</option>
                  </select>
                </div>

                {!userAttendanceToday ? (
                  <button
                    type="button"
                    onClick={handleClockIn}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    {cameraActive ? <Camera className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>{cameraActive ? 'Validating Selfie...' : 'Punch In Now'}</span>
                  </button>
                ) : !userAttendanceToday.checkOut ? (
                  <button
                    type="button"
                    onClick={handleClockOut}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Punch Out Shift</span>
                  </button>
                ) : (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Shift Completed Today</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs transition-colors">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Attendance punch-in module is managed or scheduled centrally by your supervisor.</span>
            </div>
          )}

          {/* My Assigned Tasks & Sprint Board */}
          {isAllowed('tasks') ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/60">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">My Assigned Sprint Tasks</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{taskCount} active assignments</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveScreen('tasks')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Full Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {myTasks.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-500 transition-colors">
                    No tasks currently assigned to you.
                  </div>
                ) : (
                  myTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            t.priority === 'Urgent' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30' :
                            t.priority === 'High' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {t.priority}
                          </span>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{t.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{t.projectName}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <select
                          value={t.status}
                          onChange={(e: any) => updateTaskStatus(t.id, e.target.value)}
                          className={`text-[11px] font-semibold py-1 px-2.5 rounded-lg border focus:outline-hidden transition-colors ${
                            t.status === 'Done' ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300' :
                            t.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300' :
                            t.status === 'Review' ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300' :
                            'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <option value="Todo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Todo</option>
                          <option value="In Progress" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">In Progress</option>
                          <option value="Review" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Review</option>
                          <option value="Done" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Done</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs transition-colors shadow-xl">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Sprint Task assignments are restricted or managed via your department lead.</span>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Leaves, Payslips & Expenses */}
        <div className="lg:col-span-5 space-y-6">
          {/* Leaves & PTO Balance */}
          {isAllowed('leaves') && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Leave Balance & Requests</h2>
                    <p className="text-xs text-slate-400">{user?.leavesBalance || 16} days remaining</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Apply</span>
                </button>
              </div>

              <div className="space-y-2">
                {myLeaves.length === 0 ? (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                    No active leave requests.
                  </div>
                ) : (
                  myLeaves.map((l) => (
                    <div key={l.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{l.type} Leave ({l.days} {l.days === 1 ? 'day' : 'days'})</p>
                        <p className="text-[10px] text-slate-400">{l.startDate} to {l.endDate}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        l.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        l.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Payslips & Salary Records */}
          {isAllowed('payroll') && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Monthly Payslips</h2>
                    <p className="text-xs text-slate-400">Direct deposit & tax statement</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {myPayrolls.length === 0 ? (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                    Salary statements will appear here upon payroll processing.
                  </div>
                ) : (
                  myPayrolls.map((p) => (
                    <div key={p.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{p.month} {p.year} Payslip</p>
                        <p className="text-[10px] text-slate-400 font-mono">Net: ${(p.netSalary || 0).toLocaleString()} (Tax: ${p.tax})</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert(`Downloading Payslip for ${p.month} ${p.year} (Net: $${(p.netSalary || 0).toLocaleString()})`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>PDF</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Expense Claims */}
          {isAllowed('expenses') && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Expense Claims</h2>
                    <p className="text-xs text-slate-400">Reimbursement workflow • ${expenseTotal.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Claim</span>
                </button>
              </div>

              <div className="space-y-2">
                {myExpenses.length === 0 ? (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                    No expense claims submitted.
                  </div>
                ) : (
                  myExpenses.map((exp) => (
                    <div key={exp.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{exp.title}</p>
                        <p className="text-[10px] text-slate-400">${exp.amount} • {exp.category}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        exp.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        exp.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {exp.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AUX Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Switch AUX to: {pendingAux}</h3>
            <p className="text-xs text-slate-400">
              Your AUX status change will be logged in real-time on the supervisor adherence monitor.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-semibold">Status Reason / Task Note (Optional)</label>
              <input
                type="text"
                value={auxReason}
                onChange={(e) => setAuxReason(e.target.value)}
                placeholder="e.g. Scheduled lunch break, design review..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAuxChange}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                Confirm & Log Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <form onSubmit={handleApplyLeave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Apply for Time Off</h3>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e: any) => setLeaveType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-purple-500"
              >
                <option value="Annual">Annual / Vacation Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Maternity">Maternity / Parental Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Start Date</label>
                <input
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">End Date</label>
                <input
                  type="date"
                  required
                  value={leaveEnd}
                  onChange={(e) => setLeaveEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Reason</label>
              <textarea
                required
                rows={3}
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Describe your leave reason..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer shadow-md"
              >
                Submit Leave Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateExpense} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Submit Expense Claim</h3>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Title / Description</label>
              <input
                type="text"
                required
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="e.g. Travel tickets, client lunch..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e: any) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden"
                >
                  <option value="Meals">Meals</option>
                  <option value="Travel">Travel</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Notes / Receipt Ref</label>
              <textarea
                rows={2}
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                placeholder="Optional notes or receipt attachment reference..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer shadow-md"
              >
                Submit Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit My Profile */}
      {showProfileModal && (
        <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="Edit My Profile & Professional Details">
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors">
              <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Profile Picture</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Local upload or URL</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  <img
                    src={editAvatar}
                    alt="Avatar preview"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const result = await uploadFile(file, { category: 'Profile Photos', description: 'Updated profile avatar' });
                          setEditAvatar(result.url);
                        } catch (err) {
                          alert('Failed to upload image. Please try again.');
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[9px] text-slate-400">Click the icon to browse device, or paste a URL above.</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Contact Phone Number</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+1 (555) 000-1234"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Core Skills & Expertise (comma separated)</label>
              <input
                type="text"
                value={editSkills}
                onChange={(e) => setEditSkills(e.target.value)}
                placeholder="TypeScript, React, Cloud Architecture"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Professional Biography</label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Brief professional summary..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 resize-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
