import React, { useMemo, useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FolderKanban, 
  MessageSquare, 
  Receipt, 
  FileText, 
  Download, 
  CreditCard, 
  ExternalLink, 
  AlertCircle,
  HelpCircle,
  ThumbsUp,
  MessageCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  Edit,
  Users,
  Send,
  Plus,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { where } from 'firebase/firestore';
import { aggregateOrEmpty, useAggregateStats, usePaginatedQuery } from '../lib/useFirestoreReadModels';
import { Employee, Invoice, Project, ProjectComment } from '../types';
import { auth } from '../lib/firebase';
import { Badge } from '../components/common/Badge';
import { FileManager } from '../components/common/FileManager';

export const ClientPortalScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    markInvoicePaid, 
    updateProject, 
    setActiveScreen,
    sendMessage,
    addProject
  } = useApp();

  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);
  const [supportError, setSupportError] = useState('');

  // New Project Request / Create Project
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projBudget, setProjBudget] = useState('50000');
  const [projCategory, setProjCategory] = useState<'Enterprise Software' | 'Cloud Infrastructure' | 'AI Integration' | 'Security & Compliance'>('Enterprise Software');
  const [assignedTeam, setAssignedTeam] = useState<string[]>([]);
  const [projectSuccessMsg, setProjectSuccessMsg] = useState(false);

  // Update Existing Project
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editStatus, setEditStatus] = useState<Project['status']>('Planning');
  const [editDesc, setEditDesc] = useState('');
  const [editTeam, setEditTeam] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    await addProject({
      name: projName,
      description: projDesc,
      client: clientCompany,
      clientId: user?.clientId || 'cli-1',
      budget: Number(projBudget) || 50000,
      status: 'Planning',
      progress: 0,
      spent: 0,
      deadline: '2026-12-31',
      priority: 'High',
      category: projCategory,
      team: assignedTeam,
      deliverables: [],
      comments: []
    });
    setProjName('');
    setProjDesc('');
    setAssignedTeam([]);
    setShowProjectModal(false);
    setProjectSuccessMsg(true);
    setTimeout(() => setProjectSuccessMsg(false), 4000);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    await updateProject(editingProject.id, {
      status: editStatus,
      description: editDesc,
      team: editTeam
    });
    setEditingProject(null);
  };

  const handlePostComment = async () => {
    if (!editingProject || !newComment.trim()) return;
    const comment: ProjectComment = {
      id: `cmt-${Date.now()}`,
      authorId: user?.id || 'cli-1',
      authorName: user?.name || 'Client',
      authorAvatar: user?.avatar,
      text: newComment.trim(),
      timestamp: new Date().toISOString()
    };
    const updatedComments = [...(editingProject.comments || []), comment];
    await updateProject(editingProject.id, { comments: updatedComments });
    setEditingProject({ ...editingProject, comments: updatedComments });
    setNewComment('');
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    const submittedForm = e.currentTarget as HTMLFormElement;
    const submittedValue = submittedForm.querySelector('textarea')?.value || '';
    const messageText = (supportMessage || submittedValue).trim();
    if (!messageText || !user) {
      setSupportError('Please enter a support request before submitting.');
      return;
    }

    // Support requests must be persisted so the lead/Admin receives them in
    // realtime; the previous implementation only toggled local UI state.
    const adminRecipient = supportRecipients.find((employee) => String(employee.role || '').toLowerCase() === 'admin' && employee.loginEnabled !== false);
    if (!adminRecipient) {
      setSupportError('Support is temporarily unavailable because no enabled Admin recipient is configured.');
      return;
    }

    try {
      await sendMessage({
        channelId: `support-${user.clientId || user.id}`,
        senderId: auth.currentUser?.uid || user.id,
        senderName: user.name,
        senderAvatar: user.avatar,
        senderRole: 'client',
        recipientId: adminRecipient.firebaseUid || adminRecipient.id,
        text: `[Support Request] ${messageText}`,
        readBy: [auth.currentUser?.uid || user.id],
      });
      setSupportError('');
      setTicketSent(true);
      setSupportMessage('');
    } catch (error) {
      console.error('Client support request failed:', error);
      setSupportError('Your support request could not be sent. Please try again.');
    }
    setTimeout(() => setTicketSent(false), 5000);
  };

  const toggleAssignTeam = (empName: string, isEditing: boolean) => {
    const list = isEditing ? editTeam : assignedTeam;
    const setter = isEditing ? setEditTeam : setAssignedTeam;
    if (list.includes(empName)) {
      setter(list.filter(n => n !== empName));
    } else {
      setter([...list, empName]);
    }
  };

  // Client dashboards only subscribe to this account’s records. Full history remains paginated in the detailed workspace views.
  const clientCompany = user?.clientCompany || 'Client Account';
  const clientId = user?.clientId || user?.id || '';
  const clientProjectConstraints = useMemo(() => [where('clientId', '==', clientId)], [clientId]);
  const clientInvoiceConstraints = useMemo(() => [where('clientId', '==', clientId)], [clientId]);
  const pendingInvoiceConstraints = useMemo(() => [where('clientId', '==', clientId), where('status', '==', 'Pending')], [clientId]);
  const { items: myProjects } = usePaginatedQuery<Project>({ collectionName: 'projects', queryKey: `client-projects:${clientId}`, constraints: clientProjectConstraints, pageSize: 8, enabled: Boolean(clientId) });
  const { items: myInvoices } = usePaginatedQuery<Invoice>({ collectionName: 'invoices', queryKey: `client-invoices:${clientId}`, constraints: clientInvoiceConstraints, pageSize: 12, enabled: Boolean(clientId) });
  const { items: pendingInvoices } = usePaginatedQuery<Invoice>({ collectionName: 'invoices', queryKey: `client-pending-invoices:${clientId}`, constraints: pendingInvoiceConstraints, pageSize: 8, enabled: Boolean(clientId) });
  const { items: supportRecipients } = usePaginatedQuery<Employee>({ collectionName: 'employees', queryKey: 'client-support-recipients', pageSize: 100, enabled: Boolean(user?.id) });
  const aggregateSpecs = useMemo(() => [
    { key: 'billed', collectionName: 'invoices', constraints: clientInvoiceConstraints, sumFields: ['total'] },
    { key: 'paid', collectionName: 'invoices', constraints: [where('clientId', '==', clientId), where('status', '==', 'Paid')], sumFields: ['total'] },
  ], [clientId, clientInvoiceConstraints]);
  const { values: clientStats, loading: clientStatsLoading } = useAggregateStats(aggregateSpecs, `client-dashboard:${clientId}`, { enabled: Boolean(clientId), refreshIntervalMs: 60_000 });
  const totalBilled = aggregateOrEmpty(clientStats, 'billed', ['total']).sums.total || 0;
  const totalPaid = aggregateOrEmpty(clientStats, 'paid', ['total']).sums.total || 0;
  const outstandingBalance = totalBilled - totalPaid;

  const handlePayInvoice = async (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    setTimeout(async () => {
      await markInvoicePaid(invoiceId, 'Credit Card (Stripe Client Portal)');
      setPayingInvoiceId(null);
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 4000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Client Organization Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{clientCompany}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Client Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Lead Account Representative: <span className="text-white font-semibold">{user?.name}</span> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveScreen('chat')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message Lead</span>
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              title="Sign out of Client portal"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Financial & Contract Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Total Contract Value</p>
            <p className="text-base font-bold text-white mt-0.5">{clientStatsLoading ? '—' : `$${totalBilled.toLocaleString()}`}</p>
          </div>
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Total Settled / Paid</p>
            <p className="text-base font-bold text-emerald-400 mt-0.5">{clientStatsLoading ? '—' : `$${totalPaid.toLocaleString()}`}</p>
          </div>
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Outstanding Balance</p>
            <p className={`text-base font-bold mt-0.5 ${outstandingBalance > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {clientStatsLoading ? '—' : `$${outstandingBalance.toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>

      {showPaymentSuccess && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Payment successful! Invoice receipt generated and marked as paid in real-time.</span>
        </div>
      )}

      {/* Main Grid: Projects & Deliverables + Invoices & Support */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Projects & Milestone Deliverables */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Active Engagements & Roadmap</h2>
                  <p className="text-xs text-slate-400">Live progress tracking and deliverables</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectModal(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Project</span>
              </button>
            </div>

            {projectSuccessMsg && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Project submitted successfully! Assigned team notified.</span>
              </div>
            )}

            <div className="space-y-4">
              {myProjects.length === 0 ? (
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                  No active projects found under this account.
                </div>
              ) : (
                myProjects.map((proj) => (
                  <div key={proj.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative">
                    <button 
                      onClick={() => {
                        setEditingProject(proj);
                        setEditStatus(proj.status);
                        setEditDesc(proj.description);
                        setEditTeam(proj.team || []);
                      }}
                      className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                      title="Update Details, Team & Comments"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-8">
                      <div>
                        <h3 className="text-sm font-bold text-white">{proj.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{proj.description}</p>
                      </div>
                      <Badge variant={proj.status === 'Completed' ? 'success' : proj.status === 'On Hold' ? 'danger' : proj.status === 'Active' ? 'info' : 'default'}>
                        {proj.status}
                      </Badge>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Assigned Team</p>
                      <div className="flex flex-wrap gap-1">
                        {(proj.team || []).length > 0 ? proj.team.map((t, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">{t}</span>
                        )) : <span className="text-[10px] text-slate-600">Unassigned</span>}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-800/50 mt-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Sprint Completion</span>
                        <span className="font-bold text-emerald-400 font-mono">{proj.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${proj.progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Billing & Support */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-white">Pending Invoices</h2>
              </div>
              
              <div className="space-y-3">
                {pendingInvoices.length === 0 ? (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                    No pending invoices. You're all caught up!
                  </div>
                ) : (
                  pendingInvoices.map(inv => (
                    <div key={inv.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                       <div className="flex justify-between items-start">
                         <div>
                           <p className="text-xs font-bold text-white">{inv.id}</p>
                           <p className="text-[10px] text-slate-400 mt-0.5">Due: {inv.dueDate}</p>
                         </div>
                         <span className="text-sm font-bold text-white">${inv.total.toLocaleString()}</span>
                       </div>
                       
                       <button
                         onClick={() => handlePayInvoice(inv.id)}
                         disabled={payingInvoiceId === inv.id}
                         className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold transition-colors flex justify-center items-center gap-2 cursor-pointer"
                       >
                         {payingInvoiceId === inv.id ? (
                           <span className="animate-pulse">Processing Payment...</span>
                         ) : (
                           <>Pay Now <ArrowRight className="w-3.5 h-3.5" /></>
                         )}
                       </button>
                    </div>
                  ))
                )}
              </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-white">Direct Support</h2>
              </div>
              
              {ticketSent ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="text-xs text-amber-300 font-medium">Support request sent to your account manager.</p>
                </div>
              ) : (
                <>
                  {supportError && (
                    <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-semibold">
                      {supportError}
                    </div>
                  )}
                <form onSubmit={handleSendSupport} className="space-y-3 text-xs">
                  <textarea 
                    required
                    rows={3}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    onInput={(e) => setSupportMessage(e.currentTarget.value)}
                    placeholder="Describe your issue or request here..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                  <button type="submit" className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer">
                    Submit Request
                  </button>
                </form>
                </>
              )}
           </div>
        </div>
      </div>


      {/* File Manager & Shared Documents */}
      <div className="pt-2">
        <FileManager />
      </div>

      {/* Create Project Modal */}
      <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Project Name</label>
            <input
              type="text"
              required
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Details / Objectives</label>
            <textarea
              rows={3}
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
               <label className="text-slate-700 dark:text-slate-300 font-bold">Budget Allocation</label>
               <input
                 type="number"
                 value={projBudget}
                 onChange={(e) => setProjBudget(e.target.value)}
                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
               />
             </div>
             <div className="space-y-1">
               <label className="text-slate-700 dark:text-slate-300 font-bold">Category</label>
               <select
                 value={projCategory}
                 onChange={(e) => setProjCategory(e.target.value as any)}
                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
               >
                 <option>Enterprise Software</option>
                 <option>Cloud Infrastructure</option>
                 <option>AI Integration</option>
                 <option>Security & Compliance</option>
               </select>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Assign Employees (Optional)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {assignedTeam.map(emp => (
                <span key={emp} className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-semibold text-[10px] flex items-center gap-1">
                  {emp} <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => toggleAssignTeam(emp, false)} />
                </span>
              ))}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) toggleAssignTeam(e.target.value, false);
                e.target.value = '';
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="">-- Select to Add Employee --</option>
              {supportRecipients.map(e => <option key={e.id} value={e.name}>{e.name} - {e.role}</option>)}
            </select>
          </div>
          
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl cursor-pointer">
              Create Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit / Detail Project Modal */}
      {editingProject && (
        <Modal isOpen={true} onClose={() => setEditingProject(null)} title="Project Management & Collaboration">
           <div className="space-y-5 text-xs pb-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
              <form onSubmit={handleUpdateProject} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-bold block">Status Update</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-slate-300 font-bold block">Update Description</label>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold mb-1 block">Manage Team Assignment</label>
                  <div className="flex flex-wrap gap-2 mb-2 p-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl min-h-[40px]">
                    {editTeam.length === 0 && <span className="text-slate-400 px-1 py-1 text-[10px]">No members assigned.</span>}
                    {editTeam.map(emp => (
                      <span key={emp} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded font-semibold text-[10px] flex items-center gap-1">
                        {emp} <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => toggleAssignTeam(emp, true)} />
                      </span>
                    ))}
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) toggleAssignTeam(e.target.value, true);
                      e.target.value = '';
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Add Employee to Project --</option>
                    {supportRecipients.map(e => <option key={e.id} value={e.name}>{e.name} - {e.department}</option>)}
                  </select>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl cursor-pointer">
                    Save Changes
                  </button>
                </div>
              </form>

              {/* Comments Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-5 space-y-4">
                 <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                   <MessageSquare className="w-4 h-4 text-purple-600" /> Project Discussion
                 </h3>
                 <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                   {(!editingProject.comments || editingProject.comments.length === 0) ? (
                     <p className="text-center text-slate-500 py-4">No comments yet. Start the discussion.</p>
                   ) : (
                     editingProject.comments.map(c => (
                       <div key={c.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl flex gap-3">
                         <div className="w-7 h-7 bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full flex items-center justify-center font-bold shrink-0">
                           {c.authorName.charAt(0)}
                         </div>
                         <div>
                           <div className="flex items-center gap-2 mb-0.5">
                             <span className="font-bold text-slate-900 dark:text-white text-[11px]">{c.authorName}</span>
                             <span className="text-[9px] text-slate-400">{new Date(c.timestamp).toLocaleString()}</span>
                           </div>
                           <p className="text-slate-600 dark:text-slate-300">{c.text}</p>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
                 <div className="flex gap-2">
                   <input
                     type="text"
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     placeholder="Add a comment or status update..."
                     className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                   />
                   <button onClick={handlePostComment} className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer">
                     <Send className="w-4 h-4" />
                   </button>
                 </div>
              </div>
           </div>
        </Modal>
      )}

    </div>
  );
};
