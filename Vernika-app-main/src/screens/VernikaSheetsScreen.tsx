import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { VernikaSheet, SheetTab, SheetCell } from '../types';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Star,
  Share2,
  Trash2,
  Copy,
  Download,
  Upload,
  ArrowLeft,
  Save,
  Check,
  Sparkles,
  BarChart3,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  DollarSign,
  Percent,
  Hash,
  Calendar,
  Grid,
  List,
  Filter,
  Users,
  MoreVertical,
  X,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Maximize2,
  Keyboard,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Clipboard,
  Columns3,
  Rows3,
  WandSparkles,
  CheckSquare
} from 'lucide-react';
import {
  SPREADSHEET_SHORTCUTS,
  cellRange,
  displayShortcut,
  isPrimaryModifier,
  normalizeClipboardText,
  selectionBounds,
  selectionLabel
} from '../utils/spreadsheetShortcuts';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Helper: Column index to Letter (0 -> A, 25 -> Z, 26 -> AA)
const colToLetter = (colIdx: number): string => {
  let temp = colIdx;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

// Helper: Letter to Column index (A -> 0, Z -> 25, AA -> 26)
const letterToCol = (colStr: string): number => {
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  return col - 1;
};

// Helper: Evaluate cell formula
const evaluateFormula = (
  rawVal: string, 
  data: Record<string, SheetCell>, 
  visited: Set<string> = new Set()
): string => {
  if (!rawVal) return '';
  if (!rawVal.startsWith('=')) return rawVal;

  const formula = rawVal.substring(1).trim();

  // Simple range functions: SUM, AVERAGE, COUNT, MIN, MAX, MEDIAN
  const rangeFuncMatch = formula.match(/^(SUM|AVERAGE|AVG|COUNT|MIN|MAX|MEDIAN)\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)$/i);
  if (rangeFuncMatch) {
    const func = rangeFuncMatch[1].toUpperCase();
    const startCoord = rangeFuncMatch[2].toUpperCase();
    const endCoord = rangeFuncMatch[3].toUpperCase();

    const startColStr = startCoord.replace(/[0-9]/g, '');
    const startRow = parseInt(startCoord.replace(/[^0-9]/g, ''), 10);
    const endColStr = endCoord.replace(/[0-9]/g, '');
    const endRow = parseInt(endCoord.replace(/[^0-9]/g, ''), 10);

    const startCol = letterToCol(startColStr);
    const endCol = letterToCol(endColStr);

    const values: number[] = [];
    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
      for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
        const coord = `${colToLetter(c)}${r}`;
        if (!visited.has(coord)) {
          const nextVisited = new Set(visited);
          nextVisited.add(coord);
          const cell = data[coord];
          if (cell && cell.raw) {
            const evaluated = evaluateFormula(cell.raw, data, nextVisited);
            const num = parseFloat(evaluated.replace(/[^0-9.-]/g, ''));
            if (!isNaN(num)) values.push(num);
          }
        }
      }
    }

    if (values.length === 0) return '0';

    if (func === 'SUM') {
      const sum = values.reduce((a, b) => a + b, 0);
      return sum.toString();
    } else if (func === 'AVERAGE' || func === 'AVG') {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return (Math.round(avg * 100) / 100).toString();
    } else if (func === 'COUNT') {
      return values.length.toString();
    } else if (func === 'MIN') {
      return Math.min(...values).toString();
    } else if (func === 'MAX') {
      return Math.max(...values).toString();
    } else if (func === 'MEDIAN') {
      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      const median = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
      return median.toString();
    }
  }

  // Arithmetic evaluation with cell references e.g. (A1+B1)*1.18 or (D4-B4)/B4
  try {
    let expr = formula.replace(/([A-Z]+[0-9]+)/g, (match) => {
      if (visited.has(match)) return '0';
      const nextVisited = new Set(visited);
      nextVisited.add(match);
      const cell = data[match];
      if (cell && cell.raw) {
        const evalVal = evaluateFormula(cell.raw, data, nextVisited);
        const clean = evalVal.replace(/[^0-9.-]/g, '');
        return clean || '0';
      }
      return '0';
    });

    // Safely evaluate simple math expressions
    // Sanitizing expression to only math chars
    if (/^[0-9+\-*/().\s]+$/.test(expr)) {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return (Math.round(result * 100) / 100).toString();
      }
    }
  } catch (err) {
    return '#VALUE!';
  }

  return rawVal;
};

// Format formatted cell output
const formatCellValue = (val: string, format?: SheetCell['format']): string => {
  if (!val) return '';
  const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return val;

  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  }
  if (format === 'percentage' || format === 'percent') {
    return (num * (num <= 1 && num > -1 ? 100 : 1)).toFixed(1) + '%';
  }
  if (format === 'number') {
    return new Intl.NumberFormat('en-US').format(num);
  }
  return val;
};

const COLOR_SWATCHES = ['#ffffff', '#f8fafc', '#e0f2fe', '#ecfdf5', '#fef3c7', '#fee2e2', '#f3e8ff', '#0f172a', '#0284c7', '#059669', '#d97706', '#dc2626'];

