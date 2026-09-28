import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Clock, 
  Shield, 
  UserCheck, 
  Users,
  LogOut, 
  Sparkles, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  Menu,
  Activity,
  User,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
  Wifi,
  Radio,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../common/Logo';

export interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const { user, role, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { 
    attendance,
    employees,
    clockIn,
    clockOut, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    dismissNotification,
    setActiveScreen,
    isSyncing,
    lastSyncTime,
    syncStatus,
    syncError,
    forceRefreshSync
  } = useApp();
  
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const userTodayAttendance = attendance.find(
    (a) => a.employeeName === user?.name && a.date === today
  );
  const isClockedIn = !!userTodayAttendance && !userTodayAttendance.checkOut;

  // Deduplicate and filter notifications strictly for the active user session
  const uniqueNotifications = Array.from(
    notifications.reduce((map, notif) => {
      if (notif && notif.id) {
        map.set(notif.id, notif);
      }
      return map;
    }, new Map<string, typeof notifications[0]>()).values()
  );

  // Strict Privacy & Role Scoping
  const userNotifications = uniqueNotifications.filter((notif) => {
    if (!notif) return false;

    // 1. Never show notifications sent by this user to themselves
    if (user?.id && notif.senderId && notif.senderId === user.id) return false;
    if (user?.name && notif.senderName && notif.senderName === user.name && notif.category === 'message') return false;

    // 2. Direct user targeting
    if (notif.targetUserId) {
      if (notif.targetUserId === 'all') return true;
      if (user?.id && notif.targetUserId === user.id) return true;
      if (user?.email && notif.targetUserId.toLowerCase() === user.email.toLowerCase()) return true;
      const targetedEmployee = employees.find((employee) =>
        employee.id === notif.targetUserId || employee.employeeId === notif.targetUserId
      );
      if (targetedEmployee?.email && targetedEmployee.email.toLowerCase() === user?.email?.toLowerCase()) return true;
      return false;
    }

    // 3. Role targeting
    if (notif.targetRole) {
      if (notif.targetRole === 'all') return true;
      if (user?.role && notif.targetRole === user.role) return true;
      return false;
    }

    // 4. Department targeting
    if (notif.targetDepartment && notif.targetDepartment !== 'All' && user?.department) {
      if ((notif.targetDepartment || '').toLowerCase() === (user.department || '').toLowerCase()) return true;
      return false;
    }

    // 5. Untargeted notifications are workspace-wide system events. The sender
    // exclusion above prevents a user from seeing their own message echo.
    return true;
  });

  const unreadNotifs = userNotifications.filter((n) => !n.read);

  const handleClockToggle = () => {
    if (!user) return;
    if (isClockedIn) {
      clockOut(user.id || user.name);
    } else {
      clockIn(user.id || user.name, user.name, 'Office');
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Mobile Menu & Search Bar */}
      <div className="flex items-center gap-3 w-full max-w-md">
        {onOpenMobileSidebar && (
          <div className="flex items-center gap-2 md:hidden shrink-0">
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Logo size="sm" subtitle="" />
          </div>
        )}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees, tasks, deals, invoices, chats..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time Multi-Device Sync Indicator */}
        <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold ${
          syncStatus === 'healthy' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300' :
          syncStatus === 'syncing' ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300' :
          syncStatus === 'degraded' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300' :
          'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
        }`}>
          <span className={`w-2 h-2 rounded-full ${syncStatus === 'healthy' ? 'bg-emerald-500 animate-pulse' : syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : syncStatus === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'}`} />
          <span>{syncStatus === 'healthy' ? 'Live Sync' : syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'degraded' ? 'Degraded Sync' : 'Sync Error'}</span>
          <button
            type="button"
            onClick={() => forceRefreshSync()}
            title={`${syncError ? `${syncError} ` : ''}Last synced: ${lastSyncTime}. Click to force refresh.`}
            className="ml-1 p-0.5 rounded text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Shift Clock In/Out */}
        {role !== 'client' && (
          <button
            type="button"
            onClick={handleClockToggle}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              isClockedIn
                ? 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80'
            }`}
            title={isClockedIn ? `Clocked in at ${userTodayAttendance?.checkIn}` : 'Click to clock in today'}
          >
            <Clock className={`w-3.5 h-3.5 ${isClockedIn ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>{isClockedIn ? `Shift: ${userTodayAttendance?.checkIn}` : 'Punch Clock'}</span>
          </button>
        )}

        {/* Theme Switcher Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
          title={`Switch Theme (Current: ${theme})`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Vernika AI Quick Button */}
        <button
          type="button"
          onClick={() => setActiveScreen('ai_assistant')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Copilot</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
            title="System Notifications Stream"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-84 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 py-2">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Notifications</span>
                  {unreadNotifs.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold">
                      {unreadNotifs.length} new
                    </span>
                  )}
                </div>
                {unreadNotifs.length > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                {userNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No notifications for your profile
                  </div>
                ) : (
                  userNotifications.map((notif) => {
                    const targetScreen = notif.linkScreen || (notif.actionUrl ? notif.actionUrl.replace(/^\//, '') : null);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (targetScreen) setActiveScreen(targetScreen as any);
                          setShowNotifs(false);
                        }}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-start gap-3 ${
                          !notif.read ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : notif.type === 'warning' ? (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          ) : notif.type === 'alert' ? (
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Bell className="w-4 h-4 text-sky-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{notif.title}</p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(notif.id);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Dismiss notification"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.description || notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block font-mono">
                            {notif.time || 'Just now'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800 cursor-pointer"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-300 dark:ring-slate-700"
            />
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{user?.name}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono capitalize">{user?.role} Portal</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-800/60 text-[10px] uppercase font-bold">
                  {user?.role} Workspace
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveScreen('employees');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Employee Profile</span>
                </button>
                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveScreen('settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Organization Settings</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-2 cursor-pointer mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
