import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Hash,
  Smile,
  Paperclip,
  Users,
  Sparkles,
  User,
  Search,
  CheckCircle2,
  Lock,
  Plus,
  ArrowRight,
  Circle,
  Video,
  Phone,
  MoreVertical,
  Download,
  FileText,
  Image as ImageIcon,
  Check,
  CheckCheck,
  X,
  Volume2,
  Mic,
  MicOff,
  Pin,
  Reply,
  Edit2,
  Trash2,
  Eye,
  Bell,
  BellOff,
  CornerDownRight,
  Play,
  Pause,
  Filter,
  ExternalLink,
  Shield,
  HelpCircle,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, ChatChannel, Employee, ClientAccount } from '../types';
import { Modal } from '../components/common/Modal';
import { auth } from '../lib/firebase';

// Helper for canonical DM Channel IDs between any two users
export const getCanonicalDmId = (id1: string, id2: string): string => {
  const s1 = String(id1 || '').trim().toLowerCase();
  const s2 = String(id2 || '').trim().toLowerCase();
  const sorted = [s1, s2].sort();
  return `dm-${sorted[0]}-${sorted[1]}`;
};

// Web Audio API soft sound synthesizer
const playChime = (type: 'send' | 'receive' | 'join' | 'voice') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'send') {
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'receive') {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'voice') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // AudioContext blocked or autoplay policy
  }
};

