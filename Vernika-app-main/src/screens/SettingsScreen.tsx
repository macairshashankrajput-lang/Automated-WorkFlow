import React, { useEffect, useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Palette,
  Globe,
  Database,
  CheckCircle2,
  Lock,
  User,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  FileSignature,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { getWorkspaceConfig, syncAllWorkspaceSheets } from '../lib/firebase';

const DEFAULT_WORKSPACE_CONFIG = {
  spreadsheetId: '1IUhKLwiXsDqdQEsML9zu4kcYXE1taQsRcVeG8-T1inc',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1IUhKLwiXsDqdQEsML9zu4kcYXE1taQsRcVeG8-T1inc/edit',
  templates: {
    offer_letter: '1E2KWDpbu9z0eVy_4Ikx5EqOAyrO3niypk7ujVXlbY7Q',
    experience_letter: '1yYxSmmmBfjCJjo3NY6Yp_zxPxCjyXMakw1sUGoJh-2M',
    relieving_letter: '1YaBJlftb1TvyHYC8uoaOEmABEXSJ1yznv92xe3oxnKI',
    payslip: '1GtoCm1PvTc7az0Hs4ns7KZtWcDKF5B7uCF6F2aS6JM0',
    promotion_letter: '1wFZcST-g0gk0KYjMHrLk-aRpLb65KKozu-zTty7oibo',
    internship_offer: '1AUnHMNZlBxqD58K3V73979eCFPJnE-x6TWt1M-56nno',
  },
  secretValuesIncluded: false as const,
};

export const SettingsScreen: React.FC = () => {
  const { user, role, sessionTimeoutMinutes, setSessionTimeoutMinutes } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'data' | 'workspace'>('general');
  const [workspaceConfig, setWorkspaceConfig] = useState<typeof DEFAULT_WORKSPACE_CONFIG | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [workspaceRefreshState, setWorkspaceRefreshState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [workspaceRefreshMessage, setWorkspaceRefreshMessage] = useState('');

  const [companyName, setCompanyName] = useState('Vernika Enterprises Inc.');
  const [timezone, setTimezone] = useState('America/Los_Angeles (PST)');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [auxSoundAlerts, setAuxSoundAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (activeTab !== 'workspace' || role !== 'admin' || workspaceConfig || workspaceLoading) return;
    setWorkspaceLoading(true);
    getWorkspaceConfig().then((config) => setWorkspaceConfig({ ...DEFAULT_WORKSPACE_CONFIG, ...config, templates: { ...DEFAULT_WORKSPACE_CONFIG.templates, ...config.templates } })).catch((error) => { setWorkspaceError(error instanceof Error ? `${error.message} The live Workspace Function is unavailable; showing the configured admin workbook so synchronization can be deployed without hiding the control.` : 'Workspace configuration unavailable.'); setWorkspaceConfig(DEFAULT_WORKSPACE_CONFIG); }).finally(() => setWorkspaceLoading(false));
  }, [activeTab, role, workspaceConfig, workspaceLoading]);

  const handleWorkspaceRefresh = async () => {
    setWorkspaceRefreshState('loading');
    setWorkspaceRefreshMessage('Refreshing all workbook tabs from Firestore…');
    try {
      const result = await syncAllWorkspaceSheets();
      setWorkspaceRefreshState('success');
      setWorkspaceRefreshMessage(`Workbook refreshed: ${result.results.length} tabs synchronized.`);
    } catch (error) {
      setWorkspaceRefreshState('error');
      setWorkspaceRefreshMessage(error instanceof Error ? error.message : 'Workbook refresh failed.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">System Preferences & Enterprise Settings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure tenant parameters, role security policies, telemetry thresholds, and themes
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences saved successfully</span>
          </div>
        )}
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[500px] transition-colors">
        {/* Left Tabs */}
        <div className="lg:col-span-3 border-r border-slate-200 dark:border-slate-800 p-4 space-y-1 bg-slate-50/50 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'general' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>General & Branding</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'security' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'notifications' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications & AUX</span>
          </button>

          {role === 'admin' && (
            <button
              onClick={() => setActiveTab('workspace')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'workspace' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Workspace</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'data' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data & Local Storage</span>
          </button>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-9 p-6">
          <form onSubmit={handleSave} className="space-y-6 text-xs max-w-2xl">
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tenant & Workspace Configuration</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Manage organization identity and locale</p>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">Organization Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">Primary Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST, UTC-8)</option>
                    <option value="America/New_York (EST)">America/New_York (EST, UTC-5)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT, UTC+0)</option>
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, UTC+5:30)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">Theme & Appearance</label>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-300">Vernika Theme Engine</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">High-contrast Emerald Light & Dark theme architecture with instant toggle</p>
                    </div>
                    <Badge variant="success">Adaptive Active</Badge>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">User Access & Role Privileges</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Current session credentials and role permissions</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Signed In As</span>
                    <Badge variant="info">{role === 'admin' ? 'Administrator' : 'Standard Employee'}</Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{user?.name} ({user?.email})</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Title: {user?.title} • ID: {user?.id}</p>
                </div>

                {/* Session Inactivity Auto-Lock Protocol */}
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="font-bold text-slate-900 dark:text-white">Inactivity Session Timeout</span>
                    </div>
                    <Badge variant="warning">Auto-Lock Protocol Active</Badge>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Automatically terminates user sessions and returns to the login screen when no user activity (mouse, keyboard, click, or touch) is detected for the specified interval.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">Timeout Duration:</label>
                    <select
                      value={sessionTimeoutMinutes}
                      onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                    >
                      <option value={5}>5 Minutes (Maximum Security)</option>
                      <option value={15}>15 Minutes (Recommended Enterprise)</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes (1 Hour)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Role Permissions</p>
                  <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Multi-user session authentication and role switching</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Real-time AUX telemetry reporting & activity logs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Access to CRM, Inventory, Project Management & Email modules</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notification & Alert Channels</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Manage system alerts, sound effects, and digests</p>
                </div>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Email Notifications</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive email alerts on invoice payments and leave decisions</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={auxSoundAlerts}
                    onChange={(e) => setAuxSoundAlerts(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">AUX Status Chimes</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Audio chime when transitioning between AUX operational states</p>
                  </div>
                </label>
              </div>
            )}

            {activeTab === 'workspace' && role === 'admin' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Google Workspace Operations</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Private Admin-only workbook, official HR templates, and safe integration inventory.</p>
                </div>
                {workspaceLoading && <div className="text-xs text-slate-500 flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Loading workspace configuration…</div>}
                {workspaceError && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">{workspaceError}</div>}
                {workspaceConfig && (
                  <>
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                      <div className="flex items-center justify-between gap-3"><div><p className="font-bold text-emerald-900 dark:text-emerald-200">Vernika 2.0 — Private Admin Operations</p><p className="text-[11px] text-emerald-700 dark:text-emerald-300">Only the authorized Admin account can open or synchronize this workbook.</p></div><Badge variant="success">Admin only</Badge></div>
                      {workspaceError && <p className="text-[11px] text-amber-800 dark:text-amber-200">Configuration fallback active. The button will work after the Firebase Workspace Functions are deployed.</p>}
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={workspaceConfig.spreadsheetUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"><ExternalLink className="w-3.5 h-3.5" /> Open private workbook</a>
                        <button type="button" onClick={() => void handleWorkspaceRefresh()} disabled={workspaceRefreshState === 'loading'} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-60"><RefreshCw className={`w-3.5 h-3.5 ${workspaceRefreshState === 'loading' ? 'animate-spin' : ''}`} /> Refresh all tabs</button>
                      </div>
                      {workspaceRefreshMessage && <p className={`text-[11px] ${workspaceRefreshState === 'error' ? 'text-rose-700' : workspaceRefreshState === 'success' ? 'text-emerald-700' : 'text-slate-600'}`}>{workspaceRefreshMessage}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(workspaceConfig.templates).map(([type, id]) => <div key={type} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><div className="flex items-center gap-2"><FileSignature className="w-4 h-4 text-emerald-600" /><span className="font-bold text-xs text-slate-800 dark:text-slate-200">{type.replace(/_/g, ' ')}</span></div><a className="text-[10px] text-emerald-700 dark:text-emerald-400 underline break-all" target="_blank" rel="noreferrer" href={`https://docs.google.com/document/d/${id}/edit`}>Open template</a></div>)}
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200"><p className="font-bold mb-1">Credential inventory protection</p><p>The API Inventory tab documents variable names, code locations, scopes, and rotation instructions. Private keys, passwords, refresh tokens, service-role keys, and secret values are intentionally excluded.</p></div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data Persistence & Cache</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Manage local client storage and cache state</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">Local Browser Storage Engine</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    All CRM leads, contacts, warehouses, inventory SKUs, invoices, emails, and chat messages are persisted in local browser storage for instant reload without data loss.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset demo state to initial enterprise defaults?')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 hover:text-rose-700 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                  >
                    Reset to Factory Defaults
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
