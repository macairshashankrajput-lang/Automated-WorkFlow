import React, { useState, useMemo, useRef } from 'react';
import {
  Mail,
  Inbox,
  Send,
  Star,
  Archive,
  Trash2,
  FileText,
  Search,
  Plus,
  Paperclip,
  Reply,
  Forward,
  MoreVertical,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
  X,
  RefreshCw,
  CornerDownRight,
  Shield,
  Download,
  Sparkles,
  Calendar,
  Filter,
  Check,
  Printer,
  ChevronDown,
  FileSpreadsheet,
  AlertTriangle,
  UploadCloud,
  Layers,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { EmailMessage } from '../types';

export const MailScreen: React.FC = () => {
  const { user } = useAuth();
  const { 
    emails, 
    sendEmail, 
    markEmailRead, 
    toggleStarEmail, 
    deleteEmail, 
    moveEmailToFolder,
    employees,
    addCalendarEvent,
    setActiveScreen,
    uploadFile
  } = useApp();

  // Navigation Folders & Outlook Views
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'drafts' | 'starred' | 'archive' | 'trash' | 'junk'>('inbox');
  const [inboxTab, setInboxTab] = useState<'focused' | 'other'>('focused');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'starred' | 'attachments' | 'important'>('all');
  const [selectedMailId, setSelectedMailId] = useState<string | null>(() => emails[0]?.id || null);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeCategory, setComposeCategory] = useState<'Primary' | 'Work' | 'Finance' | 'Clients' | 'Alerts'>('Work');
  const [composePriority, setComposePriority] = useState(false);
  const [composeAttachments, setComposeAttachments] = useState<Array<{ name: string; size: string; type: string; url?: string }>>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const [scheduledSendNotice, setScheduledSendNotice] = useState<string | null>(null);

  // AI Copilot / Assistant in Compose
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');

  // Quick Reply & Reading Pane
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [forwardRecipient, setForwardRecipient] = useState('');
  const [forwardNote, setForwardNote] = useState('');

  // Toast / Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserEmail = (user?.email || 'admin@vernika.io').toLowerCase();

  // Multi-user smart filtered emails
  const filteredEmails = useMemo(() => {
    return emails.filter((mail) => {
      const mailTo = (mail.toEmail || '').toLowerCase();
      const mailFrom = (mail.fromEmail || '').toLowerCase();

      // Folder filtering
      if (activeFolder === 'starred') {
        if (!mail.starred) return false;
      } else if (activeFolder === 'sent') {
        if (mail.folder !== 'sent' && mailFrom !== currentUserEmail) return false;
      } else if (activeFolder === 'drafts') {
        if (mail.folder !== 'drafts') return false;
      } else if (activeFolder === 'archive') {
        if (mail.folder !== 'archive') return false;
      } else if (activeFolder === 'trash') {
        if (mail.folder !== 'trash') return false;
      } else if (activeFolder === 'junk') {
        if (mail.folder !== 'trash' && mail.category !== 'Alerts') return false;
      } else if (activeFolder === 'inbox') {
        if (mail.folder && mail.folder !== 'inbox') {
          // If explicitly filed into another folder, exclude
          if (mail.folder === 'sent' && mailFrom === currentUserEmail && mailTo !== currentUserEmail) return false;
          if (['drafts', 'archive', 'trash'].includes(mail.folder)) return false;
        }

        // Focused vs Other inbox tab logic
        if (inboxTab === 'focused') {
          // Focused contains Primary, Work, Clients or Important emails
          const subj = (mail.subject || '').toLowerCase();
          const isOther = mail.category === 'Alerts' || subj.includes('newsletter') || subj.includes('automated');
          if (isOther && !mail.important && !mail.starred) return false;
        } else {
          // Other contains general automated notifications and non-focused emails
          const isFocused = (mail.category === 'Primary' || mail.category === 'Work' || mail.category === 'Clients' || mail.important || mail.starred);
          if (isFocused) return false;
        }
      }

      // Category filter
      if (selectedCategory && mail.category !== selectedCategory) {
        return false;
      }

      // Type filters
      if (filterType === 'unread' && mail.read) return false;
      if (filterType === 'starred' && !mail.starred) return false;
      if (filterType === 'attachments' && !mail.hasAttachments) return false;
      if (filterType === 'important' && !mail.important) return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const fromN = (mail.fromName || '').toLowerCase();
        const fromE = (mail.fromEmail || '').toLowerCase();
        const subj = (mail.subject || '').toLowerCase();
        const snip = (mail.snippet || '').toLowerCase();
        const body = (mail.body || '').toLowerCase();
        const matchFrom = fromN.includes(q) || fromE.includes(q);
        const matchSubj = subj.includes(q);
        const matchBody = snip.includes(q) || body.includes(q);
        if (!matchFrom && !matchSubj && !matchBody) return false;
      }

      return true;
    });
  }, [emails, activeFolder, inboxTab, selectedCategory, filterType, searchQuery, currentUserEmail]);

  const selectedMail = useMemo(() => {
    return emails.find((m) => m.id === selectedMailId) || filteredEmails[0] || null;
  }, [emails, selectedMailId, filteredEmails]);

  // Unread counts
  const inboxUnread = emails.filter((m) => (m.folder === 'inbox' || !m.folder) && !m.read).length;
  const starredCount = emails.filter((m) => m.starred).length;
  const draftsCount = emails.filter((m) => m.folder === 'drafts').length;

  const handleSelectMail = (mail: EmailMessage) => {
    setSelectedMailId(mail.id);
    if (!mail.read) {
      markEmailRead(mail.id, true);
    }
    // If selecting a draft, open compose modal to continue editing
    if (mail.folder === 'drafts') {
      setEditingDraftId(mail.id);
      setComposeTo(mail.toEmail || '');
      setComposeSubject(mail.subject || '');
      setComposeBody(mail.body || '');
      setComposeCategory((mail.category as any) || 'Work');
      setComposePriority(!!mail.important);
      setComposeAttachments((mail.attachments || []).map((a) => ({ name: a.name, size: a.size, type: a.type || 'document', url: a.url })));
      setIsComposeOpen(true);
    }
  };

  const handleSendCompose = async (e: React.FormEvent, scheduleTime?: string) => {
    e.preventDefault();
    if (!composeTo || !composeSubject) return;

    if (editingDraftId) {
      // Remove previous draft entry
      await deleteEmail(editingDraftId);
      setEditingDraftId(null);
    }

    const emailPayload: any = {
      fromName: user?.name || 'Administrator',
      fromEmail: user?.email || 'admin@vernika.io',
      fromAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      toEmail: composeTo,
      subject: composeSubject,
      snippet: composeBody.slice(0, 120),
      body: composeBody,
      important: composePriority,
      hasAttachments: composeAttachments.length > 0,
      attachments: composeAttachments,
      category: composeCategory,
      ccEmails: composeCc ? composeCc.split(',').map((s) => s.trim()) : undefined,
      folder: 'sent',
      read: true,
      starred: false,
    };

    await sendEmail(emailPayload);

    setIsComposeOpen(false);
    setComposeTo('');
    setComposeCc('');
    setComposeSubject('');
    setComposeBody('');
    setComposeAttachments([]);
    setShowScheduleMenu(false);

    if (scheduleTime) {
      showToast(`Email scheduled to send at ${scheduleTime}`);
    } else {
      showToast('Message sent successfully!');
    }
    setActiveFolder('sent');
  };

  const handleSaveDraft = async () => {
    if (!composeSubject && !composeBody && !composeTo) {
      setIsComposeOpen(false);
      return;
    }

    if (editingDraftId) {
      await deleteEmail(editingDraftId);
    }

    await sendEmail({
      fromName: user?.name || 'Administrator',
      fromEmail: user?.email || 'admin@vernika.io',
      fromAvatar: user?.avatar,
      toEmail: composeTo || 'draft@vernika.io',
      subject: composeSubject || '(No Subject)',
      snippet: composeBody.slice(0, 100) || '(Draft with no body)',
      body: composeBody || '',
      important: composePriority,
      hasAttachments: composeAttachments.length > 0,
      attachments: composeAttachments,
      category: composeCategory,
      folder: 'Drafts',
      read: true,
      starred: false,
    });

    setIsComposeOpen(false);
    setEditingDraftId(null);
    setComposeTo('');
    setComposeCc('');
    setComposeSubject('');
    setComposeBody('');
    setComposeAttachments([]);
    showToast('Draft saved securely to Vernika Cloud');
  };

  // AI Prompt Templates
  const handleGenerateWithAiTemplate = (type: string) => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      let subject = '';
      let body = '';
      const userName = user?.name || 'Team Member';
      const userDept = user?.department || 'Operations';

      switch (type) {
        case 'project_update':
          subject = 'Project Sprint Milestone & Status Update';
          body = `Hi Team,\n\nI am writing to share a brief update on our active project milestones for the current sprint.\n\nKey Highlights:\n• Core architecture and database sync are completed ahead of schedule.\n• Security rules and cross-module permissions have been tested across all roles.\n• Next deployment review will occur this Thursday at 2:00 PM PST.\n\nPlease review the attached sprint tickets and let me know if you have any questions.\n\nBest regards,\n${userName}\n${userDept} Department | Vernika Cloud`;
          break;

        case 'client_proposal':
          subject = 'Proposal & Deployment Scope - Vernika Business Suite';
          body = `Dear Partner,\n\nThank you for taking the time to review our enterprise cloud capabilities earlier this week.\n\nAttached to this email, you will find our comprehensive proposal detailing:\n1. Dedicated cloud infrastructure deployment & security certifications.\n2. User provisioning, geofenced attendance, and real-time Outlook sync.\n3. Dedicated 24/7 enterprise SLA and support tiers.\n\nWe look forward to answering any questions during our upcoming walkthrough.\n\nWarm regards,\n${userName}\nVernika Cloud Enterprise Services`;
          break;

        case 'leave_request':
          subject = 'Formal Leave / PTO Application Request';
          body = `Dear Supervisor,\n\nI would like to formally request scheduled paid time off from next Monday to Wednesday for personal obligations.\n\nI have handed off all active sprint tickets and verified that our deployment pipeline is fully covered by the team. I will ensure all critical emails are addressed prior to my departure.\n\nThank you for your approval.\n\nSincerely,\n${userName}\n${userDept}`;
          break;

        case 'invoice_followup':
          subject = 'Invoice & Payment Schedule Notification';
          body = `Dear Accounts Team,\n\nThis is a friendly reminder regarding Invoice #INV-2026-088 which was issued on the 1st of the month.\n\nAccording to our records, the payment is scheduled for settlement this week. Please find the PDF statement attached for your reference.\n\nIf you require updated tax documentation or bank details, please let us know.\n\nThank you,\nFinance Operations | Vernika Business Suite`;
          break;

        case 'polish':
          if (composeBody) {
            body = `Dear Team,\n\n${composeBody.trim()}\n\nPlease feel free to reach out should you require any additional clarity or immediate support.\n\nBest regards,\n${userName}`;
          }
          break;

        case 'bulletize':
          if (composeBody) {
            const lines = composeBody.split('\n').filter(Boolean);
            body = `Executive Summary:\n` + lines.map(l => `• ${l.replace(/^[-•*]\s*/, '')}`).join('\n') + `\n\nNext Action Items:\n• Coordinate with department leads for immediate execution.`;
          }
          break;
      }

      if (subject) setComposeSubject(subject);
      if (body) setComposeBody(body);
      setIsGeneratingAi(false);
      setAiPromptOpen(false);
      showToast('Vernika AI Copilot drafted your message!');
    }, 600);
  };

  const handleCustomAiPrompt = () => {
    if (!aiCustomPrompt) return;
    setIsGeneratingAi(true);
    setTimeout(() => {
      setComposeSubject(`Re: ${aiCustomPrompt.slice(0, 40)}`);
      setComposeBody(`Hi,\n\nRegarding "${aiCustomPrompt}":\n\nI have reviewed the requirements in detail. We will proceed with the implementation, ensuring full compliance with our enterprise standards and real-time database synchronization.\n\nPlease find the relevant action items outlined above.\n\nBest regards,\n${user?.name || 'Administrator'}`);
      setIsGeneratingAi(false);
      setAiPromptOpen(false);
      setAiCustomPrompt('');
      showToast('AI content successfully generated!');
    }, 700);
  };

  const handleAddAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = '';
    if (!selectedFiles.length) return;
    try {
      const uploaded: Array<{ name: string; size: string; type: string; url?: string }> = [];
      for (const file of selectedFiles) {
        const record = await uploadFile(file, { category: 'mail_attachment', description: `Mail attachment: ${file.name}` });
        uploaded.push({ name: record.name, size: `${(record.size / (1024 * 1024)).toFixed(1)} MB`, type: record.type || 'FILE', url: record.url });
      }
      setComposeAttachments((prev) => [...prev, ...uploaded]);
      showToast(`Attached ${uploaded.length} file(s) securely`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not attach the selected file.');
    }
  };

  const handleSendReply = async () => {
    if (!replyText || !selectedMail) return;

    await sendEmail({
      fromName: user?.name || 'Administrator',
      fromEmail: user?.email || 'admin@vernika.io',
      fromAvatar: user?.avatar,
      toEmail: selectedMail.fromEmail || selectedMail.sender,
      subject: selectedMail.subject.startsWith('Re:') ? selectedMail.subject : `Re: ${selectedMail.subject}`,
      snippet: replyText.slice(0, 100),
      body: replyText,
      important: selectedMail.important,
      hasAttachments: false,
      category: selectedMail.category,
      folder: 'Sent',
      read: true,
      starred: false,
    });

    setReplyText('');
    setIsReplying(false);
    showToast('Reply sent successfully!');
  };

  const handleSendForward = async () => {
    if (!forwardRecipient || !selectedMail) return;

    const fwdBody = `${forwardNote ? forwardNote + '\n\n' : ''}---------- Forwarded message ---------\nFrom: ${selectedMail.fromName || selectedMail.sender || 'Colleague'} <${selectedMail.fromEmail || ''}>\nDate: ${selectedMail.date} at ${selectedMail.time || ''}\nSubject: ${selectedMail.subject}\nTo: ${selectedMail.toEmail || selectedMail.recipient || ''}\n\n${selectedMail.body}`;

    await sendEmail({
      fromName: user?.name || 'Administrator',
      fromEmail: user?.email || 'admin@vernika.io',
      fromAvatar: user?.avatar,
      toEmail: forwardRecipient,
      subject: selectedMail.subject.startsWith('Fwd:') ? selectedMail.subject : `Fwd: ${selectedMail.subject}`,
      snippet: fwdBody.slice(0, 120),
      body: fwdBody,
      important: selectedMail.important,
      hasAttachments: selectedMail.hasAttachments,
      attachments: selectedMail.attachments,
      category: selectedMail.category,
      folder: 'Sent',
      read: true,
      starred: false,
    });

    setIsForwarding(false);
    setForwardRecipient('');
    setForwardNote('');
    showToast(`Message forwarded to ${forwardRecipient}`);
  };

  const handleScheduleMeetingFromEmail = async () => {
    if (!selectedMail) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    await addCalendarEvent({
      title: `Sync: ${selectedMail.subject.replace(/^(Re:|Fwd:)\s*/i, '')}`,
      date: dateStr,
      time: '10:00 AM',
      startTime: '10:00',
      endTime: '10:45',
      type: 'Meeting',
      location: 'Vernika Virtual Video Room',
      attendees: [selectedMail.fromEmail || selectedMail.sender || 'colleague@vernika.io', user?.email || 'admin@vernika.io'],
      status: 'Confirmed'
    });

    showToast(`Calendar meeting created for ${dateStr} at 10:00 AM with ${selectedMail.fromName || selectedMail.sender || 'colleague'}!`);
    setActiveScreen('calendar');
  };

  const handlePrintEmail = () => {
    if (!selectedMail) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${selectedMail.subject} - Vernika Outlook Mail</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
              h1 { font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
              .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; line-height: 1.6; }
              .body { font-size: 14px; line-height: 1.8; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>${selectedMail.subject}</h1>
            <div class="meta">
              <strong>From:</strong> ${selectedMail.fromName} &lt;${selectedMail.fromEmail}&gt;<br/>
              <strong>To:</strong> ${selectedMail.toName || selectedMail.toEmail}<br/>
              <strong>Date:</strong> ${selectedMail.date} at ${selectedMail.time}<br/>
              <strong>Category:</strong> ${selectedMail.category || 'Work'}
            </div>
            <div class="body">${selectedMail.body}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Notification Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Vernika Outlook Mail
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Real-Time Cloud Sync
              </span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">Enterprise email suite with AI Copilot, scheduling, and multi-user live dispatch.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingDraftId(null);
              setComposeTo('');
              setComposeCc('');
              setComposeSubject('');
              setComposeBody('');
              setComposeAttachments([]);
              setIsComposeOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Mail</span>
          </button>
        </div>
      </div>

      {/* Main Mail Grid: 3-column Outlook layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[660px]">
        {/* Left Navigation Folders (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-xs transition-colors">
          <div className="space-y-5">
            {/* Quick Folders */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => { setActiveFolder('inbox'); setSelectedCategory(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFolder === 'inbox' && !selectedCategory
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                {inboxUnread > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeFolder === 'inbox' ? 'bg-white text-blue-700' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400'
                  }`}>
                    {inboxUnread}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveFolder('starred'); setSelectedCategory(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFolder === 'starred'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4" />
                  <span>Starred</span>
                </div>
                {starredCount > 0 && (
                  <span className="text-[10px] text-amber-500 dark:text-amber-400 font-bold">{starredCount}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveFolder('sent'); setSelectedCategory(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFolder === 'sent'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4" />
                  <span>Sent Items</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setActiveFolder('drafts'); setSelectedCategory(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFolder === 'drafts'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" />
                  <span>Drafts</span>
                </div>
                {draftsCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeFolder === 'drafts' ? 'bg-white text-blue-700' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {draftsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveFolder('archive'); setSelectedCategory(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFolder === 'archive'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4" />
                  <span>Archive</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setActiveFolder('trash'); setSelectedCategory(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFolder === 'trash'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4" />
                  <span>Deleted Items</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setActiveFolder('junk'); setSelectedCategory(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFolder === 'junk'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Junk / Spam</span>
                </div>
              </button>
            </div>

            {/* Outlook Categories */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 flex items-center justify-between">
                <span>Categories</span>
                <Tag className="w-3 h-3 text-slate-400" />
              </p>
              <div className="space-y-1">
                {['Work', 'Clients', 'Finance', 'Alerts', 'Primary'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        cat === 'Work' ? 'bg-emerald-500' :
                        cat === 'Clients' ? 'bg-purple-500' :
                        cat === 'Finance' ? 'bg-amber-500' :
                        cat === 'Alerts' ? 'bg-rose-500' : 'bg-blue-500'
                      }`} />
                      <span>{cat}</span>
                    </div>
                    {selectedCategory === cat && <Check className="w-3 h-3 text-blue-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Connected Mail Gateway Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 mt-4 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Vernika TLS 1.3 Active</span>
            </div>
            <p className="text-[10px] text-slate-500">Connected account: {currentUserEmail}</p>
          </div>
        </div>

        {/* Middle Message List (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xs transition-colors">
          {/* Focused vs Other Tabs (Classic Outlook) */}
          {activeFolder === 'inbox' && (
            <div className="flex items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 px-3 pt-2">
              <button
                type="button"
                onClick={() => setInboxTab('focused')}
                className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  inboxTab === 'focused'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Focused
              </button>
              <button
                type="button"
                onClick={() => setInboxTab('other')}
                className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  inboxTab === 'other'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Other
              </button>
            </div>
          )}

          {/* List Search & Quick Filters */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mail, sender, subject..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold custom-scrollbar">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('unread')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'unread' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setFilterType('starred')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'starred' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Starred
              </button>
              <button
                type="button"
                onClick={() => setFilterType('attachments')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'attachments' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Files
              </button>
              <button
                type="button"
                onClick={() => setFilterType('important')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'important' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Urgent
              </button>
            </div>
          </div>

          {/* List Entries */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Mail className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
                <p className="text-xs font-semibold text-slate-400">No emails in this view</p>
                <p className="text-[11px] text-slate-500">Check other folders or compose a new email.</p>
              </div>
            ) : (
              filteredEmails.map((mail) => {
                const isSelected = selectedMail?.id === mail.id;
                return (
                  <div
                    key={mail.id}
                    onClick={() => handleSelectMail(mail)}
                    className={`p-3.5 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    } ${!mail.read ? 'font-semibold' : 'opacity-90'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {!mail.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                        <span className="text-xs text-slate-900 dark:text-white truncate font-semibold">
                          {activeFolder === 'sent' ? `To: ${mail.toName || mail.toEmail}` : mail.fromName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{mail.time}</span>
                    </div>

                    <p className={`text-xs text-slate-800 dark:text-slate-200 truncate ${!mail.read ? 'font-bold text-slate-900 dark:text-white' : ''}`}>
                      {mail.subject}
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {mail.snippet}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        {mail.category && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            mail.category === 'Work' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' :
                            mail.category === 'Clients' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300' :
                            mail.category === 'Finance' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300' :
                            mail.category === 'Alerts' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300'
                          }`}>
                            {mail.category}
                          </span>
                        )}
                        {mail.important && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Urgent
                          </span>
                        )}
                        {mail.hasAttachments && (
                          <Paperclip className="w-3 h-3 text-slate-400" />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarEmail(mail.id);
                        }}
                        className="text-slate-400 hover:text-amber-500 p-1 cursor-pointer"
                        title="Star"
                      >
                        <Star className={`w-3.5 h-3.5 ${mail.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Reading & Reply Pane (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xs transition-colors">
          {selectedMail ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message Header & Action Toolbar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {selectedMail.subject}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedMail.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {selectedMail.category}
                        </span>
                      )}
                      {selectedMail.important && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          High Priority
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Toolbar Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleStarEmail(selectedMail.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Star / Unstar"
                    >
                      <Star className={`w-4 h-4 ${selectedMail.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        moveEmailToFolder(selectedMail.id, 'Archive');
                        showToast('Moved to Archive');
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintEmail}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Print / Save PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteEmail(selectedMail.id);
                        showToast('Message deleted');
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sender Profile Details */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedMail.fromAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={selectedMail.fromName}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedMail.fromName}</p>
                        <span className="text-[10px] text-slate-500">&lt;{selectedMail.fromEmail}&gt;</span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                        To: {selectedMail.toName || selectedMail.toEmail}
                        {selectedMail.ccEmails && selectedMail.ccEmails.length > 0 && ` | Cc: ${selectedMail.ccEmails.join(', ')}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{selectedMail.date}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{selectedMail.time}</p>
                  </div>
                </div>

                {/* Direct Action Chips: Schedule Meeting / Mark Unread */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleScheduleMeetingFromEmail}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule Meeting</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      markEmailRead(selectedMail.id, false);
                      showToast('Marked as unread');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Mark Unread</span>
                  </button>
                </div>
              </div>

              {/* Message Body Content */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                {selectedMail.body}

                {/* Attachments Section if present */}
                {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{selectedMail.attachments.length} Attachments</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedMail.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-xs text-slate-900 dark:text-white truncate font-medium">{att.name}</p>
                              <p className="text-[10px] text-slate-500">{att.size}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => showToast(`Downloaded ${att.name}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="Download Attachment"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Smart Quick Reply Suggestions */}
              <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] custom-scrollbar">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    AI Reply:
                  </span>
                  {[
                    "Sounds good, approved! Proceed with the plan.",
                    "Thank you, I will review and get back by EOD.",
                    "Could you send over the latest attachment?",
                    "Let's schedule a 15-minute sync to discuss."
                  ].map((smartReply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setReplyText(smartReply);
                        setIsReplying(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 whitespace-nowrap transition-all cursor-pointer"
                    >
                      {smartReply}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Reply / Forward Bar */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplying(!isReplying);
                      setIsForwarding(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      isReplying
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForwarding(!isForwarding);
                      setIsReplying(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      isForwarding
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Forward className="w-3.5 h-3.5" />
                    <span>Forward</span>
                  </button>
                </div>

                {/* Reply Form */}
                {isReplying && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${selectedMail.fromName}...`}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500 resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setIsReplying(false); setReplyText(''); }}
                        className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSendReply}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Forward Form */}
                {isForwarding && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <input
                      type="email"
                      required
                      value={forwardRecipient}
                      onChange={(e) => setForwardRecipient(e.target.value)}
                      placeholder="Forward to recipient@vernika.io..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                    />
                    <textarea
                      rows={2}
                      value={forwardNote}
                      onChange={(e) => setForwardNote(e.target.value)}
                      placeholder="Add an optional note to the forwarded message..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500 resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setIsForwarding(false); setForwardRecipient(''); setForwardNote(''); }}
                        className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSendForward}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
                      >
                        <Forward className="w-3.5 h-3.5" />
                        <span>Forward Message</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <Mail className="w-12 h-12 opacity-30 text-blue-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-400">Select a message to view</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Select any email from the message list to inspect threads, download attachments, or compose replies.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full Outlook Compose Modal with AI Copilot */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingDraftId ? 'Edit Saved Draft' : 'New Enterprise Message'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Assistant Quick Generator Banner */}
            <div className="p-3 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border-b border-slate-200/60 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Vernika AI Copilot</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiPromptOpen(!aiPromptOpen)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  {aiPromptOpen ? 'Hide Custom Prompt' : 'Custom AI Prompt'}
                </button>
              </div>

              {aiPromptOpen ? (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    placeholder="e.g., Ask client for sign-off on Q3 deliverables..."
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleCustomAiPrompt}
                    disabled={isGeneratingAi}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] custom-scrollbar pt-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleGenerateWithAiTemplate('project_update')}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 shrink-0 cursor-pointer"
                  >
                    🚀 Sprint Update
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateWithAiTemplate('client_proposal')}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 shrink-0 cursor-pointer"
                  >
                    💼 Client Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateWithAiTemplate('leave_request')}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 shrink-0 cursor-pointer"
                  >
                    🏖️ PTO Request
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateWithAiTemplate('invoice_followup')}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 shrink-0 cursor-pointer"
                  >
                    💰 Invoice Notice
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateWithAiTemplate('polish')}
                    className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold shrink-0 cursor-pointer"
                  >
                    ✨ Polish Draft
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSendCompose} className="p-4 space-y-3 text-xs">
              {/* To field with Employee Picker */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">To Recipient:</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setComposeTo(e.target.value);
                    }}
                    className="text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 text-slate-700 dark:text-slate-300"
                  >
                    <option value="">Quick select staff or team...</option>
                    <option value="all@vernika.io">All Staff (all@vernika.io)</option>
                    <option value="executives@vernika.io">Executive Leadership (executives@vernika.io)</option>
                    {Array.from(new Map((employees || []).filter(e => e && e.email).map(e => [e.email, e])).values()).map((emp) => (
                      <option key={`mail-emp-${emp.id || emp.email}`} value={emp.email}>
                        {emp.name} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="recipient@vernika.io or client email"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Cc Field */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Cc (optional):</label>
                <input
                  type="text"
                  value={composeCc}
                  onChange={(e) => setComposeCc(e.target.value)}
                  placeholder="Comma separated emails"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Subject:</label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Message subject line"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-semibold"
                />
              </div>

              {/* Category & Priority */}
              <div className="flex items-center gap-4 py-1">
                <div className="flex items-center gap-2">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">Category:</label>
                  <select
                    value={composeCategory}
                    onChange={(e: any) => setComposeCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="Work">Work</option>
                    <option value="Clients">Clients</option>
                    <option value="Finance">Finance</option>
                    <option value="Alerts">Alerts</option>
                    <option value="Primary">Primary</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={composePriority}
                    onChange={(e) => setComposePriority(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Mark High Priority</span>
                </label>
              </div>

              {/* Body */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Body:</label>
                <textarea
                  rows={7}
                  required
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Compose your email message..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* Attachments List */}
              {composeAttachments.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Attached Files:</p>
                  <div className="flex flex-wrap gap-2">
                    {composeAttachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-semibold text-slate-900 dark:text-white">{att.name}</span>
                        <span className="text-[10px] text-slate-400">({att.size})</span>
                        <button
                          type="button"
                          onClick={() => setComposeAttachments(composeAttachments.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-rose-500 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAddAttachment}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    <span>Attach Files</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 relative">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Discard
                  </button>

                  <div className="flex items-center">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-l-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowScheduleMenu(!showScheduleMenu)}
                      className="px-2.5 py-2 rounded-r-xl bg-blue-700 hover:bg-blue-600 text-white border-l border-blue-500 cursor-pointer"
                      title="Schedule Send Options"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Schedule Send Dropdown Menu */}
                  {showScheduleMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-2xl space-y-1 z-50">
                      <p className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Schedule Delivery</p>
                      <button
                        type="button"
                        onClick={(e) => handleSendCompose(e, 'Tomorrow 8:00 AM')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                      >
                        <span>Tomorrow Morning</span>
                        <span className="text-[10px] text-slate-400">8:00 AM</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSendCompose(e, 'Monday 9:00 AM')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                      >
                        <span>Next Monday</span>
                        <span className="text-[10px] text-slate-400">9:00 AM</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSendCompose(e, 'Custom Time')}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                      >
                        <span>Pick Date & Time</span>
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
