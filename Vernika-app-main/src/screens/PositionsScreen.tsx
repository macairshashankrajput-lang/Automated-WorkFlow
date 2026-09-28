import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Users,
  DollarSign
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { Position } from '../types';

export const PositionsScreen: React.FC = () => {
  const { positions, departments, employees, addPosition, updatePosition, deletePosition, sendEmail, sendMessage } = useApp();
  const { role, user } = useAuth();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dept, setDept] = useState(departments[0]?.name || 'Engineering & Technology');
  const [level, setLevel] = useState<Position['level']>('Senior');
  const [minSalary, setMinSalary] = useState(90000);
  const [maxSalary, setMaxSalary] = useState(140000);
  const [openings, setOpenings] = useState(1);
  const [hiringStatus, setHiringStatus] = useState<Position['hiringStatus']>('Open');
  const [interviewerIds, setInterviewerIds] = useState<string[]>([]);
  const visiblePositions: Position[] = positions.length > 0 ? positions : Array.from(new Map(employees.filter((employee) => employee.position).map((employee) => [employee.position, { id: `derived-${employee.position}`, title: employee.position, department: employee.department, minSalary: 0, maxSalary: 0, level: 'Senior', activeStaff: employees.filter((candidate) => candidate.position === employee.position).length, openings: 0, hiringStatus: 'Open' as const, interviewerIds: [] }])).values());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    addPosition({
      title,
      department: dept,
      minSalary: Number(minSalary),
      maxSalary: Number(maxSalary),
      level,
      activeStaff: 0,
      openings: Number(openings),
      hiringStatus,
      interviewerIds,
    });
    setIsAddOpen(false);
    setTitle('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Job Positions & Compensation Bands</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Role definitions, seniority titles, and standardized compensation tiers
            </p>
          </div>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Position</span>
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visiblePositions.map((pos) => (
          <div
            key={pos.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-emerald-300 dark:hover:border-emerald-500/50 shadow-xs transition-all space-y-3 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{pos.title}</h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">{pos.department} · {pos.activeStaff} assigned</p>
              <p className="text-[10px] text-slate-500 mt-1">{pos.openings || 0} openings · {pos.hiringStatus || 'Open'} · {pos.interviewerIds?.length || 0} interviewers · {employees.filter((candidate) => candidate.position === pos.title && candidate.applicationStatus).length} tracked applications</p>
              <p className="text-[10px] text-slate-500 mt-1">Interviewers: {(pos.interviewerIds || []).map((id) => employees.find((employee) => employee.id === id)?.name || id).join(', ') || 'Not assigned'}</p>
              {role === 'admin' && <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-2">Interview stage<select value={pos.interviewStatus || 'Not Scheduled'} onChange={(e) => void updatePosition(pos.id, { interviewStatus: e.target.value })} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1 font-normal"><option>Not Scheduled</option><option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Selected</option><option>Rejected</option></select></label>}
              {role === 'admin' && employees[0] && <button type="button" onClick={async () => { const recipient = employees[0]; await sendEmail({ fromName: user?.name || 'HR', fromEmail: user?.email || '', toName: recipient.name, toEmail: recipient.email, subject: `Employee referral: ${pos.title}`, body: `Please review and refer candidates for the ${pos.title} position in ${pos.department}.`, folder: 'Sent' }); await sendMessage({ senderId: user?.id || '', senderName: user?.name || 'HR', recipientId: recipient.id, recipientName: recipient.name, text: `Referral request: please share candidates for ${pos.title}.` } as any); }} className="mt-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline">Share referral request via Mail + Messenger</button>}

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Compensation Band</span>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {pos.minSalary || pos.maxSalary ? `$${((pos.minSalary || 0) / 1000).toFixed(0)}k - $${((pos.maxSalary || 0) / 1000).toFixed(0)}k / year` : 'Compensation band not configured'}
                </p>
              </div>
            </div>

            {role === 'admin' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => deletePosition(pos.id)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Job Position">
        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Position Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Principal Cloud Architect"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Department</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Seniority Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              >
                <option value="Junior">Junior</option>
                <option value="Mid">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead / Principal</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><label className="text-slate-700 dark:text-slate-300 font-bold">Openings</label><input type="number" min="0" value={openings} onChange={(e) => setOpenings(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white" /></div>
            <div className="space-y-1"><label className="text-slate-700 dark:text-slate-300 font-bold">Hiring Status</label><select value={hiringStatus} onChange={(e) => setHiringStatus(e.target.value as Position['hiringStatus'])} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"><option>Open</option><option>Paused</option><option>Closed</option></select></div>
            <div className="space-y-1"><label className="text-slate-700 dark:text-slate-300 font-bold">Interviewers</label><select multiple value={interviewerIds} onChange={(e) => setInterviewerIds(Array.from(e.target.selectedOptions, (option) => option.value))} className="w-full h-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-900 dark:text-white">{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Minimum Salary ($)</label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Maximum Salary ($)</label>
              <input
                type="number"
                value={maxSalary}
                onChange={(e) => setMaxSalary(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Save Position
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
