import React, { useState } from 'react';
import {
  Layers,
  Clock,
  DollarSign,
  Calendar,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Save,
  UserCheck,
  Building,
  TrendingUp,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { EmployeeWorkflowProfile } from '../types';

export const WorkflowManagementScreen: React.FC = () => {
  const {
    employees,
    workflowProfiles,
    updateWorkflowProfile,
    projects,
    tasks
  } = useApp();
  const { role, user } = useAuth();

  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    role === 'employee' && user ? user.id : (employees[0]?.id || '')
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'shifts' | 'payout' | 'projects' | 'roster'>('shifts');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active selected employee
  const selectedEmp = employees.find((e) => e.id === selectedEmpId) || employees[0];
  
  // Find or construct workflow profile
  const existingProfile = workflowProfiles.find((w) => w.employeeId === selectedEmp?.id);

  // Local state for editable workflow profile
  const [profileData, setProfileData] = useState<EmployeeWorkflowProfile>(() => {
    if (existingProfile) return existingProfile;
    return {
      id: `wf-${selectedEmp?.id || 'unassigned'}`,
      employeeId: selectedEmp?.id || '',
      employeeName: selectedEmp?.name || 'Staff Member',
      department: selectedEmp?.department || 'Engineering & Technology',
      position: selectedEmp?.position || 'Specialist',
      shiftType: 'General',
      shiftStartTime: '09:00 AM',
      shiftEndTime: '06:00 PM',
      gracePeriodMinutes: 15,
      weeklyOffDays: ['Saturday', 'Sunday'],
      overtimeEligible: true,
      overtimeRateMultiplier: 1.5,
      overtimeHoursMonth: 8.0,
      leaveQuotaTotal: 24,
      leaveQuotaUsed: 3,
      monthlyBaseSalary: selectedEmp?.salary ? selectedEmp.salary / 12 : 7500,
      monthlyBonus: 800,
      monthlyIncentives: 400,
      taxDeduction: 1200,
      pfDeduction: 450,
      healthInsuranceDeduction: 200,
      otherDeductions: 0,
      netMonthlyPayout: 7050,
      assignedProjects: [
        {
          projectId: 'proj-1',
          projectName: 'Vernika Enterprise Cloud 2.0',
          role: 'Contributor',
          status: 'Active',
          sprintVelocity: 94,
          tasksCompleted: 18,
          assignedDate: '2024-01-10'
        }
      ],
      shiftRoster: {}
    };
  });

  // When selected employee changes, refresh profileData
  React.useEffect(() => {
    if (!selectedEmp) return;
    const match = workflowProfiles.find((w) => w.employeeId === selectedEmp.id);
    if (match) {
      setProfileData(match);
    } else {
      setProfileData({
        id: `wf-${selectedEmp.id}`,
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.name,
        department: selectedEmp.department,
        position: selectedEmp.position,
        shiftType: 'General',
        shiftStartTime: '09:00 AM',
        shiftEndTime: '06:00 PM',
        gracePeriodMinutes: 15,
        weeklyOffDays: ['Saturday', 'Sunday'],
        overtimeEligible: true,
        overtimeRateMultiplier: 1.5,
        overtimeHoursMonth: 6.0,
        leaveQuotaTotal: 24,
        leaveQuotaUsed: 2,
        monthlyBaseSalary: selectedEmp.salary ? Math.round(selectedEmp.salary / 12) : 7500,
        monthlyBonus: 750,
        monthlyIncentives: 300,
        taxDeduction: 1100,
        pfDeduction: 400,
        healthInsuranceDeduction: 180,
        otherDeductions: 0,
        netMonthlyPayout: 7070,
        assignedProjects: [
          {
            projectId: 'proj-1',
            projectName: 'Vernika Enterprise Cloud 2.0',
            role: 'Contributor',
            status: 'Active',
            sprintVelocity: 92,
            tasksCompleted: 15,
            assignedDate: '2024-01-10'
          }
        ],
        shiftRoster: {}
      });
    }
  }, [selectedEmpId, workflowProfiles, selectedEmp]);

  // Dynamic Net Payout calculation
  const calculatedNetPayout = React.useMemo(() => {
    const gross = (profileData.monthlyBaseSalary || 0) + (profileData.monthlyBonus || 0) + (profileData.monthlyIncentives || 0);
    const deductions = (profileData.taxDeduction || 0) + (profileData.pfDeduction || 0) + (profileData.healthInsuranceDeduction || 0) + (profileData.otherDeductions || 0);
    return Math.max(0, gross - deductions);
  }, [
    profileData.monthlyBaseSalary,
    profileData.monthlyBonus,
    profileData.monthlyIncentives,
    profileData.taxDeduction,
    profileData.pfDeduction,
    profileData.healthInsuranceDeduction,
    profileData.otherDeductions
  ]);

  const handleSaveProfile = async () => {
    const payload = {
      ...profileData,
      netMonthlyPayout: calculatedNetPayout,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    await updateWorkflowProfile(profileData.employeeId, payload);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!emp) return false;
    const s = (searchTerm || '').toLowerCase();
    const name = (emp.name || '').toLowerCase();
    const pos = (emp.position || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const matchesSearch = !s || name.includes(s) || pos.includes(s) || dept.includes(s);
    const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = ['All', ...Array.from(new Set(employees.map((e) => e.department).filter(Boolean)))];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleWeeklyOff = (day: string) => {
    const current = profileData.weeklyOffDays || [];
    if (current.includes(day)) {
      setProfileData({ ...profileData, weeklyOffDays: current.filter((d) => d !== day) });
    } else {
      setProfileData({ ...profileData, weeklyOffDays: [...current, day] });
    }
  };

  // Next 7 days roster dates
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  const updateRosterShift = (dateStr: string, shiftName: string) => {
    setProfileData({
      ...profileData,
      shiftRoster: {
        ...(profileData.shiftRoster || {}),
        [dateStr]: shiftName
      }
    });
  };

  return (
    <div className="space-y-6 pb-12 text-slate-900 dark:text-slate-100" id="workflow-management-screen">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Employee Workflow, Rostering & Monthly Payouts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Rule Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure shift policies, grace thresholds, automated monthly payout calculations, and project sprint assignments.
            </p>
          </div>
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> Changes Synced!
              </span>
            )}
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Deploy Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Staff Directory Selector on Left + Detail Configuration on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Employee Selector */}
        {role === 'admin' && (
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Staff Members ({filteredEmployees.length})
                </h3>
              </div>

              {/* Search & Department Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, role, dept..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept} className="dark:bg-slate-800">
                        Dept: {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Employee List */}
              <div className="max-h-[460px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {filteredEmployees.map((emp) => {
                  const isSelected = emp.id === selectedEmpId;
                  const empWf = workflowProfiles.find((w) => w.employeeId === emp.id);

                  return (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmpId(emp.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-800'
                      }`}
                    >
                      <img
                        src={emp.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                        alt={emp.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-900 dark:text-white'}`}>
                            {emp.name}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            {empWf?.shiftType || 'General'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {emp.position} • {emp.department}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Workflow Configurator */}
        <div className={role === 'admin' ? 'lg:col-span-8 space-y-5' : 'lg:col-span-12 space-y-5'}>
          {/* Selected Employee Summary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={selectedEmp?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                alt={selectedEmp?.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500/30 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedEmp?.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    {selectedEmp?.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ID: {selectedEmp?.id} • {selectedEmp?.position} • {selectedEmp?.department}
                </p>
              </div>
            </div>

            {/* Quick KPI pills */}
            <div className="flex items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Leave Balance</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {(profileData.leaveQuotaTotal || 24) - (profileData.leaveQuotaUsed || 0)} Days
                </p>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400">Est. Net Payout</p>
                <p className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                  ${calculatedNetPayout.toLocaleString()}/mo
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { id: 'shifts', label: 'Shift Rules & Timing', icon: Clock },
              { id: 'payout', label: 'Monthly Payout Engine', icon: DollarSign },
              { id: 'projects', label: 'Project Allocation', icon: FolderKanban },
              { id: 'roster', label: '7-Day Shift Roster', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Shift Rules & Timing */}
          {activeTab === 'shifts' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Standard Shift Configuration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Designate shift schedules, grace arrival thresholds, and overtime multiplier policies.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shift Type</label>
                  <select
                    value={profileData.shiftType}
                    onChange={(e) => setProfileData({ ...profileData, shiftType: e.target.value as any })}
                    disabled={role !== 'admin'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="General">General (9:00 AM - 6:00 PM)</option>
                    <option value="Morning">Morning (7:00 AM - 4:00 PM)</option>
                    <option value="Night">Night (10:00 PM - 7:00 AM)</option>
                    <option value="Rotational">Rotational Shift</option>
                    <option value="Flexible">Flexible Core Hours</option>
                    <option value="Custom">Custom Schedule</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shift Start Time</label>
                  <input
                    type="text"
                    value={profileData.shiftStartTime}
                    onChange={(e) => setProfileData({ ...profileData, shiftStartTime: e.target.value })}
                    disabled={role !== 'admin'}
                    placeholder="e.g. 09:00 AM"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shift End Time</label>
                  <input
                    type="text"
                    value={profileData.shiftEndTime}
                    onChange={(e) => setProfileData({ ...profileData, shiftEndTime: e.target.value })}
                    disabled={role !== 'admin'}
                    placeholder="e.g. 06:00 PM"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Grace Arrival Window</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={profileData.gracePeriodMinutes}
                      onChange={(e) => setProfileData({ ...profileData, gracePeriodMinutes: Number(e.target.value) })}
                      disabled={role !== 'admin'}
                      min={0}
                      max={60}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-500 shrink-0">Mins</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Overtime Eligibility</label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={profileData.overtimeEligible}
                        onChange={(e) => setProfileData({ ...profileData, overtimeEligible: e.target.checked })}
                        disabled={role !== 'admin'}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Eligible for OT</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">OT Multiplier</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={profileData.overtimeRateMultiplier}
                      onChange={(e) => setProfileData({ ...profileData, overtimeRateMultiplier: Number(e.target.value) })}
                      disabled={role !== 'admin'}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-500 shrink-0">x Rate</span>
                  </div>
                </div>
              </div>

              {/* Weekly Off Days Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Designated Weekly Off Days
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {daysOfWeek.map((day) => {
                    const isOff = (profileData.weeklyOffDays || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => role === 'admin' && toggleWeeklyOff(day)}
                        disabled={role !== 'admin'}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          isOff
                            ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {day} {isOff ? '(OFF)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Monthly Payout Engine */}
          {activeTab === 'payout' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Automated Monthly Payout & Compensation Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure monthly salary pillars, performance incentives, statutory withholdings, and health insurance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Earnings Column */}
                <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                    <span>Monthly Gross Earnings</span>
                    <TrendingUp className="w-4 h-4" />
                  </h4>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Monthly Base Salary ($)</label>
                      <input
                        type="number"
                        value={profileData.monthlyBaseSalary}
                        onChange={(e) => setProfileData({ ...profileData, monthlyBaseSalary: Number(e.target.value) })}
                        disabled={role !== 'admin'}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Performance & OKR Bonus ($)</label>
                      <input
                        type="number"
                        value={profileData.monthlyBonus}
                        onChange={(e) => setProfileData({ ...profileData, monthlyBonus: Number(e.target.value) })}
                        disabled={role !== 'admin'}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Sales / Delivery Incentives ($)</label>
                      <input
                        type="number"
                        value={profileData.monthlyIncentives}
                        onChange={(e) => setProfileData({ ...profileData, monthlyIncentives: Number(e.target.value) })}
                        disabled={role !== 'admin'}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center justify-between">
                    <span>Statutory & Custom Deductions</span>
                    <AlertCircle className="w-4 h-4" />
                  </h4>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Estimated Income Tax / TDS ($)</label>
                      <input
                        type="number"
                        value={profileData.taxDeduction}
                        onChange={(e) => setProfileData({ ...profileData, taxDeduction: Number(e.target.value) })}
                        disabled={role !== 'admin'}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Provident Fund / 401(k) ($)</label>
                      <input
                        type="number"
                        value={profileData.pfDeduction}
                        onChange={(e) => setProfileData({ ...profileData, pfDeduction: Number(e.target.value) })}
                        disabled={role !== 'admin'}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Corporate Health Insurance ($)</label>
                      <input
                        type="number"
                        value={profileData.healthInsuranceDeduction}
                        onChange={(e) => setProfileData({ ...profileData, healthInsuranceDeduction: Number(e.target.value) })}
                        disabled={role !== 'admin'}
                        className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payout Summary Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Net Take-Home Monthly Payout
                  </p>
                  <p className="text-2xl font-black text-indigo-900 dark:text-white mt-0.5">
                    ${calculatedNetPayout.toLocaleString()} <span className="text-xs font-medium text-slate-500">/ month</span>
                  </p>
                </div>

                <div className="text-xs text-indigo-800 dark:text-indigo-200 font-medium">
                  Annualized CTC: <span className="font-bold">${((profileData.monthlyBaseSalary || 0) * 12 + ((profileData.monthlyBonus || 0) + (profileData.monthlyIncentives || 0)) * 12).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Project Allocation */}
          {activeTab === 'projects' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Assigned Project Portfolio & Sprint Velocity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track active workstreams, sprint deliverables, and completed tasks for this staff member.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(profileData.assignedProjects || []).map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {proj.projectName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Role: <span className="font-semibold text-slate-700 dark:text-slate-300">{proj.role}</span>
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                        {proj.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400">Sprint Velocity</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{proj.sprintVelocity || 90}%</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Tasks Delivered</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{proj.tasksCompleted || 12} items</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 7-Day Shift Roster */}
          {activeTab === 'roster' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Upcoming 7-Day Shift Schedule
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Assign dynamic shifts or scheduled rest days across the coming week.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {next7Days.map((day) => {
                  const assignedShift = profileData.shiftRoster?.[day.dateStr] || profileData.shiftType || 'General';
                  const isOff = assignedShift === 'OFF' || (profileData.weeklyOffDays || []).includes(
                    new Date(day.dateStr).toLocaleDateString('en-US', { weekday: 'long' })
                  );

                  return (
                    <div
                      key={day.dateStr}
                      className={`p-3.5 rounded-2xl border text-center space-y-2 ${
                        isOff
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400">{day.dayName}</p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{day.formatted}</p>
                      </div>

                      {role === 'admin' ? (
                        <select
                          value={assignedShift}
                          onChange={(e) => updateRosterShift(day.dateStr, e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="General">General</option>
                          <option value="Morning">Morning</option>
                          <option value="Night">Night</option>
                          <option value="OFF">Weekly OFF</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${isOff ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'}`}>
                          {assignedShift}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
