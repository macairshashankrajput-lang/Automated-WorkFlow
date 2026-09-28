import React, { useState, useEffect } from 'react';
import {
  Building2,
  Building,
  Utensils,
  Globe,
  ArrowRight,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Edit2,
  Save,
  Link2,
} from 'lucide-react';

interface PortfolioShowcaseProps {
  onNavigate: (tab: any) => void;
}

export const PortfolioShowcase: React.FC<PortfolioShowcaseProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'vernika' | 'goldenprime' | 'chakna' | 'website'>('all');

  // Vercel deployment links state persisted in localStorage
  const [vercelLinks, setVercelLinks] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('aw_portfolio_vercel_links');
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore storage errors */
    }
    return {
      app_vernika: 'https://vernika-business-suite.vercel.app',
      app_goldenprime: 'https://goldenprime-pg-ops.vercel.app',
      app_chaknastore: 'https://chaknastore-food.vercel.app',
      app_website: 'https://vernika-corporate.vercel.app',
    };
  });

  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [tempUrl, setTempUrl] = useState('');

  const saveVercelLink = (appId: string) => {
    const updated = { ...vercelLinks, [appId]: tempUrl.trim() };
    setVercelLinks(updated);
    try {
      localStorage.setItem('aw_portfolio_vercel_links', JSON.stringify(updated));
    } catch {
      /* ignore storage errors */
    }
    setEditingAppId(null);
  };

  const portfolioApps = [
    {
      id: 'app_vernika',
      title: 'Vernika Enterprise Business Suite',
      category: 'vernika',
      icon: Building,
      accentColor: 'indigo',
      badge: '16 Integrated Enterprise Modules',
      description:
        'Comprehensive ERP suite powering live formula spreadsheets, HR employee rosters, attendance tracking, 3-way invoice matching, video meetings, and Copilot AI.',
      modules: [
        'Vernika Sheets Formula Matrix (=SUM, =A1+B1)',
        'HR Employee Directory & Access Grants',
        'Attendance Clock-In/Out & Shift Tracker',
        'Leave Management & Approvals',
        'CRM Deal Stages & Contacts',
        'Tax Invoicing & 3-Way PO Match',
        'Monthly Payroll Disbursements',
        'Expense Reimbursements',
        'Project Financial Rollup & Analytics',
        'Kanban Task Management',
        'Virtual Video Calls & Screen Share',
        'Team Messenger Channels & DM',
        'Outlook Mail Messaging System',
        'Org Hierarchy Chart',
        'Vernika Copilot AI Assistant',
        'Immutable Security Audit Logs',
      ],
      actionTab: 'app_vernika',
    },
    {
      id: 'app_goldenprime',
      title: 'GoldenPrime PG Operations App',
      category: 'goldenprime',
      icon: Building2,
      accentColor: 'emerald',
      badge: '8 PG Management Modules',
      description:
        'Mobile-first PG building management platform handling room billing modes, tenant KYC, rent ledger receipts, WhatsApp reminders, and operating expenses.',
      modules: [
        'PG Buildings & Floor Plan Wizard',
        'Per-Bed / Fixed Room / Split Billing Modes',
        'Tenant Directory & Aadhaar KYC',
        'Rent Collections & Partial Payment Ledger',
        'WhatsApp Payment Alert Composer',
        'Operating Expense Reconciliation',
        'Payment QR Code & Bank Settings',
        'PG Ledger Workbook Exporter (.xlsx)',
      ],
      actionTab: 'app_goldenprime',
    },
    {
      id: 'app_chaknastore',
      title: 'ChaknaStore Food Delivery & Tiffin',
      category: 'chakna',
      icon: Utensils,
      accentColor: 'amber',
      badge: '7 Food & Vendor Modules',
      description:
        'Multi-vendor food ordering ecosystem featuring shopping cart quantity controls, CHAKNA20 promo code evaluator, daily tiffin plans, and vendor fulfillment.',
      modules: [
        'Multi-Vendor Food Item Directory',
        'Shopping Cart & Quantity Adjuster (+/-)',
        'Promo Code Discount Engine (CHAKNA20)',
        'Daily & Weekly Tiffin Subscriptions',
        'Event Catering Requests & Guest Estimator',
        'Vendor Fulfillment State Machine',
        'Live Order Status Tracker',
      ],
      actionTab: 'app_chaknastore',
    },
    {
      id: 'app_website',
      title: 'Vernika Corporate Website & Lead Portal',
      category: 'website',
      icon: Globe,
      accentColor: 'cyan',
      badge: '5 Lead & Portal Modules',
      description:
        'High-converting corporate website with interactive product solution walkthroughs, case studies, consultation scheduling, and admin lead board.',
      modules: [
        'Corporate Landing Page & Brand Hero',
        'Product Solutions Showcase Walkthrough',
        'Case Studies & ROI Estimator',
        'Consultation Booking Form & Spreadsheet Intake',
        'Admin Inbound Lead Pipeline Board',
      ],
      actionTab: 'app_website',
    },
  ];

  const filteredApps = portfolioApps.filter(
    (app) => activeCategory === 'all' || app.category === activeCategory
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Portfolio Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs mb-1">
          <Sparkles className="h-4 w-4" /> Comprehensive Product Portfolio
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">
          Full Application Portfolio & Deployment Showcase
        </h1>
        <p className="text-xs text-slate-400">
          Launch applications internally or redirect to live deployed Vercel URLs for individual production usage.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'all', label: 'All 4 Applications (36 Modules)' },
          { id: 'vernika', label: 'Vernika Enterprise (16)' },
          { id: 'goldenprime', label: 'GoldenPrime PG (8)' },
          { id: 'chakna', label: 'ChaknaStore (7)' },
          { id: 'website', label: 'Vernika Website (5)' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-3 py-1.5 rounded-xl transition-all flex-shrink-0 ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Application Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredApps.map((app) => {
          const Icon = app.icon;
          const currentVercelUrl = vercelLinks[app.id] || 'https://vercel.com';
          const isEditing = editingAppId === app.id;

          return (
            <div key={app.id} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                    {app.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white font-display">{app.title}</h2>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">{app.description}</p>
                </div>

                {/* Vercel Deployment Link Configurator */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <Link2 className="h-3.5 w-3.5 text-indigo-400" /> Vercel Deployment Link:
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingAppId(app.id);
                          setTempUrl(currentVercelUrl);
                        }}
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Edit2 className="h-3 w-3" /> Edit Link
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="url"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        placeholder="e.g. https://your-app.vercel.app"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <button
                        onClick={() => saveVercelLink(app.id)}
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        title="Save Vercel URL"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <a
                      href={currentVercelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 font-mono text-[11px] truncate block hover:underline"
                    >
                      {currentVercelUrl}
                    </a>
                  )}
                </div>

                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    Included Active Modules ({app.modules.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {app.modules.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate(app.actionTab)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  Workspace Studio <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href={currentVercelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2 text-center"
                >
                  Direct Vercel Launch <ExternalLink className="h-4 w-4 text-cyan-400" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
