import React, { useEffect, useMemo, useState } from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';

interface RealtimeNotificationToastProps {
  onOpen: (screen?: string) => void;
}

export const RealtimeNotificationToast: React.FC<RealtimeNotificationToastProps> = ({ onOpen }) => {
  const { notifications } = useApp();
  const { user } = useAuth();
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());

  const visibleNotifications = useMemo(() => notifications.filter((item) => {
    if (!item || !item.id || item.read) return false;
    if (item.targetUserId && item.targetUserId !== 'all' && item.targetUserId !== user?.id && item.targetUserId !== user?.email) return false;
    if (item.targetRole && item.targetRole !== 'all' && item.targetRole !== user?.role) return false;
    if (item.targetDepartment && item.targetDepartment !== 'All' && item.targetDepartment !== user?.department) return false;
    return item.senderId !== user?.id;
  }), [notifications, user?.department, user?.email, user?.id, user?.role]);

  useEffect(() => {
    const newest = [...visibleNotifications].sort((a, b) => {
      const aTime = Date.parse(a.timestamp || '') || Date.parse(a.time || '') || 0;
      const bTime = Date.parse(b.timestamp || '') || Date.parse(b.time || '') || 0;
      return bTime - aTime;
    })[0];
    if (!newest || seenIds.has(newest.id)) return;
    setSeenIds((previous) => new Set(previous).add(newest.id));
    setToast(newest);
    const timer = window.setTimeout(() => setToast((current) => current?.id === newest.id ? null : current), 7000);
    return () => window.clearTimeout(timer);
  }, [seenIds, visibleNotifications]);

  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed top-20 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-blue-400/40 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-md">
      <div className="pointer-events-auto flex items-start gap-3">
        <div className="rounded-xl bg-blue-500/20 p-2 text-blue-300"><Bell className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Live workspace update</p>
          <h3 className="mt-1 truncate text-sm font-bold">{toast.title}</h3>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-300">{toast.description || toast.message || 'A new update is available.'}</p>
          <button type="button" onClick={() => { onOpen(toast.actionUrl || toast.linkScreen); setToast(null); }} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold hover:bg-blue-500">
            Open update <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
};
