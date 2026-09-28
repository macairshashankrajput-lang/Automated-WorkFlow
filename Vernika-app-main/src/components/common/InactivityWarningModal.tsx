import React from 'react';
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const InactivityWarningModal: React.FC = () => {
  const { showInactivityWarning, inactivitySecondsLeft, extendSession, logout } = useAuth();

  if (!showInactivityWarning) return null;

  const minutes = Math.floor(inactivitySecondsLeft / 60);
  const seconds = inactivitySecondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-6 text-center relative overflow-hidden">
        {/* Subtle top indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-pulse" />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Session Expiring Soon
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
            You have been inactive for a while. For enterprise workspace data protection, your session will automatically terminate in:
          </p>
        </div>

        {/* Live Countdown Display */}
        <div className="py-4 px-6 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-2xl inline-flex items-center justify-center gap-3">
          <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="text-3xl font-mono font-black text-amber-700 dark:text-amber-300 tracking-wider">
            {formattedTime}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={extendSession}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Stay Logged In & Extend Session</span>
          </button>
          
          <button
            type="button"
            onClick={() => logout()}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