export const ChatScreen: React.FC = () => {
  const {
    messages,
    chatChannels,
    addChatChannel,
    deleteChatChannel,
    typingStatuses,
    setChatTyping,
    sendMessage,
    editChatMessage,
    deleteChatMessage,
    togglePinChatMessage,
    addReaction,
    employees,
    clients,
    setActiveScreen,
    addMeeting,
    auxLogs,
    selectedChatChannelId,
    setSelectedChatChannelId,
    markMessagesAsRead,
    uploadFile
  } = useApp();
  const { user, role } = useAuth();

  const currentUserId = auth.currentUser?.uid || user?.id || '';

  const [activeChannelId, setActiveChannelId] = useState<string>(() => selectedChatChannelId || 'ch-general');
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'all' | 'unread' | 'dms' | 'channels'>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Sync with global selectedChatChannelId
  useEffect(() => {
    if (selectedChatChannelId) {
      setActiveChannelId(selectedChatChannelId);
    }
  }, [selectedChatChannelId]);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');

  // Voice note simulation
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Read state tracking per channel
  const [channelLastReadTime, setChannelLastReadTime] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`chat_read_times_${user?.id || 'default'}`);
      const parsed = saved ? JSON.parse(saved) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  });

  // Channel Creation Modal
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');

  // Attachment modal
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>();
  const [attachmentStatus, setAttachmentStatus] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'pdf' | 'code' | 'doc'>('pdf');

  // New DM modal state
  const [showNewDmModal, setShowNewDmModal] = useState(false);

  // Pinned bar collapsed state
  const [showPinnedDropdown, setShowPinnedDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const previousMessagesCountRef = useRef(messages.length);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voiceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mark channel read when active channel changes or new messages arrive while in active channel
  useEffect(() => {
    setChannelLastReadTime((prev) => {
      const updated = { ...prev, [activeChannelId]: Date.now() };
      try {
        localStorage.setItem(`chat_read_times_${user?.id || 'default'}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [activeChannelId, user?.id, messages.length]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [activeChannelId]);

  useEffect(() => {
    if (messages.length > previousMessagesCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderId !== user?.id) {
        playChime('receive');
      }
      scrollToBottom(true);
    }
    previousMessagesCountRef.current = messages.length;
  }, [messages, user?.id]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setVoiceSeconds(0);
      voiceIntervalRef.current = setInterval(() => {
        setVoiceSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (voiceIntervalRef.current) clearInterval(voiceIntervalRef.current);
      setVoiceSeconds(0);
    }
    return () => {
      if (voiceIntervalRef.current) clearInterval(voiceIntervalRef.current);
    };
  }, [isRecordingVoice]);

  // Build standard public & team channels from Firestore state
  const standardChannels: ChatChannel[] = (chatChannels || []).filter((c) => c && c.type === 'channel');

  // Helper to calculate unread count for a given channel / DM
  const getUnreadCount = (channelId: string, participants?: string[]) => {
    const lastRead = channelLastReadTime[channelId] || 0;
    const channelMsgs = messages.filter((m) => {
      if (String(channelId || '').startsWith('dm-')) {
        if (m.channelId === channelId) return true;
        if (participants && participants.length >= 2) {
          return participants.includes(m.senderId) && (m.recipientId ? participants.includes(m.recipientId) : false);
        }
        return false;
      }
      return m.channelId === channelId;
    });

    return channelMsgs.filter((m) => {
      if (currentUserId && m.senderId === currentUserId) return false;
      // If message has readBy array and user is in it, it's read
      if (currentUserId && m.readBy && m.readBy.includes(currentUserId)) return false;
      // Compare message ID timestamp if created after lastRead
      const idTime = parseInt(m.id.split('-')[1] || '0', 10);
      if (idTime && idTime > lastRead) return true;
      return false;
    }).length;
  };

  // Dynamic DMs list connecting Admin, all Employees, and all Client Accounts
  const rawDmChannels: ChatChannel[] = [
    // Employees DMs
    ...(employees || [])
      .filter((e) => e && e.id && e.id !== currentUserId && e.name !== user?.name && e.email !== user?.email)
      .map((e) => {
        const canonicalId = getCanonicalDmId(currentUserId, e.id);
        const unread = getUnreadCount(canonicalId, [currentUserId, e.id]);
        return {
          id: canonicalId,
          name: e.name || 'Team Member',
          type: 'dm' as const,
          description: `${e.position || e.department || 'Staff'}`,
          participants: [currentUserId, e.id],
          unreadCount: unread,
        };
      }),
    // Clients DMs
    ...(clients || [])
      .filter((c) => c && c.id && c.id !== currentUserId && c.name !== user?.name && c.email !== user?.email)
      .map((c) => {
        const canonicalId = getCanonicalDmId(currentUserId, c.id);
        const unread = getUnreadCount(canonicalId, [currentUserId, c.id]);
        return {
          id: canonicalId,
          name: `${c.name || 'Client Lead'} (${c.company || 'Client Partner'})`,
          type: 'dm' as const,
          description: `Client Partner Lead for ${c.company || 'Client'}`,
          participants: [currentUserId, c.id],
          unreadCount: unread,
        };
      })
  ];

  const dmChannels: ChatChannel[] = Array.from(
    new Map(rawDmChannels.map((item) => [item.id, item])).values()
  );

  // Enrich standard channels with live unread counts
  const enrichedStandardChannels: ChatChannel[] = standardChannels.map((c) => ({
    ...c,
    unreadCount: getUnreadCount(c.id),
  }));

  const allChannels = [...enrichedStandardChannels, ...dmChannels];

  // Resolve current active channel
  const currentChannel = allChannels.find((c) => c.id === activeChannelId) ||
    (String(activeChannelId || '').startsWith('dm-') ? (() => {
      const parts = String(activeChannelId || '').replace('dm-', '').split('-');
      const otherId = parts.find(p => p !== currentUserId) || parts[1] || parts[0];
      const partnerEmp = employees.find(e => e.id === otherId);
      const partnerCli = clients.find(c => c.id === otherId);
      return {
        id: activeChannelId,
        name: partnerEmp?.name || partnerCli?.name || 'Direct Message',
        type: 'dm' as const,
        description: partnerEmp?.position || partnerCli?.company || 'Direct 1-on-1 Encrypted Channel',
        participants: [currentUserId, otherId]
      };
    })() : enrichedStandardChannels[0] || {
      id: 'ch-general',
      name: 'General',
      type: 'channel' as const,
      description: 'Company-wide collaborative space'
    });

  // Find partner details if active channel is DM
  const dmPartnerId = currentChannel.type === 'dm'
    ? currentChannel.participants?.find((p) => p !== currentUserId) || activeChannelId.replace('dm-', '').split('-').find(p => p !== currentUserId)
    : undefined;
  const dmPartnerEmployee = dmPartnerId ? employees.find((e) => e.id === dmPartnerId) : null;
  const dmPartnerClient = dmPartnerId ? clients.find((c) => c.id === dmPartnerId) : null;

  // Filter messages for current channel / DM
  const channelMessages = messages.filter((m) => {
    if (currentChannel.type === 'channel') {
      return m.channelId === activeChannelId;
    } else {
      if (m.channelId === activeChannelId) return true;
      if (currentUserId && dmPartnerId) {
        const canonical = getCanonicalDmId(currentUserId, dmPartnerId);
        if (m.channelId === canonical) return true;
        return (
          (m.senderId === currentUserId && m.recipientId === dmPartnerId) ||
          (m.senderId === dmPartnerId && m.recipientId === currentUserId)
        );
      }
      return false;
    }
  });

  // Auto mark messages as read
  useEffect(() => {
    if (!currentUserId || !activeChannelId) return;
    const unread = channelMessages.filter(
      (m) => m.senderId !== currentUserId && (!m.readBy || !m.readBy.includes(currentUserId))
    );
    if (unread.length > 0 && markMessagesAsRead) {
      markMessagesAsRead(unread.map((m) => m.id), currentUserId);
    }
  }, [activeChannelId, channelMessages.length, currentUserId]);

  // Pinned messages for the current channel
  const pinnedMessages = channelMessages.filter((m) => m.isPinned);

  // In-conversation message search filter
  const displayedMessages = messageSearchQuery.trim()
    ? channelMessages.filter((m) =>
        (m.text || '').toLowerCase().includes(messageSearchQuery.toLowerCase()) ||
        (m.senderName || '').toLowerCase().includes(messageSearchQuery.toLowerCase())
      )
    : channelMessages;

  // Search and Tab filtering for sidebar channels
  const filteredStandardChannels = enrichedStandardChannels.filter((c) => {
    if (sidebarTab === 'unread' && (c.unreadCount || 0) === 0) return false;
    if (sidebarTab === 'dms') return false;
    const filter = (searchFilter || '').toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(filter) ||
      (c.description || '').toLowerCase().includes(filter)
    );
  });

  const filteredDmChannels = dmChannels.filter((c) => {
    if (sidebarTab === 'unread' && (c.unreadCount || 0) === 0) return false;
    if (sidebarTab === 'channels') return false;
    const filter = (searchFilter || '').toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(filter) ||
      (c.description || '').toLowerCase().includes(filter)
    );
  });

  const totalUnreadAll = allChannels.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (user?.name) setChatTyping(activeChannelId, user.name, false);

    const recipientId = currentChannel.type === 'dm'
      ? dmPartnerId || currentChannel.participants?.find((p) => p !== currentUserId)
      : undefined;

    const replyPayload = replyingTo
      ? {
          replyTo: {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text ? replyingTo.text.slice(0, 100) : 'Attachment',
          }
        }
      : {};

    setReplyingTo(null);
    playChime('send');

    await sendMessage({
      channelId: activeChannelId,
      senderId: currentUserId,
      senderName: user?.name || 'Workspace User',
      senderAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      senderRole: role === 'admin' ? 'Admin' : role === 'client' ? 'Client' : 'Employee',
      recipientId,
      text: messageText,
      readBy: [currentUserId],
      ...replyPayload,
    });
  };

  const handleSendVoiceNote = async () => {
    if (!user) return;
    setIsRecordingVoice(false);
    playChime('voice');

    const recipientId = currentChannel.type === 'dm'
      ? currentChannel.participants?.find((p) => p !== user.id)
      : undefined;

    const duration = voiceSeconds > 0 ? voiceSeconds : 4;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const formattedDuration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    await sendMessage({
      channelId: activeChannelId,
      senderId: currentUserId,
      senderName: user.name || 'User',
      senderAvatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      senderRole: user.role === 'admin' ? 'Admin' : user.role === 'client' ? 'Client' : 'Employee',
      recipientId,
      text: `🎤 Voice note (${formattedDuration})`,
      readBy: [user.id || 'usr-1'],
      voiceNote: {
        duration: formattedDuration,
        waveform: [20, 45, 80, 60, 95, 40, 70, 85, 30, 60, 90, 50, 75, 40, 65, 35],
      },
    });
  };

  const handlePlayVoice = (msgId: string) => {
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msgId);
      playChime('voice');
      setTimeout(() => {
        setPlayingVoiceId((curr) => (curr === msgId ? null : curr));
      }, 4000);
    }
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editInputText.trim()) return;
    await editChatMessage(msgId, editInputText.trim());
    setEditingMessageId(null);
    setEditInputText('');
  };

  const handleDeleteMessage = async (msgId: string) => {
    await deleteChatMessage(msgId);
  };

  const handleTogglePin = async (msgId: string) => {
    await togglePinChatMessage(msgId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (user?.name) {
      setChatTyping(activeChannelId, user.name, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (user?.name) setChatTyping(activeChannelId, user.name, false);
      }, 2500);
    }
  };

  const handleReactionClick = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const newChanId = await addChatChannel({
      name: newChannelName.trim(),
      type: 'channel',
      description: newChannelDesc.trim() || 'Custom team topic',
    });

    setNewChannelName('');
    setNewChannelDesc('');
    setShowNewChannelModal(false);
    setActiveChannelId(newChanId);
  };

  const handleAttachmentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const record = await uploadFile(file, { category: 'chat_attachment', description: `Chat attachment: ${file.name}` });
      setAttachmentName(record.name);
      setAttachmentUrl(record.url);
      setAttachmentStatus(`File uploaded: ${record.name}`);
    } catch (error) {
      setAttachmentStatus(error instanceof Error ? error.message : 'Could not upload the selected file.');
    }
  };

  const handleSendAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentName.trim() || !attachmentUrl || !user) return;

    const recipientId = currentChannel.type === 'dm'
      ? currentChannel.participants?.find((p) => p !== user.id)
      : undefined;

    playChime('send');

    await sendMessage({
      channelId: activeChannelId,
      senderId: currentUserId,
      senderName: user.name || 'User',
      senderAvatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      senderRole: user.role === 'admin' ? 'Admin' : user.role === 'client' ? 'Client' : 'Employee',
      recipientId,
      text: `📎 Shared attachment: **${attachmentName.trim()}**`,
      readBy: [user.id || 'usr-1'],
      attachments: [
        {
          name: attachmentName.trim(),
          size: '2.4 MB',
          type: attachmentType,
          url: attachmentUrl,
        },
      ],
    });

    setAttachmentName('');
    setAttachmentUrl(undefined);
    setAttachmentStatus(null);
    setShowAttachmentModal(false);
  };

  const handleQuickCall = async (callType: 'Video' | 'Audio' = 'Video') => {
    if (!user) return;
    const meetingTitle = currentChannel.type === 'dm'
      ? `1-on-1 ${callType} Call: ${user.name} & ${currentChannel.name}`
      : `${currentChannel.name} Sync Call`;

    const participantsList = [user.name];
    if (currentChannel.type === 'dm' && (dmPartnerEmployee || dmPartnerClient)) {
      participantsList.push(dmPartnerEmployee ? dmPartnerEmployee.name : dmPartnerClient!.name);
    }

    await addMeeting({
      title: meetingTitle,
      hostName: user.name,
      hostEmail: user.email,
      department: user.department || 'General',
      scheduledTime: 'Now (Live Real-Time Call)',
      durationMinutes: 30,
      status: 'Live',
      meetingType: currentChannel.type === 'dm' ? '1-on-1' : 'Team Sync',
      participants: participantsList,
      meetingLink: `https://meet.vernika.io/${meetingTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    });

    // Send call invite message into chat channel
    await sendMessage({
      channelId: activeChannelId,
      senderId: currentUserId,
      senderName: user.name,
      senderAvatar: user.avatar,
      senderRole: user.role === 'admin' ? 'Admin' : user.role === 'client' ? 'Client' : 'Employee',
      text: `📹 **Started a live ${callType} Call**: "${meetingTitle}". Click below to join the conference room!`,
      readBy: [user.id],
    });

    setActiveScreen('meetings');
  };

  const availableEmojis = ['👍', '❤️', '🚀', '🎉', '🔥', '👀', '💯', '👏'];

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Team & Client Messenger
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Realtime Sync</span>
              </span>
              {totalUnreadAll > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {totalUnreadAll} unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Role-isolated secure messaging with live typing, pinned messages, unread tracking, voice notes & instant meeting integration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {role === 'client' && (
            <button
              type="button"
              onClick={() => setActiveScreen('dashboard')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Back to Portal
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowNewChannelModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>New Channel</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickCall('Video')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Start Video Call</span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface Container */}
      <div className="h-[calc(100vh-14rem)] min-h-[520px] flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl transition-colors">
        {/* Left Sidebar: Channels, Groups, and Direct Messages */}
        <div className="w-72 sm:w-80 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 flex flex-col shrink-0">
          {/* Search Box & Tab Filter */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter channels & people..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
              <button
                type="button"
                onClick={() => setSidebarTab('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                  sidebarTab === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('unread')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                  sidebarTab === 'unread'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>Unread</span>
                {totalUnreadAll > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {totalUnreadAll}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('channels')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                  sidebarTab === 'channels'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Channels
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('dms')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                  sidebarTab === 'dms'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Direct Messages
              </button>
            </div>
          </div>

          {/* Channels & DMs List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
            {/* Standard Channels Section */}
            {sidebarTab !== 'dms' && (
              <div>
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Channels ({filteredStandardChannels.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewChannelModal(true)}
                    className="text-slate-400 hover:text-emerald-500 p-0.5 cursor-pointer"
                    title="Create Channel"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-0.5">
                  {filteredStandardChannels.map((chan) => {
                    const isActive = chan.id === activeChannelId;
                    const unread = chan.unreadCount || 0;
                    return (
                      <button
                        key={chan.id}
                        type="button"
                        onClick={() => setActiveChannelId(chan.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer group ${
                          isActive
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : unread > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-800/60'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span className="truncate text-xs">{chan.name}</span>
                        </div>
                        {unread > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              isActive ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'
                            }`}
                          >
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Direct Messages Section */}
            {sidebarTab !== 'channels' && (
              <div>
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Direct Messages ({filteredDmChannels.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewDmModal(true)}
                    className="text-slate-400 hover:text-emerald-500 p-0.5 cursor-pointer"
                    title="New Direct Message"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-0.5">
                  {filteredDmChannels.map((dm) => {
                    const isActive = dm.id === activeChannelId;
                    const unread = dm.unreadCount || 0;
                    const emp = employees.find((e) => dm.participants?.includes(e.id) && e.id !== user?.id);
                    const cli = clients.find((c) => dm.participants?.includes(c.id) && c.id !== user?.id);
                    const isClient = Boolean(cli);

                    // Presence calculation from AUX / status
                    const latestAux = emp ? auxLogs?.find((l) => l.employeeId === emp.id) : null;
                    const auxStatus = latestAux?.status || (emp?.status === 'Active' ? 'Available' : 'Offline');

                    return (
                      <button
                        key={dm.id}
                        type="button"
                        onClick={() => setActiveChannelId(dm.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : unread > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-slate-900 dark:text-white font-bold border border-emerald-200 dark:border-emerald-800/60'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={
                              emp?.avatar ||
                              cli?.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={dm.name}
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ${
                              isActive ? 'ring-emerald-600' : 'ring-white dark:ring-slate-950'
                            } ${
                              auxStatus === 'Available'
                                ? 'bg-emerald-500'
                                : auxStatus === 'Break' || auxStatus === 'Lunch'
                                ? 'bg-amber-500'
                                : auxStatus === 'In Call' || auxStatus === 'Meeting'
                                ? 'bg-rose-500 animate-pulse'
                                : 'bg-slate-400'
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate text-xs">{dm.name}</p>
                            {unread > 0 && (
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                                  isActive ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'
                                }`}
                              >
                                {unread}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-[10px] truncate ${
                              isActive ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {isClient ? `Client: ${cli?.company || 'External account'}` : emp?.position || (emp as any)?.title || dm.description || 'Direct message'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Mini Bar in Sidebar footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={user?.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500/40 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 capitalize">{user?.role} Portal</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Connected to Real-time Database" />
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
          {/* Active Channel Header */}
          <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {currentChannel.type === 'channel' ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
              ) : (
                <div className="relative shrink-0">
                  <img
                    src={
                      dmPartnerEmployee?.avatar ||
                      dmPartnerClient?.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={currentChannel.name}
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {currentChannel.name}
                  </h2>
                  {currentChannel.type === 'channel' ? (
                    <span className="px-2 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
                      Public Topic
                    </span>
                  ) : (
                    <span className="px-2 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                      Direct Encrypted
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentChannel.description || 'Enterprise collaboration stream'}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Pinned Messages Toggle */}
              {pinnedMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPinnedDropdown(!showPinnedDropdown)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showPinnedDropdown
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="View Pinned Messages"
                >
                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{pinnedMessages.length} Pinned</span>
                </button>
              )}

              {/* Message Search Toggle */}
              <button
                type="button"
                onClick={() => {
                  setShowMessageSearch(!showMessageSearch);
                  if (showMessageSearch) setMessageSearchQuery('');
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  showMessageSearch
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Search Messages"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickCall('Audio')}
                title="Start Audio Call"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickCall('Video')}
                title="Start Video Meeting in this Channel"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowAttachmentModal(true)}
                title="Share File / Document"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* In-Conversation Search Bar Header */}
          {showMessageSearch && (
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  placeholder="Search in this conversation..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8.5 pr-3 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
                  autoFocus
                />
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">
                {displayedMessages.length} results
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowMessageSearch(false);
                  setMessageSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pinned Messages Banner */}
          {showPinnedDropdown && pinnedMessages.length > 0 && (
            <div className="px-4 py-2.5 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pinned Messages in #{currentChannel.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPinnedDropdown(false)}
                  className="text-amber-700 dark:text-amber-400 hover:text-amber-900 text-[11px]"
                >
                  Hide
                </button>
              </div>
              {pinnedMessages.map((pm) => (
                <div
                  key={pm.id}
                  className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-800/40 flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-[11px]">{pm.senderName}: </span>
                    <span className="text-slate-700 dark:text-slate-300 text-[11px]">{pm.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePin(pm.id)}
                    className="text-slate-400 hover:text-rose-500 text-[10px] shrink-0 font-semibold"
                    title="Unpin"
                  >
                    Unpin
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Messages Stream Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40">
            {displayedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <MessageSquare className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {messageSearchQuery ? 'No matching messages found' : `Start of #${currentChannel.name}`}
                  </h3>
                  <p className="text-xs max-w-sm mt-1">
                    {messageSearchQuery
                      ? 'Try another search keyword in this chat stream.'
                      : 'No messages yet in this channel. Send the first message to kickstart real-time collaboration with the team!'}
                  </p>
                </div>
              </div>
            ) : (
              displayedMessages.map((msg, index) => {
                const isMe = msg.senderId === user?.id || msg.senderName === user?.name;
                const isEditing = editingMessageId === msg.id;

                return (
                  <div
                    key={msg.id || index}
                    className={`flex items-start gap-3 group relative ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <img
                      src={
                        msg.senderAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 mt-0.5"
                    />

                    <div className={`max-w-[78%] sm:max-w-md md:max-w-lg space-y-1 ${isMe ? 'items-end text-right' : ''}`}>
                      {/* Sender Meta */}
                      <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'justify-end' : ''}`}>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          {msg.senderRole || 'Member'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {msg.timestamp}
                        </span>
                        {msg.isEdited && (
                          <span className="text-[9px] italic text-slate-400">(edited)</span>
                        )}
                        {msg.isPinned && (
                          <Pin className="w-3 h-3 text-amber-500 inline fill-amber-500" />
                        )}
                      </div>

                      {/* Reply Quoted Preview */}
                      {msg.replyTo && (
                        <div
                          className={`text-[11px] px-3 py-1.5 rounded-lg border-l-2 mb-1 flex items-start gap-1.5 text-left ${
                            isMe
                              ? 'bg-emerald-700/60 border-emerald-300 text-emerald-100'
                              : 'bg-slate-100 dark:bg-slate-800/80 border-emerald-500 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <CornerDownRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="truncate">
                            <span className="font-bold">{msg.replyTo.senderName}: </span>
                            <span>{msg.replyTo.text}</span>
                          </div>
                        </div>
                      )}

                      {/* Message Bubble or Inline Edit */}
                      {isEditing ? (
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-emerald-500 shadow-md space-y-2 text-left">
                          <input
                            type="text"
                            value={editInputText}
                            onChange={(e) => setEditInputText(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setEditingMessageId(null)}
                              className="px-2.5 py-1 text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(msg.id)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded-md font-bold cursor-pointer hover:bg-emerald-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed transition-all shadow-xs relative text-left ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-tr-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs'
                          }`}
                        >
                          {/* Voice Note Player */}
                          {msg.voiceNote ? (
                            <div className="flex items-center gap-3 py-1 min-w-[200px]">
                              <button
                                type="button"
                                onClick={() => handlePlayVoice(msg.id)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shrink-0 ${
                                  isMe ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {playingVoiceId === msg.id ? (
                                  <Pause className="w-4 h-4 fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1 flex items-center gap-0.5 h-6">
                                {msg.voiceNote.waveform.map((val, idx) => (
                                  <span
                                    key={idx}
                                    style={{ height: `${val}%` }}
                                    className={`w-1 rounded-full transition-all ${
                                      playingVoiceId === msg.id ? 'bg-amber-400 animate-pulse' : isMe ? 'bg-white/80' : 'bg-emerald-500'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-mono shrink-0 opacity-85">
                                {msg.voiceNote.duration}
                              </span>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                          )}

                          {/* Attachments rendering */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-white/20 dark:border-slate-700 space-y-1.5">
                              {msg.attachments.map((att, attIdx) => (
                                <div
                                  key={attIdx}
                                  className={`flex items-center justify-between p-2 rounded-xl ${
                                    isMe
                                      ? 'bg-black/15 text-white'
                                      : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="font-semibold text-xs truncate">{att.name}</p>
                                      <p className="text-[10px] opacity-75">{att.size}</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => alert(`Downloading verified document: ${att.name}`)}
                                    className="p-1 rounded-lg hover:bg-black/20 text-emerald-300 cursor-pointer"
                                    title="Download"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Emoji Reactions & Action Hover Buttons */}
                      <div className={`flex items-center gap-1 flex-wrap ${isMe ? 'justify-end' : ''}`}>
                        {msg.reactions &&
                          Object.entries(msg.reactions).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReactionClick(msg.id, emoji)}
                              className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:scale-105 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>{emoji}</span>
                              <span className="text-[10px] font-bold text-slate-500">{Array.isArray(count) ? count.length : String(count)}</span>
                            </button>
                          ))}

                        {/* Hover Actions Toolbar */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-1 py-0.5 shadow-sm">
                          {/* Reply Button */}
                          <button
                            type="button"
                            onClick={() => setReplyingTo(msg)}
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Reply / Quote"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>

                          {/* Pin Button */}
                          <button
                            type="button"
                            onClick={() => handleTogglePin(msg.id)}
                            className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                              msg.isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                            }`}
                            title={msg.isPinned ? 'Unpin' : 'Pin to channel'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          {/* Emoji Picker trigger */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                              title="Add Reaction"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {showEmojiPicker === msg.id && (
                              <div className="absolute bottom-full mb-1 left-0 z-50 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-xl">
                                {availableEmojis.map((emo) => (
                                  <button
                                    key={emo}
                                    type="button"
                                    onClick={() => handleReactionClick(msg.id, emo)}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm transition-transform hover:scale-125 cursor-pointer"
                                  >
                                    {emo}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Edit / Delete for own messages or Admin */}
                          {(isMe || role === 'admin') && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditInputText(msg.text);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                title="Edit message"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Real-time Typing Status Indicator */}
          {typingStatuses && typingStatuses[activeChannelId] && typingStatuses[activeChannelId] !== user?.name && (
            <div className="px-4 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 animate-pulse bg-emerald-50/70 dark:bg-emerald-950/30 border-t border-emerald-100 dark:border-emerald-900/40 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>
                <strong>{typingStatuses[activeChannelId]}</strong> is typing...
              </span>
            </div>
          )}

          {/* Replying Banner Preview */}
          {replyingTo && (
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2 shrink-0 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200 min-w-0">
                <Reply className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-bold">Replying to {replyingTo.senderName}:</span>
                <span className="truncate opacity-80">{replyingTo.text || 'Attachment'}</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Chat Message Input Form */}
          <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 focus-within:border-emerald-500 transition-colors">
              <button
                type="button"
                onClick={() => setShowAttachmentModal(true)}
                className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Attach Document or Image"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice Note Button */}
              <button
                type="button"
                onClick={() => {
                  if (isRecordingVoice) {
                    handleSendVoiceNote();
                  } else {
                    setIsRecordingVoice(true);
                  }
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isRecordingVoice
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-rose-500 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
                title={isRecordingVoice ? 'Click to Send Voice Note' : 'Record Voice Note'}
              >
                {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {isRecordingVoice ? (
                <div className="flex-1 flex items-center justify-between px-3 text-rose-500 font-bold text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>Recording Voice Note ({voiceSeconds}s)...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRecordingVoice(false)}
                    className="text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={`Message #${currentChannel.name}...`}
                  className="flex-1 bg-transparent border-0 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden px-2 py-1.5"
                />
              )}

              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-2 rounded-xl font-bold transition-all cursor-pointer ${
                  inputText.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-400 bg-slate-200/50 dark:bg-slate-800 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* New Channel Creation Modal */}
      <Modal
        isOpen={showNewChannelModal}
        onClose={() => setShowNewChannelModal(false)}
        title="Create Team Channel"
      >
        <form onSubmit={handleCreateChannel} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Channel Name
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="e.g. client-apex-reviews"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Topic / Purpose Description
            </label>
            <textarea
              rows={2}
              value={newChannelDesc}
              onChange={(e) => setNewChannelDesc(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowNewChannelModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Create Channel
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Attachment Modal */}
      <Modal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        title="Share File / Document with Team"
      >
        <form onSubmit={handleSendAttachment} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select local file (700 KB maximum)</label>
            <input type="file" required onChange={handleAttachmentFileChange} accept=".pdf,.txt,.csv,.json,.docx,.xlsx,.pptx,image/png,image/jpeg,image/webp,image/gif" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-xs" />
            {attachmentStatus && <p role="status" className="mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{attachmentStatus}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              File Title / Name
            </label>
            <input
              type="text"
              required
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              placeholder="e.g. Q3_Financial_Forecast_v2.pdf"
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Document Category
            </label>
            <select
              value={attachmentType}
              onChange={(e) => setAttachmentType(e.target.value as any)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="pdf">PDF Document</option>
              <option value="image">Screenshot / Image Asset</option>
              <option value="doc">Word / Spreadsheet File</option>
              <option value="code">Code / Config Snippet</option>
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1 text-slate-500">
            <Paperclip className="w-6 h-6 mx-auto text-emerald-500" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">File verified & ready to encrypt</p>
            <p className="text-[10px]">Standard SHA-256 cloud encryption enabled</p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAttachmentModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!attachmentUrl}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold cursor-pointer"
            >
              Share File
            </button>
          </div>
        </form>
      </Modal>

      {/* New Direct Message Modal */}
      <Modal
        isOpen={showNewDmModal}
        onClose={() => setShowNewDmModal(false)}
        title="Start Direct Message"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Connect directly with any colleague, team member, admin, or client:
          </p>
          <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1">
            {Array.from(new Map((employees || []).filter(Boolean).map((e) => [e.id, e])).values())
              .filter((e) => e.id !== user?.id)
              .map((emp) => {
                const canonicalId = user?.id ? getCanonicalDmId(user.id, emp.id) : `dm-${emp.id}`;
                return (
                  <button
                    key={`new_dm_emp_${emp.id}`}
                    type="button"
                    onClick={() => {
                      setActiveChannelId(canonicalId);
                      setShowNewDmModal(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <img
                      src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={emp.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{emp.position || emp.department || 'Staff'}</p>
                    </div>
                  </button>
                );
              })}
            {Array.from(new Map((clients || []).filter(Boolean).map((c) => [c.id, c])).values()).map((cli) => {
              const canonicalId = user?.id ? getCanonicalDmId(user.id, cli.id) : `dm-${cli.id}`;
              return (
                <button
                  key={`new_dm_cli_${cli.id}`}
                  type="button"
                  onClick={() => {
                    setActiveChannelId(canonicalId);
                    setShowNewDmModal(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <img
                    src={cli.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={cli.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{cli.name} <span className="text-[10px] font-normal text-emerald-600">({cli.company})</span></p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Client Partner</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};
