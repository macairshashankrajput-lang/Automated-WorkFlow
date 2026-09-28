import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Paperclip,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ExpenseClaim } from '../types';
import { Modal } from '../components/common/Modal';

export const ExpensesScreen: React.FC = () => {
  const { expenses, addExpense, updateExpenseStatus } = useApp();
  const { role, user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseClaim['category']>('Meals');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const totalClaimed = expenses.reduce((acc, e) => acc + Number(e.amount ?? 0), 0);
  const totalApproved = expenses.filter((e) => e.status === 'Approved').reduce((acc, e) => acc + Number(e.amount ?? 0), 0);
  const totalPending = expenses.filter((e) => e.status === 'Pending').reduce((acc, e) => acc + Number(e.amount ?? 0), 0);

  const filteredExpenses = expenses.filter((exp) => {
    // Non-admin sees their own claims unless admin
    if (role === 'employee' && user) {
      const expEmpName = (exp.employeeName || '').toLowerCase();
      const uName = (user.name || '').toLowerCase();
      if (exp.employeeId !== user.id && (!uName || !expEmpName.includes(uName))) {
        return false;
      }
    }
    const s = (search || '').toLowerCase();
    const matchesSearch =
      (exp.title || '').toLowerCase().includes(s) ||
      (exp.employeeName || '').toLowerCase().includes(s) ||
      (exp.department || '').toLowerCase().includes(s);
    const matchesCat = selectedCategory === 'all' || exp.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !user) return;
    await addExpense({
      employeeId: user.id,
      employeeName: user.name,
      department: user.department,
      title,
      description: title,
      category,
      amount: parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      notes,
    });
    setIsAddOpen(false);
    setTitle('');
    setAmount('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Corporate Expense Reimbursements & Claims</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
              Audit Stream
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submit expense claims with receipts, review audit trails, and approve employee reimbursements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Expense Claim</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Approved Claims</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">${totalApproved.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Reimbursed via direct deposit</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">${totalPending.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Awaiting managerial sign-off</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Lifecycle Claims</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">${totalClaimed.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{expenses.length} claims submitted</p>
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
            placeholder="Search claim, employee, department..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
          >
            <option value="all">All Categories</option>
            <option value="Meals">Meals</option>
            <option value="Travel">Travel</option>
            <option value="Software">Software</option>
            <option value="Hardware">Hardware</option>
            <option value="Office Supplies">Office Supplies</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Claim Details</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                {role === 'admin' && <th className="py-3.5 px-4 text-right">Review Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{exp.title}</p>
                      {exp.notes && <p className="text-[10px] text-slate-500 dark:text-slate-400">{exp.notes}</p>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{exp.employeeName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{exp.department}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] text-slate-700 dark:text-slate-300 font-semibold">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{exp.date}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                    ${Number(exp.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      exp.status === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' :
                      exp.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30' :
                      'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                    }`}>
                      {exp.status}
                    </span>
                  </td>
                  {role === 'admin' && (
                    <td className="py-3.5 px-4 text-right">
                      {exp.status === 'Pending' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateExpenseStatus(exp.id, 'Approved', user?.name || 'Administrator')}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all"
                            title="Approve Claim"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateExpenseStatus(exp.id, 'Rejected', user?.name || 'Administrator')}
                            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all"
                            title="Reject Claim"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                          Reviewed by {exp.reviewedBy || 'Admin'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Submit Claim */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Submit Expense Reimbursement Claim">
        <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-semibold">Expense Title / Item Description *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Flight tickets to Austin HQ, database cloud test suite..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="Meals">Meals & Client Entertainment</option>
                <option value="Travel">Travel & Lodging</option>
                <option value="Software">Software & Cloud Subscriptions</option>
                <option value="Hardware">Hardware & Equipment</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Total Amount ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 dark:text-slate-300 font-semibold">Business Justification & Receipt Reference</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide context and link or reference to the receipt..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
            />
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
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              Submit Claim for Review
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
