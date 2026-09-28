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
  ShieldCheck,
  Check,
  Zap,
  Calculator,
  UserPlus,
  Receipt,
  PlusCircle,
} from 'lucide-react';
import { hybridDB } from '../services/hybridDatabase';

interface Tenant {
  id: string;
  name: string;
  phone: string;
  aadhaar: string;
  room: string;
  building: string;
  rent: number;
  paidAmount: number;
  deposit: number;
  kycDone: boolean;
  paidThisMonth: boolean;
  joinDate: string;
}

interface BuildingItem {
  id: string;
  name: string;
  address: string;
  totalRooms: number;
  occupiedBeds: number;
  totalBeds: number;
  status: string;
}

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
}

export const GoldenPrimeAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'buildings' | 'rooms' | 'tenants' | 'collections' | 'expenses' | 'powersplit' | 'qrsettings'
  >('overview');

  // PG Buildings State
  const [buildings, setBuildings] = useState<BuildingItem[]>([
    { id: 'b1', name: 'Golden Prime Main Block', address: '124 MG Road, Indiranagar', totalRooms: 20, occupiedBeds: 38, totalBeds: 40, status: 'Active' },
    { id: 'b2', name: 'Golden Prime Annex Tower B', address: '88 Cyber Park, HSR Layout', totalRooms: 15, occupiedBeds: 25, totalBeds: 30, status: 'Active' },
  ]);
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [newBldName, setNewBldName] = useState('');
  const [newBldAddr, setNewBldAddr] = useState('');
  const [newBldRooms, setNewBldRooms] = useState(10);
  const [newBldBeds, setNewBldBeds] = useState(20);

  // Tenants State
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: 't1', name: 'Amit Patel', phone: '+91 98765 43210', aadhaar: '5421 8890 1234', room: '101', building: 'Golden Prime Main Block', rent: 14000, paidAmount: 14000, deposit: 28000, kycDone: true, paidThisMonth: true, joinDate: '2025-06-10' },
    { id: 't2', name: 'Rajesh Kumar', phone: '+91 98765 11223', aadhaar: '9981 2234 5566', room: '102', building: 'Golden Prime Main Block', rent: 12000, paidAmount: 0, deposit: 24000, kycDone: true, paidThisMonth: false, joinDate: '2025-08-01' },
    { id: 't3', name: 'Suresh Raina', phone: '+91 98123 44556', aadhaar: '4412 9900 7711', room: '201', building: 'Golden Prime Main Block', rent: 15000, paidAmount: 15000, deposit: 30000, kycDone: true, paidThisMonth: true, joinDate: '2025-01-15' },
    { id: 't4', name: 'Priya Sharma', phone: '+91 97788 99001', aadhaar: '8823 4411 0099', room: '204', building: 'Golden Prime Annex Tower B', rent: 8500, paidAmount: 4000, deposit: 17000, kycDone: false, paidThisMonth: false, joinDate: '2025-09-01' },
  ]);

  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantAadhaar, setNewTenantAadhaar] = useState('');
  const [newTenantRoom, setNewTenantRoom] = useState('103');
  const [newTenantRent, setNewTenantRent] = useState(12000);

  // Expenses State
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 'x1', title: 'Indiranagar Main Block Electricity Bill', category: 'Utilities', amount: 18500, date: '2026-09-25' },
    { id: 'x2', title: 'High-Speed Broadband Fiber Internet', category: 'Wifi & Tech', amount: 6200, date: '2026-09-20' },
    { id: 'x3', title: 'Housekeeping & Cook Staff Monthly Wages', category: 'Staff Payroll', amount: 22000, date: '2026-09-01' },
  ]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Utilities');
  const [newExpAmount, setNewExpAmount] = useState(5000);

  // Sub-meter Power Bill Splitter
  const [powerUnits, setPowerUnits] = useState(180);
  const [unitRate, setUnitRate] = useState(8);
  const [targetRoom, setTargetRoom] = useState('101');

  // WhatsApp & Pay Modals
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);

  // Bank UPI Settings
  const [upiId, setUpiId] = useState('goldenprimepg@upi');
  const [accountName, setAccountName] = useState('GoldenPrime Residency Private Limited');

  const totalCollected = tenants.reduce((sum, t) => sum + t.paidAmount, 0);
  const totalPending = tenants.reduce((sum, t) => sum + Math.max(0, t.rent - t.paidAmount), 0);

  // Handlers
  const handleAddBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBldName.trim()) return;
    const newBld: BuildingItem = {
      id: `b${Date.now()}`,
      name: newBldName,
      address: newBldAddr || 'Indiranagar Hub',
      totalRooms: Number(newBldRooms),
      occupiedBeds: 0,
      totalBeds: Number(newBldBeds),
      status: 'Active',
    };
    setBuildings([...buildings, newBld]);
    setShowAddBuildingModal(false);
    setNewBldName('');
    setNewBldAddr('');
    hybridDB.saveAppData('goldenprime', 'buildings', [...buildings, newBld]);
  };

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    const newT: Tenant = {
      id: `t${Date.now()}`,
      name: newTenantName,
      phone: newTenantPhone || '+91 98765 00000',
      aadhaar: newTenantAadhaar || '1234 5678 9012',
      room: newTenantRoom,
      building: 'Golden Prime Main Block',
      rent: Number(newTenantRent),
      paidAmount: 0,
      deposit: Number(newTenantRent) * 2,
      kycDone: true,
      paidThisMonth: false,
      joinDate: new Date().toISOString().split('T')[0],
    };
    setTenants([...tenants, newT]);
    setShowAddTenantModal(false);
    setNewTenantName('');
    hybridDB.saveAppData('goldenprime', 'tenants', [...tenants, newT]);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle.trim()) return;
    const exp: ExpenseItem = {
      id: `x${Date.now()}`,
      title: newExpTitle,
      category: newExpCategory,
      amount: Number(newExpAmount),
      date: new Date().toISOString().split('T')[0],
    };
    setExpenses([...expenses, exp]);
    setShowAddExpenseModal(false);
    setNewExpTitle('');
    hybridDB.saveAppData('goldenprime', 'expenses', [...expenses, exp]);
  };

  const handleApplyPowerBill = () => {
    const totalBill = powerUnits * unitRate;
    const roomTenants = tenants.filter((t) => t.room === targetRoom);
    if (roomTenants.length === 0) {
      alert(`No active tenants found in Room ${targetRoom}.`);
      return;
    }
    const perHeadSurcharge = Math.round(totalBill / roomTenants.length);

    const updated = tenants.map((t) => {
      if (t.room === targetRoom) {
        return { ...t, rent: t.rent + perHeadSurcharge };
      }
      return t;
    });

    setTenants(updated);
    alert(`Added ₹${perHeadSurcharge} power surcharge to each of the ${roomTenants.length} tenants in Room ${targetRoom}!`);
    hybridDB.saveAppData('goldenprime', 'tenants', updated);
  };

  const handleOpenWhatsAppModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    const due = tenant.rent - tenant.paidAmount;
    setCustomMessage(
      `Dear ${tenant.name},\n\nYour GoldenPrime PG rent for Room ${tenant.room} (${tenant.building}) is currently pending.\nDue Amount: ₹${due.toLocaleString()}\nPayment UPI: ${upiId}\n\nPlease transfer and reply with screenshot. Thank you!`
    );
    setShowWhatsAppModal(true);
  };

  const handleSendWhatsApp = () => {
    if (!selectedTenant) return;
    window.open(`https://wa.me/${selectedTenant.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(customMessage)}`, '_blank');
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
  };

  const handleExportWorkbook = () => {
    const sheetData = tenants.map((t) => ({
      TenantID: t.id,
      Name: t.name,
      Phone: t.phone,
      Aadhaar: t.aadhaar,
      Building: t.building,
      Room: t.room,
      RentAmount: t.rent,
      PaidAmount: t.paidAmount,
      BalanceDue: t.rent - t.paidAmount,
      KYC_Verified: t.kycDone ? 'YES' : 'PENDING',
      Status: t.paidThisMonth ? 'FULL PAID' : t.paidAmount > 0 ? 'PARTIAL' : 'OVERDUE',
    }));
    hybridDB.exportToSpreadsheet('GoldenPrime_PG_Rent_Ledger', sheetData);
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
              <h1 className="text-xl font-bold text-white font-display">GoldenPrime PG Operations & Rent Ledger</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                8 Integrated PG Modules
              </span>
            </div>
            <p className="text-xs text-slate-400">Building Wizard, Aadhaar KYC Onboarding, Power Bill Splitter, Rent Ledger & WhatsApp Alerts</p>
          </div>
        </div>

        <button
          onClick={handleExportWorkbook}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold text-xs text-slate-200 transition-all flex items-center gap-1.5"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Export Rent Ledger (.xlsx)
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Financial Overview', icon: TrendingUp },
          { id: 'buildings', label: 'PG Buildings Wizard', icon: Building },
          { id: 'rooms', label: 'Rooms & Bed Billing', icon: Bed },
          { id: 'tenants', label: 'Tenants & Aadhaar KYC', icon: Users },
          { id: 'collections', label: 'Rent Ledger & Reminders', icon: DollarSign },
          { id: 'powersplit', label: 'Power Bill Splitter', icon: Zap },
          { id: 'expenses', label: 'Operating Expenses', icon: CreditCard },
          { id: 'qrsettings', label: 'UPI QR Settings', icon: QrCode },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 flex-shrink-0 ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Financial Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 space-y-1">
              <div className="text-xs text-slate-400">Collected Rent This Month</div>
              <div className="text-2xl font-extrabold text-emerald-400">₹{totalCollected.toLocaleString('en-IN')}</div>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-1">
              <div className="text-xs text-slate-400">Outstanding Overdue Rent</div>
              <div className="text-2xl font-extrabold text-rose-400">₹{totalPending.toLocaleString('en-IN')}</div>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-1">
              <div className="text-xs text-slate-400">Total PG Beds Occupancy</div>
              <div className="text-2xl font-extrabold text-cyan-400">63 / 70 Beds (90%)</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PG Buildings Wizard */}
      {activeTab === 'buildings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">Managed PG Properties ({buildings.length})</h2>
            <button
              onClick={() => setShowAddBuildingModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" /> Add New Building
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buildings.map((b) => (
              <div key={b.id} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{b.name}</h3>
                    <div className="text-xs text-slate-400">{b.address}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {b.status}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>Total Rooms: <strong className="text-white">{b.totalRooms}</strong></div>
                  <div>Bed Occupancy: <strong className="text-emerald-400">{b.occupiedBeds} / {b.totalBeds}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Rooms & Bed Billing Modes */}
      {activeTab === 'rooms' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bed className="h-4 w-4 text-indigo-400" /> Room & Bed Billing Modes Configurator
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400">Per-Bed Sharing Mode</div>
              <div className="text-slate-400">Each tenant pays individual bed fee (e.g. 2-Sharing ₹8,500/mo).</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-indigo-400">Fixed Single Room Mode</div>
              <div className="text-slate-400">Single private occupant pays fixed room rent (₹15,000/mo).</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-amber-400">Split Bill Electricity Mode</div>
              <div className="text-slate-400">Monthly sub-meter power bill split equally across room occupants.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Tenants & Aadhaar KYC */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">Registered Tenants ({tenants.length})</h2>
            <button
              onClick={() => setShowAddTenantModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" /> Onboard Tenant
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => (
              <div key={t.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{t.name}</h3>
                    <div className="text-xs text-slate-400">Room {t.room} • {t.phone}</div>
                    <div className="text-[11px] text-indigo-400 font-mono mt-1">Aadhaar: {t.aadhaar}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    t.kycDone
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {t.kycDone ? 'Aadhaar Verified' : 'KYC Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Rent Ledger & Reminders */}
      {activeTab === 'collections' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-rose-400" /> Rent Ledger & Overdue Collections
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
                      <td className="p-3 font-bold text-slate-200">₹{t.rent.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-bold text-emerald-400">₹{t.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3 font-bold text-rose-400">₹{due.toLocaleString('en-IN')}</td>
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
      )}

      {/* Tab 6: Power Bill Splitter */}
      {activeTab === 'powersplit' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 max-w-lg">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" /> Room Sub-meter Power Bill Splitter
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Target Room Number</label>
              <select
                value={targetRoom}
                onChange={(e) => setTargetRoom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              >
                <option value="101">Room 101 (Amit Patel)</option>
                <option value="102">Room 102 (Rajesh Kumar)</option>
                <option value="201">Room 201 (Suresh Raina)</option>
                <option value="204">Room 204 (Priya Sharma)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Sub-meter Units (kWh)</label>
                <input
                  type="number"
                  value={powerUnits}
                  onChange={(e) => setPowerUnits(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Unit Tariff Rate (₹/kWh)</label>
                <input
                  type="number"
                  value={unitRate}
                  onChange={(e) => setUnitRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between font-bold">
              <span>Total Calculated Power Bill:</span>
              <span className="text-amber-400">₹{(powerUnits * unitRate).toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={handleApplyPowerBill}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white transition-all shadow-lg shadow-amber-600/30"
            >
              Split & Append Surcharge to Room {targetRoom} Rent
            </button>
          </div>
        </div>
      )}

      {/* Tab 7: Operating Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">Monthly PG Operating Expenses</h2>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5"
            >
              <Receipt className="h-4 w-4" /> Log Expense
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {expenses.map((x) => (
              <div key={x.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white">{x.title}</div>
                <div className="text-slate-400">Category: {x.category} • {x.date}</div>
                <div className="text-sm font-extrabold text-rose-400 pt-1 border-t border-slate-900">
                  ₹{x.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: UPI QR Settings */}
      {activeTab === 'qrsettings' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 max-w-md">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <QrCode className="h-4 w-4 text-emerald-400" /> Bank UPI & Payment Settings
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">PG Business VPA / UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Account Holder Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Building Modal */}
      {showAddBuildingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold text-white">Add New PG Building</h2>
            <form onSubmit={handleAddBuilding} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Building Name</label>
                <input
                  type="text"
                  required
                  value={newBldName}
                  onChange={(e) => setNewBldName(e.target.value)}
                  placeholder="e.g. Golden Prime Tower C"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={newBldAddr}
                  onChange={(e) => setNewBldAddr(e.target.value)}
                  placeholder="e.g. MG Road, Indiranagar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Total Rooms</label>
                  <input
                    type="number"
                    value={newBldRooms}
                    onChange={(e) => setNewBldRooms(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Total Beds Capacity</label>
                  <input
                    type="number"
                    value={newBldBeds}
                    onChange={(e) => setNewBldBeds(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddBuildingModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">
                  Save Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {showAddTenantModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold text-white">Onboard New Tenant</h2>
            <form onSubmit={handleAddTenant} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="e.g. Vikram Singh"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newTenantPhone}
                  onChange={(e) => setNewTenantPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Aadhaar Card Number (KYC Verification)</label>
                <input
                  type="text"
                  required
                  value={newTenantAadhaar}
                  onChange={(e) => setNewTenantAadhaar(e.target.value)}
                  placeholder="1234 5678 9012"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Room Number</label>
                  <input
                    type="text"
                    value={newTenantRoom}
                    onChange={(e) => setNewTenantRoom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    value={newTenantRent}
                    onChange={(e) => setNewTenantRent(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddTenantModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">
                  Onboard Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold text-white">Log Operational Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  value={newExpTitle}
                  onChange={(e) => setNewExpTitle(e.target.value)}
                  placeholder="e.g. Water Tanker Supply"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="Utilities">Utilities (Water/Power)</option>
                  <option value="Wifi & Tech">Wifi & Tech</option>
                  <option value="Staff Payroll">Staff Payroll</option>
                  <option value="Repairs">Repairs & Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddExpenseModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Message Modal */}
      {showWhatsAppModal && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" /> WhatsApp Payment Reminder
            </h2>
            <div className="text-xs text-slate-400">Recipient: <span className="text-white font-bold">{selectedTenant.name} ({selectedTenant.phone})</span></div>

            <div>
              <label className="text-slate-400 block mb-1 text-xs">Custom Message Text</label>
              <textarea
                rows={6}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowWhatsAppModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs">
                Cancel
              </button>
              <button onClick={handleSendWhatsApp} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" /> Launch WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
            <h2 className="text-base font-bold text-white">Record Rent Receipt</h2>
            <div className="text-xs text-slate-400">Tenant: <span className="text-white font-bold">{selectedTenant.name}</span></div>

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
