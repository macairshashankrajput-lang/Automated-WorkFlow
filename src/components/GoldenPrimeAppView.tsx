import React, { useState } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  FileSpreadsheet,
  Plus,
  Send,
  Download,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building,
  Bed,
  CreditCard,
  QrCode,
  AlertCircle,
  Search,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { hybridDB } from '../services/hybridDatabase';

interface Tenant {
  id: string;
  name: string;
  phone: string;
  room: string;
  building: string;
  rent: number;
  paidAmount: number;
  deposit: number;
  kycDone: boolean;
  paidThisMonth: boolean;
  joinDate: string;
}

export const GoldenPrimeAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'buildings' | 'rooms' | 'tenants' | 'collections' | 'expenses' | 'settings'
  >('overview');

  // Tenants State
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: 't1', name: 'Amit Patel', phone: '+91 98765 43210', room: '101', building: 'Golden Prime Main', rent: 14000, paidAmount: 14000, deposit: 28000, kycDone: true, paidThisMonth: true, joinDate: '2025-06-10' },
    { id: 't2', name: 'Rajesh Kumar', phone: '+91 98765 11223', room: '102', building: 'Golden Prime Main', rent: 12000, paidAmount: 0, deposit: 24000, kycDone: true, paidThisMonth: false, joinDate: '2025-08-01' },
    { id: 't3', name: 'Suresh Raina', phone: '+91 98123 44556', room: '201', building: 'Golden Prime Main', rent: 15000, paidAmount: 15000, deposit: 30000, kycDone: true, paidThisMonth: true, joinDate: '2025-01-15' },
    { id: 't4', name: 'Priya Sharma', phone: '+91 97788 99001', room: '204', building: 'Annex Tower B', rent: 8500, paidAmount: 4000, deposit: 17000, kycDone: false, paidThisMonth: false, joinDate: '2025-09-01' },
  ]);

  // WhatsApp Alert Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [customMessage, setCustomMessage] = useState('');

  // Payment Recording Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const totalCollected = tenants.reduce((sum, t) => sum + t.paidAmount, 0);
  const totalPending = tenants.reduce((sum, t) => sum + Math.max(0, t.rent - t.paidAmount), 0);

  const handleOpenWhatsAppModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    const due = tenant.rent - tenant.paidAmount;
    setCustomMessage(
      `Dear ${tenant.name},\n\nYour PG rent for Room ${tenant.room} (${tenant.building}) is currently pending.\nDue Amount: ₹${due.toLocaleString()}\nPayment UPI: goldenprimepg@upi\n\nPlease reply with the transaction screenshot upon transfer. Thank you!\n- GoldenPrime PG Management`
    );
    setShowWhatsAppModal(true);
  };

  const handleSendWhatsApp = () => {
    if (!selectedTenant) return;
    alert(`WhatsApp Message Dispatched to ${selectedTenant.name} (${selectedTenant.phone}):\n\n${customMessage}`);
    setShowWhatsAppModal(false);
  };

  const handleOpenPayModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setPayAmount(tenant.rent - tenant.paidAmount);
    setShowPayModal(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    const updated = tenants.map((t) => {
      if (t.id === selectedTenant.id) {
        const newPaid = t.paidAmount + Number(payAmount);
        return {
          ...t,
          paidAmount: newPaid,
          paidThisMonth: newPaid >= t.rent,
        };
      }
      return t;
    });

    setTenants(updated);
    hybridDB.saveAppData('goldenprime', 'tenants', updated);
    setShowPayModal(false);
    alert(`Payment of ₹${payAmount.toLocaleString()} recorded for ${selectedTenant.name}! Receipt synced to Google Drive.`);
  };

  const handleExportWorkbook = () => {
    const sheetData = tenants.map((t) => ({
      TenantID: t.id,
      Name: t.name,
      Phone: t.phone,
      Building: t.building,
      Room: t.room,
      RentAmount: t.rent,
      PaidAmount: t.paidAmount,
      BalanceDue: t.rent - t.paidAmount,
      Status: t.paidThisMonth ? 'FULL PAID' : t.paidAmount > 0 ? 'PARTIAL' : 'PENDING OVERDUE',
    }));
    hybridDB.exportToSpreadsheet('GoldenPrime_Rent_Ledger', sheetData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* App Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-display">GoldenPrime PG Ledger & WhatsApp Alerts</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Drive & Spreadsheet Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">Rent Ledger, Partial Payments, WhatsApp Reminders & Receipts</p>
          </div>
        </div>

        <button
          onClick={handleExportWorkbook}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-bold text-xs text-slate-200 transition-all flex items-center gap-1.5"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Export Rent Ledger (.xlsx)
        </button>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Collected Rent This Month</div>
          <div className="text-2xl font-extrabold text-emerald-400">₹{totalCollected.toLocaleString()}</div>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Outstanding Overdue Rent</div>
          <div className="text-2xl font-extrabold text-rose-400">₹{totalPending.toLocaleString()}</div>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Total Active Tenants</div>
          <div className="text-2xl font-extrabold text-cyan-400">{tenants.length} Tenants</div>
        </div>
      </div>

      {/* Rent Collections & Overdue Ledger Table */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-rose-400" /> Rent Collections & Reminders Ledger
        </h2>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] bg-slate-950">
                <th className="p-3">Tenant Name</th>
                <th className="p-3">Room & Building</th>
                <th className="p-3">Rent</th>
                <th className="p-3">Paid</th>
                <th className="p-3">Balance Due</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tenants.map((t) => {
                const due = t.rent - t.paidAmount;
                return (
                  <tr key={t.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-white">{t.name} <div className="text-[10px] text-slate-400 font-normal">{t.phone}</div></td>
                    <td className="p-3 text-slate-300">Room {t.room} ({t.building})</td>
                    <td className="p-3 font-bold text-slate-200">₹{t.rent.toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-400">₹{t.paidAmount.toLocaleString()}</td>
                    <td className="p-3 font-bold text-rose-400">₹{due.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        due === 0
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : t.paidAmount > 0
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {due === 0 ? 'Full Paid' : t.paidAmount > 0 ? 'Partial' : 'Overdue'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenPayModal(t)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 font-bold transition-all"
                      >
                        Record Pay
                      </button>
                      {due > 0 && (
                        <button
                          onClick={() => handleOpenWhatsAppModal(t)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 font-bold transition-all"
                        >
                          WhatsApp Alert
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Message Composer Modal */}
      {showWhatsAppModal && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" /> WhatsApp Payment Reminder Composer
            </h2>
            <div className="text-xs text-slate-400">Recipient: <span className="text-white font-bold">{selectedTenant.name} ({selectedTenant.phone})</span></div>

            <div>
              <label className="text-slate-400 block mb-1 text-xs">Custom Message Text</label>
              <textarea
                rows={6}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowWhatsAppModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs">
                Cancel
              </button>
              <button onClick={handleSendWhatsApp} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" /> Dispatch WhatsApp Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold text-white">Record Rent Receipt</h2>
            <div className="text-xs text-slate-400">Tenant: <span className="text-white font-bold">{selectedTenant.name} (Room {selectedTenant.room})</span></div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Amount Received (₹)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">
                  Save Receipt & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
