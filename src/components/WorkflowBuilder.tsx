import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Check,
  Plus,
  Play,
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
  Send,
} from 'lucide-react';
import { hybridDB } from '../services/hybridDatabase';

export const WorkflowBuilder: React.FC = () => {
  const [workflowTitle, setWorkflowTitle] = useState('Unified Enterprise Operations Blueprint');
  const [activeCategory, setActiveCategory] = useState<'all' | 'vernika' | 'goldenprime' | 'chakna' | 'website'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // All 36 Modules across all 4 applications
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
    'web_leads',
  ]);

  const [generated, setGenerated] = useState(false);

  const filteredModules = allModules.filter((m) => {
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchesQuery =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.app.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const toggleFeature = (id: string) => {
    if (selectedFeatures.includes(id)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== id));
    } else {
      setSelectedFeatures([...selectedFeatures, id]);
    }
  };

  const handleGenerateWorkflow = () => {
    setGenerated(true);
  };

  const handleExportBlueprint = () => {
    const blueprint = selectedFeatures.map((fid) => {
      const mod = allModules.find((m) => m.id === fid);
      return {
        ModuleID: fid,
        Application: mod?.app,
        ModuleName: mod?.name,
        Description: mod?.description,
        DatabaseTable: `${mod?.app.toLowerCase().replace(/[^a-z]/g, '')}_${fid}`,
        StorageSyncTarget: 'Google Drive & Cloud Hybrid DB',
      };
    });

    hybridDB.exportToSpreadsheet('Automated_Workflow_Full_Blueprint', blueprint);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Studio Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
          <Sparkles className="h-4 w-4" /> Softr-Style AI Bot Studio
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">
          Automated Workflow Composer & Template Studio
        </h1>
        <p className="text-xs text-slate-400">
          Combine all 36 module features across Vernika Suite, GoldenPrime PG, ChaknaStore, and Vernika Website into custom automated workflows.
        </p>
      </div>

      {/* Main Builder Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Module Picker & Category Filter */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-white">1. Select Application Modules ({selectedFeatures.length} Selected)</h2>
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-bold">
                {[
                  { id: 'all', label: 'All Modules (36)' },
                  { id: 'vernika', label: 'Vernika (16)' },
                  { id: 'goldenprime', label: 'GoldenPrime (8)' },
                  { id: 'chakna', label: 'ChaknaStore (7)' },
                  { id: 'website', label: 'Website (5)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all flex-shrink-0 ${
                      activeCategory === cat.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Workflow Name & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Workflow Title</label>
                <input
                  type="text"
                  value={workflowTitle}
                  onChange={(e) => setWorkflowTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Search Features</label>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search modules..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredModules.map((mod) => {
                const Icon = mod.icon;
                const isSelected = selectedFeatures.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggleFeature(mod.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          {mod.app}
                        </span>
                        <div
                          className={`h-4 w-4 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-indigo-500 text-white' : 'border border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                        <h3 className="text-xs font-bold text-white leading-tight">{mod.name}</h3>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{mod.description}</p>
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
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedFeatures.map((fid) => {
                      const mod = allModules.find((m) => m.id === fid);
                      return (
                        <div
                          key={fid}
                          className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between"
                        >
                          <span className="font-semibold text-slate-200">{mod?.name}</span>
                          <span className="text-[10px] text-indigo-400 font-bold">{mod?.app}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleExportBlueprint}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4 text-indigo-400" />
                  Export Full Blueprint (.xlsx)
                </button>
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
    </div>
  );
};
