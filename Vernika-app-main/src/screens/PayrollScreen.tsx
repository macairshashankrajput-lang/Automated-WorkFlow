import React, { useState } from 'react';
import { 
  DollarSign, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Building2, 
  FileText, 
  Calendar,
  ShieldCheck,
  TrendingUp,
  Percent
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PayrollRecord } from '../types';
import { Modal } from '../components/common/Modal';

export const PayrollScreen: React.FC = () => {
  const { payrolls, employees, addPayroll, updatePayrollStatus } = useApp();
  const { role, user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [month, setMonth] = useState('August');
  const [year, setYear] = useState(2026);
  const [basicSalary, setBasicSalary] = useState(12000);
  const [allowances, setAllowances] = useState(800);
  const [deductions, setDeductions] = useState(200);
  const [tax, setTax] = useState(2200);
  const [paymentMethod, setPaymentMethod] = useState('Direct Deposit / ACH');

  const totalPayrollBudget = payrolls.reduce((acc, p) => acc + (p.netSalary ?? p.netPay ?? 0), 0);
  const totalTaxWithheld = payrolls.reduce((acc, p) => acc + (p.tax ?? 0), 0);

  const filteredPayrolls = payrolls.filter((p) => {
    // If employee role, show only their own payroll slips
    if (role === 'employee' && user) {
      const pEmpName = (p.employeeName || '').toLowerCase();
      const uName = (user.name || '').toLowerCase();
      if (p.employeeId !== user.id && (!uName || !pEmpName.includes(uName))) {
        return false;
      }
    }
    const s = (search || '').toLowerCase();
    const matchesSearch =
      (p.employeeName || '').toLowerCase().includes(s) ||
      (p.department || '').toLowerCase().includes(s) ||
      (p.employeeId || '').toLowerCase().includes(s);
    const matchesMonth = selectedMonth === 'all' || p.month === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  const handleSavePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmpId) || employees[0];
    const net = Number(basicSalary) + Number(allowances) - Number(deductions) - Number(tax);
    await addPayroll({
      employeeId: emp?.employeeId || emp?.id || 'EMP-001',
      employeeName: emp?.name || 'Employee',
      department: emp?.department || 'General',
      month,
      year: Number(year),
      basicSalary: Number(basicSalary),
      allowances: Number(allowances),
      deductions: Number(deductions),
      tax: Number(tax),
      netSalary: net,
      status: 'Paid',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
    });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Enterprise Payroll & Compensation Ledger</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
              Tax Compliant
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated monthly salary disbursements, tax withholding calculations, and payslip generation.
          </p>
        </div>

        {role === 'admin' && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Process New Payroll Record</span>
          </button>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Monthly Net Payroll Disbursed</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">${totalPayrollBudget.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Direct deposit executed via ACH</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Statutory Tax Withholding</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">${totalTaxWithheld.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">State, Federal & Social Security</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Payroll Processing Cycle</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono mt-1">1st of Month</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Next run: Sept 1, 2026</p>
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
            placeholder="Search employee, ID, department..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Months</option>
            <option value="August">August 2026</option>
            <option value="July">July 2026</option>
            <option value="June">June 2026</option>
          </select>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Period</th>
                <th className="py-3.5 px-4">Basic Pay</th>
                <th className="py-3.5 px-4">Allowances</th>
                <th className="py-3.5 px-4">Tax Withheld</th>
                <th className="py-3.5 px-4">Net Salary</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredPayrolls.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{pay.employeeName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{pay.employeeId} • {pay.department}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{pay.month} {pay.year}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">${(pay.basicSalary || 0).toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">+${pay.allowances}</td>
                  <td className="py-3.5 px-4 font-mono text-rose-600 dark:text-rose-400">-${pay.tax}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ${(pay.netSalary || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      pay.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' :
                      pay.status === 'Processing' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30' :
                      'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                    }`}>
                      {pay.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`Downloading Official PDF Payslip for ${pay.employeeName} (${pay.month} ${pay.year}) - Net: ${(pay.netSalary || 0).toLocaleString()}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Download className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Process Payroll */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Process Employee Payroll Record">
        <form onSubmit={handleSavePayroll} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-semibold">Select Employee</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employeeId} - {e.department})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Payroll Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Basic Pay ($)</label>
              <input
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Allowances ($)</label>
              <input
                type="number"
                value={allowances}
                onChange={(e) => setAllowances(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Deductions ($)</label>
              <input
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Tax ($)</label>
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Calculated Net Salary:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              ${(Number(basicSalary) + Number(allowances) - Number(deductions) - Number(tax)).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              Disburse & Issue Payslip
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
