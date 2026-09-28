import React, { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LeaveRequest } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const LeavesScreen: React.FC = () => {
  const { leaves, applyLeave, updateLeaveStatus } = useApp();
  const { user, role } = useAuth();

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('Paid Leave');
  const [startDate, setStartDate] = useState('2026-03-25');
  const [endDate, setEndDate] = useState('2026-03-27');
  const [reason, setReason] = useState('');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !user) return;
    applyLeave({
      employeeId: user.id,
      employeeName: user.name,
      type: leaveType,
      startDate,
      endDate,
      days: 3,
      reason,
      appliedOn: '2026-03-12',
    });
    setIsApplyOpen(false);
    setReason('');
  };

  const filteredLeaves = leaves.filter((l) => {
    // Legacy records can be partially empty; never render blank rows or expose
    // approval actions for records that cannot identify an employee/request.
    if (!l || !l.employeeName || !l.type || !l.startDate || !l.endDate) return false;
    const matchesType = filterType === 'all' || l.type === filterType;
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchesRole = role === 'admin' ? true : l.employeeName === user?.name;
    return matchesType && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Leave & Time-Off Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit vacation requests, track leave quotas, and manage managerial approvals
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsApplyOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Paid Annual Leave</p>
          <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-1">18 Days</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Remaining this fiscal year</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sick / Medical Leave</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">8 Days</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Available for health needs</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Casual / Personal</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">5 Days</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Emergency time off</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Approvals</p>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">
            {leaves.filter((l) => l.status === 'Pending').length}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">Under manager review</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Leave Applications & History</h2>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                {role === 'admin' && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLeaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{l.employeeName}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{l.type}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{l.startDate}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{l.endDate}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{l.days} days</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{l.reason}</td>
                  <td className="py-3 px-4">
                    <Badge variant={l.status === 'Approved' ? 'success' : l.status === 'Pending' ? 'warning' : 'danger'}>
                      {l.status}
                    </Badge>
                  </td>
                  {role === 'admin' && (
                    <td className="py-3 px-4 text-right">
                      {l.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => updateLeaveStatus(l.id, 'Approved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 font-bold border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateLeaveStatus(l.id, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 font-bold border border-rose-200 dark:border-rose-800 cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} title="Submit Leave Request">
        <form onSubmit={handleApply} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="Paid Leave">Paid Annual Leave</option>
              <option value="Sick Leave">Sick / Medical Leave</option>
              <option value="Casual Leave">Casual / Personal Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Reason for Request</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual family vacation and travel"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsApplyOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
