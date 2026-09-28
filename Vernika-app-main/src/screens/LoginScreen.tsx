import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck,
  ShieldAlert,
  X,
  Building2,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from '../components/common/Logo';

export const LoginScreen: React.FC = () => {
  const { login, sessionExpiredReason, clearSessionExpiredReason } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!identifier || !password) {
      setError('Please enter both username/email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(identifier, password, selectedRole);
      if (!success) {
        setError('Authentication failed. Verify the credentials and choose the role assigned to this account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (userType: 'admin' | 'employee' | 'client') => {
    setSelectedRole(userType);
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-300">
      {/* Background Ambience */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none transition-colors duration-300" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none transition-colors duration-300" />

      {/* Top Floating Controls (Theme Toggle) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-amber-400 transition-all cursor-pointer shadow-md"
          title={`Switch Theme (Current: ${theme})`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
        </button>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Side: Enterprise Platform Architecture */}
        <div className="lg:col-span-6 space-y-8">
          <Logo size="lg" subtitle="ENTERPRISE WORKPLACE & MULTI-USER CLOUD" />

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              One Platform. <br />
              <span className="text-blue-600 dark:text-emerald-400">Three Distinct Portals.</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
              Experience true multi-user workplace separation. Each persona operates in their own designated window with customized toolsets, live telemetry, project tracking, and real-time database synchronization.
            </p>
          </div>

          {/* Persona Capability Highlights */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
            <button type="button"
              onClick={() => handleRoleSelect('admin')}
              aria-pressed={selectedRole === 'admin'}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900/60 border text-left ${selectedRole === 'admin' ? 'border-blue-500 dark:border-emerald-500 ring-2 ring-blue-500/20 dark:ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'} hover:border-blue-300 dark:hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-emerald-500/20 text-blue-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Admin</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Master control & Live monitor</p>
            </button>

            <button type="button"
              onClick={() => handleRoleSelect('employee')}
              aria-pressed={selectedRole === 'employee'}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900/60 border text-left ${selectedRole === 'employee' ? 'border-indigo-500 dark:border-blue-500 ring-2 ring-indigo-500/20 dark:ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'} hover:border-indigo-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-blue-500/20 text-indigo-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Employee</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Tasks, punch clock & payslips</p>
            </button>

            <button type="button"
              onClick={() => handleRoleSelect('client')}
              aria-pressed={selectedRole === 'client'}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900/60 border text-left ${selectedRole === 'client' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-800'} hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer group`}
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Client</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Deliverables & invoices</p>
            </button>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400 pt-2 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Real-Time Cloud Firestore</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Isolated Portals</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Box */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Welcome Back</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to your Vernika workspace</p>
            </div>

            {sessionExpiredReason && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Session Security Notice</p>
                  <p className="text-[11px] opacity-90 leading-tight mt-0.5">{sessionExpiredReason}</p>
                </div>
                <button 
                  type="button" 
                  onClick={clearSessionExpiredReason}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 p-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs text-center font-medium">
                {error}
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleCustomLogin} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                  <span>Username or Work Email</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-emerald-500 transition-shadow"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                  <span>Password</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-blue-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-emerald-500 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 dark:shadow-emerald-600/20 transition-all cursor-pointer text-xs disabled:opacity-50"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In Securely'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Secure enterprise connection. 
                <br />
                Please select your role from the left and enter your credentials to login.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

