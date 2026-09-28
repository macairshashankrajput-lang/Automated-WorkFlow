import React, { useMemo, useState } from 'react';
import { Network, Users, ShieldCheck, FolderKanban, Save, ChevronDown, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

const CARD_WIDTH = 236;
const CHILD_GAP = 18;

const GRANTABLE_MODULES = [
  ['dashboard', 'Dashboard'], ['attendance', 'Attendance'], ['leaves', 'Leave'], ['tasks', 'Tasks'],
  ['projects', 'Projects'], ['chat', 'Team Messenger'], ['expenses', 'Claims & Expenses'],
  ['payroll', 'Payroll'], ['sheets', 'Sheets'], ['documents', 'Documents'],
] as const;

export const OrgTreeScreen: React.FC = () => {
  const { employees, departments, projects, updateEmployee, updateDepartment, updateProject } = useApp();
  const { role, user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draftHead, setDraftHead] = useState<Record<string, string>>({});
  const [grantDraft, setGrantDraft] = useState<Record<string, string[]>>({});
  const [projectDraft, setProjectDraft] = useState<Record<string, string>>({});
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [classicOpenIds, setClassicOpenIds] = useState<Record<string, boolean>>({});
  const [treeSearch, setTreeSearch] = useState('');
  const isAdmin = role === 'admin';
  const isHead = role === 'department_head' || user?.isDepartmentHead === true;

  const liveDepartments = useMemo(() => {
    const names = departments.length
      ? departments.map((department) => department.name)
      : Array.from(new Set(employees.map((employee) => employee.department).filter(Boolean)));
    return names.map((name) => {
      const persisted = departments.find((department) => department.name === name);
      const team = employees.filter((employee) => employee.department === name);
      const head = team.find((employee) => employee.isDepartmentHead || employee.role === 'department_head')
        || team.find((employee) => employee.id === persisted?.headEmployeeId)
        || team.find((employee) => employee.role === 'admin');
      return {
        id: persisted?.id || `derived-${name}`,
        name,
        team,
        head,
        projects: projects.filter((project) => (project as any).department === name || (project as any).departmentId === persisted?.id),
      };
    });
  }, [departments, employees, projects]);

  const toggleGrant = (employeeId: string, moduleId: string) => {
    setGrantDraft((prev) => {
      const current = prev[employeeId] || employees.find((employee) => employee.id === employeeId)?.allowedModules || [];
      return { ...prev, [employeeId]: current.includes(moduleId) ? current.filter((id) => id !== moduleId) : [...current, moduleId] };
    });
  };

  const saveHead = async (departmentName: string, employeeId: string) => {
    const department = liveDepartments.find((item) => item.name === departmentName);
    const previous = department?.head;
    if (previous && previous.id !== employeeId) {
      await updateEmployee(previous.id, { isDepartmentHead: false, managedDepartment: undefined, canAssignProjects: false });
    }
    const selected = employees.find((employee) => employee.id === employeeId);
    if (!selected) return;
    await updateEmployee(selected.id, {
      role: 'department_head',
      isDepartmentHead: true,
      managedDepartment: departmentName,
      canAssignProjects: true,
      grantableModules: selected.grantableModules?.length ? selected.grantableModules : ['tasks', 'projects', 'leaves', 'expenses', 'chat'],
    });
    if (department && !department.id.startsWith('derived-')) {
      await updateDepartment(department.id, {
        headEmployeeId: selected.id,
        headEmployeeUid: selected.firebaseUid || selected.id,
        headEmployeeName: selected.name,
        managerName: selected.name,
        employeesCount: department.team.length,
      });
    }
  };

  const saveGrants = async (employeeId: string) => {
    const selected = employees.find((employee) => employee.id === employeeId);
    if (!selected || (!isAdmin && selected.department !== user?.managedDepartment)) return;
    const requested = grantDraft[employeeId] || selected.allowedModules || [];
    const delegated = isAdmin ? requested : requested.filter((moduleId) => (user?.grantableModules || []).includes(moduleId));
    await updateEmployee(employeeId, { allowedModules: delegated, accessGrantedBy: user?.id || 'admin', accessGrantVersion: Date.now() });
  };

  const delegateProject = async (projectId: string, employeeId: string) => {
    const target = employees.find((employee) => employee.id === employeeId);
    const project = projects.find((item) => item.id === projectId);
    if (!target || !project || (!isAdmin && (!isHead || target.department !== user?.managedDepartment))) return;
    await updateProject(projectId, { assignedTo: employeeId, assignedToName: target.name, department: target.department } as any);
  };

  const chartRoot = employees.find((employee) => employee.role === 'admin');
  const chartHeads = liveDepartments.map((department) => department.head).filter((employee): employee is typeof employees[number] => Boolean(employee && employee.role !== 'admin'));
  const chartChildren = (parent: typeof employees[number]) => {
    const department = parent.department;
    const query = treeSearch.trim().toLowerCase();
    return employees.filter((employee) => {
      if (employee.id === parent.id || employee.role === 'admin' || chartHeads.some((head) => head.id === employee.id)) return false;
      const direct = employee.supervisorId === parent.id || (!employee.supervisorId && employee.department === department);
      const text = `${employee.name} ${employee.position} ${employee.department} ${employee.employmentType || ''}`.toLowerCase();
      return direct && (!query || text.includes(query));
    });
  };
  const CARD_HEIGHT = 92;
  const LEVEL_GAP = 58;
  type LayoutNode = { employee: typeof employees[number]; x: number; y: number; depth: number; childCount: number };
  type LayoutLink = { fromX: number; fromY: number; toX: number; toY: number };
  const subtreeWidth = (employee: typeof employees[number], seen = new Set<string>()): number => {
    if (seen.has(employee.id)) return CARD_WIDTH;
    const nextSeen = new Set(seen).add(employee.id);
    const children = chartChildren(employee);
    if (!children.length) return CARD_WIDTH;
    const width = children.reduce((total, child, index) => total + subtreeWidth(child, nextSeen) + (index ? CHILD_GAP : 0), 0);
    return Math.max(CARD_WIDTH, width);
  };
  const visibleChartHeads = chartHeads.filter((head) => {
    const query = treeSearch.trim().toLowerCase();
    return !query || `${head.name} ${head.position} ${head.department}`.toLowerCase().includes(query) || chartChildren(head).length > 0;
  });
  const chartLayout = (() => {
    const nodes: LayoutNode[] = [];
    const links: LayoutLink[] = [];
    const rootWidth = chartRoot ? Math.max(CARD_WIDTH, visibleChartHeads.reduce((total, head, index) => total + subtreeWidth(head) + (index ? CHILD_GAP : 0), 0)) : CARD_WIDTH;
    const build = (employee: typeof employees[number], left: number, depth: number, seen: Set<string>) => {
      if (seen.has(employee.id)) return;
      const nextSeen = new Set(seen).add(employee.id);
      const children = classicOpenIds[employee.id] === false ? [] : depth === 0 ? visibleChartHeads : chartChildren(employee);
      const width = Math.max(CARD_WIDTH, children.reduce((total, child, index) => total + subtreeWidth(child, nextSeen) + (index ? CHILD_GAP : 0), 0));
      const centerX = left + width / 2;
      const y = depth * (CARD_HEIGHT + LEVEL_GAP);
      nodes.push({ employee, x: centerX - CARD_WIDTH / 2, y, depth, childCount: children.length });
      let childLeft = left;
      children.forEach((child, index) => {
        const childWidth = subtreeWidth(child, nextSeen);
        const childCenterX = childLeft + childWidth / 2;
        links.push({ fromX: centerX, fromY: y + CARD_HEIGHT, toX: childCenterX, toY: (depth + 1) * (CARD_HEIGHT + LEVEL_GAP) });
        build(child, childLeft, depth + 1, nextSeen);
        childLeft += childWidth + (index < children.length - 1 ? CHILD_GAP : 0);
      });
    };
    if (chartRoot) build(chartRoot, 0, 0, new Set<string>());
    const maxDepth = nodes.reduce((max, node) => Math.max(max, node.depth), 0);
    return { nodes, links, width: rootWidth + 32, height: (maxDepth + 1) * (CARD_HEIGHT + LEVEL_GAP) - LEVEL_GAP + 32 };
  })();
  const renderChartCard = (employee: typeof employees[number], depth: number, childCount: number) => {
    const name = employee.name || 'Unnamed member';
    const initials = name.split(/\\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    return <button type="button" onClick={() => setSelectedMemberId(employee.id)} className={`org-chart-card org-chart-card-positioned group tree-node ${depth === 0 ? 'org-chart-root' : ''}`}><div className="flex items-center gap-3"><div className="org-chart-avatar">{employee.avatar ? <img src={employee.avatar} alt="" className="h-full w-full object-cover" /> : initials}</div><div className="min-w-0 text-left"><p className="truncate text-xs font-bold text-slate-900 dark:text-white">{name}</p><p className="truncate text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">{employee.position || 'Position not assigned'}</p><p className="truncate text-[10px] text-slate-500">{employee.department || 'Department not assigned'}</p></div></div><div className="mt-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-slate-400"><span>{depth === 0 ? 'Admin / Root' : employee.isDepartmentHead || employee.role === 'department_head' ? 'Department Head' : employee.employmentType || 'Team Member'}</span>{childCount > 0 && <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">{childCount}</span>}</div></button>;
  };

  const renderTeamNode = (employee: typeof employees[number], team: typeof employees, depth = 0, seen = new Set<string>()): React.ReactNode => {
    if (seen.has(employee.id)) return null;
    const nextSeen = new Set(seen).add(employee.id);
    const children = team.filter((candidate) => candidate.id !== employee.id && candidate.supervisorId === employee.id);
    return (
      <div key={`${employee.id}-${depth}`} className={`${depth ? 'ml-5 border-l-2 border-emerald-200 dark:border-emerald-800 pl-4' : ''} space-y-2`}>
        <button type="button" onClick={() => setSelectedMemberId(employee.id)} className="w-full flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">
          <span><p className="text-xs font-bold text-slate-900 dark:text-white">{employee.name}</p><p className="text-[10px] text-slate-500">{employee.position || 'Role not assigned'}{employee.supervisorName ? ` · Reports to ${employee.supervisorName}` : ''}</p></span>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{employee.employmentType || 'Full Time'}</span>
        </button>
        {children.map((child) => renderTeamNode(child, team, depth + 1, nextSeen))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"><Network className="w-6 h-6" /></div>
        <div><h1 className="text-xl font-bold text-slate-900 dark:text-white">Organization Hierarchy & Delegation</h1><p className="text-xs text-slate-500 dark:text-slate-400">Live department tree, accountable heads, scoped grants, and project ownership</p></div>
      </div>
      <section className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-indigo-100 dark:border-indigo-900/60"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Network className="w-5 h-5 text-indigo-500" /><div><h2 className="font-bold text-slate-900 dark:text-white">Classic Organization Member Tree</h2><p className="text-xs text-slate-500">Company-wide interconnected reporting hierarchy. Select any profile card for complete details.</p></div></div><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"><Search className="h-3.5 w-3.5 text-slate-400" /><input value={treeSearch} onChange={(event) => setTreeSearch(event.target.value)} placeholder="Find a member" className="w-40 bg-transparent text-xs outline-none" /></label></div></div>
        <div className="overflow-x-auto p-5"><div className="org-chart-canvas">{chartRoot ? <div className="org-chart-stage" style={{ width: `${chartLayout.width}px`, height: `${chartLayout.height}px` }}><svg className="org-chart-connectors" width={chartLayout.width} height={chartLayout.height} viewBox={`0 0 ${chartLayout.width} ${chartLayout.height}`} aria-hidden="true">{chartLayout.links.map((link, index) => { const midY = link.fromY + (link.toY - link.fromY) / 2; return <path key={`link-${index}`} d={`M ${link.fromX} ${link.fromY} V ${midY} H ${link.toX} V ${link.toY}`} />; })}</svg>{chartLayout.nodes.map((node) => <div key={`chart-node-${node.employee.id}`} className="org-chart-positioned-node" style={{ left: `${node.x}px`, top: `${node.y}px` }}>{renderChartCard(node.employee, node.depth, node.childCount)}</div>)}</div> : <p className="py-6 text-center text-xs text-slate-500">No Admin root is available in the live employee directory.</p>}</div></div>
      </section>
      {selectedMemberId && (() => { const member = employees.find((employee) => employee.id === selectedMemberId); if (!member) return null; const supervisor = employees.find((employee) => employee.id === member.supervisorId); return <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setSelectedMemberId(null)}><div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-lg font-bold text-slate-900 dark:text-white">{member.name}</p><p className="text-xs text-slate-500">{member.position} · {member.department}</p></div><button type="button" onClick={() => setSelectedMemberId(null)} className="text-xs font-bold text-slate-500">Close</button></div><div className="grid grid-cols-2 gap-3 mt-5 text-xs"><div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3"><span className="text-slate-400">Reports to</span><p className="font-semibold mt-1">{supervisor?.name || member.supervisorName || member.managerName || 'Department Head'}</p></div><div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3"><span className="text-slate-400">Employment</span><p className="font-semibold mt-1">{member.employmentType || 'Full Time'}</p></div><div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3"><span className="text-slate-400">Access modules</span><p className="font-semibold mt-1">{member.allowedModules?.length || 0} granted</p></div><div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3"><span className="text-slate-400">Status</span><p className="font-semibold mt-1">{member.status} · {member.auxStatus || 'Unavailable'}</p></div></div><div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-800 p-3 text-xs"><p className="font-bold text-emerald-700 dark:text-emerald-400">Hierarchy path</p><p className="mt-1 text-slate-600 dark:text-slate-300">Admin → {member.managedDepartment || member.department} Head → {member.name}</p></div></div></div>; })()}
    </div>
  );
};