const normalizeSheetForEditor = (sheet: VernikaSheet): VernikaSheet => {
  const rawTabs = Array.isArray((sheet as VernikaSheet & { tabs?: unknown }).tabs)
    ? (sheet as VernikaSheet).tabs
    : [];
  const tabs: SheetTab[] = rawTabs.length > 0
    ? rawTabs.map((tab, index) => ({
        ...tab,
        id: tab?.id || `tab-${index + 1}`,
        name: tab?.name || `Sheet${index + 1}`,
        rowCount: Number.isFinite(Number(tab?.rowCount)) && Number(tab?.rowCount) > 0 ? Number(tab?.rowCount) : 30,
        colCount: Number.isFinite(Number(tab?.colCount)) && Number(tab?.colCount) > 0 ? Number(tab?.colCount) : 15,
        data: tab?.data && typeof tab.data === 'object' && !Array.isArray(tab.data) ? tab.data : {}
      }))
    : [{ id: 'tab-1', name: 'Sheet1', rowCount: 30, colCount: 15, data: {} }];
  const activeTabId = tabs.some(tab => tab.id === sheet.activeTabId) ? sheet.activeTabId : tabs[0].id;
  return { ...sheet, tabs, activeTabId };
};

export const VernikaSheetsScreen: React.FC = () => {
  const { user } = useAuth();
  const { sheets, employees, addSheet, updateSheet, deleteSheet, saveSheetData, logEmployeeActivity, sendEmail, sendMessage } = useApp();

  // Navigation: null = File Manager, string = Active Sheet ID
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);

  // File Manager State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sheet Editor State
  const normalizedSheets = useMemo(() => (Array.isArray(sheets) ? sheets : []).filter(Boolean).map(normalizeSheetForEditor), [sheets]);
  const activeSheet = useMemo(() => normalizedSheets.find(s => s.id === activeSheetId), [normalizedSheets, activeSheetId]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [selectedRange, setSelectedRange] = useState<string>('A1');
  const [selectionAnchor, setSelectionAnchor] = useState<string>('A1');
  const [formulaInput, setFormulaInput] = useState<string>('');
  const [isEditingCell, setIsEditingCell] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [history, setHistory] = useState<Record<string, SheetCell>[]>([]);
  const [future, setFuture] = useState<Record<string, SheetCell>[]>([]);
  const [showShortcutModal, setShowShortcutModal] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [imagePrompt, setImagePrompt] = useState<string>('A polished executive summary of the selected spreadsheet data');
  const [imageTitle, setImageTitle] = useState<string>('Vernika Data Snapshot');

  // Modals & Panels
  const [showChartModal, setShowChartModal] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareUserId, setShareUserId] = useState('');
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('edit');
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const cellInputRef = useRef<HTMLInputElement>(null);
  const clipboardRef = useRef<string[][]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  const getSelectedCells = (range = selectedRange): string[] => cellRange(range || selectedCell);

  const applyDataSnapshot = (nextData: Record<string, SheetCell>, recordHistory = true) => {
    if (!activeSheet || !currentTab) return;
    if (recordHistory) {
      setHistory(previous => [...previous.slice(-49), currentTab.data]);
      setFuture([]);
    }
    setSaveStatus('saving');
    saveSheetData(activeSheet.id, currentTab.id, nextData);
    window.setTimeout(() => setSaveStatus('saved'), 400);
  };

  const updateSelection = (coord: string, extend = false) => {
    const normalized = coord.toUpperCase();
    setSelectedCell(normalized);
    if (extend) {
      const anchor = selectionAnchor || selectedCell;
      setSelectedRange(`${anchor}:${normalized}`);
    } else {
      setSelectionAnchor(normalized);
      setSelectedRange(normalized);
    }
  };

  const moveSelection = (rowDelta: number, colDelta: number, extend = false, jump = false) => {
    const match = selectedCell.match(/^([A-Z]+)(\d+)$/);
    if (!match) return;
    let row = Number(match[2]);
    let col = letterToCol(match[1]);
    const rowLimit = currentTab?.rowCount || 30;
    const colLimit = currentTab?.colCount || 15;
    const step = jump ? (rowDelta !== 0 ? rowLimit : colLimit) : 1;
    row = Math.min(rowLimit, Math.max(1, row + rowDelta * step));
    col = Math.min(colLimit - 1, Math.max(0, col + colDelta * step));
    updateSelection(`${colToLetter(col)}${row}`, extend);
  };

  const copySelection = async (cut = false) => {
    if (!currentTab) return;
    const bounds = selectionBounds(selectedRange);
    const start = bounds.start.match(/^([A-Z]+)(\d+)$/);
    const end = bounds.end.match(/^([A-Z]+)(\d+)$/);
    if (!start || !end) return;
    const startCol = letterToCol(start[1]);
    const endCol = letterToCol(end[1]);
    const startRow = Number(start[2]);
    const endRow = Number(end[2]);
    const matrix: string[][] = [];
    for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row += 1) {
      const values: string[] = [];
      for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col += 1) {
        const cell = currentTab.data[`${colToLetter(col)}${row}`];
        values.push(cell?.raw ?? (cell?.value !== undefined ? String(cell.value) : ''));
      }
      matrix.push(values);
    }
    clipboardRef.current = matrix;
    const text = matrix.map(row => row.join('\t')).join('\n');
    try { await navigator.clipboard.writeText(text); } catch { /* Browser permissions may deny clipboard access; the in-app clipboard remains available. */ }
    if (cut) clearSelection();
  };

  const pasteSelection = async () => {
    if (!currentTab) return;
    let matrix = clipboardRef.current;
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) matrix = normalizeClipboardText(text);
    } catch { /* Use the in-app clipboard when browser access is unavailable. */ }
    if (!matrix.length) return;
    const origin = selectedCell.match(/^([A-Z]+)(\d+)$/);
    if (!origin) return;
    const originCol = letterToCol(origin[1]);
    const originRow = Number(origin[2]);
    const nextData = { ...currentTab.data };
    matrix.forEach((row, rowIndex) => row.forEach((value, colIndex) => {
      const coord = `${colToLetter(originCol + colIndex)}${originRow + rowIndex}`;
      nextData[coord] = { ...(nextData[coord] || {}), raw: value };
    }));
    applyDataSnapshot(nextData);
    const last = `${colToLetter(originCol + matrix[0].length - 1)}${originRow + matrix.length - 1}`;
    setSelectedRange(`${selectedCell}:${last}`);
  };

  const clearSelection = () => {
    if (!currentTab) return;
    const nextData = { ...currentTab.data };
    getSelectedCells().forEach(coord => { delete nextData[coord]; });
    applyDataSnapshot(nextData);
  };

  const undo = () => {
    if (!currentTab || !history.length) return;
    const previous = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setFuture(futureValue => [currentTab.data, ...futureValue.slice(0, 49)]);
    applyDataSnapshot(previous, false);
  };

  const redo = () => {
    if (!currentTab || !future.length) return;
    const next = future[0];
    setFuture(future.slice(1));
    setHistory(historyValue => [...historyValue.slice(-49), currentTab.data]);
    applyDataSnapshot(next, false);
  };

  const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const generateSelectionImage = (title = imageTitle, prompt = imagePrompt, filename = 'vernika-data-snapshot.png', range = selectedRange) => {
    if (!currentTab) return;
    const cells = getSelectedCells(range);
    const canvas = document.createElement('canvas');
    const width = 1200;
    const rowHeight = 42;
    const height = Math.max(260, 150 + cells.length * rowHeight);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#052e2b');
    gradient.addColorStop(1, '#0f766e');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.font = '700 30px Inter, Arial';
    context.fillText(title || 'Vernika Data Snapshot', 48, 52);
    context.font = '400 15px Inter, Arial';
    context.fillStyle = '#ccfbf1';
    context.fillText(prompt || 'Selected spreadsheet data', 48, 82);
    context.fillStyle = '#ffffff';
    context.fillRect(36, 112, width - 72, height - 136);
    context.fillStyle = '#0f172a';
    context.font = '600 15px Inter, Arial';
    cells.forEach((coord, index) => {
      const cell = currentTab.data[coord];
      const raw = cell?.raw ?? (cell?.value !== undefined ? String(cell.value) : '');
      const evaluated = cell?.raw ? evaluateFormula(cell.raw, currentTab.data) : raw;
      const y = 144 + index * rowHeight;
      if (index % 2 === 0) {
        context.fillStyle = '#f0fdfa';
        context.fillRect(48, y - 22, width - 96, rowHeight);
      }
      context.fillStyle = '#0f172a';
      context.fillText(coord, 64, y);
      context.fillStyle = '#334155';
      context.fillText(String(evaluated).slice(0, 105), 150, y);
    });
    downloadCanvas(canvas, filename);
  };

  const generateColumnSnapshot = () => {
    const column = selectedCell.match(/^([A-Z]+)/)?.[1] || 'A';
    const range = `${column}1:${column}${currentTab?.rowCount || 30}`;
    setSelectedRange(range);
    generateSelectionImage(`${column} Column Snapshot`, `Selected column ${column}`, `vernika-${column.toLowerCase()}-column.png`, range);
  };

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const primary = isPrimaryModifier(event.nativeEvent);
    const key = event.key.toLowerCase();
    if (primary && key === '/') { event.preventDefault(); setShowShortcutModal(true); return; }
    if (!activeSheet || !currentTab) return;
    if (primary && key === 'c') { event.preventDefault(); void copySelection(); return; }
    if (primary && key === 'x') { event.preventDefault(); void copySelection(true); return; }
    if (primary && key === 'v') { event.preventDefault(); void pasteSelection(); return; }
    if (primary && key === 'z' && !event.shiftKey) { event.preventDefault(); undo(); return; }
    if ((primary && key === 'y') || (primary && event.shiftKey && key === 'z')) { event.preventDefault(); redo(); return; }
    if (primary && key === 's') { event.preventDefault(); setSaveStatus('saved'); return; }
    if (primary && key === 'a') { event.preventDefault(); setSelectedRange(`A1:${colToLetter((currentTab.colCount || 15) - 1)}${currentTab.rowCount || 30}`); return; }
    if (primary && key === 'b') { event.preventDefault(); toggleStyle('bold'); return; }
    if (primary && key === 'i') { event.preventDefault(); toggleStyle('italic'); return; }
    if (primary && key === 'u') { event.preventDefault(); toggleStyle('underline'); return; }
    if (primary && event.shiftKey && key === 'g') { event.preventDefault(); setShowImageModal(true); return; }
    if (primary && event.shiftKey && key === 'p') { event.preventDefault(); generateColumnSnapshot(); return; }
    if (key === 'delete' || key === 'backspace') { event.preventDefault(); clearSelection(); return; }
    if (key === 'f2' || key === 'enter') { event.preventDefault(); setIsEditingCell(true); cellInputRef.current?.focus(); return; }
    if (key === 'escape') { event.preventDefault(); setIsEditingCell(false); return; }
    if (key === 'arrowup') { event.preventDefault(); moveSelection(-1, 0, event.shiftKey, primary); return; }
    if (key === 'arrowdown') { event.preventDefault(); moveSelection(1, 0, event.shiftKey, primary); return; }
    if (key === 'arrowleft') { event.preventDefault(); moveSelection(0, -1, event.shiftKey, primary); return; }
    if (key === 'arrowright' || key === 'tab') { event.preventDefault(); moveSelection(0, 1, event.shiftKey, primary); return; }
    if (event.shiftKey && key === ' ') { event.preventDefault(); const row = selectedCell.match(/\d+$/)?.[0] || '1'; setSelectedRange(`A${row}:${colToLetter((currentTab.colCount || 15) - 1)}${row}`); return; }
    if (primary && key === ' ') { event.preventDefault(); const column = selectedCell.match(/^[A-Z]+/)?.[0] || 'A'; setSelectedRange(`${column}1:${column}${currentTab.rowCount || 30}`); }
  };

  const shareSheet = async () => {
    if (!activeSheet || !shareUserId) return;
    const recipient = employees.find((employee) => employee.id === shareUserId);
    if (!recipient) return;
    const existing = Array.isArray(activeSheet.sharedWith) ? activeSheet.sharedWith : [];
    const sharedWith = [...existing.filter((entry: any) => entry.userId !== recipient.id), { userId: recipient.id, userName: recipient.name, permission: sharePermission }];
    await updateSheet(activeSheet.id, { sharedWith });
    await sendEmail({ fromName: user?.name || 'Vernika User', fromEmail: user?.email || '', toName: recipient.name, toEmail: recipient.email, subject: `Workbook shared: ${activeSheet.title || activeSheet.name}`, body: `${user?.name || 'A teammate'} shared the workbook ${activeSheet.title || activeSheet.name} with ${sharePermission} access.`, folder: 'Sent' });
    await sendMessage({ senderId: user?.id || '', senderName: user?.name || 'Vernika User', senderAvatar: user?.avatar, recipientId: recipient.id, recipientName: recipient.name, text: `Shared workbook “${activeSheet.title || activeSheet.name}” with ${sharePermission} access.` } as any);
    setShareUserId('');
  };

  // Sync active tab when sheet opens
  useEffect(() => {
    if (activeSheet) {
      setActiveTabId(activeSheet.activeTabId || activeSheet.tabs[0]?.id || 'tab-1');
      setSelectedCell('A1');
      setSelectedRange('A1');
      setSelectionAnchor('A1');
      setHistory([]);
      setFuture([]);
    }
  }, [activeSheet]);

  const currentTab = useMemo(() => {
    if (!activeSheet) return null;
    return activeSheet.tabs.find(t => t.id === activeTabId) || activeSheet.tabs[0] || null;
  }, [activeSheet, activeTabId]);

  // Sync formula input when selected cell changes
  useEffect(() => {
    if (currentTab && selectedCell) {
      const cell = currentTab.data[selectedCell];
      setFormulaInput(cell && cell.raw ? cell.raw : (cell?.value !== undefined ? String(cell.value) : ''));
    }
  }, [selectedCell, currentTab]);

  // Filtered sheets for File Manager
  const filteredSheets = useMemo(() => {
    return normalizedSheets.filter(s => {
      const sheetTitle = s.title || (s as any).name || '';
      const sheetOwner = s.ownerName || '';
      const matchSearch = sheetTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          sheetOwner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'All' || s.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [normalizedSheets, searchQuery, categoryFilter]);

  // Handle Cell Value Update
  const updateCell = (coord: string, raw: string, extra: Partial<SheetCell> = {}) => {
    if (!activeSheet || !currentTab) return;
    const existing = currentTab.data[coord] || { raw: '' };
    setHistory(previous => [...previous.slice(-49), currentTab.data]);
    setFuture([]);
    const updatedData = {
      ...currentTab.data,
      [coord]: {
        ...existing,
        raw,
        ...extra
      }
    };

    setSaveStatus('saving');
    saveSheetData(activeSheet.id, currentTab.id, updatedData);
    setTimeout(() => setSaveStatus('saved'), 400);

    logEmployeeActivity({
      employeeId: user?.id || '',
      employeeName: user?.name || 'Staff User',
      action: 'Sheet Edited',
      activityType: 'Sheet Edited',
      module: 'sheets',
      details: `Updated cell ${coord} in spreadsheet "${activeSheet.title || (activeSheet as any).name || 'Spreadsheet'}"`,
      impactScore: 10
    });
  };

  // Format toggles
  const toggleStyle = (styleKey: 'bold' | 'italic' | 'underline') => {
    if (!currentTab || !selectedCell) return;
    const current = currentTab.data[selectedCell] || { raw: '' };
    updateCell(selectedCell, current.raw || '', { [styleKey]: !current[styleKey] });
  };

  const setAlignment = (align: 'left' | 'center' | 'right') => {
    if (!currentTab || !selectedCell) return;
    const current = currentTab.data[selectedCell] || { raw: '' };
    updateCell(selectedCell, current.raw || '', { align });
  };

  const setNumberFormat = (format: SheetCell['format']) => {
    if (!currentTab || !selectedCell) return;
    const current = currentTab.data[selectedCell] || { raw: '' };
    updateCell(selectedCell, current.raw || '', { format });
  };

  const setColors = (textColor?: string, bgColor?: string) => {
    if (!currentTab || !selectedCell) return;
    const current = currentTab.data[selectedCell] || { raw: '' };
    updateCell(selectedCell, current.raw || '', { textColor, bgColor });
  };

  // Create New Sheet
  const handleCreateNewSheet = async (templateCategory?: VernikaSheet['category']) => {
    const newId = await addSheet({
      title: templateCategory ? `New ${templateCategory} Workbook` : 'Untitled Spreadsheet',
      description: 'Collaborative cloud workbook for team financial and operational calculations',
      ownerId: user?.id || '',
      ownerName: user?.name || 'Enterprise Staff',
      category: templateCategory || 'General',
      activeTabId: 'tab-1',
      tags: [templateCategory || 'General', 'Spreadsheet'],
      starred: false,
      tabs: [
        {
          id: 'tab-1',
          name: 'Sheet1',
          rowCount: 30,
          colCount: 15,
          data: {
            'A1': { raw: 'Item / Category', bold: true, bgColor: '#e0f2fe' },
            'B1': { raw: 'Q1 Target', bold: true, bgColor: '#e0f2fe', align: 'right' },
            'C1': { raw: 'Q2 Target', bold: true, bgColor: '#e0f2fe', align: 'right' },
            'D1': { raw: 'Total', bold: true, bgColor: '#bae6fd', align: 'right' },
            'A2': { raw: 'Sample Metric A' },
            'B2': { raw: '15000', format: 'currency' },
            'C2': { raw: '18500', format: 'currency' },
            'D2': { raw: '=SUM(B2:C2)', format: 'currency', bold: true }
          }
        }
      ]
    });
    setActiveSheetId(newId);
  };

  // Duplicate Sheet
  const handleDuplicateSheet = async (sheet: VernikaSheet) => {
    await addSheet({
      title: `${sheet.title} (Copy)`,
      description: sheet.description,
      ownerId: user?.id || '',
      ownerName: user?.name || 'Staff User',
      category: sheet.category,
      activeTabId: sheet.activeTabId,
      tags: sheet.tags,
      starred: false,
      tabs: sheet.tabs
    });
  };

  // Add new tab to active sheet
  const handleAddTab = () => {
    if (!activeSheet) return;
    const newTabId = 'tab-' + Date.now();
    const newTab: SheetTab = {
      id: newTabId,
      name: `Sheet${activeSheet.tabs.length + 1}`,
      rowCount: 30,
      colCount: 15,
      data: {}
    };
    updateSheet(activeSheet.id, {
      tabs: [...activeSheet.tabs, newTab],
      activeTabId: newTabId
    });
    setActiveTabId(newTabId);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!currentTab) return;
    const maxRow = currentTab.rowCount || 30;
    const maxCol = currentTab.colCount || 15;

    const rows: string[] = [];
    for (let r = 1; r <= maxRow; r++) {
      const rowVals: string[] = [];
      let rowHasData = false;
      for (let c = 0; c < maxCol; c++) {
        const coord = `${colToLetter(c)}${r}`;
        const cell = currentTab.data[coord];
        const val = cell && cell.raw ? evaluateFormula(cell.raw, currentTab.data) : (cell?.value !== undefined ? String(cell.value) : '');
        if (val) rowHasData = true;
        rowVals.push(`"${val.replace(/"/g, '""')}"`);
      }
      if (rowHasData || r <= 10) {
        rows.push(rowVals.join(','));
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeSheet?.title || 'Vernika_Sheet'}_${currentTab.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart Data Extraction (auto-extract from Table Rows)
  const chartData = useMemo(() => {
    if (!currentTab) return [];
    const items = [];
    // Read up to first 12 rows
    for (let r = 3; r <= 15; r++) {
      const labelCell = currentTab.data[`A${r}`];
      const val1Cell = currentTab.data[`B${r}`];
      const val2Cell = currentTab.data[`C${r}`];
      const val3Cell = currentTab.data[`D${r}`];

        if (labelCell && labelCell.raw && !labelCell.raw.toLowerCase().includes('total')) {
          const name = evaluateFormula(labelCell.raw, currentTab.data);
          const v1 = val1Cell && val1Cell.raw ? parseFloat(evaluateFormula(val1Cell.raw, currentTab.data).replace(/[^0-9.-]/g, '')) || 0 : 0;
          const v2 = val2Cell && val2Cell.raw ? parseFloat(evaluateFormula(val2Cell.raw, currentTab.data).replace(/[^0-9.-]/g, '')) || 0 : 0;
          const v3 = val3Cell && val3Cell.raw ? parseFloat(evaluateFormula(val3Cell.raw, currentTab.data).replace(/[^0-9.-]/g, '')) || 0 : 0;

        if (name && (v1 || v2 || v3)) {
          items.push({ name: name.length > 20 ? name.substring(0, 18) + '...' : name, Actual: v1, Target: v2, Forecast: v3, value: v1 || v2 || v3 });
        }
      }
    }
    return items;
  }, [currentTab]);

  // AI Sheet Copilot Handler
  const handleRunAi = () => {
    if (!aiPrompt.trim() || !currentTab || !activeSheet) return;
    setAiLoading(true);
    setTimeout(() => {
      // Simulate rich AI automation
      const lower = aiPrompt.toLowerCase();
      if (lower.includes('tax') || lower.includes('15%') || lower.includes('18%')) {
        updateCell('F3', 'Tax (18%)', { bold: true, bgColor: '#fef3c7', align: 'right' });
        updateCell('F4', '=E4*0.18', { format: 'currency' });
        updateCell('F5', '=E5*0.18', { format: 'currency' });
        updateCell('F6', '=E6*0.18', { format: 'currency' });
        updateCell('F7', '=E7*0.18', { format: 'currency' });
      } else if (lower.includes('growth') || lower.includes('forecast')) {
        updateCell('G3', 'Q4 Growth Proj', { bold: true, bgColor: '#e0f2fe', align: 'right' });
        updateCell('G4', '=E4*1.12', { format: 'currency' });
        updateCell('G5', '=E5*1.12', { format: 'currency' });
        updateCell('G6', '=E6*1.15', { format: 'currency' });
        updateCell('G7', '=E7*1.10', { format: 'currency' });
      } else {
        updateCell('D10', 'AI Auto-Generated Summary', { bold: true, textColor: '#0284c7' });
        updateCell('D11', '=SUM(B4:D7)', { format: 'currency', bold: true });
      }
      setAiLoading(false);
      setShowAiModal(false);
      setAiPrompt('');
    }, 800);
  };

  // ==========================================
  // RENDER: 1. CLOUD FILE MANAGER VIEW
  // ==========================================
  if (!activeSheetId || !activeSheet) {
    return (
      <div className="space-y-6 pb-12 text-slate-900 dark:text-slate-100" id="vernika-sheets-file-manager">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Vernika Sheets & Cloud Workspace
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Firestore Synced
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Collaborative multi-tab enterprise spreadsheets with live mathematical formula engine, financial modeling, and cloud persistence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCreateNewSheet()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              New Blank Spreadsheet
            </button>
          </div>
        </div>

        {/* Quick Starter Templates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Start with Pre-Built Enterprise Model
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { title: 'Q3 Financial Budget', cat: 'Finance', desc: 'Revenue, OpEx, Net Margin', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
              { title: 'B2B Sales CRM Pipeline', cat: 'Sales', desc: 'Deal Sizing, Close Probability', icon: TrendingUp, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
              { title: 'Staff OKRs & Performance', cat: 'HR', desc: 'Task Velocity, Quality Adherence', icon: Users, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
              { title: 'Sprint Backlog & Velocity', cat: 'Operations', desc: 'Story Points, Sprint Burndown', icon: BarChart3, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' }
            ].map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => handleCreateNewSheet(tmpl.cat as VernikaSheet['category'])}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition text-left flex items-start gap-3 group"
              >
                <div className={`p-2.5 rounded-xl ${tmpl.color} shrink-0`}>
                  <tmpl.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">{tmpl.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tmpl.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search workbooks, formulas, or owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="All" className="dark:bg-slate-800">Category: All</option>
                <option value="Finance" className="dark:bg-slate-800">Finance</option>
                <option value="Sales" className="dark:bg-slate-800">Sales</option>
                <option value="HR" className="dark:bg-slate-800">HR</option>
                <option value="Operations" className="dark:bg-slate-800">Operations</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-xs text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sheets Grid / List */}
        {filteredSheets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No workbooks found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create your first spreadsheet or adjust the search criteria.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSheets.map((sheet) => (
              <div
                key={sheet.id}
                onClick={() => setActiveSheetId(sheet.id)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                          {sheet.title}
                        </h3>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {sheet.tabs.length} Tab{sheet.tabs.length > 1 ? 's' : ''} • Updated {sheet.updatedAt}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSheet(sheet.id, { starred: !sheet.starred });
                      }}
                      className="text-slate-300 dark:text-slate-600 hover:text-amber-400 p-1"
                    >
                      <Star className={`w-4 h-4 ${sheet.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {sheet.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {sheet.description}
                    </p>
                  )}
                </div>

                {/* Tags and Collaborators */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {sheet.category || 'General'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDuplicateSheet(sheet)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSheet(sheet.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Workbook Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Tabs</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSheets.map((sheet) => (
                  <tr
                    key={sheet.id}
                    onClick={() => setActiveSheetId(sheet.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{sheet.title}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {sheet.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{sheet.ownerName}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{sheet.tabs.length} tabs</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{sheet.updatedAt}</td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDuplicateSheet(sheet)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSheet(sheet.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: 2. VERNIKA SPREADSHEET EDITOR VIEW
  // ==========================================
  const maxRows = currentTab?.rowCount || 30;
  const maxCols = currentTab?.colCount || 15;
  const activeCellData = currentTab?.data[selectedCell] || { raw: '' };
  const selectedCellSet = new Set(getSelectedCells());

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-3" id="vernika-sheets-editor">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSheetId(null)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Back to Workbooks Manager"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <input
                type="text"
                value={activeSheet.title}
                onChange={(e) => updateSheet(activeSheet.id, { title: e.target.value })}
                className="text-base font-bold text-slate-900 dark:text-white bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border focus:border-emerald-500 rounded-lg px-2 py-0.5 outline-hidden transition"
              />
              <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 px-2">
                <span>{activeSheet.category || 'Finance'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3 h-3" /> {saveStatus === 'saving' ? 'Saving to Cloud...' : 'Saved to Cloud DB'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Active Collaborators Presence */}
          <div className="flex items-center -space-x-1.5 mr-2">
            {activeSheet.activeEditors?.map((editor, idx) => (
              <div
                key={idx}
                title={`${editor.userName} is active in cell ${editor.activeCell}`}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-xs cursor-pointer"
                style={{ backgroundColor: editor.color }}
              >
                {(editor?.userName || 'U').charAt(0)}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Sheet Copilot
          </button>

          <button
            onClick={undo}
            disabled={!history.length}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer"
            title={`Undo (${displayShortcut('Ctrl+Z', '⌘ Z')})`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!future.length}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition cursor-pointer"
            title={`Redo (${displayShortcut('Ctrl+Y', '⌘ Shift+Z')})`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowShortcutModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title="Keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
            Shortcuts
          </button>

          <button
            onClick={() => setShowImageModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-fuchsia-50 dark:bg-fuchsia-950/40 hover:bg-fuchsia-100 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 transition cursor-pointer"
            title={`Generate image (${displayShortcut('Ctrl+Shift+G', '⌘ Shift+G')})`}
          >
            <WandSparkles className="w-3.5 h-3.5" />
            Generate Image
          </button>

          <button
            onClick={generateColumnSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
            title={`Selected column snapshot (${displayShortcut('Ctrl+Shift+P', '⌘ Shift+P')})`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            Column PNG
          </button>

          <button
            onClick={() => setShowChartModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Chart Visualizer
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Formatting & Formula Bar */}
      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 shrink-0">
        {/* Style Formatting Row */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => toggleStyle('bold')}
              className={`p-1.5 rounded-md transition cursor-pointer ${activeCellData.bold ? 'bg-white dark:bg-slate-700 font-bold text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleStyle('italic')}
              className={`p-1.5 rounded-md transition cursor-pointer ${activeCellData.italic ? 'bg-white dark:bg-slate-700 italic text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleStyle('underline')}
              className={`p-1.5 rounded-md transition cursor-pointer ${activeCellData.underline ? 'bg-white dark:bg-slate-700 underline text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Alignment */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setAlignment('left')}
              className={`p-1.5 rounded-md transition cursor-pointer ${activeCellData.align === 'left' || !activeCellData.align ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setAlignment('center')}
              className={`p-1.5 rounded-md transition cursor-pointer ${activeCellData.align === 'center' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setAlignment('right')}
              className={`p-1.5 rounded-md transition cursor-pointer ${activeCellData.align === 'right' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Number Formats */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setNumberFormat('currency')}
              className={`px-2 py-1 rounded-md transition font-medium flex items-center gap-0.5 cursor-pointer ${activeCellData.format === 'currency' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              title="Currency ($ USD)"
            >
              <DollarSign className="w-3.5 h-3.5" /> Currency
            </button>
            <button
              onClick={() => setNumberFormat('percentage')}
              className={`px-2 py-1 rounded-md transition font-medium flex items-center gap-0.5 cursor-pointer ${activeCellData.format === 'percentage' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              title="Percentage (%)"
            >
              <Percent className="w-3.5 h-3.5" /> %
            </button>
            <button
              onClick={() => setNumberFormat('number')}
              className={`px-2 py-1 rounded-md transition font-medium flex items-center gap-0.5 cursor-pointer ${activeCellData.format === 'number' ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              title="Number"
            >
              <Hash className="w-3.5 h-3.5" /> 1,234
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Color Palettes */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Fill:</span>
            {['#ffffff', '#e0f2fe', '#ecfdf5', '#fef3c7', '#fee2e2', '#ede9fe'].map((c) => (
              <button
                key={c}
                onClick={() => setColors(activeCellData.textColor, c)}
                style={{ backgroundColor: c }}
                className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-110 transition cursor-pointer"
              />
            ))}
          </div>
        </div>

        {/* Formula Bar (fx) */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 w-16 text-center shrink-0">
            {selectedCell}
          </div>

          <div className="flex items-center gap-2 flex-1 relative">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 italic select-none">fx</span>
            <input
              ref={cellInputRef}
              type="text"
              onFocus={() => setIsEditingCell(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === 'Tab') {
                  event.preventDefault();
                  setIsEditingCell(false);
                  moveSelection(0, event.shiftKey ? -1 : 1);
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setIsEditingCell(false);
                }
              }}
              value={formulaInput}
              onChange={(e) => {
                setFormulaInput(e.target.value);
                updateCell(selectedCell, e.target.value);
              }}
              placeholder="Enter value or formula e.g. =SUM(A1:A5) or =B2*1.18"
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Main Interactive Spreadsheet Grid */}
      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={handleGridKeyDown}
        onClick={() => gridRef.current?.focus()}
        className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-auto relative outline-none focus:ring-2 focus:ring-emerald-500/30"
      >
        <table className="border-collapse table-fixed w-max min-w-full text-xs">
          {/* Column Header Row */}
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-800/90 sticky top-0 z-20 border-b border-slate-300 dark:border-slate-700 select-none">
              <th className="w-12 min-w-12 h-8 bg-slate-200/80 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 font-bold text-[11px] sticky left-0 z-30">
                #
              </th>
              {Array.from({ length: maxCols }).map((_, c) => {
                const colLetter = colToLetter(c);
                return (
                  <th
                    key={c}
                    onClick={() => setSelectedRange(`${colLetter}1:${colLetter}${maxRows}`)}
                    className={`w-32 min-w-32 h-8 border-r border-slate-300 dark:border-slate-700 text-center text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer ${selectedRange.startsWith(`${colLetter}1:`) ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : ''}`}
                    title={`Select column ${colLetter}`}
                  >
                    {colLetter}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Grid Rows */}
          <tbody>
            {Array.from({ length: maxRows }).map((_, r) => {
              const rowNum = r + 1;
              return (
                <tr key={rowNum} className="border-b border-slate-200 dark:border-slate-800">
                  {/* Sticky Row Number */}
                  <td
                    onClick={() => setSelectedRange(`A${rowNum}:${colToLetter(maxCols - 1)}${rowNum}`)}
                    className={`w-12 min-w-12 h-8 bg-slate-100 dark:bg-slate-850 border-r border-slate-300 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 font-semibold text-[11px] select-none sticky left-0 z-10 cursor-pointer ${selectedRange.endsWith(`:${colToLetter(maxCols - 1)}${rowNum}`) ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : ''}`}
                    title={`Select row ${rowNum}`}
                  >
                    {rowNum}
                  </td>

                  {/* Cell Columns */}
                  {Array.from({ length: maxCols }).map((_, c) => {
                    const coord = `${colToLetter(c)}${rowNum}`;
                    const cell = currentTab?.data[coord];
                    const isSelected = selectedCell === coord;
                    const isInSelection = selectedCellSet.has(coord);
                    const computedValue = cell && cell.raw ? evaluateFormula(cell.raw, currentTab?.data || {}) : (cell?.value !== undefined ? String(cell.value) : '');
                    const displayValue = cell ? formatCellValue(computedValue, cell.format) : '';

                    return (
                      <td
                        key={coord}
                        onClick={(event) => updateSelection(coord, event.shiftKey)}
                        onDoubleClick={() => {
                          setSelectedCell(coord);
                          cellInputRef.current?.focus();
                        }}
                        style={{
                          backgroundColor: cell?.bgColor,
                          color: cell?.textColor,
                          textAlign: cell?.align || (cell?.format === 'currency' || cell?.format === 'number' || cell?.format === 'percentage' ? 'right' : 'left'),
                          fontWeight: cell?.bold ? 'bold' : 'normal',
                          fontStyle: cell?.italic ? 'italic' : 'normal',
                          textDecoration: cell?.underline ? 'underline' : 'none'
                        }}
                        className={`w-32 min-w-32 h-8 px-2 py-1 border-r border-slate-200 dark:border-slate-800 text-xs truncate transition-colors cursor-cell relative text-slate-900 dark:text-slate-200 ${
                          isSelected
                            ? 'outline-2 outline-emerald-500 z-10 bg-emerald-50/40 dark:bg-emerald-950/40'
                            : isInSelection
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 outline-1 outline-emerald-300'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {displayValue}

                        {/* Selected cell corner fill-handle */}
                        {isSelected && (
                          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-600 pointer-events-none" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Multi-Tab Bottom Bar */}
      <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          {activeSheet.tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`px-4 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTabId === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{tab.name}</span>
            </button>
          ))}

          <button
            onClick={handleAddTab}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition ml-1 cursor-pointer"
            title="Add New Sheet Tab"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Cell Stat Summary */}
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs px-2">
          <span>Active Cell: <strong className="text-slate-800 dark:text-slate-200">{selectedCell}</strong></span>
          <span>Rows: <strong className="text-slate-800 dark:text-slate-200">{maxRows}</strong></span>
          <span>Cols: <strong className="text-slate-800 dark:text-slate-200">{maxCols}</strong></span>
        </div>
      </div>

      {/* Keyboard Shortcut Reference */}
      {showShortcutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Spreadsheet keyboard shortcuts">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Keyboard className="w-6 h-6 text-emerald-600" /><div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Spreadsheet keyboard shortcuts</h3><p className="text-xs text-slate-500 dark:text-slate-400">Windows and macOS shortcuts work throughout the editor.</p></div></div>
              <button onClick={() => setShowShortcutModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SPREADSHEET_SHORTCUTS.map(shortcut => <div key={shortcut.action} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-800 dark:text-slate-200">{shortcut.action}</span><span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">{displayShortcut(shortcut.windows, shortcut.mac)}</span></div><p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{shortcut.description}</p></div>)}
            </div>
          </div>
        </div>
      )}

      {/* Generated Image Dialog */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Generate spreadsheet image">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><ImageIcon className="w-6 h-6 text-fuchsia-600" /><div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Generate an image from the selection</h3><p className="text-xs text-slate-500 dark:text-slate-400">Creates a branded PNG using the selected cells and your prompt.</p></div></div><button onClick={() => setShowImageModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button></div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Image title<input value={imageTitle} onChange={event => setImageTitle(event.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm" /></label>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Visual brief<textarea value={imagePrompt} onChange={event => setImagePrompt(event.target.value)} rows={3} className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm resize-none" /></label>
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500 dark:text-slate-400">Selection: <strong className="text-slate-800 dark:text-slate-200">{selectionLabel(selectedRange)}</strong></span><button onClick={() => { generateSelectionImage(); setShowImageModal(false); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold"><WandSparkles className="w-4 h-4" />Download PNG</button></div>
          </div>
        </div>
      )}

      {/* Chart Visualizer Modal */}
      {showChartModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Spreadsheet Data Visualizer</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Live dynamic chart converted from {currentTab?.name} data table</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${chartType === 'line' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartType('pie')}
                    className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${chartType === 'pie' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Pie
                  </button>
                </div>

                <button onClick={() => setShowChartModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-72 w-full bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                  No numerical row data detected in sheet range A3:D15.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                      <Legend />
                      <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Target" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="Target" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                      <Legend />
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} fill="#8884d8">
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'][index % 5]} />
                        ))}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowChartModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Close Chart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Copilot Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Vernika AI Sheet Assistant</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Automate formulas, create tax projections, or summarize models</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  What would you like AI to calculate or generate?
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., 'Calculate 18% tax in column F for all items' or 'Project 12% quarterly compound revenue growth'"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Calculate 18% tax column',
                  'Project 12% Q4 growth',
                  'Add gross summary total'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setAiPrompt(chip)}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 font-medium transition cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRunAi}
                disabled={aiLoading || !aiPrompt.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white shadow-xs transition cursor-pointer"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Apply to Sheet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Share Workbook</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activeSheet.title}</p>
                </div>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select value={shareUserId} onChange={(e) => setShareUserId(e.target.value)} className="sm:col-span-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"><option value="">Select a team member</option>{employees.filter((employee) => employee.id !== user?.id).map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.department}</option>)}</select>
              <select value={sharePermission} onChange={(e) => setSharePermission(e.target.value as 'view' | 'edit')} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"><option value="edit">Can edit</option><option value="view">Can view</option></select>
              <button type="button" onClick={shareSheet} disabled={!shareUserId} className="sm:col-span-3 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">Assign and notify by Mail + Messenger</button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Collaborators with Access:</span>
              <div className="space-y-2">
                {activeSheet.sharedWith?.map((collab) => (
                  <div key={collab.userId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-medium text-slate-900 dark:text-white">{collab.userName}</span>
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase text-[10px]">
                      {collab.permission}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VernikaSheetsScreen;
