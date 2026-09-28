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
} from 'lucide-react';
import { hybridDB } from '../services/hybridDatabase';

interface SheetData {
  [cellId: string]: string; // e.g. "A1": "Name", "B1": "100", "C1": "=A1+B1"
}

export const VernikaAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'sheets' | 'employees' | 'attendance' | 'crm' | 'tasks' | 'meetings' | 'orgtree'
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

  // Evaluates formula or returns plain cell value
  const evaluateCell = (cellId: string, data: SheetData, depth = 0): string => {
    if (depth > 5) return '#REF!';
    const val = data[cellId];
    if (!val) return '';
    if (!val.startsWith('=')) return val;

    const expr = val.substring(1).trim().toUpperCase();

    // Handle SUM range e.g. SUM(C2:C5)
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

    // Handle simple addition B2+C2
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

  // Employees State
  const [employees] = useState([
    { id: 'e1', name: 'Shashank Rajput', title: 'Managing Director & Lead Engineer', dept: 'Executive', email: 'shashank@vernika.org', status: 'Active', role: 'admin', location: 'Office' },
    { id: 'e2', name: 'Alex Rivera', title: 'Operations Manager', dept: 'Operations', email: 'alex.rivera@vernika.org', status: 'Active', role: 'manager', location: 'Office' },
    { id: 'e3', name: 'Rahul Verma', title: 'Full Stack Engineer', dept: 'Engineering', email: 'rahul.v@vernika.org', status: 'On Leave', role: 'employee', location: 'Remote' },
    { id: 'e4', name: 'Priya Sharma', title: 'Senior Product Designer', dept: 'Design', email: 'priya.s@vernika.org', status: 'Active', role: 'employee', location: 'Office' },
  ]);

  // Attendance Clock state
  const [clockedIn, setClockedIn] = useState(true);
  const [clockTime, setClockTime] = useState('09:00 AM');

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
              <h1 className="text-xl font-bold text-white font-display">Vernika Business Suite</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Formula Spreadsheet Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">Live Vernika Sheets with Formula Evaluator (=SUM, =A1+B1), HR Roster & Attendance</p>
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
          { id: 'employees', label: 'HR Employee Roster', icon: Users },
          { id: 'attendance', label: 'Attendance Clock', icon: Clock },
          { id: 'crm', label: 'CRM Deals', icon: Briefcase },
          { id: 'meetings', label: 'Video Meetings', icon: Video },
          { id: 'orgtree', label: 'Org Structure', icon: UserCheck },
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

      {/* Tab 1: Interactive Vernika Sheets Formula Editor */}
      {activeTab === 'sheets' && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          {/* Formula Bar */}
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

          {/* Spreadsheet Table Grid */}
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

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <Calculator className="h-3.5 w-3.5 text-indigo-400" />
            <span>Supported formulas: <code className="text-indigo-300">=SUM(C2:C5)</code>, <code className="text-indigo-300">=C2+D2</code>, or plain text / numeric values.</span>
          </div>
        </div>
      )}

      {/* Tab 2: HR Employee Roster */}
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
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
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
            <Clock className="h-4 w-4 text-indigo-400" /> HR Attendance Clock
          </h2>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Shift Status:</span>
              <span className={`font-bold ${clockedIn ? 'text-emerald-400' : 'text-slate-400'}`}>
                {clockedIn ? 'Clocked In' : 'Clocked Out'}
              </span>
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
    </div>
  );
};
