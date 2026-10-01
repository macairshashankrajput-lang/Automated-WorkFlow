import React from 'react';
import {
  Layers,
  Database,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  Zap,
} from 'lucide-react';
import { UserAccount } from '../services/hybridDatabase';
import { AppTheme } from '../services/themeContext';

interface HeaderNavProps {
  currentUser: UserAccount;
  onOpenAuth: () => void;
  onOpenDBSync: () => void;
  syncing: boolean;
  onTriggerSync: () => void;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  onLogout: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentUser,
  onOpenAuth,
  onOpenDBSync,
  syncing,
  onTriggerSync,
  theme,
  setTheme,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
          <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Layers className="h-5 w-5 text-indigo-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white font-display">Automated Workflow</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Studio
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Softr Studio Workspace & Portfolio Hub</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Theme Switcher */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTheme('dark')}
            title="Dark Theme"
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
              theme === 'dark' ? 'bg-indigo-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme('midnight')}
            title="Midnight Cyber Theme"
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
              theme === 'midnight' ? 'bg-cyan-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          </button>
          <button
            onClick={() => setTheme('light')}
            title="Light Theme"
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
              theme === 'light' ? 'bg-amber-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme('cyberpunk')}
            title="Cyberpunk Theme"
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
              theme === 'cyberpunk' ? 'bg-rose-600 text-white shadow font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-rose-300" />
          </button>
        </div>

        {/* Hybrid Database Sync Status Button */}
        <button
          onClick={onOpenDBSync}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="h-3.5 w-3.5 text-indigo-400" />
          <span className="hidden md:inline">Hybrid DB: Active</span>
        </button>

        {/* Manual Sync Trigger */}
        <button
          onClick={onTriggerSync}
          disabled={syncing}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 transition-all disabled:opacity-50"
          title="Sync Google Drive, Sheets, Supabase & Firebase"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Active Account Switcher */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-xs font-medium text-slate-100 transition-all"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="h-6 w-6 rounded-full object-cover border border-indigo-400/40"
          />
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-100 leading-tight">{currentUser.name}</div>
            <div className="text-[10px] text-indigo-300 capitalize">{currentUser.role}</div>
          </div>
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-600/20 border border-slate-700/80 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 transition-all"
          title="Sign Out of Session"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
