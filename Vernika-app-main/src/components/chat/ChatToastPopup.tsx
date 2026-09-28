import React, { useEffect, useState } from 'react';
import { MessageSquare, X, ArrowRight, CornerDownRight } from 'lucide-react';
import { ChatMessage } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export interface ChatToastProps {
  onOpenChat: (channelId: string) => void;
}

export const ChatToastPopup: React.FC<ChatToastProps> = ({ onOpenChat }) => {
  const { messages, chatChannels, activeScreen } = useApp();
  const { user } = useAuth();
  const [incomingToast, setIncomingToast] = useState<{
    msg: ChatMessage;
    channelTitle: string;
  } | null>(null);

  const [lastProcessedMsgId, setLastProcessedMsgId] = useState<string | null>(() => {
    if (messages && messages.length > 0) {
      return messages[messages.length - 1].id;
    }
    return null;
  });

  useEffect(() => {
    if (messages.length === 0) return;
    const latestMsg = [...messages]
      .filter((message) => message && message.id)
      .sort((a, b) => {
        const aTime = Date.parse(a.createdAt || a.timestamp || '') || 0;
        const bTime = Date.parse(b.createdAt || b.timestamp || '') || 0;
        return bTime - aTime;
      })[0];
    if (!latestMsg || !latestMsg.id) return;
    if (latestMsg.id === lastProcessedMsgId) return;

    // Check if this message was sent by the current user
    if (user && latestMsg.senderId === user.id) {
      setLastProcessedMsgId(latestMsg.id);
      return;
    }

    // Check if message is intended for this user:
    // If DM, recipientId must match or user must be in channel
    if (latestMsg.recipientId && user && latestMsg.recipientId !== user.id) {
      setLastProcessedMsgId(latestMsg.id);
      return;
    }

    // Find channel title
    let title = 'Team Chat';
    if (String(latestMsg.channelId || '').startsWith('dm_')) {
      title = `Direct Message`;
    } else {
      const ch = chatChannels.find((c) => c.id === latestMsg.channelId);
      if (ch) title = `#${ch.name}`;
    }

    // Show popup
    setIncomingToast({
      msg: latestMsg,
      channelTitle: title,
    });
    setLastProcessedMsgId(latestMsg.id);

    // Auto dismiss after 6s
    const timer = setTimeout(() => {
      setIncomingToast((prev) => (prev?.msg.id === latestMsg.id ? null : prev));
    }, 6000);

    return () => clearTimeout(timer);
  }, [messages, user?.id, chatChannels, lastProcessedMsgId]);

  if (!incomingToast) return null;

  const { msg, channelTitle } = incomingToast;

  return (
    <div className="pointer-events-none fixed top-4 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-96 animate-in slide-in-from-top-4 fade-in duration-200">
      <div className="pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md rounded-2xl p-3.5 text-white flex items-start gap-3 relative overflow-hidden group">
        {/* Accent strip */}
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl" />

        {/* Sender Avatar */}
        <img
          src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
          alt={msg.senderName}
          className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/30 shrink-0 mt-0.5"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-bold text-emerald-400 truncate">{msg.senderName}</span>
              <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700/60 truncate">
                {channelTitle}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">{msg.timestamp || 'Now'}</span>
          </div>

          <p className="text-xs text-slate-200 mt-1 line-clamp-2 leading-relaxed">
            {msg.text || (msg.attachments && msg.attachments.length > 0 ? `📎 ${msg.attachments[0].name}` : 'New message')}
          </p>

          {/* Quick Action Button */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenChat(msg.channelId);
                setIncomingToast(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>Reply in Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setIncomingToast(null)}
              className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIncomingToast(null)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close message popup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
