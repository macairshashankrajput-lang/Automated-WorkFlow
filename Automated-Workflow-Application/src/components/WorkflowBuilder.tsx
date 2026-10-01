import React, { useState, useEffect } from 'react';
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
  Play,
  Edit3,
  Trash2,
  Eye,
  Activity,
  ArrowRight,
  Power,
  RefreshCw,
  FileCode,
  Sliders,
} from 'lucide-react';
import { hybridDB, GOOGLE_DRIVE_FOLDER_URL, SERVICE_ACCOUNT_EMAIL } from '../services/hybridDatabase';

export interface SavedWorkflow {
  id: string;
  title: string;
  selectedModules: string[];
  status: 'active' | 'draft' | 'paused';
  createdAt: string;
  updatedAt: string;
  schema: any;
  executionCount: number;
}

export const WorkflowBuilder: React.FC = () => {
  const [workflowTitle, setWorkflowTitle] = useState('Unified Enterprise Operations Blueprint');
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'vernika' | 'goldenprime' | 'chakna' | 'website'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [previewWorkflow, setPreviewWorkflow] = useState<SavedWorkflow | null>(null);
  const [synthesizedSchema, setSynthesizedSchema] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Execution Simulator State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'composer' | 'stepbuilder' | 'sandbox' | 'blueprints' | 'github' | 'simulator'>('composer');

  // Step-by-Step Flow Builder State
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [flowAuthRole, setFlowAuthRole] = useState<'customer' | 'client' | 'employee' | 'vendor' | 'admin'>('customer');
  const [flowDatabase, setFlowDatabase] = useState<'supabase' | 'firebase' | 'sheets' | 'hybrid'>('hybrid');
  const [flowTemplate, setFlowTemplate] = useState<'chakna' | 'goldenprime' | 'vernika' | 'website' | 'custom'>('chakna');
  const [sandboxApp, setSandboxApp] = useState<'chakna' | 'goldenprime' | 'vernika' | 'website'>('chakna');

  // Initial Saved Blueprints from hybridDB
  const [savedBlueprints, setSavedBlueprints] = useState<SavedWorkflow[]>(() => {
    const saved = hybridDB.getAppData('vernika', 'saved_workflows_list', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    return [
      {
        id: 'wf_initial_01',
        title: 'Unified Enterprise Operations Blueprint',
        selectedModules: ['ver_sheets', 'ver_hr', 'ver_crm', 'gp_rent', 'gp_whatsapp', 'chak_cart', 'web_consultation'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schema: hybridDB.synthesizeSchema(['ver_sheets', 'ver_hr', 'ver_crm', 'gp_rent', 'gp_whatsapp', 'chak_cart', 'web_consultation']),
        executionCount: 128,
      },
      {
        id: 'wf_initial_02',
        title: 'ChaknaStore Food Delivery & Tiffin Pipeline',
        selectedModules: ['chak_menu', 'chak_cart', 'chak_promo', 'chak_tiffin', 'chak_vendor', 'chak_tracker'],
        status: 'active',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        schema: hybridDB.synthesizeSchema(['chak_menu', 'chak_cart', 'chak_promo', 'chak_tiffin', 'chak_vendor', 'chak_tracker']),
        executionCount: 64,
      },
    ];
  });

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

  // Persist workflows to hybridDB
  useEffect(() => {
    hybridDB.saveAppData('vernika', 'saved_workflows_list', savedBlueprints);
  }, [savedBlueprints]);

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveAndDeployWorkflow = () => {
    const selectedModuleNames = selectedFeatures.map((id) => {
      const found = allModules.find((m) => m.id === id);
      return found ? found.name : id;
    });

    const schema = hybridDB.synthesizeSchema(selectedModuleNames);

    if (editingWorkflowId) {
      // Update existing workflow
      const updatedList = savedBlueprints.map((wf) => {
        if (wf.id === editingWorkflowId) {
          return {
            ...wf,
            title: workflowTitle,
            selectedModules: [...selectedFeatures],
            updatedAt: new Date().toISOString(),
            schema,
          };
        }
        return wf;
      });
      setSavedBlueprints(updatedList);
      setEditingWorkflowId(null);
    } else {
      // Create new workflow
      const newWf: SavedWorkflow = {
        id: `wf_${Date.now()}`,
        title: workflowTitle,
        selectedModules: [...selectedFeatures],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        schema,
        executionCount: 1,
      };
      setSavedBlueprints([newWf, ...savedBlueprints]);
    }

    setSynthesizedSchema(schema);
    setShowSchemaModal(true);
  };

  const handleEditBlueprint = (wf: SavedWorkflow) => {
    setEditingWorkflowId(wf.id);
    setWorkflowTitle(wf.title);
    setSelectedFeatures([...wf.selectedModules]);
    setActiveTab('composer');
  };

  const handleDeleteBlueprint = (id: string) => {
    const filtered = savedBlueprints.filter((wf) => wf.id !== id);
    setSavedBlueprints(filtered);
    if (editingWorkflowId === id) {
      setEditingWorkflowId(null);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = savedBlueprints.map((wf) => {
      if (wf.id === id) {
        const nextStatus: 'active' | 'draft' | 'paused' =
          wf.status === 'active' ? 'paused' : wf.status === 'paused' ? 'draft' : 'active';
        return { ...wf, status: nextStatus };
      }
      return wf;
    });
    setSavedBlueprints(updated);
  };

  const handlePreviewBlueprint = (wf: SavedWorkflow) => {
    setPreviewWorkflow(wf);
    setSynthesizedSchema(wf.schema);
    setShowSchemaModal(true);
  };

  const handleRunSimulation = (wf: SavedWorkflow) => {
    setIsSimulating(true);
    setSimulationLogs([]);
    setActiveTab('simulator');

    const steps = [
      `[TRIGGER] Initializing '${wf.title}' workflow execution...`,
      `[EVENT] Inbound API payload received for ${wf.selectedModules.length} configured modules.`,
      `[TRANSFORM] Executing Vernika Sheets formula matrix & validation checks...`,
      `[SUPABASE] Executing PostgreSQL upsert DDL trigger on 'hybrid_app_records'...`,
      `[FIRESTORE] Syncing real-time Firestore document state to project 'automated-workflow-shashank'...`,
      `[DRIVE BACKUP] Generating automated spreadsheet row entry in Google Drive backup folder...`,
      `[NOTIFY] Dispatching WhatsApp payment link / Email notification webhook...`,
      `[SUCCESS] Workflow execution completed with 0 errors!`,
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setSimulationLogs((prev) => [...prev, step]);
        if (index === steps.length - 1) {
          setIsSimulating(false);
          // Increment execution count
          setSavedBlueprints((prevList) =>
            prevList.map((item) => (item.id === wf.id ? { ...item, executionCount: item.executionCount + 1 } : item))
          );
        }
      }, (index + 1) * 600);
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
            Combine any of the 36 active modules, synthesize hybrid schemas, deploy live workflows, and manage saved blueprints.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('composer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'composer' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" /> Canvas Composer
          </button>
          <button
            onClick={() => setActiveTab('stepbuilder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'stepbuilder' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> Step-by-Step Flow Wizard
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'sandbox' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Live Sandbox Preview
          </button>
          <button
            onClick={() => setActiveTab('blueprints')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'blueprints' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="h-3.5 w-3.5" /> Blueprints ({savedBlueprints.length})
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'github' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" /> Fork on GitHub
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'simulator' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-3.5 w-3.5" /> Test Console
          </button>
        </div>
      </div>

      {/* Tab 1: Visual Canvas Composer */}
      {activeTab === 'composer' && (
        <div className="space-y-6">
          {/* Blueprint Title Input */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {editingWorkflowId ? 'Editing Blueprint Name' : 'Blueprint Title'}
                </label>
                {editingWorkflowId && (
                  <button
                    onClick={() => {
                      setEditingWorkflowId(null);
                      setWorkflowTitle('Unified Enterprise Operations Blueprint');
                    }}
                    className="text-[10px] text-rose-400 hover:underline font-bold"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
              <input
                type="text"
                value={workflowTitle}
                onChange={(e) => setWorkflowTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-right flex-shrink-0 flex items-center gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-400">{selectedFeatures.length} / 36</span>
                <span className="text-xs text-slate-400 block">Modules Selected</span>
              </div>
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
                    onClick={handleSaveAndDeployWorkflow}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {editingWorkflowId ? 'Update & Redeploy Blueprint' : 'Synthesize & Deploy Live Workflow'} ({selectedFeatures.length} Modules)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Pipeline & Active Nodes */}
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  Visual Pipeline Execution Graph
                </h2>

                <div className="space-y-3">
                  {/* Step 1: Trigger */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-1 relative">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Step 1: Inbound Trigger</div>
                    <div className="text-xs font-bold text-white">Multi-App Event Webhook & Intake</div>
                    <div className="text-[11px] text-slate-400">Captures form submissions, rent receipts & food orders.</div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-indigo-400 rotate-90" />
                  </div>

                  {/* Step 2: Transformation */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30 space-y-1">
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Step 2: Formula & Logic Engine</div>
                    <div className="text-xs font-bold text-white">Vernika Sheets & GST Calculator</div>
                    <div className="text-[11px] text-slate-400">Evaluates formulas (=SUM), taxes & promo discount coupons.</div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-purple-400 rotate-90" />
                  </div>

                  {/* Step 3: Database Upsert */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-1">
                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Step 3: Hybrid Database Persistence</div>
                    <div className="text-xs font-bold text-white">Supabase PostgreSQL + Firebase Firestore</div>
                    <div className="text-[11px] text-slate-400">Real-time sync to PostgreSQL tables and Firestore collections.</div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-cyan-400 rotate-90" />
                  </div>

                  {/* Step 4: Dispatch */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Step 4: Automated Dispatch & Backup</div>
                    <div className="text-xs font-bold text-white">WhatsApp Alert + Google Drive (.xlsx)</div>
                    <div className="text-[11px] text-slate-400">Generates instant receipts and appends to Google Drive workbook.</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={handleExportBlueprint}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-indigo-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" /> Export Active Blueprint (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Step-by-Step Flow Wizard */}
      {activeTab === 'stepbuilder' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" /> End-to-End Application Flow Synthesizer
              </h2>
              <p className="text-xs text-slate-400">
                Step-by-step wizard to configure authentication, databases, UI templates, and live preview.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <button
                  key={step}
                  onClick={() => setBuilderStep(step as any)}
                  className={`h-7 w-7 rounded-full text-xs font-bold transition-all ${
                    builderStep === step
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : builderStep > step
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          {/* Step 1: Auth & Role Data Feeding */}
          {builderStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Step 1: Configure Authentication & Primary User Role
              </div>
              <h3 className="text-sm font-bold text-white">Select User Persona & Login Role</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { role: 'customer', title: 'Customer / End User', desc: 'Browses food catalog, places orders, rents rooms, submits inquiries.' },
                  { role: 'vendor', title: 'Vendor / Partner', desc: 'Manages menus, updates order status, views sales performance.' },
                  { role: 'employee', title: 'Employee / Staff', desc: 'Clock-in attendance, expense submission, leave requests, team chat.' },
                  { role: 'client', title: 'B2B Client', desc: 'Views invoices, submits support tickets, tracks project milestones.' },
                  { role: 'admin', title: 'System Administrator', desc: 'Full control, financial rollups, user management, audit logs.' },
                ].map((r) => (
                  <button
                    key={r.role}
                    onClick={() => setFlowAuthRole(r.role as any)}
                    className={`p-4 rounded-xl border text-left transition-all space-y-1.5 ${
                      flowAuthRole === r.role
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-indigo-300">{r.title}</div>
                    <div className="text-[11px] text-slate-400">{r.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setBuilderStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-2"
                >
                  Next: Database Selection <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Database Layer Selection */}
          {builderStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Step 2: Database Engine & Persistence Layer
              </div>
              <h3 className="text-sm font-bold text-white">Choose Preferred Database Storage</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'hybrid', title: 'Hybrid Triple Engine (Recommended)', desc: 'Supabase PostgreSQL + Firebase Firestore + Google Drive Sheets sync.' },
                  { id: 'supabase', title: 'Supabase PostgreSQL', desc: 'Relational SQL tables with real-time subscriptions and DDL generation.' },
                  { id: 'firebase', title: 'Firebase Firestore', desc: 'NoSQL document database with strict firestore.rules security.' },
                  { id: 'sheets', title: 'Google Drive & Sheets API', desc: 'Automated spreadsheet logging and Excel workbook export.' },
                ].map((db) => (
                  <button
                    key={db.id}
                    onClick={() => setFlowDatabase(db.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all space-y-1.5 ${
                      flowDatabase === db.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-indigo-300">{db.title}</div>
                    <div className="text-[11px] text-slate-400">{db.desc}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setBuilderStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setBuilderStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-2"
                >
                  Next: Application Template <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Application Template & Modules Picker */}
          {builderStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Step 3: Choose Primary Application Template
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { id: 'chakna', title: 'ChaknaStore Food', sub: '7 Delivery & Tiffin Modules' },
                  { id: 'goldenprime', title: 'GoldenPrime PG', sub: '8 PG Property Modules' },
                  { id: 'vernika', title: 'Vernika Enterprise', sub: '16 ERP & HR Modules' },
                  { id: 'website', title: 'Corporate Website', sub: '5 Lead Intake Modules' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setFlowTemplate(t.id as any);
                      setSandboxApp(t.id as any);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all space-y-1 ${
                      flowTemplate === t.id
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-indigo-300">{t.title}</div>
                    <div className="text-[10px] text-slate-400">{t.sub}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setBuilderStep(2)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setBuilderStep(4)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-2"
                >
                  Next: Launch Live Sandbox <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Live Sandbox Testing */}
          {builderStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Step 4: Interactive Live Sandbox Preview
                  </div>
                  <h3 className="text-sm font-bold text-white">Test Your Configured Flow Live in Browser</h3>
                </div>
                <button
                  onClick={() => setActiveTab('sandbox')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <Eye className="h-4 w-4" /> Open Fullscreen Preview
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Active Persona: <span className="text-indigo-400 uppercase">{flowAuthRole}</span> | Database: <span className="text-indigo-400 uppercase">{flowDatabase}</span>
                </div>
                <p className="text-xs text-slate-400">
                  Your workflow flow has been synthesized. You can interact with the app in the preview sandbox tab directly.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setBuilderStep(3)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setBuilderStep(5)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-2"
                >
                  Next: GitHub & Deployment <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: GitHub Fork & Export */}
          {builderStep === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                Step 5: Code Export & GitHub Forking
              </div>
              <h3 className="text-sm font-bold text-white">Push & Fork to GitHub for Local IDE Testing</h3>

              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-purple-300">
                    https://github.com/macairshashankrajput-lang/Automated-WorkFlow
                  </div>
                  <a
                    href="https://github.com/macairshashankrajput-lang/Automated-WorkFlow/fork"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                  >
                    <ExternalLink className="h-4 w-4" /> Fork on GitHub
                  </a>
                </div>
                <p className="text-xs text-slate-300">
                  Fork this repository to test your created workflow directly inside VS Code or Cursor IDE.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setBuilderStep(4)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveTab('composer')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                >
                  Finish & Return to Canvas
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Live Sandbox App Preview */}
      {activeTab === 'sandbox' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-emerald-400" /> Integrated Live Sandbox Application Preview
              </h2>
              <p className="text-xs text-slate-400">
                Test the created application and modules live without needing to fork or leave the studio.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
              {[
                { id: 'chakna', label: 'ChaknaStore Food' },
                { id: 'goldenprime', label: 'GoldenPrime PG' },
                { id: 'vernika', label: 'Vernika Suite' },
                { id: 'website', label: 'Vernika Portal' },
              ].map((app) => (
                <button
                  key={app.id}
                  onClick={() => setSandboxApp(app.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sandboxApp === app.id ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {app.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2">
              <span className="font-mono text-emerald-400">Preview Mode: Active Application ({sandboxApp.toUpperCase()})</span>
              <span className="text-slate-500">Live Data Storage: Supabase PostgreSQL + Firestore Sync</span>
            </div>

            <div className="min-h-[500px] border border-slate-800 rounded-xl p-4 bg-slate-900/50">
              {sandboxApp === 'chakna' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <Utensils className="h-4 w-4" /> ChaknaStore Food Delivery & Tiffin Application Live Preview
                    </div>
                    <div>Browse multi-vendor dishes, add items to cart, test coupon codes (e.g. CHAKNA20), and track orders live.</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-white">Crispy Paneer Pakoda</div>
                      <div className="text-[11px] text-slate-400">Fresh cottage cheese fritters with mint chutney.</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-emerald-400">₹180</span>
                        <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-[11px] font-bold text-white">Add to Cart</button>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-white">Chicken Seekh Kebab</div>
                      <div className="text-[11px] text-slate-400">Spiced minced chicken skewers grilled over charcoal.</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-emerald-400">₹240</span>
                        <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-[11px] font-bold text-white">Add to Cart</button>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-white">Daily Veg Tiffin Plan</div>
                      <div className="text-[11px] text-slate-400">3 Roti + Sabzi + Dal + Rice + Salad daily lunch/dinner.</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-emerald-400">₹2,800/mo</span>
                        <button className="px-2.5 py-1 rounded-lg bg-emerald-600 text-[11px] font-bold text-white">Subscribe</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sandboxApp === 'goldenprime' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> GoldenPrime PG Property Operations Live Preview
                    </div>
                    <div>Manage PG buildings, floor plans, room billing, tenant KYC, and send WhatsApp rent alerts.</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-white">Building Alpha (Sector 62, Noida)</div>
                      <div className="text-[11px] text-slate-400">4 Floors • 16 Rooms • 32 Total Beds</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-emerald-400 font-bold">28 Occupied (87.5%)</span>
                        <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-[11px] font-bold text-white">View Rooms</button>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-white">Tenant Rent Ledger</div>
                      <div className="text-[11px] text-slate-400">Rahul Sharma (Room 201) • Rent: ₹8,500 due 5th Oct</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-amber-400 font-bold">Pending ₹8,500</span>
                        <button className="px-2.5 py-1 rounded-lg bg-emerald-600 text-[11px] font-bold text-white">Send WhatsApp</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sandboxApp === 'vernika' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" /> Vernika Enterprise Business Suite Live Preview
                    </div>
                    <div>Collaborative spreadsheet, HR roster, attendance clock-in, and CRM lead pipeline.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                    <div className="text-slate-400 text-[11px]">Vernika Sheets Live Formula Sandbox:</div>
                    <div className="grid grid-cols-3 gap-2 text-slate-300">
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">A1: 50,000</div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">B1: 18,000</div>
                      <div className="p-2 bg-indigo-950/60 rounded border border-indigo-500 text-indigo-300 font-bold">=SUM(A1:B1) = 68,000</div>
                    </div>
                  </div>
                </div>
              )}

              {sandboxApp === 'website' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <Globe className="h-4 w-4" /> Vernika Corporate Portal Live Preview
                    </div>
                    <div>Public landing page hero, product solution walkthroughs, and lead booking intake.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-center">
                    <div className="text-sm font-bold text-white">Accelerate Your Enterprise Workflows</div>
                    <div className="text-xs text-slate-400">Automate operations across HR, PG Property, and Food Delivery in one place.</div>
                    <div className="pt-2">
                      <button className="px-4 py-2 rounded-xl bg-indigo-600 font-bold text-xs text-white">Book Digital Audit</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Fork on GitHub & Code Export */}
      {activeTab === 'github' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="h-5 w-5 text-purple-400" /> Push to GitHub & Fork for Local IDE
              </h2>
              <p className="text-xs text-slate-400">
                Fork the complete multi-application codebase or test specific subfolder apps in your IDE.
              </p>
            </div>
            <a
              href="https://github.com/macairshashankrajput-lang/Automated-WorkFlow/fork"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-purple-600/30"
            >
              <ExternalLink className="h-4 w-4" /> Fork Repository
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
                <Code2 className="h-4 w-4" /> Direct GitHub Repository Link
              </div>
              <a
                href="https://github.com/macairshashankrajput-lang/Automated-WorkFlow"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-indigo-400 underline block hover:text-indigo-300 break-all"
              >
                https://github.com/macairshashankrajput-lang/Automated-WorkFlow
              </a>
              <p className="text-[11px] text-slate-400">
                Contains all 4 application folders plus the master visual workflow synthesizer.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <FileCode className="h-4 w-4" /> Clone Command for IDE
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-900 text-[11px] font-mono text-emerald-300 border border-slate-800">
                git clone https://github.com/macairshashankrajput-lang/Automated-WorkFlow.git
              </pre>
              <p className="text-[11px] text-slate-400">Run this in your terminal or Cursor / VS Code terminal.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white">Subfolder Independent Testing Commands:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-300">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-bold">ChaknaStore Food:</div>
                <div className="text-[11px] text-slate-400">cd chaknastore-FoodDeliveryapp-main</div>
                <div className="text-[11px] text-emerald-400">npm install && npx expo export -p web</div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-bold">GoldenPrime PG:</div>
                <div className="text-[11px] text-slate-400">cd GoldenPrime-Stay-app-main</div>
                <div className="text-[11px] text-emerald-400">npm install && npm run vercel:build</div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-bold">Vernika Enterprise:</div>
                <div className="text-[11px] text-slate-400">cd Vernika-app-main</div>
                <div className="text-[11px] text-emerald-400">npm install && npm run build</div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                <div className="text-indigo-400 font-bold">Vernika Website:</div>
                <div className="text-[11px] text-slate-400">cd vernika-website-main</div>
                <div className="text-[11px] text-emerald-400">npm install && npm run vercel:build</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Saved & Deployed Blueprints */}
      {activeTab === 'blueprints' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" /> Deployed Workflow Blueprints
              </h2>
              <p className="text-xs text-slate-400">Manage, edit, delete, or trigger live executions for saved workflows.</p>
            </div>
            <button
              onClick={() => {
                setEditingWorkflowId(null);
                setWorkflowTitle('New Custom Workflow Blueprint');
                setSelectedFeatures(['ver_sheets', 'ver_crm']);
                setActiveTab('composer');
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Blueprint
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedBlueprints.map((wf) => (
              <div key={wf.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{wf.title}</h3>
                    <button
                      onClick={() => handleToggleStatus(wf.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border transition-all ${
                        wf.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : wf.status === 'paused'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {wf.status}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{wf.selectedModules.length} Modules</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-mono font-bold">{wf.executionCount} Executions</span>
                  </div>

                  {/* Modules preview tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {wf.selectedModules.slice(0, 5).map((mid) => {
                      const mod = allModules.find((m) => m.id === mid);
                      return (
                        <span key={mid} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                          {mod?.name.split('(')[0]}
                        </span>
                      );
                    })}
                    {wf.selectedModules.length > 5 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] text-indigo-400 font-bold">
                        +{wf.selectedModules.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-900 gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRunSimulation(wf)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
                    >
                      <Play className="h-3.5 w-3.5" /> Run
                    </button>
                    <button
                      onClick={() => handlePreviewBlueprint(wf)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-indigo-300 flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Schema
                    </button>
                    <button
                      onClick={() => handleEditBlueprint(wf)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteBlueprint(wf.id)}
                    className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Live Test Simulator Console */}
      {activeTab === 'simulator' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-400" /> Live Workflow Test Console
              </h2>
              <p className="text-xs text-slate-400">Simulate end-to-end execution of active workflow triggers.</p>
            </div>
            <button
              onClick={() => handleRunSimulation(savedBlueprints[0])}
              disabled={isSimulating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-bold text-xs text-white flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
              {isSimulating ? 'Simulating...' : 'Trigger Test Execution'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 min-h-[300px] max-h-[450px] overflow-y-auto">
            {simulationLogs.length > 0 ? (
              simulationLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg ${
                    log.includes('SUCCESS')
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                      : log.includes('TRIGGER')
                      ? 'text-indigo-400 font-bold'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-500">
                Click "Trigger Test Execution" above or "Run" on any blueprint to start simulation.
              </div>
            )}
          </div>
        </div>
      )}

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
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
