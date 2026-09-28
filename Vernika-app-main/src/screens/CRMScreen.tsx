import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  CalendarDays, 
  Truck, 
  FileText, 
  Plus, 
  Search, 
  DollarSign, 
  Building, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  Trash2,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  FolderKanban
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CRMLead, CRMContact, Vendor, Contract, CalendarEvent } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { FileManager } from '../components/common/FileManager';

const PIPELINE_STAGES: CRMLead['stage'][] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
];

export const CRMScreen: React.FC = () => {
  const { 
    leads, 
    contacts, 
    vendors, 
    contracts, 
    calendarEvents,
    addLead, 
    updateLeadStage, 
    deleteLead,
    addContact,
    deleteContact,
    addVendor,
    deleteVendor,
    addContract,
    deleteContract,
    addCalendarEvent,
    deleteCalendarEvent,
    autoRouteLead
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'contacts' | 'calendar' | 'vendors' | 'contracts' | 'files'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [isAddContractModalOpen, setIsAddContractModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  // Form States
  const [newLead, setNewLead] = useState<Omit<CRMLead, 'id' | 'lastContactDate'>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    value: 50000,
    stage: 'New',
    assignedTo: '',
    probability: 25,
    expectedCloseDate: '2026-06-30',
  });

  const [newContact, setNewContact] = useState<Omit<CRMContact, 'id' | 'lastContact'>>({
    name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    status: 'Customer',
  });

  const [newVendor, setNewVendor] = useState<Omit<Vendor, 'id'>>({
    name: '',
    category: 'Cloud Services',
    contactPerson: '',
    email: '',
    phone: '',
    status: 'Active',
    rating: 4.8,
    activeContracts: 1,
  });

  const [newContract, setNewContract] = useState<Omit<Contract, 'id'>>({
    title: '',
    party: '',
    type: 'Client SOW',
    value: 120000,
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    status: 'Active',
  });

  const [newEvent, setNewEvent] = useState<Omit<CalendarEvent, 'id'>>({
    title: '',
    date: '2026-03-20',
    startTime: '11:00 AM',
    endTime: '12:00 PM',
      attendees: [],
    type: 'Call',
    location: 'Google Meet',
    status: 'Confirmed',
  });

  // Pipeline metrics
  const totalPipelineValue = leads.reduce((acc, curr) => acc + curr.value, 0);
  const wonValue = leads.filter((l) => l.stage === 'Closed Won').reduce((acc, curr) => acc + curr.value, 0);
  const totalContractsValue = contracts.reduce((acc, curr) => acc + curr.value, 0);

  // Handlers
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name) return;
    addLead(newLead);
    setIsAddLeadModalOpen(false);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name) return;
    addContact(newContact);
    setIsAddContactModalOpen(false);
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.name) return;
    addVendor(newVendor);
    setIsAddVendorModalOpen(false);
  };

  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContract.title) return;
    addContract(newContract);
    setIsAddContractModalOpen(false);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;
    addCalendarEvent(newEvent);
    setIsAddEventModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">CRM & Commercial Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pipeline leads, customer contacts, calendar meetings, suppliers, and legal contracts
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-inner">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-md ring-1 ring-slate-200 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Leads ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'contacts'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-md ring-1 ring-slate-200 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-md ring-1 ring-slate-200 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Meetings</span>
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'vendors'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-md ring-1 ring-slate-200 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Vendors</span>
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'contracts'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-md ring-1 ring-slate-200 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Legal</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'files'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-md ring-1 ring-slate-200 dark:ring-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Files</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Pipeline Value</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">${totalPipelineValue.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">{leads.length} qualified opportunities</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Won Revenue (YTD)</p>
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">${wonValue.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-1 font-medium">Closed enterprise contracts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Contracts Value</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">${totalContractsValue.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{contracts.length} agreements active</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/60">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Customer & Vendor Base</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{contacts.length + vendors.length}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{contacts.length} clients, {vendors.length} vendors</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-800/60">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TAB 1: PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Lead Pipeline & Deal Stages</h2>
            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Deal / Lead</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-2">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage);
              const stageTotal = stageLeads.reduce((acc, curr) => acc + curr.value, 0);

              return (
                <div key={stage} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-3 min-w-[200px] transition-colors">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{stage}</span>
                    <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    ${stageTotal.toLocaleString()}
                  </div>

                  <div className="space-y-2">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs space-y-2 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{lead.name}</p>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{lead.company}</p>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">${lead.value.toLocaleString()}</span>
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">{lead.probability}%</span>
                        </div>
                        
                        {lead.aiScore && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">AI Score: {lead.aiScore}/100</span>
                            <span className="font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                              Grade {lead.dealGrade}
                            </span>
                          </div>
                        )}

                        {/* Quick stage advance */}
                        <div className="flex justify-between items-center pt-1">
                          <button 
                            onClick={() => autoRouteLead(lead.id)}
                            className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded hover:bg-indigo-100 transition-colors"
                          >
                            Auto Route (AI)
                          </button>
                          <select
                            value={lead.stage}
                            onChange={(e) => updateLeadStage(lead.id, e.target.value as any)}
                            className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-300"
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CONTACTS */}
      {activeTab === 'contacts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Enterprise Contacts & Client Directory</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Key stakeholders, decision makers, and partner contacts</p>
            </div>
            <button
              onClick={() => setIsAddContactModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Contact Name & Title</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Relationship</th>
                  <th className="py-3 px-4">Last Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{c.title}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{c.company}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.email}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{c.phone}</td>
                    <td className="py-3 px-4">
                      <Badge variant={c.status === 'Customer' || c.status === 'Active' ? 'success' : 'default'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{c.lastContact}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteContact(c.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">CRM Meetings & Stakeholder Calendar</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming demo sessions, renewal calls, and contract reviews</p>
            </div>
            <button
              onClick={() => setIsAddEventModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendarEvents.map((evt) => (
              <div key={evt.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                      {evt.type}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1.5">{evt.title}</h3>
                  </div>
                  <button
                    onClick={() => deleteCalendarEvent(evt.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.date} • {evt.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.location}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Attendees:</span> {evt.attendees.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: VENDORS */}
      {activeTab === 'vendors' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Vendors & Procurement Partners</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cloud providers, hardware suppliers, and legal counsel</p>
            </div>
            <button
              onClick={() => setIsAddVendorModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{v.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{v.category}</p>
                  </div>
                  <Badge variant={v.status === 'Active' ? 'success' : 'warning'}>
                    {v.status}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <p><span className="font-semibold text-slate-800 dark:text-slate-200">Contact:</span> {v.contactPerson}</p>
                  <p><span className="font-semibold text-slate-800 dark:text-slate-200">Email:</span> {v.email}</p>
                  <p><span className="font-semibold text-slate-800 dark:text-slate-200">Phone:</span> {v.phone}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Rating: {v.rating} / 5.0</span>
                  <span className="text-slate-500 dark:text-slate-400">{v.activeContracts} Active Contracts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Legal Contracts & Service Level Agreements</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track multi-year contracts, renewal terms, and contract values</p>
            </div>
            <button
              onClick={() => setIsAddContractModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Contract</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Agreement Title</th>
                  <th className="py-3 px-4">Party & Type</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Auto-Renew</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {contracts.map((ctr) => (
                  <tr key={ctr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{ctr.title}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{ctr.partyName || ctr.party}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{ctr.partyType || ctr.type}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      ${ctr.value.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{ctr.startDate}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{ctr.endDate}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{ctr.autoRenew ? 'Yes' : 'No'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={ctr.status === 'Active' ? 'success' : ctr.status === 'Draft' ? 'warning' : 'danger'}>
                        {ctr.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteContract(ctr.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: FILES */}
      {activeTab === 'files' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <FileManager />
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal isOpen={isAddLeadModalOpen} onClose={() => setIsAddLeadModalOpen(false)} title="Create Sales Lead / Opportunity">
        <form onSubmit={handleAddLead} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Deal / Project Name</label>
            <input
              type="text"
              required
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              placeholder="e.g. Enterprise Cloud Modernization"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Company Name</label>
              <input
                type="text"
                required
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                placeholder="Acme Corp"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Deal Value ($)</label>
              <input
                type="number"
                min="0"
                value={newLead.value}
                onChange={(e) => setNewLead({ ...newLead, value: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Stage</label>
              <select
                value={newLead.stage}
                onChange={(e) => setNewLead({ ...newLead, stage: e.target.value as any })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newLead.probability}
                onChange={(e) => setNewLead({ ...newLead, probability: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddLeadModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Save Deal
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Contact Modal */}
      <Modal isOpen={isAddContactModalOpen} onClose={() => setIsAddContactModalOpen(false)} title="Add Customer Contact">
        <form onSubmit={handleAddContact} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Full Name</label>
            <input
              type="text"
              required
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="e.g. Eleanor Vance"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Job Title</label>
              <input
                type="text"
                required
                value={newContact.title}
                onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                placeholder="Chief Technology Officer"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Company</label>
              <input
                type="text"
                required
                value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                placeholder="Acme Financial"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Email</label>
              <input
                type="email"
                required
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Phone</label>
              <input
                type="text"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddContactModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Save Contact
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Vendor Modal */}
      <Modal isOpen={isAddVendorModalOpen} onClose={() => setIsAddVendorModalOpen(false)} title="Register Supplier / Vendor">
        <form onSubmit={handleAddVendor} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Vendor Name</label>
            <input
              type="text"
              required
              value={newVendor.name}
              onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
              placeholder="e.g. AWS Cloud Infrastructure"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Category</label>
              <input
                type="text"
                required
                value={newVendor.category}
                onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Contact Person</label>
              <input
                type="text"
                required
                value={newVendor.contactPerson}
                onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddVendorModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Save Vendor
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Contract Modal */}
      <Modal isOpen={isAddContractModalOpen} onClose={() => setIsAddContractModalOpen(false)} title="Draft Legal Agreement / Contract">
        <form onSubmit={handleAddContract} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Contract Title</label>
            <input
              type="text"
              required
              value={newContract.title}
              onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
              placeholder="e.g. Master Cloud Services Agreement"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Party Name</label>
              <input
                type="text"
                required
                value={newContract.party}
                onChange={(e) => setNewContract({ ...newContract, party: e.target.value })}
                placeholder="e.g. Apex Global Financial"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Total Contract Value ($)</label>
              <input
                type="number"
                min="0"
                value={newContract.value}
                onChange={(e) => setNewContract({ ...newContract, value: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddContractModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Save Agreement
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Event Modal */}
      <Modal isOpen={isAddEventModalOpen} onClose={() => setIsAddEventModalOpen(false)} title="Schedule Stakeholder Meeting">
        <form onSubmit={handleAddEvent} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-bold">Meeting Title</label>
            <input
              type="text"
              required
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="e.g. Architecture Alignment with Acme Corp"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Date</label>
              <input
                type="date"
                required
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Start Time</label>
              <input
                type="text"
                required
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                placeholder="10:00 AM"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddEventModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
