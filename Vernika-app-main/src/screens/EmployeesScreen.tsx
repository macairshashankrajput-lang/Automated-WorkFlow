import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Star,
  Edit2,
  Trash2,
  Filter,
  Shield,
  UserCheck,
  Lock,
  Key,
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Sliders,
  DollarSign,
  Camera,
  Gift,
  Award,
  Heart,
  FileText,
  Building,
  Eye,
  MessageSquare,
  LayoutGrid,
  ListFilter,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Employee, UserRole } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const ALL_AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Executive Dashboard', desc: 'Main executive metrics & activity', category: 'Overview' },
  { id: 'sheets', label: 'Vernika Sheets', desc: 'Collaborative spreadsheets & data workbooks', category: 'Overview' },
  { id: 'ai_assistant', label: 'Vernika AI Copilot', desc: 'Enterprise AI Assistant and insights', category: 'Overview' },

  { id: 'mail', label: 'Outlook Mail', desc: 'Corporate Email Inbox, Outbox, and AI Drafting', category: 'Communication' },
  { id: 'calendar', label: 'Corporate Calendar', desc: 'Company events, shifts, and schedules', category: 'Communication' },
  { id: 'meetings', label: 'Virtual Meeting Rooms', desc: 'Team video syncs, calls & screen sharing', category: 'Communication' },
  { id: 'chat', label: 'Team Messenger', desc: 'Channels and 1-on-1 direct messaging', category: 'Communication' },
  { id: 'announcements', label: 'Announcements Bulletin', desc: 'Company-wide notices and broadcasts', category: 'Communication' },

  { id: 'tasks', label: 'Tasks & Sprint Board', desc: 'Kanban board & agile sprint tasks', category: 'Work & Projects' },
  { id: 'projects', label: 'Projects Portfolio', desc: 'Project management & milestone tracking', category: 'Work & Projects' },

  { id: 'attendance', label: 'Attendance & Geofence', desc: 'Shift clock-in/out and selfie validation', category: 'Workforce & HR' },
  { id: 'leaves', label: 'Leaves & PTO Management', desc: 'Leave requests and vacation balances', category: 'Workforce & HR' },
  { id: 'aux_status', label: 'AUX Telemetry & Adherence', desc: 'Real-time staff status and break adherence', category: 'Workforce & HR' },
  { id: 'tracking', label: 'Staff Work Tracking', desc: 'Live employee tracking & work adherence', category: 'Workforce & HR' },
  { id: 'employees', label: 'Employee Directory', desc: 'Staff directory & access control', category: 'Workforce & HR' },
  { id: 'departments', label: 'Departments Directory', desc: 'Organizational division structure', category: 'Workforce & HR' },
  { id: 'positions', label: 'Positions & Salary Grades', desc: 'Staff leveling and pay bands', category: 'Workforce & HR' },
  { id: 'orgtree', label: 'Organization Tree', desc: 'Hierarchy visualization and chain of command', category: 'Workforce & HR' },

  { id: 'payroll', label: 'Payroll & Payslips', desc: 'Monthly salary and direct deposit slips', category: 'Financial & Sales' },
  { id: 'expenses', label: 'Expenses & Claims', desc: 'Reimbursement workflow and receipts', category: 'Financial & Sales' },
  { id: 'invoicing', label: 'Invoices & Billing', desc: 'Client billing and payment statements', category: 'Financial & Sales' },
  { id: 'crm', label: 'CRM & Enterprise Sales', desc: 'Lead pipeline and revenue funnel', category: 'Financial & Sales' },

  { id: 'settings', label: 'Workspace Settings', desc: 'System preferences & security configuration', category: 'Administration' },
];

