import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Video,
  X,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
  CalendarDays,
  Gift,
  Cake,
  Award,
  Heart,
  CalendarCheck,
  Check,
  Ban,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CalendarEvent, LeaveRequest, Employee } from '../types';

export const CalendarScreen: React.FC = () => {
  const { calendarEvents, employees, leaves, departments, addCalendarEvent, deleteCalendarEvent, applyLeave, updateLeaveStatus, setActiveScreen } = useApp();
  const { user, role } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 16)); // August 2026
  const [activeTab, setActiveTab] = useState<'calendar' | 'roster'>('calendar');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  // New Event Modal State
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-08-20');
  const [newEventStartTime, setNewEventStartTime] = useState('10:00 AM');
  const [newEventEndTime, setNewEventEndTime] = useState('11:00 AM');
  const [newEventType, setNewEventType] = useState('Team Sync');
  const [newEventLocation, setNewEventLocation] = useState('Vernika Boardroom A / Video Room');
  const [newEventAttendees, setNewEventAttendees] = useState('');

  // Selected Event Details Modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Selected Roster Cell Details Modal
  const [selectedRosterCell, setSelectedRosterCell] = useState<{
    emp: any;
    dateStr: string;
    status: any;
  } | null>(null);

  // Schedule Leave / Corporate Holiday Modal State
  const [isScheduleLeaveModalOpen, setIsScheduleLeaveModalOpen] = useState(false);
  const [scheduleTargetType, setScheduleTargetType] = useState<'employee_leave' | 'company_holiday'>('employee_leave');
  const [scheduleLeaveEmpId, setScheduleLeaveEmpId] = useState('');
  const [scheduleLeaveType, setScheduleLeaveType] = useState<LeaveRequest['type']>('Paid Leave');
  const [scheduleLeaveStart, setScheduleLeaveStart] = useState('2026-08-20');
  const [scheduleLeaveEnd, setScheduleLeaveEnd] = useState('2026-08-21');
  const [scheduleLeaveReason, setScheduleLeaveReason] = useState('Vacation / Personal Time-Off');
  const [scheduleHolidayTitle, setScheduleHolidayTitle] = useState('Vernika Corporate Holiday');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 7, 16));
  };

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
      });
    }

    // Next month padding
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate) return;

    await addCalendarEvent({
      title: newEventTitle,
      date: newEventDate,
      time: `${newEventStartTime} - ${newEventEndTime}`,
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      type: newEventType,
      location: newEventLocation,
      attendees: newEventAttendees.split(',').map((a) => a.trim()),
      status: 'Confirmed',
    });

    setIsNewEventModalOpen(false);
    setNewEventTitle('');
  };

  // Compute birthdays and anniversaries from employees
  const celebrationEvents = useMemo(() => {
    const list: CalendarEvent[] = [];
    const processedBirthdays = new Set<string>();
    const processedAnnivs = new Set<string>();

    (employees || []).forEach((emp) => {
      if (!emp || !emp.id) return;
      if (emp.birthDate && !processedBirthdays.has(emp.id)) {
        processedBirthdays.add(emp.id);
        const parts = emp.birthDate.split('-');
        if (parts.length === 3) {
          const bMonth = parts[1];
          const bDay = parts[2];
          const dateStr = `${year}-${bMonth}-${bDay}`;
          list.push({
            id: `bday-${emp.id}-${dateStr}`,
            title: `🎂 Birthday: ${emp.name}`,
            date: dateStr,
            time: 'All Day',
            startTime: '09:00 AM',
            endTime: '05:00 PM',
            type: 'Birthday',
            location: `${emp.department} • Vernika Celebration`,
            attendees: [emp.name, emp.managerName || 'Team'],
            status: 'Confirmed',
          });
        }
      }
      if ((emp.workAnniversary || emp.joinDate) && !processedAnnivs.has(emp.id)) {
        processedAnnivs.add(emp.id);
        const joinStr = emp.workAnniversary || emp.joinDate;
        const parts = joinStr.split('-');
        if (parts.length === 3) {
          const joinYear = parseInt(parts[0], 10);
          const aMonth = parts[1];
          const aDay = parts[2];
          const yearsCount = Math.max(1, year - joinYear);
          const dateStr = `${year}-${aMonth}-${aDay}`;
          list.push({
            id: `anniv-${emp.id}-${dateStr}`,
            title: `🎉 ${yearsCount}-Yr Work Anniversary: ${emp.name}`,
            date: dateStr,
            time: 'All Day',
            startTime: '09:00 AM',
            endTime: '05:00 PM',
            type: 'Work Anniversary',
            location: `${emp.position} • Vernika Team Milestone`,
            attendees: [emp.name, 'Company Wide'],
            status: 'Confirmed',
          });
        }
      }
    });
    return list;
  }, [employees, year]);

  const allCalendarEvents = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    (calendarEvents || []).forEach((e) => {
      if (e && e.id) map.set(e.id, e);
    });
    celebrationEvents.forEach((e) => {
      if (e && e.id) map.set(e.id, e);
    });
    return Array.from(map.values());
  }, [calendarEvents, celebrationEvents]);

  const getEventsForDate = (dayNum: number, m: number, y: number) => {
    const formattedMonth = String(m + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${y}-${formattedMonth}-${formattedDay}`;

    return allCalendarEvents.filter((evt) => {
      if (selectedCategory && evt.type !== selectedCategory) return false;
      return evt.date === dateStr;
    });
  };

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'Executive Review':
        return 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30';
      case 'Client Call':
        return 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/30';
      case 'All Hands':
        return 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30';
      case 'Team Sync':
        return 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/30';
      case 'Birthday':
        return 'bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-500/30 font-bold';
      case 'Work Anniversary':
        return 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30 font-bold';
      default:
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30';
    }
  };

  const currentEmpRecord = employees?.find((e) => {
    if (!e) return false;
    const userEmail = (user?.email || '').toLowerCase();
    const userName = (user?.name || '').toLowerCase();
    const eEmail = (e.email || '').toLowerCase();
    const eName = (e.name || '').toLowerCase();
    return (userEmail && eEmail && userEmail === eEmail) || (userName && eName && userName === eName);
  });

  const canViewFull = role === 'admin' || user?.role === 'admin' || currentEmpRecord?.canViewFullRoster === true;

  // Unique employees list for dropdowns
  const uniqueEmployeesList = useMemo(() => {
    return Array.from(new Map((employees || []).filter(e => e && e.id).map(e => [e.id, e])).values());
  }, [employees]);

  // Unique departments list for filter
  const departmentList = useMemo(() => {
    const depts = new Set<string>();
    (departments || []).forEach((d) => {
      if (d?.name) depts.add(d.name);
    });
    (employees || []).forEach((e) => {
      if (e?.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [departments, employees]);

  // Filtered employees for roster
  const filteredEmployeesForRoster = useMemo(() => {
    let baseList = uniqueEmployeesList;

    if (!canViewFull) {
      const myName = (user?.name || '').toLowerCase();
      const myManagerName = (currentEmpRecord?.managerName || '').toLowerCase();

      baseList = baseList.filter((e) => {
        if (!e) return false;
        const eName = (e.name || '').toLowerCase();
        const eMgr = (e.managerName || '').toLowerCase();
        const isSelf = eName === myName || (user?.id && e.id === user.id);
        const isMyManager = myManagerName && eName === myManagerName;
        const isManagedByMe = eMgr === myName;
        return isSelf || isMyManager || isManagedByMe;
      });
    }

    if (departmentFilter === 'All') return baseList;
    return baseList.filter((e) => e && (e.department || '').toLowerCase() === departmentFilter.toLowerCase());
  }, [employees, departmentFilter, canViewFull, user, currentEmpRecord]);

  // Days in current month for roster matrix
  const rosterDays = useMemo(() => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const arr = [];
    for (let d = 1; d <= totalDays; d++) {
      const formattedM = String(month + 1).padStart(2, '0');
      const formattedD = String(d).padStart(2, '0');
      const dateStr = `${year}-${formattedM}-${formattedD}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      arr.push({ dayNum: d, dateStr, isWeekend });
    }
    return arr;
  }, [year, month]);

  const getEmployeeStatusForDate = (employeeId: string, employeeName: string, dateStr: string, isWeekend: boolean, empRecord?: Employee) => {
    // 1. First check if date has a company-wide holiday or corporate public holiday
    const companyHoliday = allCalendarEvents.find((evt) => {
      if (evt.date !== dateStr) return false;
      const t = (evt.type || '').toLowerCase();
      const title = (evt.title || '').toLowerCase();
      return t === 'holiday' || t === 'public holiday' || t === 'company holiday' || title.includes('holiday') || title.includes('office closed') || title.includes('wellness day');
    });
    if (companyHoliday) {
      return { 
        type: 'holiday', 
        label: `🎉 Company Holiday: ${companyHoliday.title}`, 
        color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-500/40 font-bold',
        details: companyHoliday 
      };
    }

    // 2. Check if employee has a celebration on this day (Birthday / Work Anniversary)
    const empCelebration = celebrationEvents.find((evt) => {
      return evt.date === dateStr && (
        (evt.attendees && evt.attendees.some(a => a.toLowerCase().includes(employeeName.toLowerCase()))) || 
        evt.title.toLowerCase().includes(employeeName.toLowerCase())
      );
    });
    if (empCelebration) {
      if (empCelebration.type === 'Birthday') {
        return { 
          type: 'birthday', 
          label: `🎂 ${empCelebration.title}`, 
          color: 'bg-pink-100 dark:bg-pink-500/20 text-pink-900 dark:text-pink-300 border-pink-300 dark:border-pink-500/40 font-bold',
          details: empCelebration 
        };
      }
      if (empCelebration.type === 'Work Anniversary') {
        return { 
          type: 'anniversary', 
          label: `⭐ ${empCelebration.title}`, 
          color: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40 font-bold',
          details: empCelebration 
        };
      }
    }

    // 3. Employee Leave check (matches by id, employeeId, or name)
    const matchingLeave = leaves.find((l) => {
      if (!l) return false;
      const eNameClean = (employeeName || '').toLowerCase().replace(/['\s]/g, '');
      const lNameClean = (l.employeeName || '').toLowerCase().replace(/['\s]/g, '');
      const matchesEmp = l.employeeId === employeeId || 
                         (empRecord && (l.employeeId === empRecord.employeeId || l.employeeId === empRecord.id)) ||
                         (lNameClean && eNameClean && (lNameClean === eNameClean || lNameClean.includes(eNameClean) || eNameClean.includes(lNameClean)));
      if (!matchesEmp) return false;
      const lStart = (l.startDate || '').slice(0, 10);
      const lEnd = (l.endDate || '').slice(0, 10);
      return dateStr >= lStart && dateStr <= lEnd;
    });

    if (matchingLeave) {
      if (matchingLeave.status === 'Pending') {
        return { 
          type: 'pending_leave', 
          label: `⏳ Pending Leave (${matchingLeave.type})`, 
          leaveId: matchingLeave.id, 
          color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 font-bold',
          leave: matchingLeave 
        };
      }
      if (matchingLeave.status === 'Approved') {
        if ((matchingLeave.type || '').toLowerCase().includes('half')) {
          return { 
            type: 'half_leave', 
            label: `🌗 Half-Day Leave (${matchingLeave.type})`, 
            leaveId: matchingLeave.id, 
            color: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40 font-bold',
            leave: matchingLeave 
          };
        }
        return { 
          type: 'planned_leave', 
          label: `🏖️ Planned Leave / Holiday (${matchingLeave.type})`, 
          leaveId: matchingLeave.id, 
          color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-500/40 font-bold',
          leave: matchingLeave 
        };
      }
      if (matchingLeave.status === 'Rejected') {
        return { 
          type: 'unapproved', 
          label: '❌ Rejected Leave Request', 
          leaveId: matchingLeave.id, 
          color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-500/40 font-bold',
          leave: matchingLeave 
        };
      }
    }

    if (isWeekend) {
      return { 
        type: 'weekoff', 
        label: '🛋️ Scheduled Weekoff', 
        color: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700' 
      };
    }

    return { 
      type: 'working', 
      label: '💼 Regular Working Day', 
      color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30' 
    };
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Corporate Calendar & Working Roster
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                Live Admin Sync
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">View team working calendar, planned leaves, weekoffs, half-leaves, and approve pending leave requests.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calendar' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              Calendar Events
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roster' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              Team Working & Leave Roster
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveScreen('meetings')}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Virtual Meeting Rooms</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewEventModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {activeTab === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Mini Sidebar (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Calendar Category Filter */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Categories</span>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  { name: 'Executive Review', color: 'bg-amber-500' },
                  { name: 'Client Call', color: 'bg-purple-500' },
                  { name: 'All Hands', color: 'bg-rose-500' },
                  { name: 'Team Sync', color: 'bg-blue-500' },
                  { name: 'Sprint Demo', color: 'bg-emerald-500' },
                  { name: 'Birthday', color: 'bg-pink-500' },
                  { name: 'Work Anniversary', color: 'bg-indigo-500' },
                ].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedCategory(selectedCategory === c.name ? null : c.name)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                      selectedCategory === c.name
                        ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-900 dark:text-white font-bold border border-emerald-200 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                      <span>{c.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {allCalendarEvents.filter((e) => e.type === c.name).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming Schedule Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                <span>Upcoming Agenda</span>
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </h3>

              <div className="space-y-2.5">
                {allCalendarEvents.slice(0, 6).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 hover:border-emerald-500/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${getCategoryColor(evt.type)}`}>
                        {evt.type}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{evt.date}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{evt.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{evt.time || evt.startTime}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Calendar Month View (9 cols) */}
          <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
            {/* Controls Bar: Month / Year + Nav Arrows + View Modes */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {monthNames[month]} {year}
                </h2>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToday}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'month' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'week' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'day' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Day
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-1">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Month Day Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((cell, idx) => {
                const dayEvents = getEventsForDate(cell.day, cell.month, cell.year);
                const isToday = cell.day === 16 && cell.month === 7 && cell.year === 2026;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      const formattedM = String(cell.month + 1).padStart(2, '0');
                      const formattedD = String(cell.day).padStart(2, '0');
                      setNewEventDate(`${cell.year}-${formattedM}-${formattedD}`);
                      setIsNewEventModalOpen(true);
                    }}
                    className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      cell.isCurrentMonth
                        ? 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-950 shadow-2xs'
                        : 'bg-slate-100/40 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-900 text-slate-400 dark:text-slate-600'
                    } ${isToday ? 'ring-2 ring-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-500/5' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-emerald-500 text-white'
                            : cell.isCurrentMonth
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Events list in cell */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border truncate font-medium ${getCategoryColor(evt.type)}`}
                          title={evt.title}
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold px-1">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Team Working & Leave Sharing Roster */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Team Working & Leave Sharing Roster ({monthNames[month]} {year})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shows planned leaves, weekoffs, working days, half-leaves, and pending leave approvals for all selected employees.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const formattedM = String(month + 1).padStart(2, '0');
                  setScheduleLeaveStart(`${year}-${formattedM}-20`);
                  setScheduleLeaveEnd(`${year}-${formattedM}-21`);
                  setScheduleLeaveEmpId(employees[0]?.id || '');
                  setIsScheduleLeaveModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Leave / Holiday</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Department:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="All">All Departments</option>
                  {departmentList.map((deptName) => (
                    <option key={`dept-filter-${deptName}`} value={deptName}>{deptName}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <button type="button" onClick={handlePrevMonth} className="text-slate-600 dark:text-slate-400 hover:text-white cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{monthNames[month]} {year}</span>
                <button type="button" onClick={handleNextMonth} className="text-slate-600 dark:text-slate-400 hover:text-white cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Pending Leave Requests Quick Review Banner */}
          {leaves.filter((l) => l.status === 'Pending').length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Pending Leave Requests Awaiting Admin Approval ({leaves.filter((l) => l.status === 'Pending').length})
                  </h4>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {leaves
                  .filter((l) => l.status === 'Pending')
                  .map((leave) => (
                    <div key={leave.id} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{leave.employeeName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-bold">
                          {leave.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {leave.startDate} to {leave.endDate} ({leave.days || 1} days)
                      </p>
                      <p className="text-[11px] text-slate-500 italic">"{leave.reason}"</p>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={async () => await updateLeaveStatus(leave.id, 'Rejected', 'Admin')}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => await updateLeaveStatus(leave.id, 'Approved', 'Admin')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Roster Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="p-3 sticky left-0 bg-slate-100 dark:bg-slate-950 z-10 min-w-[180px]">Employee</th>
                  {rosterDays.map((d) => (
                    <th key={d.dayNum} className={`p-2 text-center min-w-[42px] ${d.isWeekend ? 'bg-slate-200/50 dark:bg-slate-900/50 text-slate-400' : ''}`}>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {new Date(year, month, d.dayNum).toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </div>
                      <div>{d.dayNum}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredEmployeesForRoster.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                    <td className="p-3 sticky left-0 bg-white dark:bg-slate-900 z-10 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {(emp?.name || 'U').charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="truncate">{emp?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-500 font-normal truncate">{emp.position || emp.department}</div>
                      </div>
                    </td>

                    {rosterDays.map((d) => {
                      const st = getEmployeeStatusForDate(emp.id, emp.name, d.dateStr, d.isWeekend, emp);
                      return (
                        <td key={d.dayNum} className="p-1 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => setSelectedRosterCell({ emp, dateStr: d.dateStr, status: st })}
                            className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-bold border transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-2xs ${st.color}`}
                            title={`${emp.name} on ${d.dateStr}: ${st.label} (Click to inspect)`}
                          >
                            {st.type === 'working' ? '💼' : 
                             st.type === 'weekoff' ? '🛋️' : 
                             st.type === 'pending_leave' ? '⏳' : 
                             st.type === 'half_leave' ? '🌗' : 
                             st.type === 'holiday' ? '🎉' :
                             st.type === 'birthday' ? '🎂' :
                             st.type === 'anniversary' ? '⭐' :
                             st.type === 'unapproved' ? '❌' : '🏖️'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">Legend:</span>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-400" /> Working Day</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-800" /> Weekoff</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-400" /> Company Holiday</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-400" /> Planned Leave</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-400" /> Half Leave</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-400" /> Pending Approval</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pink-500/20 border border-pink-400" /> Birthday / Anniversary</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-400" /> Unapproved / Rejected</div>
          </div>
        </div>
      )}

      {/* New Event Modal */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Calendar Event</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEventModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Event Title</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Q3 Architecture Sync & Demo"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Date</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Category Type</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Team Sync">Team Sync</option>
                    <option value="Executive Review">Executive Review</option>
                    <option value="Client Call">Client Call</option>
                    <option value="All Hands">All Hands</option>
                    <option value="Sprint Demo">Sprint Demo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Start Time</label>
                  <input
                    type="text"
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">End Time</label>
                  <input
                    type="text"
                    value={newEventEndTime}
                    onChange={(e) => setNewEventEndTime(e.target.value)}
                    placeholder="11:00 AM"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Location / Video Link</label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="Vernika Boardroom A or Video Room"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Attendees (comma separated)</label>
                <input
                  type="text"
                  value={newEventAttendees}
                  onChange={(e) => setNewEventAttendees(e.target.value)}
                  placeholder="Enter attendee names or emails"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save to Calendar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getCategoryColor(selectedEvent.type)}`}>
                  {selectedEvent.type}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{selectedEvent.date}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{selectedEvent.time || `${selectedEvent.startTime} - ${selectedEvent.endTime}`}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{selectedEvent.location}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Attendees:</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">{selectedEvent.attendees.join(', ')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={async () => {
                  await deleteCalendarEvent(selectedEvent.id);
                  setSelectedEvent(null);
                }}
                className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold cursor-pointer"
              >
                Delete Event
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedEvent(null);
                  setActiveScreen('meetings');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Video className="w-4 h-4" />
                <span>Launch Video Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Roster Cell Details Modal */}
      {selectedRosterCell && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {(selectedRosterCell.emp?.name || 'U').charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedRosterCell.emp?.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedRosterCell.emp?.position || selectedRosterCell.emp?.department} • {selectedRosterCell.dateStr}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRosterCell(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Display Card */}
            <div className={`p-3.5 rounded-2xl border ${selectedRosterCell.status?.color || 'bg-slate-100 dark:bg-slate-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{selectedRosterCell.status?.label}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/50 dark:bg-black/30">
                  {selectedRosterCell.status?.type?.replace('_', ' ')}
                </span>
              </div>
              {selectedRosterCell.status?.leave && (
                <div className="mt-2 text-xs space-y-1 text-slate-800 dark:text-slate-200">
                  <p><strong>Duration:</strong> {selectedRosterCell.status.leave.startDate} to {selectedRosterCell.status.leave.endDate} ({selectedRosterCell.status.leave.days || 1} days)</p>
                  <p><strong>Reason:</strong> <em>"{selectedRosterCell.status.leave.reason}"</em></p>
                  <p><strong>Status:</strong> {selectedRosterCell.status.leave.status}</p>
                </div>
              )}
              {selectedRosterCell.status?.details && (
                <div className="mt-2 text-xs space-y-1 text-slate-800 dark:text-slate-200">
                  <p><strong>Event:</strong> {selectedRosterCell.status.details.title}</p>
                  <p><strong>Time:</strong> {selectedRosterCell.status.details.time || 'All Day Event'}</p>
                  <p><strong>Location:</strong> {selectedRosterCell.status.details.location || 'Company Wide'}</p>
                </div>
              )}
            </div>

            {/* Actions for Pending Leave */}
            {selectedRosterCell.status?.type === 'pending_leave' && selectedRosterCell.status?.leaveId && (
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={async () => {
                    await updateLeaveStatus(selectedRosterCell.status.leaveId, 'Rejected', 'Admin');
                    setSelectedRosterCell(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 cursor-pointer"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateLeaveStatus(selectedRosterCell.status.leaveId, 'Approved', 'Admin');
                    setSelectedRosterCell(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Leave</span>
                </button>
              </div>
            )}

            {/* Actions for Regular Working Day */}
            {selectedRosterCell.status?.type === 'working' && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setScheduleLeaveEmpId(selectedRosterCell.emp.id);
                    setScheduleLeaveStart(selectedRosterCell.dateStr);
                    setScheduleLeaveEnd(selectedRosterCell.dateStr);
                    setScheduleLeaveType('Casual');
                    setScheduleLeaveReason('Manager Approved Half-Day Off');
                    setSelectedRosterCell(null);
                    setIsScheduleLeaveModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 cursor-pointer"
                >
                  Grant Half-Day
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleLeaveEmpId(selectedRosterCell.emp.id);
                    setScheduleLeaveStart(selectedRosterCell.dateStr);
                    setScheduleLeaveEnd(selectedRosterCell.dateStr);
                    setScheduleLeaveType('Paid Leave');
                    setScheduleLeaveReason('Planned Leave / Vacation');
                    setSelectedRosterCell(null);
                    setIsScheduleLeaveModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  Schedule Leave
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Leave / Corporate Holiday Modal */}
      {isScheduleLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Leave or Corporate Holiday</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleLeaveModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (scheduleTargetType === 'company_holiday') {
                  if (!scheduleHolidayTitle || !scheduleLeaveStart) return;
                  await addCalendarEvent({
                    title: scheduleHolidayTitle,
                    date: scheduleLeaveStart,
                    time: 'All Day Event',
                    startTime: '09:00 AM',
                    endTime: '06:00 PM',
                    type: 'Holiday',
                    location: 'All Vernika Offices & Remote Workspaces (Closed)',
                    attendees: ['All Employees', 'Executive Staff'],
                    status: 'Confirmed',
                  });
                } else {
                  const targetEmp = employees.find(emp => emp.id === scheduleLeaveEmpId) || employees[0];
                  if (!targetEmp) return;
                  const daysCalc = Math.max(1, Math.round((new Date(scheduleLeaveEnd).getTime() - new Date(scheduleLeaveStart).getTime()) / (1000 * 60 * 60 * 24)) + 1);
                  await applyLeave({
                    employeeId: targetEmp.id,
                    employeeName: targetEmp.name,
                    type: scheduleLeaveType,
                    startDate: scheduleLeaveStart,
                    endDate: scheduleLeaveEnd,
                    days: daysCalc,
                    reason: scheduleLeaveReason,
                    appliedOn: new Date().toISOString().split('T')[0],
                  });
                }
                setIsScheduleLeaveModalOpen(false);
              }}
              className="p-5 space-y-4 text-xs"
            >
              {/* Type Switcher */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setScheduleTargetType('employee_leave')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    scheduleTargetType === 'employee_leave'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🏖️ Employee Time-Off / Leave
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleTargetType('company_holiday')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    scheduleTargetType === 'company_holiday'
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🎉 Company-Wide Holiday
                </button>
              </div>

              {scheduleTargetType === 'employee_leave' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Select Employee</label>
                    <select
                      value={scheduleLeaveEmpId}
                      onChange={(e) => setScheduleLeaveEmpId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    >
                      {uniqueEmployeesList.map((emp) => (
                        <option key={`sched-emp-${emp.id}`} value={emp.id}>
                          {emp.name} ({emp.department} - {emp.employeeId || emp.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Leave Type</label>
                    <select
                      value={scheduleLeaveType}
                      onChange={(e) => setScheduleLeaveType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="Paid Leave">Paid Annual Vacation</option>
                      <option value="Sick">Sick / Medical Leave</option>
                      <option value="Casual">Casual / Personal Time-Off</option>
                      <option value="Maternity">Maternity / Paternity Leave</option>
                      <option value="Unpaid">Unpaid Leave</option>
                      <option value="Annual">Annual Standard Leave</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">Start Date</label>
                      <input
                        type="date"
                        required
                        value={scheduleLeaveStart}
                        onChange={(e) => setScheduleLeaveStart(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-700 dark:text-slate-300 font-semibold">End Date</label>
                      <input
                        type="date"
                        required
                        value={scheduleLeaveEnd}
                        onChange={(e) => setScheduleLeaveEnd(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Reason / Notes</label>
                    <textarea
                      rows={2}
                      required
                      value={scheduleLeaveReason}
                      onChange={(e) => setScheduleLeaveReason(e.target.value)}
                      placeholder="e.g. Annual family holiday, medical appointment"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white resize-none focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Holiday Title</label>
                    <input
                      type="text"
                      required
                      value={scheduleHolidayTitle}
                      onChange={(e) => setScheduleHolidayTitle(e.target.value)}
                      placeholder="e.g. Vernika Innovation Day, Labor Day"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">Holiday Date</label>
                    <input
                      type="date"
                      required
                      value={scheduleLeaveStart}
                      onChange={(e) => setScheduleLeaveStart(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleLeaveModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Add to Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
