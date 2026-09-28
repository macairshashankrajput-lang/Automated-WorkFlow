import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Coffee, 
  Laptop, 
  Download, 
  RefreshCw,
  Sliders,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AuxStatus, Employee } from '../types';

export const AuxStatusScreen: React.FC = () => {
  const { employees, auxLogs, updateEmployeeAuxStatus, logAuxChange } = useApp();
  const { role, user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'live_monitor' | 'audit_logs'>('live_monitor');

  // Override Modal for Admin
  const [overrideEmp, setOverrideEmp] = useState<Employee | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<AuxStatus>('Available');
  const [overrideReason, setOverrideReason] = useState('');

  // Access Control: Admin has full supervisory control; other roles have live read-only telemetry oversight
  const canOverride = role === 'admin';

  const statusColors: Record<AuxStatus, { bg: string; text: string; dot: string }> = {
    'Available': { bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    'In Call': { bg: 'bg-cyan-50 dark:bg-cyan-500/15', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500' },
    'Short Break': { bg: 'bg-yellow-50 dark:bg-yellow-500/15', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
    'Break': { bg: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    'Lunch': { bg: 'bg-orange-50 dark:bg-orange-500/15', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
    'Meeting': { bg: 'bg-purple-50 dark:bg-purple-500/15', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
    'Training': { bg: 'bg-blue-50 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    'Wrap Up': { bg: 'bg-indigo-50 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
    'Offline': { bg: 'bg-slate-100 dark:bg-slate-500/15', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-500' },
    'Technical Issue': { bg: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
  };

  // Metrics across all employees
  const totalEmployees = employees.length;
  const availableCount = employees.filter((e) => (e?.auxStatus || 'Available') === 'Available').length;
  const breakCount = employees.filter((e) => e?.auxStatus === 'Break' || e?.auxStatus === 'Lunch').length;
  const meetingCount = employees.filter((e) => e?.auxStatus === 'Meeting' || e?.auxStatus === 'Training').length;
  const availabilityRate = totalEmployees > 0 ? Math.round((availableCount / totalEmployees) * 100) : 100;

  // Filter Live Staff
  const filteredEmployees = employees.filter((emp) => {
    if (!emp) return false;
    const s = (search || '').toLowerCase();
    const name = (emp.name || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const empId = (emp.employeeId || '').toLowerCase();
    const pos = (emp.position || '').toLowerCase();
    const matchesSearch = !s || name.includes(s) || dept.includes(s) || empId.includes(s) || pos.includes(s);
    const matchesStatus = selectedStatus === 'all' || (emp.auxStatus || 'Available') === selectedStatus;
    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    return matchesSearch && matchesStatus && matchesDept;
  });

  // Filter Logs
  const filteredLogs = auxLogs.filter((log) => {
    if (!log) return false;
    const s = (search || '').toLowerCase();
    const empName = (log.employeeName || '').toLowerCase();
    const empId = (log.employeeId || '').toLowerCase();
    const reason = (log.reason || '').toLowerCase();
    const matchesSearch = !s || empName.includes(s) || empId.includes(s) || reason.includes(s);
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesDept = selectedDept === 'all' || log.department === selectedDept;
    return matchesSearch && matchesStatus && matchesDept;
  });

  const handleOpenOverride = (emp: Employee) => {
    setOverrideEmp(emp);
    setOverrideStatus((emp.auxStatus as AuxStatus) || 'Available');
    setOverrideReason(`Supervisory override by ${user?.name || 'Administrator'}`);
  };

  const handleConfirmOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideEmp) return;
    if (!window.confirm(`Confirm changing ${overrideEmp.name}'s AUX status to ${overrideStatus}?`)) return;
    await updateEmployeeAuxStatus(overrideEmp.id, overrideStatus, overrideReason);
    setOverrideEmp(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Multi-User AUX Telemetry & Live Staff Adherence</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time Sync Active</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Live supervisory monitor displaying company-wide staff auxiliary states, duration timers, and multi-user audit logs.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('live_monitor')}
            className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'live_monitor' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Staff Telemetry ({employees.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit_logs')}
            className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit_logs' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>All Multi-User Logs ({auxLogs.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Telemetry Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Available & Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{availableCount} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">/ {totalEmployees} staff</span></p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Ready for queues & sprints</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">On Break / Lunch</span>
            <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">{breakCount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Scheduled rest periods</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Meetings & Training</span>
            <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 font-mono">{meetingCount}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Synced with calendars</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Floor Adherence</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{availabilityRate}%</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">Optimal operational band</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, ID, reason..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All AUX States</option>
            <option value="Available">Available</option>
            <option value="Break">Break</option>
            <option value="Lunch">Lunch</option>
            <option value="Meeting">Meeting</option>
            <option value="Training">Training</option>
            <option value="Wrap Up">Wrap Up</option>
            <option value="Technical Issue">Technical Issue</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Departments</option>
            <option value="Engineering & Technology">Engineering</option>
            <option value="Product & Design">Product</option>
            <option value="Sales & Business Dev">Sales</option>
            <option value="Marketing & Growth">Marketing</option>
            <option value="Human Resources">HR</option>
            <option value="Finance & Operations">Finance</option>
          </select>
        </div>
      </div>

      {/* View 1: Live Staff Telemetry Grid */}
      {activeTab === 'live_monitor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const currentStatus = (emp.auxStatus as AuxStatus) || 'Available';
            const color = statusColors[currentStatus] || statusColors['Available'];
            return (
              <div
                key={emp.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 rounded-3xl p-5 shadow-xs transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                      />
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${color.dot}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{emp.position}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{emp.employeeId} • {emp.department}</p>
                    </div>
                  </div>

                  <div className={`px-2.5 py-1 rounded-xl font-bold text-[10px] uppercase flex items-center gap-1.5 ${color.bg} ${color.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                    <span>{currentStatus}</span>
                  </div>
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Status Started</p>
                    <p className="font-semibold text-slate-900 dark:text-white font-mono mt-0.5">{emp.auxStartTime || '09:00 AM'}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Adherence Score</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{emp.auxAdherenceScore || 98}%</p>
                  </div>
                </div>

                {/* Admin Status Override Action */}
                {role === 'admin' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Supervisory Controls</span>
                    <button
                      type="button"
                      onClick={() => handleOpenOverride(emp)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Sliders className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span>Override Status</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View 2: All Multi-User Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Live Multi-User Auxiliary Audit Stream</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">All status transitions across every employee in real-time</p>
            </div>
            <button
              type="button"
              onClick={() => alert(`Exported ${filteredLogs.length} AUX logs to CSV format.`)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Audit CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">AUX Status</th>
                  <th className="py-3 px-4">Logged Time</th>
                  <th className="py-3 px-4">Reason / Activity Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredLogs.map((log) => {
                  const color = statusColors[log.status as AuxStatus] || statusColors['Available'];
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {log.avatar ? (
                            <img src={log.avatar} alt={log.employeeName} className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-white text-[10px]">
                              {log.employeeName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{log.employeeName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{log.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{log.department || 'Operations'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${color.bg} ${color.text}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {log.startTime || new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {log.reason || 'General shift work'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Status Override Modal */}
      {overrideEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form onSubmit={handleConfirmOverride} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Override Status for {overrideEmp.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              As an Administrator, you can update this staff member's active auxiliary state. This will update both their live session and the audit telemetry.
            </p>

            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Select New AUX Status</label>
              <select
                value={overrideStatus}
                onChange={(e: any) => setOverrideStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Available">Available (Floor Ready)</option>
                <option value="Break">Break (15 Min Rest)</option>
                <option value="Lunch">Lunch (Meal Period)</option>
                <option value="Meeting">Meeting (Team Sync)</option>
                <option value="Training">Training (Coaching Session)</option>
                <option value="Wrap Up">Wrap Up (End of Shift)</option>
                <option value="Technical Issue">Technical Issue (System Downtime)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Override Reason Note</label>
              <input
                type="text"
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for administrative override..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOverrideEmp(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md shadow-emerald-600/30"
              >
                Confirm Override
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
