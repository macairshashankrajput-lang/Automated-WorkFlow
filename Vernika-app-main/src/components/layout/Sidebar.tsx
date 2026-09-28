import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Clock,
  CalendarCheck,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Receipt,
  MessageSquare,
  Megaphone,
  Network,
  Sparkles,
  Settings,
  X,
  Activity,
  DollarSign,
  Video,
  CreditCard,
  Mail,
  CalendarDays,
  FileSpreadsheet,
  Gauge,
  Layers,
  FileText
} from 'lucide-react';
import { useApp, ScreenType } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';

interface NavItem {
  id: ScreenType;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  mgmtOnly?: boolean;
  badge?: string | number;
}

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { activeScreen, setActiveScreen, leaves, tasks, leads, emails, sheets } = useApp();
  const { role, user } = useAuth();

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const activeTasks = tasks.filter((t) => t.status !== 'Done').length;
  const activeLeads = leads.filter((l) => l.stage !== 'Closed Won' && l.stage !== 'Closed Lost').length;
  const unreadEmails = emails.filter((m) => m.folder === 'inbox' && !m.read).length;

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'sheets', label: 'Vernika Sheets', icon: FileSpreadsheet, badge: 'New' },
        { id: 'ai_assistant', label: 'Vernika AI Copilot', icon: Sparkles, badge: 'AI' },
      ],
    },
    {
      title: 'Communication & Mail',
      items: [
        { id: 'mail', label: 'Outlook Mail', icon: Mail, badge: unreadEmails > 0 ? unreadEmails : undefined },
        { id: 'calendar', label: 'Corporate Calendar', icon: CalendarDays },
        { id: 'meetings', label: 'Virtual Meeting Rooms', icon: Video, badge: 'Live' },
        { id: 'chat', label: 'Team Messenger', icon: MessageSquare },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
      ],
    },
    {
      title: 'Workforce & Telemetry',
      items: [
        { id: 'tracking', label: 'Staff Performance Tracking', icon: Gauge, badge: 'Live', mgmtOnly: true },
        { id: 'employees', label: 'Employee Directory', icon: Users, adminOnly: true },
        { id: 'workflow', label: 'Workflow & Rostering', icon: Layers, badge: 'HR', mgmtOnly: true },
        { id: 'documents', label: 'Employee Documents', icon: FileText, badge: 'New' },
        { id: 'aux_status', label: 'AUX Telemetry & Staff', icon: Activity, badge: 'Live', mgmtOnly: true },
        { id: 'attendance', label: 'Attendance & Clock', icon: Clock },
        { id: 'leaves', label: 'Leave Requests', icon: CalendarCheck, badge: pendingLeaves > 0 ? pendingLeaves : undefined },
        { id: 'departments', label: 'Departments', icon: Building2, adminOnly: true },
        { id: 'positions', label: 'Positions & Roles', icon: Briefcase, adminOnly: true },
        { id: 'orgtree', label: 'Organization Tree', icon: Network },
      ],
    },
    {
      title: 'Projects & Tasks',
      items: [
        { id: 'projects', label: 'Projects Portfolio', icon: FolderKanban },
        { id: 'tasks', label: 'Task Kanban Board', icon: CheckSquare, badge: activeTasks },
      ],
    },
    {
      title: 'Financial & Compensation',
      items: [
        { id: 'clients', label: 'Client Accounts & CRM', icon: Building2, adminOnly: true },
        { id: 'invoicing', label: 'Invoices & Billing', icon: Receipt, adminOnly: true },
        { id: 'payroll', label: 'Payroll & Payslips', icon: DollarSign },
        { id: 'expenses', label: 'Expenses & Claims', icon: CreditCard },
        { id: 'crm', label: 'Sales Leads Pipeline', icon: TrendingUp, badge: activeLeads, adminOnly: true },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'settings', label: 'Settings & Config', icon: Settings, adminOnly: true },
      ],
    },
  ];

  const sidebarContent = (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 flex flex-col shrink-0 select-none h-screen sticky top-0 transition-colors">
      {/* Brand Header with Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800/80">
        <Logo size="md" />
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
        {sections.map((section, sIdx) => {
          // Filter items based on role and allowedModules
          const visibleItems = section.items.filter((item) => {
            if (role === 'admin') return true;
            const grantedModules = Array.isArray(user?.allowedModules) ? user.allowedModules : [];
            // Grants are authoritative for every non-admin profile. This prevents
            // default navigation from overriding an Admin's explicit selection.
            return grantedModules.includes(item.id);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveScreen(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-500/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badge === 'AI'
                              ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50'
                              : item.badge === 'Live'
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 animate-pulse'
                              : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/80">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Multi-User Sync</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Online</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <div className="hidden md:block shrink-0">{sidebarContent}</div>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
