import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  CheckCircle2,
  Database,
  Building2,
  Building,
  Utensils,
} from 'lucide-react';
import { vernikaCopilot, CopilotMessage } from '../services/vernikaCopilot';
import { hybridDB } from '../services/hybridDatabase';

export const VernikaCopilotView: React.FC = () => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'init_msg',
      sender: 'copilot',
      text: 'Hello! I am Vernika Copilot AI. I can query financial records, HR attendance, food orders, or generate database schemas across Google Drive, Spreadsheets, Supabase, and Firebase.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    { label: 'GoldenPrime PG Financial Audit', icon: Building2 },
    { label: 'Vernika HR Attendance & Leaves', icon: Building },
    { label: 'ChaknaStore Tiffin & Orders', icon: Utensils },
    { label: 'Generate Hybrid DB Schema', icon: Database },
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: CopilotMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const copilotResponse = await vernikaCopilot.queryCopilot(query);
      setMessages((prev) => [...prev, copilotResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionPayload: NonNullable<CopilotMessage['actionPayload']>) => {
    if (actionPayload.type === 'export_spreadsheet') {
      hybridDB.exportToSpreadsheet('Vernika_Copilot_Financial_Audit', actionPayload.data);
    } else {
      hybridDB.saveAppData('vernika', 'copilot_generated_record', actionPayload.data);
      alert('Record saved to Hybrid Database & Google Drive Folder!');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
          <Bot className="h-4 w-4" /> Offline & Cloud AI Assistant
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-display">
          Vernika Copilot AI Intelligence
        </h1>
        <p className="text-xs text-slate-400">
          Query cross-application data, calculate financial metrics, and manage hybrid database operations.
        </p>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-shrink-0">
        {samplePrompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(p.label)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <Icon className="h-3.5 w-3.5 text-indigo-400" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {msg.sender === 'copilot' ? (
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Bot className="h-3 w-3" /> Vernika Copilot
                </span>
              ) : (
                <span className="text-[10px] font-bold text-indigo-400">You</span>
              )}
              <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              <p>{msg.text}</p>

              {msg.actionPayload && (
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleActionClick(msg.actionPayload!)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold hover:bg-indigo-500/30 transition-all text-[11px]"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    {msg.actionPayload.title}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
            Vernika Copilot processing query...
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Vernika Copilot about PG rent, HR attendance, food orders, or DB sync..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || loading}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </div>
    </div>
  );
};
