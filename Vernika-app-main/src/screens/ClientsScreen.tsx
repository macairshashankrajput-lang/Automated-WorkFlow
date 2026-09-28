import React, { useState } from 'react';
import {
  Building2,
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  FolderKanban,
  DollarSign,
  Receipt,
  MessageSquare,
  Key,
  Lock,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Briefcase,
  ExternalLink,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check,
  TrendingUp,
  LayoutGrid,
  ListFilter,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ClientAccount, Project } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const ClientsScreen: React.FC = () => {
  const { 
    clients, 
    projects, 
    invoices, 
    addClient, 
    updateClient, 
    deleteClient, 
    openChatWithUser, 
    setActiveScreen,
    employees
  } = useApp();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientAccount | null>(null);
  const [dossierClient, setDossierClient] = useState<ClientAccount | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    username: '',
    password: 'password123',
    accountManager: '',
    status: 'Active' as string,
    totalBilled: 50000,
    totalPaid: 35000,
    selectedProjects: [] as string[],
  });

  const uniqueClients = Array.from(
    new Map((clients || []).filter(Boolean).map((c) => [c.id, c])).values()
  );

  const filteredClients = uniqueClients.filter((client) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (client.name || '').toLowerCase().includes(q) ||
      (client.company || '').toLowerCase().includes(q) ||
      (client.email || '').toLowerCase().includes(q) ||
      (client.username || '').toLowerCase().includes(q) ||
      (client.phone || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesManager = managerFilter === 'all' || client.accountManager === managerFilter;

    return matchesSearch && matchesStatus && matchesManager;
  });

  // Metrics
  const totalClientsCount = uniqueClients.length;
  const activeClientsCount = uniqueClients.filter((c) => c.status === 'Active').length;
  const totalBilledSum = uniqueClients.reduce((sum, c) => sum + (c.totalBilled || 0), 0);
  const totalPaidSum = uniqueClients.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
  const outstandingSum = totalBilledSum - totalPaidSum;

  const handleCopyCredentials = (client: ClientAccount) => {
    const text = `Username: ${client.username || 'N/A'}\nPassword: ${client.password || 'password123'}\nCompany: ${client.company}\nPortal URL: https://vernika.io/portal/client`;
    navigator.clipboard.writeText(text);
    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordReveal = (clientId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '+1 (555) 000-0000',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      username: `client_${Date.now().toString().slice(-4)}`,
      password: 'password123',
      accountManager: '',
      status: 'Active',
      totalBilled: 75000,
      totalPaid: 50000,
      selectedProjects: projects.length > 0 ? [projects[0].id] : [],
    });
    setIsAddOpen(true);
  };

  const openEditModal = (client: ClientAccount) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone || '',
      avatar: client.avatar || '',
      username: client.username || '',
      password: client.password || 'password123',
      accountManager: client.accountManager || 'Unassigned',
      status: client.status || 'Active',
      totalBilled: client.totalBilled || 0,
      totalPaid: client.totalPaid || 0,
      selectedProjects: client.projects || [],
    });
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) return;

    await addClient({
      name: formData.name.trim(),
      company: formData.company.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      avatar: formData.avatar,
      username: formData.username.trim() || `client_${formData.name.toLowerCase().replace(/\s+/g, '_')}`,
      password: formData.password || 'password123',
      accountManager: formData.accountManager,
      status: formData.status,
      totalBilled: Number(formData.totalBilled) || 0,
      totalPaid: Number(formData.totalPaid) || 0,
      projects: formData.selectedProjects,
      allowedModules: ['client_dashboard', 'client_projects', 'client_invoices', 'client_deliverables', 'client_support', 'chat'],
    });

    setIsAddOpen(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    await updateClient(editingClient.id, {
      name: formData.name.trim(),
      company: formData.company.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      avatar: formData.avatar,
      username: formData.username.trim(),
      password: formData.password,
      accountManager: formData.accountManager,
      status: formData.status,
      totalBilled: Number(formData.totalBilled) || 0,
      totalPaid: Number(formData.totalPaid) || 0,
      projects: formData.selectedProjects,
    });

    setEditingClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Client Accounts & Enterprise Portals
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                {uniqueClients.length} Enterprise Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive client directory, portal login credentials management, project allocations, deliverables & direct client communication.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client Account</span>
          </button>
        </div>
      </div>

      {/* Financial & Account Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clients</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalClientsCount}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{activeClientsCount} Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">100% portal credential enabled</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Contract Value</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${(totalBilledSum / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-bold text-slate-400">Cumulative</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all active contracts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Collected Revenue</span>
            <Receipt className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ${(totalPaidSum / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-bold text-emerald-500">
              {totalBilledSum > 0 ? Math.round((totalPaidSum / totalBilledSum) * 100) : 0}% Paid
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Verified settlement receipts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Balance</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              ${(outstandingSum / 1000).toFixed(1)}k
            </span>
            <span className="text-xs font-bold text-amber-500">Invoiced</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled for upcoming cycle</p>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, client name, email, or username..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">All Account Managers</option>
            {employees.filter((employee) => employee?.name).map((employee) => <option key={employee.id} value={employee.name}>{employee.name}</option>)}
          </select>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Client Content */}
      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Client Accounts Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No enterprise client matches your current search filters. Try resetting the filters or add a new client profile.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
          >
            Create Client Account
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientProjects = projects.filter((p) => (client.projects || []).includes(p.id));
            const isCopied = copiedId === client.id;
            const isRevealed = !!revealedPasswords[client.id];
            const percentPaid = client.totalBilled > 0 
              ? Math.min(100, Math.round((client.totalPaid / client.totalBilled) * 100)) 
              : 100;

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Header Profile */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={client.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                        alt={client.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {client.company}
                        </h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{client.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Joined {client.joinedDate || '2023'}</p>
                      </div>
                    </div>

                    <Badge variant={client.status === 'Active' ? 'success' : 'default'} size="sm">
                      {client.status}
                    </Badge>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3.5 space-y-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Manager: <strong className="text-slate-800 dark:text-slate-200">{client.accountManager || 'Marcus Vance'}</strong></span>
                    </div>
                  </div>

                  {/* Credentials Box */}
                  <div className="mt-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 rounded-xl p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-800 dark:text-blue-300">
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Portal Login Credentials</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(client)}
                        className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Copy credentials"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Username</span>
                        <code className="font-bold text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 block truncate">
                          {client.username || 'client_apex'}
                        </code>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block flex items-center justify-between">
                          <span>Password</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(client.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {isRevealed ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                          </button>
                        </span>
                        <code className="font-bold text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 block truncate">
                          {isRevealed ? (client.password || 'password123') : '••••••••'}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Active Projects */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                      Assigned Projects ({clientProjects.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {clientProjects.length > 0 ? (
                        clientProjects.map((p) => (
                          <span
                            key={p.id}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                          >
                            <FolderKanban className="w-2.5 h-2.5 text-blue-500" />
                            <span className="truncate max-w-[140px]">{p.name}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No assigned projects yet</span>
                      )}
                    </div>
                  </div>

                  {/* Billing Progress */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Billed: <strong>${(client.totalBilled || 0).toLocaleString()}</strong></span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">Paid: ${(client.totalPaid || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => openChatWithUser(client.id)}
                    className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Direct Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDossierClient(client)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="View 360 Client Dossier"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(client)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Edit Client"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete client account "${client.company}"?`)) {
                        await deleteClient(client.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Client Company</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Portal Credentials</th>
                  <th className="py-3 px-4">Account Manager</th>
                  <th className="py-3 px-4">Projects</th>
                  <th className="py-3 px-4">Financials</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredClients.map((client) => {
                  const clientProjects = projects.filter((p) => (client.projects || []).includes(p.id));
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={client.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                            alt={client.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{client.company}</p>
                            <p className="text-[10px] text-slate-400">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{client.name}</p>
                        <p className="text-[10px] text-slate-400">{client.phone || 'N/A'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 inline-flex items-center gap-2">
                          <span>User: <strong>{client.username}</strong></span>
                          <span className="text-slate-400">|</span>
                          <span>Pass: {client.password || 'password123'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        {client.accountManager || 'Marcus Vance'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                          {clientProjects.length} Projects
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">${(client.totalBilled || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Paid: ${(client.totalPaid || 0).toLocaleString()}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={client.status === 'Active' ? 'success' : 'default'} size="sm">
                          {client.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openChatWithUser(client.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                            title="Direct Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDossierClient(client)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="360 Dossier"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(client)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Delete client "${client.company}"?`)) {
                                await deleteClient(client.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Enterprise Client Account">
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company / Organization Name *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Apex Global Financials"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Executive Contact *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alexander Cross"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Work Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alex@apexfinancials.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Direct Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (415) 890-3412"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Credentials Section */}
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-2.5">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-xs">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Dedicated Client Portal Login Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Portal Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. client_apex"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Portal Password</label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="password123"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Manager</label>
              <select
                value={formData.accountManager}
                onChange={(e) => setFormData({ ...formData, accountManager: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              >
                {employees.filter((employee) => employee?.name).map((employee) => <option key={employee.id} value={employee.name}>{employee.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="Active">Active Account</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total Contract Value ($)</label>
              <input
                type="number"
                value={formData.totalBilled}
                onChange={(e) => setFormData({ ...formData, totalBilled: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total Paid ($)</label>
              <input
                type="number"
                value={formData.totalPaid}
                onChange={(e) => setFormData({ ...formData, totalPaid: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Modal */}
      <Modal isOpen={!!editingClient} onClose={() => setEditingClient(null)} title="Edit Client Account">
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Executive</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-2.5">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 text-xs">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Portal Login Credentials</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Manager</label>
              <select
                value={formData.accountManager}
                onChange={(e) => setFormData({ ...formData, accountManager: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              >
                {employees.filter((employee) => employee?.name).map((employee) => <option key={employee.id} value={employee.name}>{employee.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total Billed ($)</label>
              <input
                type="number"
                value={formData.totalBilled}
                onChange={(e) => setFormData({ ...formData, totalBilled: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total Paid ($)</label>
              <input
                type="number"
                value={formData.totalPaid}
                onChange={(e) => setFormData({ ...formData, totalPaid: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingClient(null)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* 360 Client Dossier Modal */}
      {dossierClient && (
        <Modal isOpen={!!dossierClient} onClose={() => setDossierClient(null)} title={`${dossierClient.company} - 360 Dossier`}>
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <img
                src={dossierClient.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                alt={dossierClient.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500"
              />
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{dossierClient.company}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Executive Lead: {dossierClient.name}</p>
                <p className="text-[11px] text-slate-400">{dossierClient.email} • {dossierClient.phone || 'No phone'}</p>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Billed</span>
                <p className="text-base font-black text-slate-900 dark:text-white">${(dossierClient.totalBilled || 0).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Settled</span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400">${(dossierClient.totalPaid || 0).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Outstanding</span>
                <p className="text-base font-black text-amber-600 dark:text-amber-400">
                  ${((dossierClient.totalBilled || 0) - (dossierClient.totalPaid || 0)).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Projects */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4 text-blue-500" />
                <span>Active Enterprise Projects</span>
              </h4>
              <div className="space-y-2">
                {projects.filter((p) => (dossierClient.projects || []).includes(p.id)).map((p) => (
                  <div key={p.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-400">Budget: ${(p.budget || 0).toLocaleString()} • Due: {p.deadline || 'Ongoing'}</p>
                    </div>
                    <Badge variant={p.status === 'Completed' ? 'success' : 'default'} size="sm">
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDossierClient(null);
                  openChatWithUser(dossierClient.id);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open Direct Chat</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
