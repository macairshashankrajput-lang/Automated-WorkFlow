import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { EmployeePerformanceData } from '../types';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Send, 
  Star, 
  Edit3, 
  UserCheck, 
  Eye, 
  Zap, 
  ShieldAlert, 
  Monitor, 
  Flame, 
  Award,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const EmployeeTrackingScreen: React.FC = () => {
  const { user } = useAuth();
  const { 
    performanceRecords, 
    updatePerformanceRecord, 
    activityLogs, 
    logEmployeeActivity, 
    employees,
    setActiveScreen 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformanceData | null>(null);
  
  // Modals
  const [reviewModalRecord, setReviewModalRecord] = useState<EmployeePerformanceData | null>(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [scoreInput, setScoreInput] = useState(90);
  const [notesInput, setNotesInput] = useState('');
  
  const [nudgeModalRecord, setNudgeModalRecord] = useState<EmployeePerformanceData | null>(null);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [nudgeSuccess, setNudgeSuccess] = useState(false);

  const [dossierRecord, setDossierRecord] = useState<EmployeePerformanceData | null>(null);

  // Departments list for filter
  const departments = useMemo(() => {
    const set = new Set(performanceRecords.map(r => r.department).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [performanceRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return performanceRecords.filter(rec => {
      if (!rec) return false;
      const s = (searchQuery || '').toLowerCase();
      const name = (rec.employeeName || '').toLowerCase();
      const pos = (rec.position || '').toLowerCase();
      const dept = (rec.department || '').toLowerCase();
      const app = (rec.currentActiveApp || '').toLowerCase();
      const matchSearch = !s || name.includes(s) || pos.includes(s) || dept.includes(s) || app.includes(s);
      const matchDept = departmentFilter === 'All' || rec.department === departmentFilter;
      const matchStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && rec.activeWindowStatus === 'Active') ||
                          (statusFilter === 'In Call' && rec.activeWindowStatus === 'In Call') ||
                          (statusFilter === 'Break' && rec.activeWindowStatus === 'Break') ||
                          (statusFilter === 'Idle' && (rec.activeWindowStatus === 'Idle' || (rec.idleMinutes ?? 0) > 5));
      return matchSearch && matchDept && matchStatus;
    });
  }, [performanceRecords, searchQuery, departmentFilter, statusFilter]);

  // Fleet Statistics
  const stats = useMemo(() => {
    const total = performanceRecords.length;
    const active = performanceRecords.filter(r => r.activeWindowStatus === 'Active' || r.activeWindowStatus === 'In Call').length;
    const onBreak = performanceRecords.filter(r => r.activeWindowStatus === 'Break').length;
    const idleAlerts = performanceRecords.filter(r => (r.idleMinutes ?? 0) > 5 || r.activeWindowStatus === 'Idle').length;
    
    const avgScore = total > 0 
      ? Math.round(performanceRecords.reduce((acc, r) => acc + (r.productivityScore ?? 0), 0) / total) 
      : 0;
    
    const avgHours = total > 0 
      ? (performanceRecords.reduce((acc, r) => acc + (r.activeHoursToday ?? 0), 0) / total).toFixed(1)
      : '0.0';

    const avgOnTime = total > 0 
      ? Math.round(performanceRecords.reduce((acc, r) => acc + (r.onTimeDeliveryRate ?? 0), 0) / total)
      : 0;

    return { total, active, onBreak, idleAlerts, avgScore, avgHours, avgOnTime };
  }, [performanceRecords]);

  // Open Edit Review
  const handleOpenReview = (rec: EmployeePerformanceData) => {
    setReviewModalRecord(rec);
    setScoreInput(rec.productivityScore ?? 85);
    const emp = employees.find(e => e.id === rec.employeeId || e.employeeId === rec.employeeId);
    setRatingInput(emp?.performanceRating || 4.5);
    setNotesInput(rec.managerNotes || '');
  };

  const handleSaveReview = async () => {
    if (!reviewModalRecord) return;
    await updatePerformanceRecord(reviewModalRecord.employeeId, {
      productivityScore: scoreInput,
      managerNotes: notesInput,
      lastUpdated: 'Just now'
    });
    logEmployeeActivity({
      employeeId: reviewModalRecord.employeeId,
      employeeName: reviewModalRecord.employeeName,
      activityType: 'Task Completed',
      details: `Manager Performance Review updated by ${user?.name || 'Supervisor'}: Score ${scoreInput}%`,
      impactScore: 90
    });
    setReviewModalRecord(null);
  };

  // Open Nudge
  const handleOpenNudge = (rec: EmployeePerformanceData) => {
    setNudgeModalRecord(rec);
    setNudgeMessage(`Hi ${(rec.employeeName || 'Team Member').split(' ')[0]}, quick reminder to sync on sprint deliverables.`);
    setNudgeSuccess(false);
  };

  const handleSendNudge = () => {
    if (!nudgeModalRecord || !nudgeMessage) return;
    logEmployeeActivity({
      employeeId: nudgeModalRecord.employeeId,
      employeeName: nudgeModalRecord.employeeName,
      activityType: 'Status Changed',
      details: `Live Supervisor Nudge sent to ${nudgeModalRecord.employeeName}: "${nudgeMessage}"`,
      impactScore: 75
    });
    setNudgeSuccess(true);
    setTimeout(() => {
      setNudgeSuccess(false);
      setNudgeModalRecord(null);
    }, 1200);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Position', 'Status', 'Productivity Score', 'Hours Today', 'Tasks Completed', 'On-Time Rate %', 'Active App', 'Idle Mins', 'Notes'];
    const rows = performanceRecords.map(r => [
      r.employeeId,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      `"${r.position}"`,
      r.activeWindowStatus,
      r.productivityScore,
      r.activeHoursToday,
      r.tasksCompletedWeek,
      r.onTimeDeliveryRate,
      `"${r.currentActiveApp}"`,
      r.idleMinutes,
      `"${r.managerNotes || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vernika_Employee_Performance_Telemetry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12" id="employee-tracking-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <Activity className="w-6 h-6" />
              </span>
              Workforce Performance & Live Status Tracking
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time active window telemetry, employee productivity index, hourly intensity heatmaps, and supervisor coaching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('sheets')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title="Open Vernika Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Vernika Sheets
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Telemetry Log
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Live Active Fleet</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ {stats.total} total staff</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {Math.round((stats.active / (stats.total || 1)) * 100)}% active duty right now
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Productivity Score</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgScore}%</span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
              <Flame className="w-3.5 h-3.5 mr-0.5" /> High Output
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Target benchmark: &gt;85% output adherence
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Active Logged Today</span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgHours}h</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ 8.0h shift</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Shift pacing:</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">{Math.round((Number(stats.avgHours) / 8.0) * 100)}%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">On-Time Velocity & Adherence</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgOnTime}%</span>
            {stats.idleAlerts > 0 ? (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                <AlertTriangle className="w-3 h-3" /> {stats.idleAlerts} Idle Alert{stats.idleAlerts > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                All Pacing
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Sprint deliveries & AUX adherence rate
          </div>
        </div>
      </div>

      {/* Main Grid: Employee Telemetry Table + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Employee Roster & Intensity Monitor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by employee, department, active app..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d} value={d} className="dark:bg-slate-800">Dept: {d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden cursor-pointer"
                >
                  <option value="All" className="dark:bg-slate-800">Status: All</option>
                  <option value="Active" className="dark:bg-slate-800">Active / In Call</option>
                  <option value="Break" className="dark:bg-slate-800">On Break</option>
                  <option value="Idle" className="dark:bg-slate-800">Idle &gt; 5m</option>
                </select>
              </div>
            </div>
          </div>

          {/* Employee Cards List */}
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No telemetry records match filter</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try clearing search filters or changing department criteria.</p>
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const isOnline = rec.activeWindowStatus === 'Active' || rec.activeWindowStatus === 'In Call';
                const isIdle = (rec.idleMinutes ?? 0) > 5 || rec.activeWindowStatus === 'Idle';
                const hoursPercent = Math.min(100, Math.round(((rec.activeHoursToday ?? 0) / (rec.targetHoursToday || 8)) * 100));

                return (
                  <div
                    key={rec.employeeId}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <img
                            src={rec.avatar}
                            alt={rec.employeeName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                            referrerPolicy="no-referrer"
                          />
                          <span 
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                              isOnline ? 'bg-emerald-500 animate-pulse' :
                              rec.activeWindowStatus === 'Break' ? 'bg-amber-500' :
                              'bg-slate-400'
                            }`}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{rec.employeeName}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {rec.department}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{rec.position}</p>
                        </div>
                      </div>

                      {/* Status and Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${
                          isOnline ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                          rec.activeWindowStatus === 'Break' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                          'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          {rec.activeWindowStatus}
                          {isIdle && <span className="text-rose-600 dark:text-rose-400 font-bold ml-1">({rec.idleMinutes}m idle)</span>}
                        </span>

                        <button
                          onClick={() => handleOpenNudge(rec)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          title="Nudge Employee"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenReview(rec)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/50 hover:text-purple-600 dark:hover:text-purple-400 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          title="Coach & Review"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDossierRecord(rec)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          title="View Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Active Window & Live Workspace */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Active Workspace:</span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[280px]">
                          {rec.currentActiveApp}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Telemetry ping: <span className="font-medium text-slate-700 dark:text-slate-300">{rec.lastUpdated}</span>
                      </div>
                    </div>

                    {/* Hourly Activity Intensity Sparkline / Heatmap */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Hourly Interaction Intensity (9 AM - 6 PM)
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Productivity Score: <span className="text-blue-600 dark:text-blue-400">{rec.productivityScore}%</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-10 gap-1.5 h-7">
                        {(rec.activityHeatmap || []).map((val: number, idx: number) => {
                          const hour = 9 + idx;
                          const hourLabel = hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                          return (
                            <div
                              key={idx}
                              title={`${hourLabel}: ${val}% activity intensity`}
                              className="relative group rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-end"
                            >
                              <div
                                style={{ height: `${val}%` }}
                                className={`w-full transition-all rounded-b-md ${
                                  val >= 90 ? 'bg-emerald-500' :
                                  val >= 75 ? 'bg-blue-500' :
                                  val >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                                }`}
                              />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-slate-900/80 text-[10px] text-white flex items-center justify-center pointer-events-none transition">
                                {val}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        <span>9:00 AM</span>
                        <span>1:00 PM</span>
                        <span>6:00 PM</span>
                      </div>
                    </div>

                    {/* Footer Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Logged Active Hours</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-slate-900 dark:text-white">{rec.activeHoursToday}h</span>
                          <span className="text-slate-400 dark:text-slate-500">/ {rec.targetHoursToday}h</span>
                          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ml-1">
                            <div
                              style={{ width: `${hoursPercent}%` }}
                              className={`h-full ${hoursPercent >= 90 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Sprint Tasks Closed</span>
                        <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                          {rec.tasksCompletedWeek} <span className="font-normal text-slate-400 dark:text-slate-500">/ {rec.tasksAssignedWeek} total</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[11px]">On-Time Delivery</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                          {rec.onTimeDeliveryRate}% adherence
                        </span>
                      </div>
                    </div>

                    {/* Manager coaching note if present */}
                    {rec.managerNotes && (
                      <div className="text-xs p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60 text-purple-900 dark:text-purple-300 flex items-start gap-2">
                        <Award className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-purple-950 dark:text-purple-200">Manager Note: </span>
                          {rec.managerNotes}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Real-time Live Activity Audit Stream & Quick Actions */}
        <div className="space-y-6">
          {/* Supervisor Control Panel */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Live Supervisor Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (filteredRecords.length > 0) handleOpenNudge(filteredRecords[0]);
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200/80 dark:border-slate-700/80 transition flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Broadcast Team Sprint Reminder</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveScreen('sheets')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 border border-slate-200/80 dark:border-slate-700/80 transition flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Open Staff Performance OKR Sheet</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveScreen('aux_status')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-900/40 border border-slate-200/80 dark:border-slate-700/80 transition flex items-center justify-between text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>View Full AUX Telemetry Roster</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin-slow" />
                Live Fleet Activity Stream
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">Auto-syncing</span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {activityLogs.map((log) => {
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5 transition hover:bg-slate-100/70 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{log.employeeName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {log.details}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {log.activityType}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <Zap className="w-3 h-3" /> Impact +{log.impactScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Review Modal */}
      {reviewModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Coach & Review Employee</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{reviewModalRecord.employeeName} ({reviewModalRecord.position})</p>
                </div>
              </div>
              <button onClick={() => setReviewModalRecord(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Productivity Score Index (0 - 100%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={scoreInput}
                    onChange={(e) => setScoreInput(Number(e.target.value))}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-base font-bold text-blue-600 dark:text-blue-400 w-12 text-right">{scoreInput}%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Performance Star Rating (1 - 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingInput(star)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= ratingInput ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-2">{ratingInput}.0 / 5.0</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Supervisor Coaching Notes & OKR Feedback
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="E.g., Great velocity this sprint; recommend documenting sheet models for client handoff."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setReviewModalRecord(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReview}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
              >
                Save Review to DB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nudge Modal */}
      {nudgeModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Send Live Nudge</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{nudgeModalRecord.employeeName}</p>
                </div>
              </div>
              <button onClick={() => setNudgeModalRecord(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {nudgeSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-center text-emerald-800 dark:text-emerald-300 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <p className="text-sm font-bold">Nudge Dispatched</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Notification delivered to employee's workspace.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Direct Supervisor Message
                  </label>
                  <textarea
                    rows={3}
                    value={nudgeMessage}
                    onChange={(e) => setNudgeMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setNudgeModalRecord(null)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendNudge}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                  >
                    Send Instant Nudge
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Detailed Dossier Modal */}
      {dossierRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <img
                  src={dossierRecord.avatar}
                  alt={dossierRecord.employeeName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{dossierRecord.employeeName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{dossierRecord.position} • {dossierRecord.department}</p>
                </div>
              </div>
              <button onClick={() => setDossierRecord(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block">Current Status</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{dossierRecord.activeWindowStatus}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block">Productivity Index</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">{dossierRecord.productivityScore}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block">Active Hours Logged</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">{dossierRecord.activeHoursToday}h / 8.0h</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block">On-Time Velocity</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{dossierRecord.onTimeDeliveryRate}%</span>
              </div>
            </div>

            {/* Active app and telemetry */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Current Focused Window:</span>
              <p className="text-slate-900 dark:text-white font-medium">{dossierRecord.currentActiveApp}</p>
            </div>

            {/* Manager notes */}
            {dossierRecord.managerNotes && (
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800 text-xs space-y-1">
                <span className="font-semibold text-purple-950 dark:text-purple-300">Manager Coaching Log:</span>
                <p className="text-purple-900 dark:text-purple-200">{dossierRecord.managerNotes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setDossierRecord(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default EmployeeTrackingScreen;