export const EmployeesScreen: React.FC = () => {
  const { employees, departments, addEmployee, updateEmployee, deleteEmployee, updateEmployeePermissions, setActiveScreen, openChatWithUser } = useApp();
  const { role, user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [auxFilter, setAuxFilter] = useState<string>('all');
  const [viewStyle, setViewStyle] = useState<'grid' | 'table'>('grid');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [permissionsEmp, setPermissionsEmp] = useState<Employee | null>(null);
  const [viewingEmp, setViewingEmp] = useState<Employee | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [provisioningError, setProvisioningError] = useState('');
  const [phone, setPhone] = useState('');
  const [dept, setDept] = useState(departments[0]?.name || 'Engineering & Technology');
  const [position, setPosition] = useState('');
  const [empRole, setEmpRole] = useState<UserRole>('employee');
  const [salary, setSalary] = useState(115000);
  const [location, setLocation] = useState('San Francisco, CA (HQ)');
  const [managerName, setManagerName] = useState('Shashank Rajput');
  const [employmentType, setEmploymentType] = useState<Employee['employmentType']>('Full Time');
  const [supervisorId, setSupervisorId] = useState('');
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  const [birthDate, setBirthDate] = useState('1995-08-20');
  const [workAnniversary, setWorkAnniversary] = useState('2023-01-15');
  const [bio, setBio] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [skills, setSkills] = useState('TypeScript, React, Cloud, Node.js');

  // Permissions Modal State
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [grantableModules, setGrantableModules] = useState<string[]>([]);
  const [permLoginEnabled, setPermLoginEnabled] = useState(true);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [canViewFullRosterInput, setCanViewFullRosterInput] = useState(false);
  const [savePermSuccess, setSavePermSuccess] = useState(false);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  ];

  const uniqueEmployees = Array.from((employees || []).filter(Boolean).reduce((map, employee) => {
    const key = employee.firebaseUid || employee.email?.trim().toLowerCase() || employee.username?.trim().toLowerCase() || employee.employeeId || employee.id;
    const existing = map.get(key);
    map.set(key, existing ? { ...existing, ...employee } : employee);
    return map;
  }, new Map<string, typeof employees[number]>() ).values());
  const uniqueDepartments = Array.from(new Map([
    ...(departments || []).filter(d => d && d.id).map(d => [d.id, d] as const),
    ...Array.from(new Set(uniqueEmployees.map((employee) => employee.department).filter(Boolean))).map((name) => [`derived-${name}`, { id: `derived-${name}`, name, budget: 0, employeesCount: uniqueEmployees.filter((employee) => employee.department === name).length }] as const),
  ]).values());

  const filteredEmployees = uniqueEmployees.filter((emp) => {
    const s = (search || '').toLowerCase();
    const nameStr = (emp.name || '').toLowerCase();
    const emailStr = (emp.email || '').toLowerCase();
    const idStr = (emp.employeeId || '').toLowerCase();
    const posStr = (emp.position || '').toLowerCase();
    const userStr = (emp.username || '').toLowerCase();
    const deptStr = (emp.department || '').toLowerCase();
    const skillsStr = (emp.skills || []).join(' ').toLowerCase();

    const matchesSearch =
      nameStr.includes(s) ||
      emailStr.includes(s) ||
      idStr.includes(s) ||
      posStr.includes(s) ||
      userStr.includes(s) ||
      deptStr.includes(s) ||
      skillsStr.includes(s);

    const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    const matchesAux = auxFilter === 'all' || emp.auxStatus === auxFilter;

    return matchesSearch && matchesDept && matchesRole && matchesAux;
  });

  const handleOpenAdd = () => {
    setProvisioningError('');
    setName('');
    setEmail('');
    setUsername('');
    setPassword('password123');
    setPhone('+1 (555) 234-8900');
    setDept(departments[0]?.name || 'Engineering & Technology');
    setPosition('Software Engineer');
    setEmpRole('employee');
    setSalary(115000);
    setLocation('San Francisco, CA (HQ)');
    setManagerName('Shashank Rajput');
    setEmploymentType('Full Time');
    setSupervisorId('');
    setTeamMemberIds([]);
    setLoginEnabled(true);
    setAvatar(sampleAvatars[0]);
    setBirthDate('1995-08-20');
    setWorkAnniversary('2023-01-15');
    setBio('Dedicated team member at Vernika Enterprises.');
    setEmergencyContact('Emergency Contact');
    setEmergencyPhone('+1 (555) 000-1122');
    setBloodGroup('O+');
    setSkills('TypeScript, React, Cloud, Operations');
    setIsAddOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioningError('');
    if (!name || !email || !position) return;
    const cleanUsername = username.trim() || (email || '').split('@')[0];
    try {
      await addEmployee({
      name,
      email,
      username: cleanUsername,
      password: password || 'password123',
      loginEnabled,
      phone,
      department: dept,
      position,
      role: empRole,
      isDepartmentHead: empRole === 'department_head',
      managedDepartment: empRole === 'department_head' ? dept : undefined,
      canAssignProjects: empRole === 'department_head',
      grantableModules: empRole === 'department_head' ? ['tasks', 'projects', 'leaves', 'expenses', 'chat'] : [],
      salary: Number(salary),
      joinDate: new Date().toISOString().split('T')[0],
      birthDate,
      workAnniversary,
      status: 'Active',
      avatar,
      leavesBalance: 18,
      performanceRating: 4.8,
      managerName,
      employmentType,
      supervisorId: supervisorId || undefined,
      supervisorName: employees.find((employee) => employee.id === supervisorId)?.name,
      teamMemberIds,
      location,
      bio,
      emergencyContact,
      emergencyPhone,
      bloodGroup,
      skills: (skills || '').split(',').map(s => s.trim()).filter(Boolean),
      allowedModules: empRole === 'admin' 
        ? ALL_AVAILABLE_MODULES.map(m => m.id) 
        : ['dashboard', 'attendance', 'leaves', 'projects', 'tasks', 'chat', 'announcements', 'aux_status', 'payroll', 'expenses', 'meetings', 'sheets'],
      auxStatus: 'Available',
      auxStartTime: '09:00 AM',
        auxAdherenceScore: 98,
      });
      setIsAddOpen(false);
    } catch (error: any) {
      setProvisioningError(error?.message || 'Profile provisioning failed. Verify Firebase Auth and administrator authorization.');
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setEmail(emp.email);
    setUsername(emp.username || (emp.email || '').split('@')[0]);
    setPassword(emp.password || '');
    setPhone(emp.phone);
    setDept(emp.department);
    setPosition(emp.position);
    setEmpRole(emp.role);
    setSalary(emp.salary || 110000);
    setLocation(emp.location || 'San Francisco, CA (HQ)');
    setManagerName(emp.managerName || 'Shashank Rajput');
    setEmploymentType(emp.employmentType || 'Full Time');
    setSupervisorId(emp.supervisorId || '');
    setTeamMemberIds(emp.teamMemberIds || []);
    setAvatar(emp.avatar || sampleAvatars[0]);
    setBirthDate(emp.birthDate || '1995-08-20');
    setWorkAnniversary(emp.workAnniversary || emp.joinDate || '2023-01-15');
    setBio(emp.bio || '');
    setEmergencyContact(emp.emergencyContact || '');
    setEmergencyPhone(emp.emergencyPhone || '');
    setBloodGroup(emp.bloodGroup || 'O+');
    setSkills(Array.isArray(emp.skills) ? emp.skills.join(', ') : 'TypeScript, React');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    await updateEmployee(editingEmp.id, {
      name,
      email,
      username: username.trim() || (email || '').split('@')[0],
      password: password || editingEmp.password || 'password123',
      phone,
      department: dept,
      position,
      role: empRole,
      isDepartmentHead: empRole === 'department_head',
      managedDepartment: empRole === 'department_head' ? dept : undefined,
      canAssignProjects: empRole === 'department_head',
      grantableModules: empRole === 'department_head' ? ['tasks', 'projects', 'leaves', 'expenses', 'chat'] : [],
      salary: Number(salary),
      location,
      managerName,
      employmentType,
      supervisorId: supervisorId || undefined,
      supervisorName: employees.find((employee) => employee.id === supervisorId)?.name,
      teamMemberIds,
      avatar,
      birthDate,
      workAnniversary,
      bio,
      emergencyContact,
      emergencyPhone,
      bloodGroup,
      skills: (skills || '').split(',').map(s => s.trim()).filter(Boolean),
    });
    setEditingEmp(null);
  };

  const handleDelete = async (id: string, empName: string) => {
    if (window.confirm(`Are you sure you want to remove ${empName} from the company directory?`)) {
      await deleteEmployee(id);
    }
  };

  const handleOpenPermissions = (emp: Employee) => {
    setPermissionsEmp(emp);
    setSelectedModules(Array.isArray(emp.allowedModules) ? emp.allowedModules : []);
    setGrantableModules(Array.isArray(emp.grantableModules) ? emp.grantableModules : []);
    setPermLoginEnabled(emp.loginEnabled !== false);
    setNewPasswordInput('');
    setCanViewFullRosterInput(emp.canViewFullRoster === true);
    setSavePermSuccess(false);
  };

  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSavePermissions = async () => {
    if (!permissionsEmp) return;
    await updateEmployeePermissions(
      permissionsEmp.id,
      selectedModules,
      permLoginEnabled,
      newPasswordInput.trim() ? newPasswordInput.trim() : undefined,
      canViewFullRosterInput
    );
    await updateEmployee(permissionsEmp.id, {
      grantableModules: permissionsEmp.role === 'department_head' ? grantableModules : [],
      accessGrantVersion: Date.now()
    });
    setSavePermSuccess(true);
    setTimeout(() => {
      setSavePermSuccess(false);
      setPermissionsEmp(null);
    }, 1200);
  };

  // Metrics
  const activeDutyCount = uniqueEmployees.filter(e => !e.auxStatus || e.auxStatus === 'Available' || e.auxStatus === 'In Call').length;
  const onLeaveCount = uniqueEmployees.filter(e => e.auxStatus === 'Break' || e.status === 'On Leave').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Employee Directory & Access Control</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              {uniqueEmployees.length} Total Staff
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage employee credentials, module permissions, roles, departments, and real-time contact dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {role === 'admin' && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Headcount</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{uniqueEmployees.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Verified company profiles</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active On-Duty</span>
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">{activeDutyCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Available & working</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">On Break / Away</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5">{onLeaveCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Scheduled time away</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Departments</span>
            <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1.5">{uniqueDepartments.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active business divisions</p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, position, skill, username..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Departments</option>
            {uniqueDepartments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="employee">Employees</option>
          </select>

          {/* Status Filter */}
          <select
            value={auxFilter}
            onChange={(e) => setAuxFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="Available">🟢 Available</option>
            <option value="Break">🟡 On Break</option>
            <option value="Meeting">🟣 In Meeting</option>
            <option value="Offline">⚪ Offline</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewStyle('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewStyle === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewStyle === 'table'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Employees Grid View */}
      {viewStyle === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              {/* Top Card: Avatar, Name, Role Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                      />
                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        emp.auxStatus === 'Available' ? 'bg-emerald-500' :
                        emp.auxStatus === 'Break' ? 'bg-amber-500' :
                        emp.auxStatus === 'Meeting' ? 'bg-purple-500' : 'bg-slate-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{emp.position}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">{emp.employeeId} • {emp.department}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    emp.role === 'admin'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                  }`}>
                    {emp.role}
                  </span>
                </div>

                {/* Details List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">User: <b className="text-slate-900 dark:text-white">{emp.username || (emp.email || '').split('@')[0]}</b></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-mono">Salary: <b className="text-slate-900 dark:text-white">${(emp.salary || 0).toLocaleString()}/yr</b></span>
                  </div>
                </div>

                {/* Allowed Modules Tags */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Active Modules</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{emp.allowedModules?.length || 10} Granted</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(emp.allowedModules || ['dashboard', 'attendance', 'leaves', 'tasks']).slice(0, 4).map((modId: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[9px] text-slate-600 dark:text-slate-400 font-medium capitalize">
                        {modId.replace('_', ' ')}
                      </span>
                    ))}
                    {(emp.allowedModules?.length || 0) > 4 && (
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[9px] text-slate-500 font-medium">
                        +{(emp.allowedModules?.length || 0) - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewingEmp(emp)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Dossier</span>
                </button>

                <button
                  type="button"
                  onClick={() => openChatWithUser(emp.id)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-all"
                  title={`Direct Message ${emp.name}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>

                {role === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenPermissions(emp)}
                      className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 text-[11px] font-bold flex items-center justify-center cursor-pointer transition-all"
                      title="Assign Access & Permissions"
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(emp)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-all"
                      title="Edit Employee Information"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 cursor-pointer transition-all"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Dense Data Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Department & Position</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Salary</th>
                  <th className="p-3.5">Modules</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-800 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <p className="font-medium text-slate-900 dark:text-white">{emp.position}</p>
                      <p className="text-[11px] text-slate-500">{emp.department}</p>
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        emp.auxStatus === 'Available' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        emp.auxStatus === 'Break' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                        emp.auxStatus === 'Meeting' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          emp.auxStatus === 'Available' ? 'bg-emerald-500' :
                          emp.auxStatus === 'Break' ? 'bg-amber-500' :
                          emp.auxStatus === 'Meeting' ? 'bg-purple-500' : 'bg-slate-400'
                        }`} />
                        {emp.auxStatus || 'Available'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        emp.role === 'admin'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-slate-900 dark:text-white">
                      ${(emp.salary || 0).toLocaleString()}/yr
                    </td>
                    <td className="p-3.5 text-slate-500">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{emp.allowedModules?.length || 10}</span> active
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingEmp(emp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="View Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openChatWithUser(emp.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title={`Direct Message ${emp.name}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {role === 'admin' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenPermissions(emp)}
                              className="p-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 cursor-pointer"
                              title="Permissions"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(emp.id, emp.name)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Employee */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Employee Login">
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          {provisioningError && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
              {provisioningError}
            </div>
          )}
          {/* Profile Photo Selector / Upload */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Employee Profile Photo</span>
              <span className="text-[10px] text-slate-400">Select preset or paste URL</span>
            </label>
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="Avatar preview"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500 shrink-0"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {sampleAvatars.map((sa, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(sa)}
                      className={`w-7 h-7 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        avatar === sa ? 'border-emerald-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={sa} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Johnathan Doe"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Corporate Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jdoe@vernika.io"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Date of Birth (For Calendar Celebrations)</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Work Anniversary / Joining Date</label>
              <input
                type="date"
                value={workAnniversary}
                onChange={(e) => setWorkAnniversary(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              >
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Emergency Contact Person</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Parent / Spouse Name"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Emergency Phone</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+1 (555) 000-1122"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-semibold">Core Skills & Technical Expertise (comma separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="TypeScript, React, Cloud Architecture, DevOps"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-semibold">Professional Biography & Notes</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio or key achievements..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Login Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jdoe (defaults to email prefix)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Initial Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Department</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              >
                {uniqueDepartments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Job Position *</label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Role</label>
                <select value={empRole} onChange={(e) => setEmpRole(e.target.value as UserRole)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500">
                  <option value="employee">Employee</option><option value="department_head">Department Head</option><option value="supervisor">Supervisor</option><option value="hr_manager">HR Manager</option><option value="admin">Admin</option>
                </select>
              </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Employment Type</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as Employee['employmentType'])} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                <option>Full Time</option><option>Part Time</option><option>Internship</option><option>FTC</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Supervisor</label>
              <select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                <option value="">Unassigned</option>{employees.filter((employee) => employee.id !== editingEmp?.id).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Team Members</label>
              <select multiple value={teamMemberIds} onChange={(e) => setTeamMemberIds(Array.from(e.target.selectedOptions, (option) => option.value))} className="w-full h-20 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white">
                {employees.filter((employee) => employee.id !== editingEmp?.id).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Annual Salary ($)</label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              Save Employee & Enable Login
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Employee */}
      {editingEmp && (
        <Modal isOpen={!!editingEmp} onClose={() => setEditingEmp(null)} title={`Edit Employee: ${editingEmp.name}`}>
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {/* Profile Photo Selector / Upload */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Update Profile Photo</span>
                <span className="text-[10px] text-slate-400">Select preset or paste custom photo URL</span>
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={avatar}
                  alt="Avatar preview"
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500 shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {sampleAvatars.map((sa, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(sa)}
                        className={`w-7 h-7 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                          avatar === sa ? 'border-emerald-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={sa} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Birth Date (For Calendar)</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Work Anniversary / Joining Date</label>
                <input
                  type="date"
                  value={workAnniversary}
                  onChange={(e) => setWorkAnniversary(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Emergency Contact</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Spouse / Parent Name"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Emergency Phone</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+1 (555) 000-1122"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Core Skills & Technical Expertise</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="TypeScript, React, Cloud Architecture"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Professional Biography & Notes</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short bio or key achievements..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Reset Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Department</label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                >
                  {uniqueDepartments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Position</label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Role</label>
                <select
                  value={empRole}
                  onChange={(e: any) => setEmpRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="employee">Employee</option>
                  <option value="department_head">Department Head</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Salary ($)</label>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingEmp(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Assign Module Access & Work Permissions */}
      {permissionsEmp && (
        <Modal 
          isOpen={!!permissionsEmp} 
          onClose={() => setPermissionsEmp(null)} 
          title={`Assign Access & Work Permissions: ${permissionsEmp.name}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              As an Administrator, choose which functional modules and portals this employee can view and work on. Changes take effect across live employee sessions immediately.
            </p>

            {savePermSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Access permissions successfully updated & synchronized in real-time!</span>
              </div>
            )}

            {/* Modules Checkbox Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">Allowed Workspace Modules</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModules(ALL_AVAILABLE_MODULES.map(m => m.id))}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-400">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedModules(['dashboard', 'tasks', 'chat'])}
                    className="text-[10px] text-slate-500 dark:text-slate-400 hover:underline font-semibold cursor-pointer"
                  >
                    Minimal
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 pr-2">
                {ALL_AVAILABLE_MODULES.map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  return (
                    <div
                      key={mod.id}
                      onClick={() => toggleModuleSelection(mod.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        isChecked 
                          ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-300 dark:border-purple-500/40 text-purple-900 dark:text-white shadow-2xs' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center border transition-all ${
                        isChecked ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="font-bold text-xs">{mod.label}</p>
                        <p className="text-[10px] text-slate-500 leading-tight">{mod.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {permissionsEmp.role === 'department_head' && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-600 dark:text-emerald-400">Department Access Tree: {permissionsEmp.department}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">These are the only modules this Department Head may delegate to team members and interns. Their own access is controlled above.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 pr-2">
                  {ALL_AVAILABLE_MODULES.map((mod) => {
                    const checked = grantableModules.includes(mod.id);
                    return <button type="button" key={`grant-${mod.id}`} onClick={() => setGrantableModules(prev => checked ? prev.filter(id => id !== mod.id) : [...prev, mod.id])} className={`text-left p-2 rounded-lg border text-[11px] ${checked ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-800'}`} aria-pressed={checked}>
                      <span className="font-semibold">{checked ? '✓ ' : ''}{mod.label}</span>
                    </button>;
                  })}
                </div>
              </div>
            )}
            {/* Login Account Access Status & Password Reset */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Account Login Access</label>
                <select
                  value={permLoginEnabled ? 'enabled' : 'disabled'}
                  onChange={(e) => setPermLoginEnabled(e.target.value === 'enabled')}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="enabled">Active (Login Enabled)</option>
                  <option value="disabled">Suspended (Access Revoked)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Update Password</label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Full Roster Access Privilege */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Full Team Working & Leave Roster Access</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Allow employee to view entire company roster (otherwise restricted to self & department)</p>
                </div>
                <input
                  type="checkbox"
                  checked={canViewFullRosterInput}
                  onChange={(e) => setCanViewFullRosterInput(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-900 cursor-pointer"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPermissionsEmp(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                Save & Apply Permissions
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: View Full Employee Dossier */}
      {viewingEmp && (() => {
        const canSeePrivate = role === 'admin' || user?.id === viewingEmp?.id;
        return (
          <Modal
            isOpen={!!viewingEmp}
            onClose={() => setViewingEmp(null)}
            title={`Employee Dossier: ${viewingEmp.name}`}
          >
            <div className="space-y-4 text-xs">
              {/* Header Profile Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
                <img
                  src={viewingEmp.avatar}
                  alt={viewingEmp.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/50"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{viewingEmp.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {viewingEmp.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{viewingEmp.position}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">{viewingEmp.employeeId} • {viewingEmp.department}</p>
                </div>
              </div>

              {/* Key Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Gift className="w-3 h-3 text-pink-500" /> Birthday
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">{viewingEmp.birthDate || 'August 20'}</p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Award className="w-3 h-3 text-indigo-500" /> Work Anniversary
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">{viewingEmp.workAnniversary || viewingEmp.joinDate}</p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500" /> Blood Group
                  </span>
                  {canSeePrivate ? (
                    <p className="font-bold text-slate-900 dark:text-white">{viewingEmp.bloodGroup || 'O+'}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">🔒 Restricted</p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> Work Email
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{viewingEmp.email}</p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Phone
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">{viewingEmp.phone}</p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Annual Compensation
                  </span>
                  {canSeePrivate ? (
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">${(viewingEmp.salary || 0).toLocaleString()}/yr</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">🔒 Restricted (Admin)</p>
                  )}
                </div>
              </div>

              {/* Bio & Skills */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                {viewingEmp.bio && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Professional Biography</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      {viewingEmp.bio}
                    </p>
                  </div>
                )}

                {viewingEmp.skills && viewingEmp.skills.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Core Skills & Expertise</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {viewingEmp.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {canSeePrivate && (viewingEmp.emergencyContact || viewingEmp.emergencyPhone) && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Emergency Contact</span>
                      <p className="font-bold text-xs">{viewingEmp.emergencyContact || 'Family Primary'}</p>
                    </div>
                    <p className="font-mono text-xs font-bold">{viewingEmp.emergencyPhone || '+1 (555) 998-1122'}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewingEmp(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};
