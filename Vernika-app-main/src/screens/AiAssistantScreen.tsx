import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  TrendingUp,
  Users,
  CalendarCheck,
  Receipt,
  FileText,
  Boxes,
  Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AiChatMessage } from '../types';

export const AiAssistantScreen: React.FC = () => {
  const { employees, attendance, leaves, projects, leads, invoices, inventoryItems } = useApp();
  const { user } = useAuth();

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'ai-init',
      sender: 'assistant',
      text: `Hello ${user?.name}! I am Vernika AI, your executive intelligence and operations copilot. I have live telemetry access to your ${employees.length} employees, active attendance logs, $${(leads.reduce((a, b) => a + b.value, 0) / 1000).toFixed(0)}k CRM pipeline, inventory catalog, and billing ledgers. How can I assist your enterprise operations today?`,
      timestamp: 'Just now',
      suggestions: [
        'Analyze Q1 revenue vs invoice collections',
        'Summarize pending leave applications',
        'Check today\'s punctuality and floor attendance',
        'Review top CRM deals closing this month',
        'Audit low-stock inventory and assets',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const generateAIResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('revenue') || q.includes('invoice') || q.includes('billing') || q.includes('collection')) {
      const totalInv = invoices.reduce((a, b) => a + (b.amount || 0), 0);
      const paidInv = invoices.filter((i) => i.status === 'Paid').reduce((a, b) => a + (b.amount || 0), 0);
      const pendingInv = invoices.filter((i) => i.status !== 'Paid').reduce((a, b) => a + (b.amount || 0), 0);
      return `📊 **Financial & Invoicing Analysis**:\n- Total Invoices Generated: **$${totalInv.toLocaleString()} USD**\n- Collected / Settled: **$${paidInv.toLocaleString()} USD**\n- Outstanding Receivables: **$${pendingInv.toLocaleString()} USD**\n\n💡 *Action item*: Follow up on pending receivables due within the current quarter.`;
    }

    if (q.includes('inventory') || q.includes('stock') || q.includes('asset') || q.includes('warehouse')) {
      const lowStock = inventoryItems.filter((i) => i.status === 'Low Stock' || i.status === 'Out of Stock');
      return `📦 **Inventory & Asset Telemetry**:\n- Active SKUs: **${inventoryItems.length} items**\n- Attention Required: **${lowStock.length} items with low or zero stock**\n\n🚨 Items needing replenishment: ${lowStock.map((i) => i.name).join(', ') || 'All stock levels healthy'}.`;
    }

    if (q.includes('leave') || q.includes('vacation') || q.includes('time off')) {
      const pending = leaves.filter((l) => l.status === 'Pending');
      if (pending.length === 0) {
        return `✅ **Leave Status**: All employee leave requests have been reviewed and resolved. No pending applications require attention.`;
      }
      return `📝 **Pending Leave Review (${pending.length} Requests)**:\n${pending
        .map((l) => `- **${l.employeeName}**: ${l.type} for ${l.days} days (${l.startDate} to ${l.endDate}). Reason: "${l.reason}"`)
        .join('\n')}\n\n👉 You can approve or reject these directly in the Leave Management tab.`;
    }

    if (q.includes('attendance') || q.includes('punctuality') || q.includes('clock') || q.includes('present') || q.includes('aux')) {
      const present = attendance.filter((a) => a.status === 'Present').length;
      const late = attendance.filter((a) => a.status === 'Late').length;
      const rate = Math.round((present / (employees.length || 1)) * 100);
      return `⏱️ **Today's Attendance & AUX Overview**:\n- Floor Attendance Rate: **${rate}%** (${present} of ${employees.length} staff logged)\n- On-time Check-ins: **${present}**\n- Late Arrivals: **${late}**\n\nOffice operations and AUX status telemetry are operating smoothly.`;
    }

    if (q.includes('crm') || q.includes('deal') || q.includes('pipeline') || q.includes('sales')) {
      const totalPipe = leads.reduce((a, b) => a + b.value, 0);
      const topDeals = [...leads].sort((a, b) => b.value - a.value).slice(0, 3);
      return `💼 **CRM Deal Intelligence**:\n- Total Active Pipeline: **$${(totalPipe / 1000).toFixed(0)}k USD** across ${leads.length} accounts.\n\n🔥 **Top High-Value Deals**:\n${topDeals
        .map((d) => `- **${d.company}** (${d.name}): **$${d.value.toLocaleString()}** — Stage: \`${d.stage}\``)
        .join('\n')}`;
    }

    if (q.includes('project') || q.includes('task') || q.includes('sprint')) {
      const activePrj = projects.filter((p) => p.status === 'Active');
      return `🚀 **Projects & Sprints Status**:\n- Active Initiatives: **${activePrj.length} Projects**\n${activePrj
        .map((p) => `- **${p.name}**: ${p.progress}% completed (Budget: $${(p.budget / 1000).toFixed(0)}k)`)
        .join('\n')}\n\nTask Kanban board shows all critical path items are on schedule.`;
    }

    return `✨ **Vernika Business Intelligence Insight**:\nI processed your query regarding "${query}". All enterprise modules (HR, AUX, Inventory, CRM, Mail, Projects, and Financials) are connected. Feel free to request custom breakdowns, staff audits, or financial projections.`;
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: AiChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiReplyText = generateAIResponse(text);
      const aiMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Vernika Executive AI Copilot</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Natural language intelligence, financial audits, staff telemetry, and operational insights
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden flex flex-col h-[640px]">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.map((m) => {
            const isMe = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                    isMe ? 'bg-slate-800 dark:bg-slate-700' : 'bg-emerald-600'
                  }`}
                >
                  {isMe ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-2xl space-y-2 ${isMe ? 'items-end' : ''}`}>
                  <div
                    className={`p-4 rounded-3xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-tr-none shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none whitespace-pre-line'
                    }`}
                  >
                    {m.text}
                  </div>

                  {/* Suggestion Chips */}
                  {m.suggestions && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {m.suggestions.map((sug: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleSend(sug)}
                          className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-xl transition-colors cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block px-1">{m.timestamp}</span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pl-12">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Vernika Copilot analyzing enterprise database...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g. 'Summarize unpaid invoices', 'Check inventory status')..."
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden px-3"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
