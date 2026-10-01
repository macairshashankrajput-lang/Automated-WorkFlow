import React from 'react';
import {
  Sparkles,
  Layers,
  Database,
  Building2,
  Building,
  Utensils,
  Globe,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Bot,
  Users,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { GOOGLE_DRIVE_FOLDER_URL, SERVICE_ACCOUNT_EMAIL } from '../services/hybridDatabase';

interface StudioOverviewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const StudioOverview: React.FC<StudioOverviewProps> = ({ onNavigate }) => {
  const stats = [
    { label: 'Portfolio Applications', value: '4 Active', icon: Layers, color: 'from-indigo-500 to-indigo-600' },
    { label: 'Hybrid DB Architecture', value: 'Drive + Cloud', icon: Database, color: 'from-cyan-500 to-blue-600' },
    { label: 'Unified User Accounts', value: '5 Roles', icon: Users, color: 'from-emerald-500 to-teal-600' },
    { label: 'Vernika AI Copilot', value: 'Offline Ready', icon: Bot, color: 'from-amber-500 to-orange-600' },
  ];

  const appCards = [
    {
      id: 'app_goldenprime' as ActiveTab,
      title: 'GoldenPrime PG Operations',
      category: 'Property & Financial Management',
      icon: Building2,
      metrics: '2 Buildings • 12 Rooms • ₹1.45L Collection',
      description: 'Mobile-first PG operations system for buildings, rooms, tenants, rent collections, expenses, and automated WhatsApp payment reminders.',
      dbBadge: 'Google Sheets & Drive DB',
    },
    {
      id: 'app_vernika' as ActiveTab,
      title: 'Vernika Business Suite',
      category: 'Enterprise ERP & Operations',
      icon: Building,
      metrics: '24 Employees • Vernika Sheets • CRM',
      description: 'Multi-user enterprise platform featuring HR, Excel-like spreadsheet workspace, attendance, payroll, CRM, virtual meetings, and task management.',
      dbBadge: 'Firebase & Supabase Sync',
    },
    {
      id: 'app_chaknastore' as ActiveTab,
      title: 'ChaknaStore Food Delivery',
      category: 'E-Commerce & Tiffin Subscriptions',
      icon: Utensils,
      metrics: '48 Orders/Day • 32 Tiffin Members',
      description: 'Food ordering platform with vendor management, daily tiffin subscriptions, catering request pipeline, and live order tracking.',
      dbBadge: 'Supabase Realtime DB',
    },
    {
      id: 'app_website' as ActiveTab,
      title: 'Vernika Corporate Portal',
      category: 'Marketing & Lead Generation',
      icon: Globe,
      metrics: 'High Conversion • Lead Automation',
      description: 'Official digital company portal featuring interactive product showcases, consultation booking, and automated lead capture.',
      dbBadge: 'Spreadsheet Lead Store',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Softr Dashboard Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Softr-Style Automated Workflow Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Automated Workflow Studio Dashboard
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Compose custom business applications, run real-time database sync across Google Drive, Google Spreadsheets, Supabase, and Firebase, and launch any of our 4 portfolio applications from a single unified hub.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('workflow_builder')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Compose New Workflow
            </button>
            <button
              onClick={() => onNavigate('copilot')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all"
            >
              <Bot className="h-4 w-4 text-amber-400" />
              Ask Vernika Copilot
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                <div className="text-base font-extrabold text-white">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Portfolio Applications Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Portfolio Applications</h2>
            <p className="text-xs text-slate-400">Integrated sub-applications ready for feature composition and launch</p>
          </div>
          <button
            onClick={() => onNavigate('portfolio')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            View All Applications <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appCards.map((app) => {
            const Icon = app.icon;
            return (
              <div
                key={app.id}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {app.title}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium">{app.category}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {app.dbBadge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{app.description}</p>
                  <div className="text-[11px] font-semibold text-indigo-300/90 bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-900/40">
                    {app.metrics}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Synchronized & Booted
                  </span>
                  <button
                    onClick={() => onNavigate(app.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/20"
                  >
                    Launch Application <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Database Connection Info Box */}
      <div className="rounded-2xl glass-panel p-5 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <HardDrive className="h-4 w-4 text-cyan-400" />
          Configured Database & Google Service Credentials
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Service Account Email:</span>
            <div className="font-mono text-slate-200 truncate">{SERVICE_ACCOUNT_EMAIL}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Google Drive Backup Directory:</span>
            <a
              href={GOOGLE_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline block truncate"
            >
              Google Drive Backup Storage Folder
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
