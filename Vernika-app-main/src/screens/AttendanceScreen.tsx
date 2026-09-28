import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Square,
  Search,
  Filter,
  Users,
  Timer,
  RotateCcw,
  Plus,
  FileCheck,
  CheckCircle2,
  Edit2,
  CalendarDays,
  MapPin,
  Save,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord, PunchCorrectionRequest } from '../types';
import { Badge } from '../components/common/Badge';
import { formatLocalizedDateTime } from '../utils/security';

export const AttendanceScreen: React.FC = () => {
  const {
    attendance,
    employees,
    markAttendance,
    updateAttendanceRecord,
    cancelAccidentalPunchOut,
    punchRequests,
    submitPunchRequest,
    reviewPunchRequest
  } = useApp();
  const { user, role } = useAuth();

  const [activeTab, setActiveTab] = useState<'timecard' | 'requests' | 'monthly_view'>('timecard');
  const [filterMonth, setFilterMonth] = useState('2026-03');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('all');

  // Accidental Punch-Out Reversal confirmation alert
  const [reversalSuccess, setReversalSuccess] = useState(false);

  // Punch Regularization Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    date: new Date().toISOString().split('T')[0],
    requestType: 'Missed Punch In' as PunchCorrectionRequest['requestType'],
    requestedCheckIn: '09:00 AM',
    requestedCheckOut: '06:00 PM',
    reason: ''
  });

  // Admin Review Modal / State
  const [reviewingReq, setReviewingReq] = useState<PunchCorrectionRequest | null>(null);
  const [adminReviewNotes, setAdminReviewNotes] = useState('');

  // Admin Inline Edit Attendance Record
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Check if current user checked in today
  const todayStr = new Date().toISOString().split('T')[0];
  const myRecordToday = attendance.find(
    (a) => (a.employeeName === user?.name || a.employeeId === user?.id) && a.date === todayStr
  );

  const handlePunchIn = () => {
    if (!user) return;

    markAttendance({
      employeeId: user.id,
      employeeName: user.name,
      date: todayStr,
      checkIn: 'now',
      checkOut: '-',
      hoursWorked: 0,
      overtime: 0,
      status: 'Present',
      notes: 'Punched in via Vernika Cloud Biometrics',
      workLocation: 'Office'
    });
  };

  const handlePunchOut = () => {
    if (!myRecordToday) return;

    markAttendance({
      ...myRecordToday,
      checkOut: 'now',
      hoursWorked: 9,
      overtime: 1,
      notes: 'Shift completed and authenticated',
    });
  };

  const handleCancelAccidentalPunchOut = async () => {
    if (!myRecordToday) return;
    await cancelAccidentalPunchOut(myRecordToday.id);
    setReversalSuccess(true);
    setTimeout(() => setReversalSuccess(false), 4000);
  };

  const handleSubmitRegularization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await submitPunchRequest({
      employeeId: user.id,
      employeeName: user.name,
      department: user.department || 'General',
      date: newRequest.date,
      requestType: newRequest.requestType,
      requestedCheckIn: newRequest.requestedCheckIn,
      requestedCheckOut: newRequest.requestedCheckOut,
      reason: newRequest.reason
    });
    setIsRequestModalOpen(false);
    setNewRequest({
      date: new Date().toISOString().split('T')[0],
      requestType: 'Missed Punch In',
      requestedCheckIn: '09:00 AM',
      requestedCheckOut: '06:00 PM',
      reason: ''
    });
  };

  const handleApproveReject = async (status: 'Approved' | 'Rejected') => {
    if (!reviewingReq) return;
    await reviewPunchRequest(reviewingReq.id, status, adminReviewNotes, user?.name || 'Administrator');
    setReviewingReq(null);
    setAdminReviewNotes('');
  };

  const handleSaveAttendanceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    await updateAttendanceRecord(editingRecord.id, editingRecord);
    setEditingRecord(null);
  };

  const filteredAttendance = attendance.filter((rec) => {
    if (!rec) return false;
    const s = (search || '').toLowerCase();
    const eName = (rec.employeeName || '').toLowerCase();
    const matchesSearch = !s || eName.includes(s);
    const matchesStatus = filterStatus === 'all' || rec.status === filterStatus;
    const matchesEmployee = selectedEmpFilter === 'all' || rec.employeeId === selectedEmpFilter || rec.employeeName === selectedEmpFilter;
    const matchesRole = role === 'admin' ? true : (rec.employeeName === user?.name || rec.employeeId === user?.id);
    const matchesMonth = !filterMonth || (rec.date || '').startsWith(filterMonth);
    return matchesSearch && matchesStatus && matchesEmployee && matchesRole && matchesMonth;
  });

  const pendingRequestsCount = punchRequests.filter((r) => r.status === 'Pending').length;

  const presentCount = attendance.filter((a) => a.date === todayStr && a.status === 'Present').length;
  const lateCount = attendance.filter((a) => a.date === todayStr && a.status === 'Late').length;
  const totalEmployeesCount = employees.length || 1;

  return (
    <div className="space-y-6 pb-12 text-slate-900 dark:text-slate-100" id="attendance-screen">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Attendance, Biometrics & Timecard Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Real-Time Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Shift tracking, biometric punch logs, overtime hours, and punch regularization requests.
            </p>
          </div>
        </div>

        {/* Punch In / Out Actions & Accidental Logout Protection */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Regularization Request</span>
          </button>

          {!myRecordToday ? (
            <button
              onClick={handlePunchIn}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Punch In for Shift</span>
            </button>
          ) : myRecordToday.checkOut === '-' ? (
            <button
              onClick={handlePunchOut}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer"
            >
              <Square className="w-4 h-4" />
              <span>Punch Out (Active since {myRecordToday.checkIn.includes('T') ? formatLocalizedDateTime(myRecordToday.checkIn) : myRecordToday.checkIn})</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Shift Complete ({myRecordToday.hoursWorked || 8} hrs)</span>
              </div>
              <button
                onClick={handleCancelAccidentalPunchOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold transition cursor-pointer"
                title="Accidentally logged out? Click to resume shift"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo Punch-Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {reversalSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Punch-Out reversed successfully! Your active shift session has been restored.
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('timecard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'timecard'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Daily Timecard & Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly_view')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'monthly_view'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Full Month Timecard Review</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Punch Regularization Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Present On Floor</p>
            <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-1">{presentCount || 1}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">Active shift logs</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Late Arrivals</p>
            <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{lateCount}</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">After grace window</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-800/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Punch Requests</p>
            <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">{pendingRequestsCount}</p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">Awaiting HR review</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/60">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TAB 1: Daily Timecard Table */}
      {activeTab === 'timecard' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter employee attendance..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {role === 'admin' && (
                <select
                  value={selectedEmpFilter}
                  onChange={(e) => setSelectedEmpFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Staff Members</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Half Day">Half Day</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">Overtime</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Status</th>
                  {role === 'admin' && <th className="py-3 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{rec.employeeName}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{rec.date}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-800 dark:text-emerald-400">{rec.checkIn?.includes('T') ? formatLocalizedDateTime(rec.checkIn) : rec.checkIn}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{rec.checkOut && rec.checkOut !== '-' ? (rec.checkOut.includes('T') ? formatLocalizedDateTime(rec.checkOut) : rec.checkOut) : '-'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{rec.totalHours || rec.hoursWorked || 8} hrs</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{(rec.overtime || 0) > 0 ? `+${rec.overtime} hrs` : '-'}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {rec.workLocation || 'Office'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={rec.status === 'Present' ? 'success' : rec.status === 'Late' ? 'warning' : 'danger'}>
                        {rec.status}
                      </Badge>
                    </td>
                    {role === 'admin' && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setEditingRecord(rec)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 transition cursor-pointer"
                          title="Edit Punch Log"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Full Month Timecard Review */}
      {activeTab === 'monthly_view' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                Employee Monthly Timecard Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit monthly cumulative shift hours, overtime calculations, and punch consistency.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              />

              {role === 'admin' && (
                <select
                  value={selectedEmpFilter}
                  onChange={(e) => setSelectedEmpFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <p className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Total Shift Days Logged</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{filteredAttendance.length}</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-400">Cumulative Hours Worked</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {filteredAttendance.reduce((acc, r) => acc + (Number(r.hoursWorked) || Number(r.totalHours) || 8), 0)} hrs
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
              <p className="text-[11px] font-bold uppercase text-purple-700 dark:text-purple-400">Total Overtime Hours</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {filteredAttendance.reduce((acc, r) => acc + (Number(r.overtime) || 0), 0)} hrs
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Punch Regularization Requests Review */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Punch Regularization & Correction Requests
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Staff requests for missed punches, biometric sensor errors, or field duties.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Correction Type</th>
                  <th className="py-3 px-4">Requested Punch</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  {role === 'admin' && <th className="py-3 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {punchRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No punch regularization requests submitted.
                    </td>
                  </tr>
                ) : (
                  punchRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{req.employeeName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.date}</td>
                      <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">{req.requestType}</td>
                      <td className="py-3 px-4 font-mono">
                        {req.requestedCheckIn} → {req.requestedCheckOut}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{req.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'Approved'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                            : req.status === 'Rejected'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      {role === 'admin' && (
                        <td className="py-3 px-4 text-center">
                          {req.status === 'Pending' ? (
                            <button
                              onClick={() => {
                                setReviewingReq(req);
                                setAdminReviewNotes('');
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs cursor-pointer"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Submit Regularization Request */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Raise Punch Regularization Request
              </h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRegularization} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Incident</label>
                <input
                  type="date"
                  value={newRequest.date}
                  onChange={(e) => setNewRequest({ ...newRequest, date: e.target.value })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Correction Category</label>
                <select
                  value={newRequest.requestType}
                  onChange={(e) => setNewRequest({ ...newRequest, requestType: e.target.value as any })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Missed Punch In">Missed Punch In</option>
                  <option value="Missed Punch Out">Missed Punch Out</option>
                  <option value="Wrong Clock-In Time">Wrong Clock-In Time</option>
                  <option value="On Duty / Client Visit">On Duty / Client Visit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Requested Check In</label>
                  <input
                    type="text"
                    value={newRequest.requestedCheckIn}
                    onChange={(e) => setNewRequest({ ...newRequest, requestedCheckIn: e.target.value })}
                    placeholder="09:00 AM"
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Requested Check Out</label>
                  <input
                    type="text"
                    value={newRequest.requestedCheckOut}
                    onChange={(e) => setNewRequest({ ...newRequest, requestedCheckOut: e.target.value })}
                    placeholder="06:00 PM"
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reason / Justification</label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  placeholder="Explain why punch was missed or wrong (e.g. biometric sensor glitch, client site arrival)..."
                  rows={3}
                  required
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Admin Review Request Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Review Regularization Request
              </h3>
              <button
                onClick={() => setReviewingReq(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <p>
                <strong>Employee:</strong> {reviewingReq.employeeName} ({reviewingReq.department})
              </p>
              <p>
                <strong>Date:</strong> {reviewingReq.date}
              </p>
              <p>
                <strong>Correction:</strong> {reviewingReq.requestType} ({reviewingReq.requestedCheckIn} → {reviewingReq.requestedCheckOut})
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Reason:</strong> "{reviewingReq.reason}"
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">HR / Reviewer Remarks</label>
              <textarea
                value={adminReviewNotes}
                onChange={(e) => setAdminReviewNotes(e.target.value)}
                placeholder="Optional notes or reasons for decision..."
                rows={2}
                className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleApproveReject('Rejected')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Reject Request
              </button>
              <button
                type="button"
                onClick={() => handleApproveReject('Approved')}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Approve & Update Punch Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Admin Edit Attendance Record Directly */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                Edit Attendance Record ({editingRecord.employeeName})
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAttendanceEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Check In</label>
                  <input
                    type="text"
                    value={editingRecord.checkIn}
                    onChange={(e) => setEditingRecord({ ...editingRecord, checkIn: e.target.value })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Check Out</label>
                  <input
                    type="text"
                    value={editingRecord.checkOut || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, checkOut: e.target.value })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Hours</label>
                  <input
                    type="number"
                    value={editingRecord.hoursWorked || editingRecord.totalHours || 8}
                    onChange={(e) => setEditingRecord({ ...editingRecord, hoursWorked: Number(e.target.value), totalHours: Number(e.target.value) })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={editingRecord.status}
                    onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value as any })}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
