import React, { useMemo, useState } from 'react';
import {
  Users,
  Clock,
  TrendingUp,
  FolderKanban,
  Receipt,
  CalendarCheck,
  ArrowUpRight,
  Sparkles,
  Plus,
  Megaphone,
  Radio,
  Activity,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { where } from 'firebase/firestore';
import { aggregateOrEmpty, useAggregateStats, usePaginatedQuery } from '../lib/useFirestoreReadModels';
import type { Announcement, AuxLog, Invoice } from '../types';

export const DashboardScreen: React.FC = () => {
  const { departments, setActiveScreen } = useApp();
  const { user, role } = useAuth();
  const [auxFilter, setAuxFilter] = useState<string>('All');
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const aggregateSpecs = useMemo(() => [
    { key: 'employees', collectionName: 'employees' },
    { key: 'todayAttendance', collectionName: 'attendance', constraints: [where('date', '==', today)] },
    { key: 'activeProjects', collectionName: 'projects', constraints: [where('status', '==', 'Active')] },
    { key: 'pipeline', collectionName: 'leads', sumFields: ['value'] },
    { key: 'invoices', collectionName: 'invoices', sumFields: ['total'] },
    { key: 'pendingLeaves', collectionName: 'leaves', constraints: [where('status', '==', 'Pending')] },
    { key: 'announcements', collectionName: 'announcements' },
  ], [today]);
  const { values: dashboardStats, loading: statsLoading } = useAggregateStats(
    aggregateSpecs,
    `admin-dashboard:${today}`,
    { enabled: role === 'admin', refreshIntervalMs: 60_000 },
  );

  const { items: recentAnnouncements } = usePaginatedQuery<Announcement>({
    collectionName: 'announcements',
    queryKey: 'admin-dashboard-announcements',
    pageSize: 6,
    enabled: role === 'admin',
  });
  const { items: recentInvoices } = usePaginatedQuery<Invoice>({
    collectionName: 'invoices',
    queryKey: 'admin-dashboard-invoices',
    pageSize: 12,
    enabled: role === 'admin',
  });
  const { items: recentAuxLogs } = usePaginatedQuery<AuxLog>({
    collectionName: 'auxLogs',
    queryKey: 'admin-dashboard-aux',
    pageSize: 64,
    enabled: role === 'admin',
  });

  const totalEmployees = aggregateOrEmpty(dashboardStats, 'employees').count;
  // Attendance documents are created on a punch, so today’s aggregate represents today’s recorded attendance.
  const presentToday = aggregateOrEmpty(dashboardStats, 'todayAttendance').count;
  const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
  const pipeline = aggregateOrEmpty(dashboardStats, 'pipeline', ['value']);
  const pipelineValue = pipeline.sums.value || 0;
  const activeProjectsCount = aggregateOrEmpty(dashboardStats, 'activeProjects').count;
  const pendingLeavesCount = aggregateOrEmpty(dashboardStats, 'pendingLeaves').count;
  const invoiceStats = aggregateOrEmpty(dashboardStats, 'invoices', ['total']);
  const totalInvoiced = invoiceStats.sums.total || 0;
  const announcementCount = aggregateOrEmpty(dashboardStats, 'announcements').count;
  const revenueData = recentInvoices.map((invoice, index) => ({
    month: invoice.date ? new Date(invoice.date).toLocaleDateString('en-US', { month: 'short' }) : `Invoice ${index + 1}`,
    revenue: Number(invoice.total ?? invoice.amount ?? invoice.subtotal ?? 0),
    invoices: Number(invoice.total ?? invoice.amount ?? invoice.subtotal ?? 0),
  }));
  const deptChartData = departments.map((department) => ({
    name: department.name || 'Unassigned',
    staff: Number(department.headCount ?? department.employeesCount ?? 0),
    budget: Number(department.budget || 0),
  }));

  const latestAuxByEmployee = new Map<string, AuxLog>();
  for (const log of recentAuxLogs) {
    const extra = log as AuxLog & Record<string, unknown>;
    const identity = String(log.employeeId || extra.firebaseUid || extra.employeeEmail || log.employeeName || log.id);
    const previous = latestAuxByEmployee.get(identity);
    const previousExtra = previous as (AuxLog & Record<string, unknown>) | undefined;
    const currentTime = Date.parse(String(log.timestamp || extra.updatedAt || extra.createdAt || '')) || 0;
    const previousTime = previous && previousExtra ? Date.parse(String(previous.timestamp || previousExtra.updatedAt || previousExtra.createdAt || '')) || 0 : -1;
    if (!previous || currentTime >= previousTime) latestAuxByEmployee.set(identity, log);
  }
  const filteredAuxLogs = Array.from(latestAuxByEmployee.values()).filter((log) => {
    if (auxFilter === 'All') return true;
    return (log.status || '').toLowerCase() === auxFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner - Executive White & Green Theme */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 backdrop-blur-xs">
              Vernika Cloud Executive Hub
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">• Session Authenticated</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl font-medium">
            {role === 'admin'
              ? 'Real-time overview of organization headcount, live AUX telemetry, active staff logins, and cash flow.'
              : 'View your daily attendance logs, active tasks, team channels, and company announcements.'}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => setActiveScreen('ai_assistant')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-purple-600/25 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-100" />
            <span>Launch AI Copilot</span>
          </button>
        </div>

        <div className="absolute right-0 top-0 w-96 h-full bg-linear-to-l from-emerald-500/5 dark:from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Staff</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{statsLoading ? '—' : totalEmployees}</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> {totalEmployees > 0 ? 'Live roster' : 'No staff onboarded yet'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Today's Attendance</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{statsLoading ? '—' : `${attendanceRate}%`}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{presentToday} of {totalEmployees} Present</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Projects</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/40">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{statsLoading ? '—' : activeProjectsCount}</div>
            <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">{activeProjectsCount > 0 ? `${activeProjectsCount} active` : 'No active projects'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">CRM Pipeline</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{statsLoading ? '—' : `$${(pipelineValue / 1000).toFixed(0)}k`}</div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{pipeline.count} qualified leads</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Billed</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{statsLoading ? '—' : `$${(totalInvoiced / 1000).toFixed(0)}k`}</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">{invoiceStats.count > 0 ? `${invoiceStats.count} live invoices` : 'No invoices yet'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Leaves</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{statsLoading ? '—' : pendingLeavesCount}</div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Awaiting review</p>
          </div>
        </div>
      </div>

      {/* Admin Customization Widget: Live Employee AUX & Active Logins Matrix */}
      {role === 'admin' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Live Employee AUX & Active Logins Matrix</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold">
                    Real-time Telemetry
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Admin customized view of active staff presence, current AUX statuses, and login timestamps.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={auxFilter}
                onChange={(e) => setAuxFilter(e.target.value)}
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              >
                <option value="All">All AUX Statuses</option>
                <option value="Available">Available</option>
                <option value="In Call">In Call</option>
                <option value="Break">Break</option>
                <option value="Lunch">Lunch</option>
                <option value="Offline">Offline</option>
              </select>

              <button
                type="button"
                onClick={() => setActiveScreen('aux_status')}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                View Full AUX Log
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredAuxLogs.slice(0, 8).map((log) => {
              const stColor =
                log.status === 'Available'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300'
                  : log.status === 'In Call'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border-purple-300'
                  : log.status === 'Break' || log.status === 'Lunch'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';

              return (
                <div key={log.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {(log?.employeeName || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{log?.employeeName || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-500">{log.department || 'Staff'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${stColor}`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span>Active Login: {log.startTime}</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{log.durationMinutes ? `${log.durationMinutes}m active` : 'Active'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Section: Announcements & Quick Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Announcements Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Company Announcements</h3>
            </div>
            <button
              onClick={() => setActiveScreen('announcements')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Manage ({statsLoading ? '—' : announcementCount})
            </button>
          </div>

          <div className="space-y-3">
            {recentAnnouncements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-xl border transition-all ${
                  ann.pinned
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ann.title}</h4>
                      {ann.pinned && (
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 px-1.5 py-0.2 rounded font-medium">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{ann.content}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span>By {ann.author} {ann.authorRole ? `(${ann.authorRole})` : ''}</span>
                      <span>•</span>
                      <span>{ann.date}</span>
                    </div>
                  </div>
                  <Badge
                    variant={ann.priority === 'Critical' || ann.priority === 'High' || ann.priority === 'Urgent' ? 'danger' : 'default'}
                  >
                    {ann.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Quick Management</h3>
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => setActiveScreen('employees')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span>Add New Employee</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => setActiveScreen('tasks')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span>Create Task in Kanban</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => setActiveScreen('invoicing')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span>Draft Client Invoice</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => setActiveScreen('leaves')}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <CalendarCheck className="w-3.5 h-3.5" />
                </div>
                <span>Submit Leave Request</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
