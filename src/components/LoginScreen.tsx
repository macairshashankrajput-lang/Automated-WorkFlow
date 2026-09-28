import React, { useState } from 'react';
import {
  Layers,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Key,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  hybridDB,
  UserAccount,
  DEFAULT_PORTFOLIO_VISITOR_PASSWORD,
} from '../services/hybridDatabase';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('portfolio');
  const [password, setPassword] = useState(DEFAULT_PORTFOLIO_VISITOR_PASSWORD);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const authenticatedUser = hybridDB.authenticate(username, password);
    if (authenticatedUser) {
      onLoginSuccess(authenticatedUser);
    } else {
      setErrorMsg('Invalid username or password. Please check your credentials.');
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    const authenticatedUser = hybridDB.authenticate(u, p);
    if (authenticatedUser) {
      onLoginSuccess(authenticatedUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 mx-auto shadow-xl shadow-indigo-600/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Layers className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-display">
            Automated Workflow
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise Studio Dashboard & Portfolio Application Hub
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Lock className="h-3.5 w-3.5 text-indigo-400" /> Account Sign In
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Unified Auth
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              Sign In to Workspace <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Preset Credentials Box */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Preset Credentials:
            </div>

            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('portfolio', DEFAULT_PORTFOLIO_VISITOR_PASSWORD)}
                className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between transition-all"
              >
                <div>
                  <div className="font-bold text-white text-[11px]">Portfolio Visitor Guest</div>
                  <div className="text-[10px] text-indigo-400 font-mono">portfolio / password123</div>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">
                  Guest
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
