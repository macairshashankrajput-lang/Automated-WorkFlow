import React, { useState, useEffect } from 'react';
import {
  Building,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Briefcase,
  Video,
  Plus,
  Download,
  Trash2,
  Send,
  Grid,
  Calculator,
  RotateCcw,
  UserCheck,
  Layers,
  Search,
  DollarSign,
  CreditCard,
  MessageSquare,
  Mail,
  Bot,
  ShieldCheck,
  Calendar,
  Mic,
  MicOff,
  VideoOff,
  Paperclip,
  Printer,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { hybridDB } from '../services/hybridDatabase';

interface SheetData {
  [cellId: string]: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  time: string;
  text: string;
  channel: string;
}

interface EmailItem {
  id: string;
  from: string;
  subject: string;
  time: string;
  body: string;
  read: boolean;
}

export const VernikaAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'sheets' | 'employees' | 'attendance' | 'crm' | 'invoicing' | 'payroll' | 'meetings' | 'chat' | 'mail' | 'orgtree' | 'copilot' | 'audit'
  >('sheets');

  // Vernika Sheets Grid State (6 Columns A-F, 10 Rows 1-10)
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
  const rows = Array.from({ length: 10 }, (_, i) => i + 1);

  const [gridData, setGridData] = useState<SheetData>({
    A1: 'Employee Name', B1: 'Department', C1: 'Base Salary (₹)', D1: 'Performance Bonus (₹)', E1: 'Gross Total (₹)', F1: 'Status',
    A2: 'Shashank Rajput', B2: 'Engineering', C2: '120000', D2: '15000', E2: '=C2+D2', F2: 'Active',
    A3: 'Alex Rivera', B3: 'Operations', C3: '95000', D3: '10000', E3: '=C3+D3', F3: 'Active',
    A4: 'Rahul Verma', B4: 'Engineering', C4: '85000', D4: '8000', E4: '=C4+D4', F4: 'On Leave',
    A5: 'Priya Sharma', B5: 'Design', C5: '90000', D5: '12000', E5: '=C5+D5', F5: 'Active',
    A6: 'Total Budget:', B6: '4 Staff Members', C6: '=SUM(C2:C5)', D6: '=SUM(D2:D5)', E6: '=SUM(E2:E5)', F6: 'Audited',
  });

  const [selectedCell, setSelectedCell] = useState<string>('A2');
  const [formulaInput, setFormulaInput] = useState<string>('');

  useEffect(() => {
    setFormulaInput(gridData[selectedCell] || '');
  }, [selectedCell, gridData]);

  const evaluateCell = (cellId: string, data: SheetData, depth = 0): string => {
    if (depth > 5) return '#REF!';
    const val = data[cellId];
    if (!val) return '';
    if (!val.startsWith('=')) return val;

    const expr = val.substring(1).trim().toUpperCase();

    const sumMatch = expr.match(/^SUM\(([A-Z])([0-9]+):([A-Z])([0-9]+)\)$/);
    if (sumMatch) {
      const col = sumMatch[1];
      const startRow = parseInt(sumMatch[2]);
      const endRow = parseInt(sumMatch[4]);
      let sum = 0;
      for (let r = startRow; r <= endRow; r++) {
        const num = parseFloat(evaluateCell(`${col}${r}`, data, depth + 1));
        if (!isNaN(num)) sum += num;
      }
      return sum.toLocaleString('en-IN');
    }

    const addMatch = expr.match(/^([A-Z][0-9]+)\+([A-Z][0-9]+)$/);
    if (addMatch) {
      const v1 = parseFloat(evaluateCell(addMatch[1], data, depth + 1));
      const v2 = parseFloat(evaluateCell(addMatch[2], data, depth + 1));
      if (!isNaN(v1) && !isNaN(v2)) return (v1 + v2).toLocaleString('en-IN');
    }

    return val;
  };

  const handleCellChange = (cellId: string, value: string) => {
    const updated = { ...gridData, [cellId]: value };
    setGridData(updated);
    hybridDB.saveAppData('vernika', 'sheets_data', updated);
  };

  const handleFormulaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCellChange(selectedCell, formulaInput);
  };

  // HR Roster State
  const [employees, setEmployees] = useState([
    { id: 'e1', name: 'Shashank Rajput', title: 'Managing Director & Lead Engineer', dept: 'Executive', email: 'shashank@vernika.org', status: 'Active', role: 'admin' },
    { id: 'e2', name: 'Alex Rivera', title: 'Operations Manager', dept: 'Operations', email: 'alex.rivera@vernika.org', status: 'Active', role: 'manager' },
    { id: 'e3', name: 'Rahul Verma', title: 'Full Stack Engineer', dept: 'Engineering', email: 'rahul.v@vernika.org', status: 'On Leave', role: 'employee' },
    { id: 'e4', name: 'Priya Sharma', title: 'Senior Product Designer', dept: 'Design', email: 'priya.s@vernika.org', status: 'Active', role: 'employee' },
  ]);

  // Attendance Clock state
  const [clockedIn, setClockedIn] = useState(true);
  const [shiftTime, setShiftTime] = useState('09:00 AM - 06:00 PM');

  // CRM Deals State
  const [deals, setDeals] = useState([
    { id: 'd1', name: 'Vance Tech Enterprise ERP', amount: 1250000, stage: 'Proposal', client: 'David Vance', date: '2026-09-28' },
    { id: 'd2', name: 'GoldenPrime PG Billing Sync', amount: 450000, stage: 'Won', client: 'GoldenPrime Operations', date: '2026-09-25' },
    { id: 'd3', name: 'ChaknaStore Logistics API', amount: 680000, stage: 'Negotiation', client: 'Chakna Delivery Pvt Ltd', date: '2026-09-20' },
  ]);

  // Invoicing State
  const [invoiceNumber, setInvoiceNumber] = useState('INV-2026-0089');
  const [clientName, setClientName] = useState('Vance Tech International');
  const [clientGST, setClientGST] = useState('07AAAAA0000A1Z5');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: 'i1', description: 'Enterprise Software License (Q3 2026)', hsn: '998314', qty: 1, rate: 350000 },
    { id: 'i2', description: 'Custom Hybrid Database Sync Module', hsn: '998315', qty: 2, rate: 75000 },
  ]);
  const [invoiceSaved, setInvoiceSaved] = useState(false);

  const subtotal = invoiceItems.reduce((acc, item) => acc + item.qty * item.rate, 0);
  const sgst = subtotal * 0.09;
  const cgst = subtotal * 0.09;
  const grandTotal = subtotal + sgst + cgst;

  const handleAddInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: 'Consulting & Implementation Service',
      hsn: '998313',
      qty: 1,
      rate: 25000,
    };
    setInvoiceItems([...invoiceItems, newItem]);
  };

  const handleRemoveInvoiceItem = (id: string) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== id));
  };

  const handleSaveInvoice = () => {
    setInvoiceSaved(true);
    hybridDB.saveAppData('vernika', 'invoices', {
      invoiceNumber,
      clientName,
      clientGST,
      items: invoiceItems,
      grandTotal,
      timestamp: new Date().toISOString(),
    });
    setTimeout(() => setInvoiceSaved(false), 3000);
  };

  // Payroll State
  const [payrollProcessed, setPayrollProcessed] = useState(false);

  // Video Meetings State
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [inMeeting, setInMeeting] = useState(true);

  // Chat Messenger State
  const [selectedChannel, setSelectedChannel] = useState('#general');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', sender: 'Shashank Rajput', time: '10:14 AM', text: 'Team, hybrid database backup sync with Supabase & Firebase is deployed.', channel: '#general' },
    { id: 'm2', sender: 'Alex Rivera', time: '10:18 AM', text: 'Awesome! GoldenPrime PG rent ledger entries are reflecting in real-time.', channel: '#general' },
    { id: 'm3', sender: 'Rahul Verma', time: '10:22 AM', text: 'ChaknaStore order fulfillment pipeline is live as well.', channel: '#general' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Shashank Rajput (You)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: newMessage,
      channel: selectedChannel,
    };
    setChatMessages([...chatMessages, msg]);
    setNewMessage('');
    hybridDB.saveAppData('vernika', 'chat_history', msg);
  };

  // Outlook Mail State
  const [emails] = useState<EmailItem[]>([
    { id: 'm1', from: 'finance@vernika.org', subject: 'Q3 Tax & Audit Report Ready', time: '09:30 AM', body: 'The quarterly tax liability and spreadsheet audit matrix have been compiled and uploaded to Google Drive.', read: false },
    { id: 'm2', from: 'operations@goldenprime.in', subject: 'PG Room Billing Sync Completed', time: 'Yesterday', body: 'Rent receipts and WhatsApp payment links generated for all active tenants.', read: true },
  ]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem>(emails[0]);

  // Copilot AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiHistory, setAiHistory] = useState([
    { role: 'assistant', text: 'Greetings! I am Vernika Enterprise Copilot. I can analyze financial spreadsheets, generate tax invoices, process payroll, and construct automated workflow schemas.' },
  ]);

  const handleAiAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const userQ = aiPrompt;
    setAiPrompt('');
    setAiHistory((prev) => [
      ...prev,
      { role: 'user', text: userQ },
      {
        role: 'assistant',
        text: `Based on Vernika Enterprise data: Grand total Q3 revenue is ₹12,50,000 across 4 active clients. GST liability is calculated at ₹${sgst + cgst} with 100% database sync on Supabase and Firebase.`,
      },
    ]);
  };

  const handleExportSheet = () => {
    const exportRows = rows.map((r) => {
      const rowObj: Record<string, string> = {};
      columns.forEach((c) => {
        rowObj[c] = evaluateCell(`${c}${r}`, gridData);
      });
      return rowObj;
    });
    hybridDB.exportToSpreadsheet('Vernika_Sheets_Formula_Matrix', exportRows);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* App Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-display">Vernika Enterprise Business Suite</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                16 Integrated Modules
              </span>
            </div>
            <p className="text-xs text-slate-400">End-to-End Live Modules: Formula Sheets, Tax Invoicing, HR Payroll, Meetings, Messenger & Copilot AI</p>
          </div>
        </div>

        <button
          onClick={handleExportSheet}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Spreadsheet (.xlsx)
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-semibold">
        {[
          { id: 'sheets', label: 'Vernika Sheets Editor', icon: FileSpreadsheet },
          { id: 'employees', label: 'HR Roster', icon: Users },
          { id: 'attendance', label: 'Attendance Clock', icon: Clock },
          { id: 'crm', label: 'CRM Deals', icon: Briefcase },
          { id: 'invoicing', label: 'Tax Invoicing', icon: DollarSign },
          { id: 'payroll', label: 'Payroll & Slips', icon: CreditCard },
          { id: 'meetings', label: 'Video Meetings', icon: Video },
          { id: 'chat', label: 'Messenger', icon: MessageSquare },
          { id: 'mail', label: 'Outlook Mail', icon: Mail },
          { id: 'orgtree', label: 'Org Chart', icon: UserCheck },
          { id: 'copilot', label: 'Copilot AI', icon: Bot },
          { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 flex-shrink-0 ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Vernika Sheets Formula Editor */}
      {activeTab === 'sheets' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs font-mono border border-indigo-500/20">
              <Grid className="h-3.5 w-3.5" /> {selectedCell}
            </div>

            <form onSubmit={handleFormulaSubmit} className="flex-1 flex items-center gap-2 w-full">
              <span className="text-slate-400 font-bold text-xs font-mono">fx</span>
              <input
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                onBlur={() => handleCellChange(selectedCell, formulaInput)}
                placeholder="Enter value or formula e.g. =SUM(C2:C5) or =C2+D2"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold transition-all">
                Apply
              </button>
            </form>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300 font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-2.5 text-center w-10 border-r border-slate-800 text-[10px]">#</th>
                  {columns.map((col) => (
                    <th key={col} className="p-2.5 text-center font-bold border-r border-slate-800 text-[10px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                    <td className="p-2 text-center bg-slate-950 text-slate-500 font-bold border-r border-slate-800 text-[10px]">
                      {r}
                    </td>
                    {columns.map((col) => {
                      const cellId = `${col}${r}`;
                      const isSelected = selectedCell === cellId;
                      const displayVal = evaluateCell(cellId, gridData);
                      const isHeaderRow = r === 1;

                      return (
                        <td
                          key={cellId}
                          onClick={() => setSelectedCell(cellId)}
                          className={`p-2 border-r border-slate-800 cursor-pointer transition-all ${
                            isSelected ? 'bg-indigo-500/20 border-2 border-indigo-500' : ''
                          } ${isHeaderRow ? 'font-sans font-bold text-indigo-300 bg-slate-950/50' : 'text-slate-200'}`}
                        >
                          <input
                            type="text"
                            value={gridData[cellId] !== undefined ? displayVal : ''}
                            onChange={(e) => handleCellChange(cellId, e.target.value)}
                            className="w-full bg-transparent text-xs font-mono focus:outline-none text-slate-100"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: HR Roster */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((emp) => (
            <div key={emp.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{emp.name}</h3>
                    <div className="text-xs text-slate-400">{emp.title}</div>
                    <div className="text-[11px] text-indigo-400 font-mono mt-0.5">{emp.email}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {emp.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Attendance Clock */}
      {activeTab === 'attendance' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 max-w-lg">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" /> HR Attendance Shift Clock
          </h2>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Shift Status:</span>
              <span className={`font-bold ${clockedIn ? 'text-emerald-400' : 'text-slate-400'}`}>
                {clockedIn ? 'Clocked In (Active Shift)' : 'Clocked Out'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 pt-2">
              <span className="text-slate-400">Shift Timing:</span>
              <span className="font-mono text-slate-200">{shiftTime}</span>
            </div>
          </div>
          <button
            onClick={() => setClockedIn(!clockedIn)}
            className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all ${
              clockedIn ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {clockedIn ? 'Clock Out Shift' : 'Clock In Now'}
          </button>
        </div>
      )}

      {/* Tab 4: CRM Deals */}
      {activeTab === 'crm' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">CRM Enterprise Lead Pipeline</h2>
            <span className="text-xs font-bold text-emerald-400">Total Value: ₹23,80,000</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {deals.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white">{d.name}</div>
                <div className="text-slate-400">Client: {d.client}</div>
                <div className="text-[11px] text-slate-500">Date: {d.date}</div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                  <span className="font-bold text-emerald-400 font-mono">₹{d.amount.toLocaleString('en-IN')}</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-[10px] border border-indigo-500/20">{d.stage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Tax Invoicing */}
      {activeTab === 'invoicing' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-400" /> GST Tax Invoice Generator
              </h2>
              <p className="text-xs text-slate-400">Generate & save GST compliant invoices with hybrid cloud backup</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveInvoice}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {invoiceSaved ? 'Invoice Saved & Synced!' : 'Save & Sync Invoice'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Client Business Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Client GSTIN</label>
              <input
                type="text"
                value={clientGST}
                onChange={(e) => setClientGST(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Line Items</h3>
              <button
                onClick={handleAddInvoiceItem}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-400 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3">HSN/SAC</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Rate (₹)</th>
                    <th className="p-3 text-right">Total (₹)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoiceItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40">
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInvoiceItems(invoiceItems.map((i) => (i.id === item.id ? { ...i, description: val } : i)));
                          }}
                          className="w-full bg-transparent border border-slate-800 rounded-lg px-2 py-1 text-white"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInvoiceItems(invoiceItems.map((i) => (i.id === item.id ? { ...i, hsn: val } : i)));
                          }}
                          className="w-24 bg-transparent border border-slate-800 rounded-lg px-2 py-1 text-white font-mono"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setInvoiceItems(invoiceItems.map((i) => (i.id === item.id ? { ...i, qty: val } : i)));
                          }}
                          className="w-16 bg-transparent border border-slate-800 rounded-lg px-2 py-1 text-white text-center font-mono"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setInvoiceItems(invoiceItems.map((i) => (i.id === item.id ? { ...i, rate: val } : i)));
                          }}
                          className="w-28 bg-transparent border border-slate-800 rounded-lg px-2 py-1 text-white text-right font-mono"
                        />
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        ₹{(item.qty * item.rate).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveInvoiceItem(item.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax Calculation Summary */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <div className="w-full max-w-xs space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Amount:</span>
                <span className="font-mono text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST (9%):</span>
                <span className="font-mono text-white">₹{sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST (9%):</span>
                <span className="font-mono text-white">₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-indigo-400 pt-2 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Payroll & Salary Slips */}
      {activeTab === 'payroll' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-400" /> Executive Payroll & Direct Bank Payout
              </h2>
              <p className="text-xs text-slate-400">Automated salary slips, PF deduction & bank transfer authorization</p>
            </div>
            <button
              onClick={() => setPayrollProcessed(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {payrollProcessed ? 'Batch Payout Processed' : 'Authorize Monthly Payout'}
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Basic Pay</th>
                  <th className="p-3">HRA</th>
                  <th className="p-3">Conveyance</th>
                  <th className="p-3">PF Deduction</th>
                  <th className="p-3 font-bold text-emerald-400">Net Salary</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-sans font-bold text-white">{emp.name}</td>
                    <td className="p-3">₹80,000</td>
                    <td className="p-3">₹25,000</td>
                    <td className="p-3">₹5,000</td>
                    <td className="p-3 text-rose-400">-₹4,800</td>
                    <td className="p-3 font-bold text-emerald-400">₹1,05,200</td>
                    <td className="p-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${payrollProcessed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                        {payrollProcessed ? 'Disbursed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Video Meetings */}
      {activeTab === 'meetings' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Video className="h-5 w-5 text-indigo-400" /> Vernika Executive Video Room
              </h2>
              <p className="text-xs text-slate-400">Room: Executive Boardroom Alpha | Encryption: End-to-End</p>
            </div>
            <button
              onClick={() => setInMeeting(!inMeeting)}
              className={`px-4 py-2 rounded-xl font-bold text-xs text-white shadow-lg transition-all ${
                inMeeting ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {inMeeting ? 'Leave Video Room' : 'Join Boardroom'}
            </button>
          </div>

          {inMeeting ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="h-16 w-16 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-400 text-xl mx-auto">
                      SR
                    </div>
                    <div className="text-xs font-bold text-white">Shashank Rajput (Host)</div>
                  </div>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 text-[10px] text-emerald-400 font-bold border border-slate-800 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Mic Active
                  </div>
                </div>

                <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="h-16 w-16 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-purple-400 text-xl mx-auto">
                      AR
                    </div>
                    <div className="text-xs font-bold text-white">Alex Rivera (Operations)</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 max-w-sm mx-auto">
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`p-3 rounded-xl transition-all ${micActive ? 'bg-slate-800 text-white' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}
                >
                  {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setVideoActive(!videoActive)}
                  className={`p-3 rounded-xl transition-all ${videoActive ? 'bg-slate-800 text-white' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}
                >
                  {videoActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">Click "Join Boardroom" to enter active meeting.</div>
          )}
        </div>
      )}

      {/* Tab 8: Team Messenger */}
      {activeTab === 'chat' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 h-[500px]">
          <div className="space-y-2 border-r border-slate-800 pr-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Channels</h3>
            {['#general', '#engineering', '#executive', '#leads'].map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedChannel === ch ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          <div className="md:col-span-3 flex flex-col justify-between space-y-4">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-indigo-400">{msg.sender}</span>
                    <span className="text-slate-500">{msg.time}</span>
                  </div>
                  <p className="text-xs text-slate-200">{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${selectedChannel}...`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 9: Outlook Mail */}
      {activeTab === 'mail' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 border-r border-slate-800 pr-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inbox</h3>
            {emails.map((mail) => (
              <div
                key={mail.id}
                onClick={() => setSelectedEmail(mail)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedEmail.id === mail.id ? 'bg-indigo-600/20 border-indigo-500/40 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold text-white">{mail.subject}</div>
                <div className="text-[10px] text-slate-400">{mail.from}</div>
              </div>
            ))}
          </div>

          <div className="md:col-span-2 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white">{selectedEmail.subject}</h2>
            <div className="text-xs text-indigo-400 font-mono">From: {selectedEmail.from}</div>
            <div className="text-xs text-slate-300 border-t border-slate-900 pt-3">{selectedEmail.body}</div>
          </div>
        </div>
      )}

      {/* Tab 10: Org Chart */}
      {activeTab === 'orgtree' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-400" /> Organizational Structure
          </h2>
          <div className="flex flex-col items-center space-y-6">
            <div className="p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-center w-64 space-y-1">
              <div className="font-bold text-white text-sm">Shashank Rajput</div>
              <div className="text-xs text-indigo-300 font-semibold">Managing Director</div>
            </div>
            <div className="h-6 w-0.5 bg-slate-800"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              {employees.slice(1).map((emp) => (
                <div key={emp.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <div className="font-bold text-white text-xs">{emp.name}</div>
                  <div className="text-[10px] text-slate-400">{emp.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 11: Copilot AI */}
      {activeTab === 'copilot' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 max-w-2xl mx-auto">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-400" /> Vernika Enterprise Copilot AI
          </h2>
          <div className="space-y-3 h-64 overflow-y-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            {aiHistory.map((h, i) => (
              <div key={i} className={`p-3 rounded-xl ${h.role === 'user' ? 'bg-indigo-600/20 text-indigo-200 text-right ml-12' : 'bg-slate-900 text-slate-300 mr-12'}`}>
                {h.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleAiAsk} className="flex items-center gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask Copilot AI e.g. 'Calculate Q3 Tax Liability'..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white">
              Ask AI
            </button>
          </form>
        </div>
      )}

      {/* Tab 12: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" /> Security & Compliance Audit Trail
          </h2>
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-900/40">
                  <td className="p-3 text-slate-500">2026-09-28 10:14:02</td>
                  <td className="p-3 text-indigo-400 font-bold">shashank@vernika.org</td>
                  <td className="p-3">GST Tax Invoice Created</td>
                  <td className="p-3">INV-2026-0089</td>
                  <td className="p-3 text-emerald-400">Synced to Supabase</td>
                </tr>
                <tr className="hover:bg-slate-900/40">
                  <td className="p-3 text-slate-500">2026-09-28 09:45:10</td>
                  <td className="p-3 text-indigo-400 font-bold">alex.rivera@vernika.org</td>
                  <td className="p-3">GoldenPrime PG Rent Sync</td>
                  <td className="p-3">Room 102 Rent Ledger</td>
                  <td className="p-3 text-emerald-400">Synced to Firebase</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
