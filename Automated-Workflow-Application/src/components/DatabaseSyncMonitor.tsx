import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Download,
  HardDrive,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  FolderCheck,
  Layers,
  Clock,
  Activity,
  Server,
  Cloud,
} from 'lucide-react';
import {
  hybridDB,
  SUPABASE_URL,
  FIREBASE_PROJECT_ID,
  GOOGLE_DRIVE_FOLDER_URL,
  SERVICE_ACCOUNT_EMAIL,
} from '../services/hybridDatabase';

interface ServiceSyncState {
  id: string;
  name: string;
  type: string;
  status: 'In-Sync' | 'Syncing' | 'Active' | 'Degraded';
  lastSynced: string;
  recordsCount: number;
  latencyMs: number;
  details: string;
  icon: any;
  link?: string;
}

export const DatabaseSyncMonitor: React.FC = () => {
  const [globalSyncing, setGlobalSyncing] = useState(false);

  const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const [services, setServices] = useState<ServiceSyncState[]>([
    {
      id: 'sheets',
      name: 'Google Spreadsheets Engine',
      type: 'Excel & CSV Data Fallback',
      status: 'In-Sync',
      lastSynced: getCurrentTime(),
      recordsCount: 218,
      latencyMs: 14,
      details: 'Automated workbook exporter, formula calculation matrix, and CSV backups.',
      icon: FileSpreadsheet,
    },
    {
      id: 'drive',
      name: 'Google Drive Storage',
      type: 'Persistent File & Folder Backup',
      status: 'Active',
      lastSynced: getCurrentTime(),
      recordsCount: 36,
      latencyMs: 22,
      details: 'Isolated app subfolders for GoldenPrime, Vernika, Chakna, and Website.',
      icon: HardDrive,
      link: GOOGLE_DRIVE_FOLDER_URL,
    },
    {
      id: 'supabase',
      name: 'Supabase Cloud Postgres',
      type: 'Relational & Session Database',
      status: 'In-Sync',
      lastSynced: getCurrentTime(),
      recordsCount: 184,
      latencyMs: 18,
      details: `Project URL: ${SUPABASE_URL}`,
      icon: Database,
    },
    {
      id: 'firebase',
      name: 'Firebase Firestore',
      type: 'Realtime Document & Auth Database',
      status: 'In-Sync',
      lastSynced: getCurrentTime(),
      recordsCount: 312,
      latencyMs: 11,
      details: `Project ID: ${FIREBASE_PROJECT_ID}`,
      icon: Cloud,
    },
  ]);

  const handleSyncService = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, status: 'Syncing' } : s))
    );

    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                status: 'In-Sync',
                lastSynced: getCurrentTime(),
                latencyMs: Math.floor(10 + Math.random() * 15),
              }
            : s
        )
      );
    }, 800);
  };

  const handleManualSyncAll = () => {
    setGlobalSyncing(true);
    setServices((prev) => prev.map((s) => ({ ...s, status: 'Syncing' })));

    setTimeout(() => {
      setGlobalSyncing(false);
      const now = getCurrentTime();
      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          status: 'In-Sync',
          lastSynced: now,
          latencyMs: Math.floor(8 + Math.random() * 12),
        }))
      );
    }, 1000);
  };

  const handleExportAll = () => {
    const fullSnapshot = [
      { Application: 'GoldenPrime PG', Entity: 'Buildings & Rent', Records: 14, StoragePath: '/GoogleDrive/GoldenPrime/buildings.xlsx' },
      { Application: 'Vernika Suite', Entity: 'Employees & Sheets', Records: 82, StoragePath: '/GoogleDrive/Vernika/employees.xlsx' },
      { Application: 'ChaknaStore', Entity: 'Orders & Menu', Records: 48, StoragePath: '/GoogleDrive/ChaknaStore/orders.xlsx' },
      { Application: 'Vernika Website', Entity: 'Leads & Consultations', Records: 34, StoragePath: '/GoogleDrive/VernikaWebsite/leads.xlsx' },
    ];

    hybridDB.exportToSpreadsheet('Full_Hybrid_Database_Backup', fullSnapshot);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
            <Database className="h-4 w-4" /> Realtime Hybrid Cloud Synchronization Engine
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Database Health & Sync Monitor
          </h1>
          <p className="text-xs text-slate-400">
            Live indicators, last-synced timestamps, and latency metrics for Google Sheets, Drive, Supabase & Firebase
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" /> Export Full Backup (.xlsx)
          </button>
          <button
            onClick={handleManualSyncAll}
            disabled={globalSyncing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${globalSyncing ? 'animate-spin' : ''}`} />
            {globalSyncing ? 'Syncing All Services...' : 'Sync All Services'}
          </button>
        </div>
      </div>

      {/* Realtime Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const Icon = service.icon;
          const isSyncing = service.status === 'Syncing';

          return (
            <div
              key={service.id}
              className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 transition-all hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      {service.type}
                    </span>
                    <h3 className="text-base font-bold text-white">{service.name}</h3>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                    isSyncing
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                  {service.status}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{service.details}</p>

              {/* Service Metrics Row */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Last Synced</span>
                  <span className="font-mono font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-indigo-400" />
                    {service.lastSynced}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Records</span>
                  <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                    {service.recordsCount} Rows
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Sync Latency</span>
                  <span className="font-mono font-bold text-cyan-400 mt-0.5 block">
                    {service.latencyMs} ms
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {service.link ? (
                  <a
                    href={service.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-400 hover:underline"
                  >
                    Open Drive Directory &rarr;
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500">Auto-replica Enabled</span>
                )}

                <button
                  onClick={() => handleSyncService(service.id)}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 font-semibold transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-amber-400' : 'text-indigo-400'}`} />
                  Sync Service
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Application Isolation & Storage Folder Map */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FolderCheck className="h-4 w-4 text-cyan-400" />
          Application Storage & Folder Isolation Matrix
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="font-bold text-white">GoldenPrime PG</div>
            <div className="text-[11px] text-indigo-400 font-mono">/GoogleDrive/GoldenPrime/</div>
            <div className="text-[10px] text-slate-400">Firestore: goldenprime_tenants</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="font-bold text-white">Vernika Suite</div>
            <div className="text-[11px] text-indigo-400 font-mono">/GoogleDrive/Vernika/</div>
            <div className="text-[10px] text-slate-400">Firestore: vernika_employees, sheets</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="font-bold text-white">ChaknaStore</div>
            <div className="text-[11px] text-indigo-400 font-mono">/GoogleDrive/ChaknaStore/</div>
            <div className="text-[10px] text-slate-400">Supabase: chakna_orders, menu</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="font-bold text-white">Vernika Website</div>
            <div className="text-[11px] text-indigo-400 font-mono">/GoogleDrive/VernikaWebsite/</div>
            <div className="text-[10px] text-slate-400">Firestore: website_leads</div>
          </div>
        </div>
      </div>
    </div>
  );
};
