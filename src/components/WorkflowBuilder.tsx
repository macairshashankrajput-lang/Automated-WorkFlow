import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Check,
  Plus,
  Download,
  Database,
  Building2,
  Building,
  Utensils,
  Globe,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Clock,
  Briefcase,
  Video,
  MessageSquare,
  Mail,
  UserCheck,
  Bot,
  ShieldCheck,
  Bed,
  CreditCard,
  QrCode,
  Tag,
  Truck,
  BookOpen,
  Calendar,
  DollarSign,
  Search,
  Copy,
  ExternalLink,
  Code2,
  CheckCheck,
  X,
  Server,
  Cloud,
  Send,
} from 'lucide-react';
import { hybridDB, GOOGLE_DRIVE_FOLDER_URL, SERVICE_ACCOUNT_EMAIL } from '../services/hybridDatabase';

export const WorkflowBuilder: React.FC = () => {
  const [workflowTitle, setWorkflowTitle] = useState('Unified Enterprise Operations Blueprint');
  const [activeCategory, setActiveCategory] = useState<'all' | 'vernika' | 'goldenprime' | 'chakna' | 'website'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generated, setGenerated] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [synthesizedSchema, setSynthesizedSchema] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // All 36 Active Modules across all 4 applications
  const allModules = [
    // Vernika Enterprise Suite (16 Modules)
    { id: 'ver_sheets', app: 'Vernika Suite', category: 'vernika', icon: FileSpreadsheet, name: 'Vernika Sheets (Formula Engine)', description: 'Live collaborative spreadsheet matrix with =SUM, =A1+B1, and Excel export.' },
    { id: 'ver_hr', app: 'Vernika Suite', category: 'vernika', icon: Users, name: 'HR Employee Roster & Permissions', description: 'Employee profiles, active status, role assignment, and module access grants.' },
    { id: 'ver_attendance', app: 'Vernika Suite', category: 'vernika', icon: Clock, name: 'Attendance Clock & Location Tracker', description: 'Shift clock-in/out, location logs (Office/Remote), and punch correction requests.' },
    { id: 'ver_leaves', app: 'Vernika Suite', category: 'vernika', icon: Calendar, name: 'Leave Management & Approvals', description: 'Casual/sick leave applications, manager approvals, and leave balance tracking.' },
    { id: 'ver_crm', app: 'Vernika Suite', category: 'vernika', icon: Briefcase, name: 'CRM Lead Pipeline & Contacts', description: 'Lead stage pipeline (New, Contacted, Proposal, Won) and customer directory.' },
    { id: 'ver_invoicing', app: 'Vernika Suite', category: 'vernika', icon: DollarSign, name: 'Tax Invoicing & 3-Way Matching', description: 'Professional invoice creation, tax calculations, and PO 3-way verification.' },
    { id: 'ver_payroll', app: 'Vernika Suite', category: 'vernika', icon: CreditCard, name: 'Payroll & Salary Disbursements', description: 'Monthly salary records, deductions, net pay calculations, and direct receipts.' },
    { id: 'ver_expenses', app: 'Vernika Suite', category: 'vernika', icon: CreditCard, name: 'Expense Claims & Reimbursements', description: 'Employee expense submission, receipts attachment, and approval workflows.' },
    { id: 'ver_analytics', app: 'Vernika Suite', category: 'vernika', icon: Layers, name: 'Project Financial Rollup & Analytics', description: 'Labor cost rollup, budget variance analysis, and capacity bottleneck warnings.' },
    { id: 'ver_tasks', app: 'Vernika Suite', category: 'vernika', icon: Layers, name: 'Kanban Task Board & Workflows', description: 'Task status updates (To Do, In Progress, Done), assignees, and priorities.' },
    { id: 'ver_meetings', app: 'Vernika Suite', category: 'vernika', icon: Video, name: 'Virtual Video Calls & Scheduling', description: 'Live video meeting scheduler, participant states, and call recordings.' },
    { id: 'ver_chat', app: 'Vernika Suite', category: 'vernika', icon: MessageSquare, name: 'Team Messenger Channels & DM', description: 'Chat channels, direct messages, message pinning, and emoji reactions.' },
    { id: 'ver_mail', app: 'Vernika Suite', category: 'vernika', icon: Mail, name: 'Outlook Mail System & Composer', description: 'Inbox messaging, folders (Sent, Drafts, Trash), starring, and rich composer.' },
    { id: 'ver_org', app: 'Vernika Suite', category: 'vernika', icon: UserCheck, name: 'Org Hierarchy Chart & Departments', description: 'Interactive organizational hierarchy chart and department head assignments.' },
    { id: 'ver_copilot', app: 'Vernika Suite', category: 'vernika', icon: Bot, name: 'Vernika Copilot AI Assistant', description: 'Cross-app AI queries, financial audits, and database schema generation.' },
    { id: 'ver_audit', app: 'Vernika Suite', category: 'vernika', icon: ShieldCheck, name: 'Enterprise Immutable Audit Log', description: 'Security audit logs, timestamp records, IP tracking, and system events.' },

    // GoldenPrime PG Operations (8 Modules)
    { id: 'gp_buildings', app: 'GoldenPrime PG', category: 'goldenprime', icon: Building2, name: 'PG Buildings & Floor Wizard', description: 'Manage PG properties, floor counts, room counts, and building amenities.' },
    { id: 'gp_billing', app: 'GoldenPrime PG', category: 'goldenprime', icon: Bed, name: 'Rooms & Bed Billing Modes', description: 'Per-bed billing, fixed room pricing, split room billing, and bed occupancy.' },
    { id: 'gp_tenants', app: 'GoldenPrime PG', category: 'goldenprime', icon: Users, name: 'Tenants Directory & KYC Upload', description: 'Tenant profiles, phone, email, Aadhaar/ID KYC verification, and deposits.' },
    { id: 'gp_rent', app: 'GoldenPrime PG', category: 'goldenprime', icon: DollarSign, name: 'Rent Ledger & Partial Payment Recorder', description: 'Cash/UPI rent receipts recorder, partial payments, and overdue tracking.' },
    { id: 'gp_whatsapp', app: 'GoldenPrime PG', category: 'goldenprime', icon: Send, name: 'WhatsApp Payment Reminder Composer', description: 'Pre-filled WhatsApp payment alert composer with due amount and UPI links.' },
    { id: 'gp_expenses', app: 'GoldenPrime PG', category: 'goldenprime', icon: CreditCard, name: 'Operating Expense Reconciliation', description: 'Building electricity, water, internet bills, staff salary, and net profit.' },
    { id: 'gp_qr', app: 'GoldenPrime PG', category: 'goldenprime', icon: QrCode, name: 'Payment QR & Bank Info Settings', description: 'Configure UPI ID (VPA), QR code upload, and bank account details.' },
    { id: 'gp_export', app: 'GoldenPrime PG', category: 'goldenprime', icon: FileSpreadsheet, name: 'PG Ledger Workbook Exporter (.xlsx)', description: 'One-click full PG financial ledger export to Excel and Google Drive.' },

    // ChaknaStore Food Delivery & Tiffin (7 Modules)
    { id: 'chak_menu', app: 'ChaknaStore', category: 'chakna', icon: Utensils, name: 'Multi-Vendor Food Directory', description: 'Browse dishes by category, vendor ratings, prices, and food search.' },
    { id: 'chak_cart', app: 'ChaknaStore', category: 'chakna', icon: Utensils, name: 'Shopping Cart & Quantity Adjuster', description: 'Interactive cart with quantity increment/decrement (+/-) and checkout.' },
    { id: 'chak_promo', app: 'ChaknaStore', category: 'chakna', icon: Tag, name: 'Promo Code Discount Engine', description: 'Coupon evaluation (e.g. CHAKNA20 for 20% off) and subtotal calculation.' },
    { id: 'chak_tiffin', app: 'ChaknaStore', category: 'chakna', icon: Calendar, name: 'Daily & Weekly Tiffin Subscriptions', description: 'Veg/non-veg tiffin plans, monthly pricing, and delivery schedule.' },
    { id: 'chak_catering', app: 'ChaknaStore', category: 'chakna', icon: Building, name: 'Event Catering Requests & Pipeline', description: 'Custom event catering inquiry form, guest count estimator, and quote request.' },
    { id: 'chak_vendor', app: 'ChaknaStore', category: 'chakna', icon: DollarSign, name: 'Vendor Fulfillment State Machine', description: 'Order state transitions (Order Placed -> Preparing -> Out for Delivery -> Delivered).' },
    { id: 'chak_tracker', app: 'ChaknaStore', category: 'chakna', icon: Truck, name: 'Live Customer Order Status Tracker', description: 'Real-time order tracking status and customer order history.' },

    // Vernika Corporate Website & Lead Portal (5 Modules)
    { id: 'web_hero', app: 'Vernika Website', category: 'website', icon: Globe, name: 'Corporate Landing Page & Brand Hero', description: 'Brand value proposition, digital transformation hero, and feature teasers.' },
    { id: 'web_walkthrough', app: 'Vernika Website', category: 'website', icon: Layers, name: 'Product Solutions Walkthrough', description: 'Interactive tabbed showcase of Vernika Sheets, GoldenPrime & ChaknaStore.' },
    { id: 'web_case', app: 'Vernika Website', category: 'website', icon: BookOpen, name: 'Case Studies & ROI Estimator', description: 'Client success showcases, ROI calculator, and automation benchmarks.' },
    { id: 'web_consultation', app: 'Vernika Website', category: 'website', icon: Send, name: 'Consultation Booking Form & Intake', description: 'Business consultation request form with automated spreadsheet intake.' },
    { id: 'web_leads', app: 'Vernika Website', category: 'website', icon: ShieldCheck, name: 'Admin Lead Board & Status Updates', description: 'Inbound lead pipeline, lead status toggles (New, Booked, Closed), and Excel exporter.' },
  ];

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'ver_sheets',
    'ver_hr',
    'ver_attendance',
    'ver_crm',
    'gp_rent',
    'gp_whatsapp',
    'chak_cart',
    'chak_promo',
    'chak_vendor',
    'web_consultation',
  ]);

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGenerateWorkflow = () => {
    const selectedModuleNames = selectedFeatures.map((id) => {
      const found = allModules.find((m) => m.id === id);
      return found ? found.name : id;
    });

    const schema = hybridDB.synthesizeSchema(selectedModuleNames);
    setSynthesizedSchema(schema);
    setGenerated(true);
    setShowSchemaModal(true);

    hybridDB.saveAppData('vernika', 'synthesized_blueprint', {
      title: workflowTitle,
      selectedModules: selectedFeatures,
      schema,
    });
  };

  const handleCopy = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportBlueprint = () => {
    const activeMods = allModules
      .filter((m) => selectedFeatures.includes(m.id))
      .map((m) => ({
        Module_ID: m.id,
        Module_Name: m.name,
        Application: m.app,
        Category: m.category,
        Description: m.description,
        Supabase_DDL_Status: 'Ready',
        Firebase_Rules_Status: 'Active',
        Google_Sheets_Sync: 'Enabled',
      }));

    hybridDB.exportToSpreadsheet(`Workflow_Blueprint_${workflowTitle.replace(/\s+/g, '_')}`, activeMods);
  };

  const filteredModules = allModules.filter((m) => {
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchesQuery =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.app.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
            <Sparkles className="h-4 w-4" /> Visual App & Workflow Composer
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Automated Workflow Builder & Schema Synthesizer
          </h1>
          <p className="text-xs text-slate-400">
            Combine any of the 36 active modules across all 4 applications to generate unified hybrid schemas (Supabase SQL + Firebase Rules + Google Sheets).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFeatures(allModules.map((m) => m.id))}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            Select All 36 Modules
          </button>
          <button
            onClick={() => setSelectedFeatures([])}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition-all"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Blueprint Title Input */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Layers className="h-5 w-5" />
        </div>
        <div className="flex-1 w-full">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Blueprint Name
          </label>
          <input
            type="text"
            value={workflowTitle}
            onChange={(e) => setWorkflowTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
          />
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs font-bold text-indigo-400">{selectedFeatures.length} / 36</span>
          <span className="text-xs text-slate-400 block">Modules Selected</span>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Category Filter & Module List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
            {/* Search & Categories */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 36 modules..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-bold">
                {[
                  { id: 'all', label: 'All (36)' },
                  { id: 'vernika', label: 'Vernika (16)' },
                  { id: 'goldenprime', label: 'GoldenPrime (8)' },
                  { id: 'chakna', label: 'ChaknaStore (7)' },
                  { id: 'website', label: 'Website (5)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition-all flex-shrink-0 ${
                      activeCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredModules.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedFeatures.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleFeature(m.id)}
                    className={`p-3.5 rounded-xl border transition-all text-left flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="space-y-1 flex-1 pr-6">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white line-clamp-1">{m.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight line-clamp-2">{m.description}</p>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        {m.app}
                      </span>
                    </div>

                    <div className="absolute right-3 top-3">
                      {isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-slate-700 flex items-center justify-center">
                          <Plus className="h-3 w-3 text-slate-500" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3">
              <button
                onClick={handleGenerateWorkflow}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Synthesize Hybrid Workflow & Database Schema ({selectedFeatures.length} Modules)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Workflow Architecture */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-400" />
              Workflow Architecture Preview
            </h2>

            {generated ? (
              <div className="space-y-4 animate-fade-in">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Synthesized Schema Ready ({selectedFeatures.length} Active Modules)
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-400 font-medium">Included Application Modules:</div>
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedFeatures.map((fid) => {
                      const mod = allModules.find((m) => m.id === fid);
                      return (
                        <div
                          key={fid}
                          className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between"
                        >
                          <span className="font-semibold text-slate-200 truncate pr-2">{mod?.name}</span>
                          <span className="text-[10px] text-indigo-400 font-bold flex-shrink-0">{mod?.app}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setShowSchemaModal(true)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Code2 className="h-4 w-4" /> View Synthesized Code & Schemas
                  </button>

                  <button
                    onClick={handleExportBlueprint}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4 text-indigo-400" />
                    Export Full Blueprint (.xlsx)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2">
                <Sparkles className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Select any of the 36 modules on the left and click "Synthesize" to generate your unified architecture.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Synthesized Hybrid Schema Modal */}
      {showSchemaModal && synthesizedSchema && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto animate-fade-in custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Server className="h-5 w-5" /> Synthesized Hybrid Database Blueprint
              </div>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Service Account & Drive Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Service Account Ref:</div>
                <div className="font-mono text-indigo-300 font-bold text-[11px] truncate">{SERVICE_ACCOUNT_EMAIL}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px]">Google Drive Folder Backup:</div>
                <a
                  href={GOOGLE_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-cyan-400 font-bold text-[11px] truncate block hover:underline flex items-center gap-1"
                >
                  Drive Link <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* PostgreSQL DDL Code Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Database className="h-4 w-4" /> Supabase PostgreSQL DDL ({synthesizedSchema.modulesCount} Tables)
                </span>
                <button
                  onClick={() => handleCopy(synthesizedSchema.sqlDDL, 'sql')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1"
                >
                  {copiedCode === 'sql' ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCode === 'sql' ? 'Copied SQL' : 'Copy DDL'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-indigo-200 font-mono overflow-x-auto max-h-40">
                {synthesizedSchema.sqlDDL}
              </pre>
            </div>

            {/* Firebase Security Rules Code Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Cloud className="h-4 w-4" /> Firebase Firestore Security Rules
                </span>
                <button
                  onClick={() => handleCopy(synthesizedSchema.firestoreSecurityRules, 'rules')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] flex items-center gap-1"
                >
                  {copiedCode === 'rules' ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedCode === 'rules' ? 'Copied Rules' : 'Copy Rules'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-amber-200 font-mono overflow-x-auto max-h-40">
                {synthesizedSchema.firestoreSecurityRules}
              </pre>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white"
              >
                Close & Proceed to Deployment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
