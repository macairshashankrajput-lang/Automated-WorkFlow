import React, { useState } from 'react';
import {
  Building,
  Plus,
  Users,
  DollarSign,
  Trash2,
  Edit2,
  Save,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Department } from '../types';
import { Modal } from '../components/common/Modal';

export const DepartmentsScreen: React.FC = () => {
  const { departments, employees, projects, addDepartment, deleteDepartment, updateEmployee, updateProject } = useApp();
  const { role, user } = useAuth();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [managerName, setManagerName] = useState('Shashank Rajput');
  const [budget, setBudget] = useState(250000);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [grantDraft, setGrantDraft] = useState<Record<string, string[]>>({});
  const grantableModules = [['dashboard', 'Dashboard'], ['attendance', 'Attendance'], ['leaves', 'Leave'], ['tasks', 'Tasks'], ['projects', 'Projects'], ['chat', 'Team Messenger'], ['expenses', 'Claims'], ['payroll', 'Payroll'], ['documents', 'Documents']] as const;
  const visibleDepartments = departments.length > 0 ? departments : Array.from(new Set(employees.map((employee) => employee.department).filter(Boolean))).map((department) => {
    const team = employees.filter((employee) => employee.department === department);
    const head = team.find((employee) => employee.role === 'admin') || team[0];
    return { id: `derived-${department}`, name: department, managerName: head?.name || 'Unassigned', budget: 0, employeesCount: team.length };
  });

  const renderTeamNode = (employee: typeof employees[number], team: typeof employees, depth = 0, seen = new Set<string>()): React.ReactNode => {
    if (seen.has(employee.id)) return null;
    const nextSeen = new Set(seen).add(employee.id);
    const children = team.filter((candidate) => candidate.id !== employee.id && candidate.supervisorId === employee.id);
    return <div key={`${employee.id}-${depth}`} className={`${depth ? 'ml-5 border-l-2 border-emerald-200 dark:border-emerald-800 pl-4' : ''} space-y-2`}>
      <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2">
        <div><p className="text-xs font-bold text-slate-900 dark:text-white">{employee.name}</p><p className="text-[10px] text-slate-500">{employee.position || 'Role not assigned'}{employee.supervisorName ? ` · Reports to ${employee.supervisorName}` : ''}</p></div>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{employee.employmentType || 'Full Time'}</span>
      </div>
      {children.map((child) => renderTeamNode(child, team, depth + 1, nextSeen))}
    </div>;
  };

  const saveDepartmentGrants = async (employee: typeof employees[number]) => {
    const requested = grantDraft[employee.id] || employee.allowedModules || [];
    const allowed = role === 'admin' ? requested : requested.filter((moduleId) => (user?.grantableModules || []).includes(moduleId));
    await updateEmployee(employee.id, { allowedModules: allowed, accessGrantedBy: user?.id || 'admin', accessGrantVersion: Date.now() } as any);
  };

  const toggleDepartmentGrant = (employee: typeof employees[number], moduleId: string) => {
    setGrantDraft((previous) => { const current = previous[employee.id] || employee.allowedModules || []; return { ...previous, [employee.id]: current.includes(moduleId) ? current.filter((item) => item !== moduleId) : [...current, moduleId] }; });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    addDepartment({
      name,
      managerName,
      budget: Number(budget),
      employeesCount: 1,
    });
    setIsAddOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Departments & Divisions</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Departmental structure, cost center budgets, and division head assignments
            </p>
          </div>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleDepartments.map((dept) => {
          const deptRecord = dept as Department & { employeeIds?: string[]; memberIds?: string[]; teamMemberIds?: string[] };
          const assignedIds = new Set([...(deptRecord.employeeIds || []), ...(deptRecord.memberIds || []), ...(deptRecord.teamMemberIds || []), ...(deptRecord.headEmployeeId ? [deptRecord.headEmployeeId] : [])]);
          const deptStaff = employees.filter((e) => e.department === dept.name || assignedIds.has(e.id) || assignedIds.has(e.firebaseUid || '') || assignedIds.has(e.employeeId || ''));
          return (
            <div
              key={dept.id}
              onClick={() => setSelectedDepartment(dept.name)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-emerald-300 dark:hover:border-emerald-500/50 shadow-xs transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{dept.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Head: {dept.managerName}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
                    <Building className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Team Size</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{deptStaff.length || dept.employeesCount} Staff</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">Annual Budget</span>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">${dept.budget.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {role === 'admin' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => deleteDepartment(dept.id)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDepartment && (() => {
        const selectedDeptRecord = departments.find((department) => department.name === selectedDepartment) as (Department & { employeeIds?: string[]; memberIds?: string[]; teamMemberIds?: string[] }) | undefined;
        const assignedIds = new Set([...(selectedDeptRecord?.employeeIds || []), ...(selectedDeptRecord?.memberIds || []), ...(selectedDeptRecord?.teamMemberIds || []), ...(selectedDeptRecord?.headEmployeeId ? [selectedDeptRecord.headEmployeeId] : [])]);
        const team = employees.filter((employee) => employee.department === selectedDepartment || assignedIds.has(employee.id) || assignedIds.has(employee.firebaseUid || '') || assignedIds.has(employee.employeeId || ''));
        const activeProjects = projects.filter((project) => project.status === 'Active' && team.some((employee) => project.team?.includes(employee.name) || project.team?.includes(employee.id)));
        const head = team.find((employee) => employee.id === selectedDeptRecord?.headEmployeeId || employee.isDepartmentHead || employee.role === 'department_head') || team.find((employee) => employee.role === 'admin') || team[0];
        return <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedDepartment} management tree</h2><p className="text-xs text-slate-500 dark:text-slate-400">Department head, reporting team, and live project status</p></div><button type="button" onClick={() => setSelectedDepartment(null)} className="text-xs font-bold text-slate-500 hover:text-rose-500">Close</button></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4"><p className="text-[10px] uppercase font-bold text-slate-400">Department head</p><p className="font-bold text-slate-900 dark:text-white mt-1">{head?.name || 'Unassigned'}</p><p className="text-xs text-slate-500">{head?.position || 'Assign a head in Employee Directory'}</p></div><div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"><p className="text-[10px] uppercase font-bold text-slate-400">Team members</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{team.length}</p></div><div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4"><p className="text-[10px] uppercase font-bold text-slate-400">Active projects</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{activeProjects.length}</p></div></div>
          <div className="space-y-2"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reporting tree</p>{head ? renderTeamNode(head, team) : <p className="text-xs text-slate-500">Assign a department head in Employee Directory.</p>}{team.filter((employee) => employee.id !== head?.id && !team.some((candidate) => candidate.id === employee.supervisorId)).map((employee) => renderTeamNode(employee, team))}</div>
          {(role === 'admin' || (role === 'department_head' && head?.id === user?.id)) && <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /><div><h3 className="text-xs font-bold text-slate-900 dark:text-white">Organization Hierarchy & Delegation</h3><p className="text-[10px] text-slate-500">Grant only the modules required by each team member or intern.</p></div></div>{team.filter((employee) => employee.id !== head?.id).map((employee) => { const draft = grantDraft[employee.id] || employee.allowedModules || []; return <div key={employee.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-900 dark:text-white">{employee.name}</p><p className="text-[10px] text-slate-500">{employee.position || 'Position not assigned'} · {employee.employmentType || 'Team Member'}</p></div><button type="button" onClick={() => void saveDepartmentGrants(employee)} className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"><Save className="w-3 h-3" /> Save access</button></div><div className="mt-2 flex flex-wrap gap-1.5">{grantableModules.map(([id, label]) => { const enabled = draft.includes(id); const withinScope = role === 'admin' || (user?.grantableModules || []).includes(id); return <button type="button" key={id} disabled={!withinScope} onClick={() => toggleDepartmentGrant(employee, id)} className={`rounded-lg border px-2 py-1 text-[10px] ${enabled ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'} ${!withinScope ? 'cursor-not-allowed opacity-40' : ''}`}>{label}</button>; })}</div></div>; })}</div>}
        </div>;
      })()}

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Department">
        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Department Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Legal & Compliance"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Department Head</label>
            <input
              type="text"
              required
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Annual Operating Budget ($)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
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
              Save Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
