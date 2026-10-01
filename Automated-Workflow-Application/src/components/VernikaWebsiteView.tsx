import React, { useState } from 'react';
import {
  Globe,
  Send,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  Building,
  Utensils,
  BookOpen,
  Check,
  Search,
} from 'lucide-react';
import { hybridDB } from '../services/hybridDatabase';

export const VernikaWebsiteView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'home' | 'services' | 'case_studies' | 'consultation' | 'admin_leads'
  >('home');

  // Consultation Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [modules, setModules] = useState('Vernika Sheets, GoldenPrime PG');
  const [submitted, setSubmitted] = useState(false);

  // Inbound Leads State
  const [leads, setLeads] = useState([
    { ID: 'LEAD-101', Name: 'Vance Tech Solutions', Email: 'david.vance@vancetech.io', Date: 'Today', Status: 'New Inquiry', Modules: 'Vernika Sheets, CRM' },
    { ID: 'LEAD-102', Name: 'Apex Global Logistics', Email: 'sarah.m@apex.com', Date: 'Yesterday', Status: 'Consultation Booked', Modules: 'Enterprise HR & Payroll' },
    { ID: 'LEAD-103', Name: 'Horizon Media Group', Email: 'horizon@media.io', Date: '3 days ago', Status: 'Closed Deal', Modules: 'Full Automated Suite' },
  ]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const newLead = {
      ID: `LEAD-${Math.floor(100 + Math.random() * 900)}`,
      Name: company || name,
      Email: email,
      Date: 'Just Now',
      Status: 'New Inquiry',
      Modules: modules,
    };

    const updated = [newLead, ...leads];
    setLeads(updated);
    hybridDB.saveAppData('website', 'leads', updated);
    setSubmitted(true);
    setName('');
    setEmail('');
    setCompany('');
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    const updated = leads.map((l) => (l.ID === id ? { ...l, Status: newStatus } : l));
    setLeads(updated);
    hybridDB.saveAppData('website', 'leads', updated);
  };

  const handleExportLeads = () => {
    hybridDB.exportToSpreadsheet('Vernika_Website_Inbound_Leads', leads);
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.Email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.Status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* App Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-display">Vernika Corporate Website</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Lead Intake Portal
              </span>
            </div>
            <p className="text-xs text-slate-400">Corporate Portal, Product Demos, Consultation Booking & Admin Lead Management</p>
          </div>
        </div>

        <button
          onClick={handleExportLeads}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Leads (.xlsx)
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-semibold">
        {[
          { id: 'home', label: 'Corporate Landing Page', icon: Globe },
          { id: 'services', label: 'Product Solutions Showcase', icon: Layers },
          { id: 'case_studies', label: 'Case Studies & ROI', icon: BookOpen },
          { id: 'consultation', label: 'Book Consultation Form', icon: Send },
          { id: 'admin_leads', label: 'Admin Lead Board', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 flex-shrink-0 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Home Landing Page */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/30 p-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" /> Digital Operations, Fully Automated
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight font-display max-w-3xl">
              Turn Business Operations into Automated Digital Growth
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Vernika replaces fragmented SaaS tools with an integrated enterprise suite powering live spreadsheets, HR attendance, PG operations, and food delivery subscriptions.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button onClick={() => setActiveTab('consultation')} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2">
                Book Enterprise Consultation <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
              <Building className="h-6 w-6 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Vernika Business Suite</h3>
              <p className="text-xs text-slate-400">Live collaborative Vernika Sheets, HR attendance, CRM, and virtual meetings.</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
              <Building2 className="h-6 w-6 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">GoldenPrime PG Operations</h3>
              <p className="text-xs text-slate-400">Mobile-first PG building management, room billing, and rent collection reminders.</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
              <Utensils className="h-6 w-6 text-amber-400" />
              <h3 className="text-sm font-bold text-white">ChaknaStore Food Delivery</h3>
              <p className="text-xs text-slate-400">Food directory, daily tiffin subscriptions, and catering request pipeline.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Product Solutions */}
      {activeTab === 'services' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white">Integrated Enterprise Solutions & Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="font-bold text-cyan-400">Automated Hybrid Sync Engine</div>
              <div className="text-slate-300">Synchronizes data real-time across Google Drive, Spreadsheets, Supabase, and Firebase.</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="font-bold text-cyan-400">Vernika Copilot AI Assistant</div>
              <div className="text-slate-300">Offline-capable AI agent for query execution, financial audits, and database schema creation.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Case Studies */}
      {activeTab === 'case_studies' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white">Client Success & Case Studies</h2>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-white">Apex Global Logistics Case Study</div>
            <p className="text-slate-300">Automated 140 employee attendance logs and reduced payroll processing time by 82% using Vernika Sheets & Hybrid DB sync.</p>
          </div>
        </div>
      )}

      {/* Tab 4: Consultation Form */}
      {activeTab === 'consultation' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 max-w-lg space-y-4">
          <h2 className="text-base font-bold text-white">Request Digital Transformation Consultation</h2>

          {submitted ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Request Submitted Successfully
              </div>
              <p>Your inquiry is logged in our lead management board and synced to Google Spreadsheets.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitInquiry} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Your Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. David Vance" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Business Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="david.vance@company.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Company / Organization Name</label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Vance Tech Solutions" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Required App Modules</label>
                <input type="text" value={modules} onChange={(e) => setModules(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white" />
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-cyan-600 text-white font-bold text-xs">
                Submit Consultation Request
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 5: Admin Lead Board */}
      {activeTab === 'admin_leads' && (
        <div className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lead or status..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white">Inbound Lead Pipeline</h2>
            <div className="space-y-2 text-xs">
              {filteredLeads.map((l) => (
                <div key={l.ID} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white">{l.Name} ({l.ID})</div>
                    <div className="text-[11px] text-slate-400">{l.Email} • Modules: {l.Modules}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 text-[10px]">
                      {l.Status}
                    </span>
                    <button onClick={() => handleUpdateStatus(l.ID, 'Consultation Booked')} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px]">
                      Mark Booked
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
