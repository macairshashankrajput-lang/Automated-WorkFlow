import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  Download,
  Calendar,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Invoice } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const InvoicingScreen: React.FC = () => {
  const { invoices, addInvoice, markInvoicePaid, deleteInvoice, clients, verifyThreeWayMatch } = useApp();
  const { role } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State
  const [clientName, setClientName] = useState(clients[0]?.name || 'Apex Global Financials');
  const [clientEmail, setClientEmail] = useState(clients[0]?.email || 'finance@apex.com');
  const [amount, setAmount] = useState(25000);
  const [dueDate, setDueDate] = useState('2026-09-15');
  const [description, setDescription] = useState('Enterprise Cloud Modernization - Milestone 1');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return;
    const numAmount = Number(amount);
    const subtotal = numAmount;
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;

    await addInvoice({
      invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
      clientName,
      clientEmail,
      client: clientName,
      amount: total,
      subtotal,
      tax,
      total,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: 'Sent',
      items: [{ id: `item-1`, description, quantity: 1, unitPrice: subtotal, total: subtotal }],
    });
    setIsCreateOpen(false);
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!inv) return false;
    const s = (search || '').toLowerCase();
    const nameToMatch = (inv.clientName || inv.client || '').toLowerCase();
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const matchesSearch = !s || nameToMatch.includes(s) || invNum.includes(s);
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((acc, curr) => acc + (curr.total || curr.amount || 0), 0);
  const paidInvoices = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((acc, curr) => acc + (curr.total || curr.amount || 0), 0);
  const pendingInvoices = invoices
    .filter((i) => i.status === 'Sent' || i.status === 'Overdue' || i.status === 'Pending')
    .reduce((acc, curr) => acc + (curr.total || curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Invoicing & Financial Statements</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
              Multi-Client Billing
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate milestone statements, track ACH/Stripe settlements, and disburse client invoices.
          </p>
        </div>

        {role === 'admin' && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Billed Volume</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">${totalInvoiced.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{invoices.length} total issued invoices</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Collected Revenue (Paid)</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">${paidInvoices.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Settled into operating account</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Outstanding Receivables</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">${pendingInvoices.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Awaiting client payment</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number or client..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Sent">Sent / Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Total ($)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredInvoices.map((inv) => {
                const totalVal = inv.total || inv.amount || 0;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{inv.clientName || inv.client}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{inv.clientEmail}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{inv.issueDate}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                      ${totalVal.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          inv.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' :
                          inv.status === 'Overdue' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30' :
                          'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                        }`}>
                          {inv.status}
                        </span>
                        {inv.complianceBadge && (
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${
                            inv.threeWayMatched 
                              ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {inv.complianceBadge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex flex-wrap justify-end items-center gap-2">
                        {inv.status !== 'Paid' && !inv.threeWayMatched && (
                          <button
                            type="button"
                            onClick={() => {
                              const po = prompt('Enter Purchase Order Number (e.g. PO-1024):');
                              if (po) verifyThreeWayMatch(inv.id, po);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold cursor-pointer transition-all"
                          >
                            3-Way Match
                          </button>
                        )}
                        {inv.status !== 'Paid' && inv.threeWayMatched && (
                          <button
                            type="button"
                            onClick={() => markInvoicePaid(inv.id, 'Credit Card (Stripe)')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-all"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => alert(`Downloading Official PDF Statement for ${inv.invoiceNumber}`)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                        {role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => deleteInvoice(inv.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Invoice */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Client Invoice">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Client Company *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Apex Global Financials"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Billing Email *</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="billing@apex.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Invoice Amount ($ USD) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-semibold">Description / Scope of Work</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Sprint Milestone 1 Deliverables"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              Issue & Send Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
