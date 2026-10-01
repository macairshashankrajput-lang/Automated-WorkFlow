import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Bot,
  Users,
  Database,
  Building2,
  Building,
  Utensils,
  Globe,
  ChevronRight,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'portfolio'
  | 'workflow_builder'
  | 'copilot'
  | 'auth'
  | 'db_sync'
  | 'app_goldenprime'
  | 'app_vernika'
  | 'app_chaknastore'
  | 'app_website';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const mainNav = [
    { id: 'dashboard' as ActiveTab, label: 'Studio Overview', icon: LayoutDashboard },
    { id: 'portfolio' as ActiveTab, label: 'Application Portfolio', icon: Layers, badge: '4 Apps' },
    { id: 'workflow_builder' as ActiveTab, label: 'AI Workflow Studio', icon: Sparkles, badge: 'Softr' },
    { id: 'copilot' as ActiveTab, label: 'Vernika Copilot AI', icon: Bot },
    { id: 'auth' as ActiveTab, label: 'Accounts & Auth', icon: Users },
    { id: 'db_sync' as ActiveTab, label: 'Hybrid DB Sync', icon: Database },
  ];

  const appNav = [
    { id: 'app_goldenprime' as ActiveTab, label: 'GoldenPrime PG', icon: Building2, subtitle: 'PG & Rent Finance' },
    { id: 'app_vernika' as ActiveTab, label: 'Vernika Suite', icon: Building, subtitle: 'HR, CRM & Sheets' },
    { id: 'app_chaknastore' as ActiveTab, label: 'ChaknaStore', icon: Utensils, subtitle: 'Food Delivery App' },
    { id: 'app_website' as ActiveTab, label: 'Vernika Website', icon: Globe, subtitle: 'Corporate Lead Portal' },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6">
        {/* Navigation Section: Studio Workspace */}
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Studio Workspace
          </div>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Navigation Section: Portfolio Applications */}
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Integrated Applications
          </div>
          <nav className="space-y-1">
            {appNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-slate-800 text-indigo-400 border border-indigo-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.subtitle}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer info box */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px] mb-1">
            <Database className="h-3.5 w-3.5" />
            Drive & Cloud Hybrid DB
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Google Drive, Spreadsheets, Supabase & Firebase auto-sync enabled.
          </p>
        </div>
      </div>
    </aside>
  );
};
