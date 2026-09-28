import React, { useState } from 'react';
import {
  Users,
  Shield,
  Key,
  CheckCircle2,
  RefreshCw,
  Plus,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { hybridDB, UserAccount } from '../services/hybridDatabase';

interface AuthConsoleProps {
  currentUser: UserAccount;
  onSelectUser: (user: UserAccount) => void;
}

export const AuthConsole: React.FC<AuthConsoleProps> = ({ currentUser, onSelectUser }) => {
  const [accounts, setAccounts] = useState<UserAccount[]>(hybridDB.getAccounts());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'employee' | 'tenant' | 'client'>('employee');
  const [newPassword, setNewPassword] = useState('');
  const [showAdminSecrets, setShowAdminSecrets] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  const defaultPasswords: Record<string, string> = {
    admin: 'admin123',
    manager: 'manager123',
    employee: 'emp123',
    tenant: 'tenant123',
    client: 'client123',
  };

  const handleResetAccounts = () => {
    if (!isAdmin) return;
    const res = hybridDB.resetAccounts();
    setAccounts(res);
    onSelectUser(res[0]);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newUsername.trim() || !newName.trim()) return;

    const pwdToSave = newPassword.trim() || `${newUsername.toLowerCase().trim()}123`;

    const newAcc: UserAccount = {
      id: `user_${Date.now()}`,
      username: newUsername.toLowerCase().trim(),
      name: newName,
      email: `${newUsername.toLowerCase().trim()}@automated-workflow.org`,
      role: newRole,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      department: newRole === 'tenant' ? 'PG Residents' : newRole === 'client' ? 'Corporate Client' : 'General Operations',
      allowedApps: ['goldenprime', 'vernika', 'chaknastore', 'website'],
      lastActive: new Date().toISOString(),
    };

    const updated = [...accounts, newAcc];
    hybridDB.saveAccounts(updated);
    setAccounts(updated);
    setNewUsername('');
    setNewName('');
    setNewPassword('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
            <Users className="h-4 w-4" /> Unified Authentication & Access Control
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-display">
            Shared User Accounts & Credentials Manager
          </h1>
          <p className="text-xs text-slate-400">
            {isAdmin
              ? 'Admin Interface: Manage passwords, create employee/tenant/client profiles, and switch accounts.'
              : 'User View: Credentials management and account switching are restricted to Admin users.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAccounts}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 text-indigo-400" /> Reset Accounts
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Profile
            </button>
          </div>
        )}
      </div>

      {/* Non-Admin Security Notice */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div>
            <div className="font-bold">Restricted View (Current Role: {currentUser.role})</div>
            <div>
              Admin credentials and account switching buttons are hidden to maintain security across all applications. Log in as an <strong>Admin</strong> to modify credentials and switch profiles.
            </div>
          </div>
        </div>
      )}

      {/* Admin Toggle Password Visibility */}
      {isAdmin && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-400" /> Admin Master Key Controls
          </span>
          <button
            onClick={() => setShowAdminSecrets(!showAdminSecrets)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-all"
          >
            {showAdminSecrets ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-indigo-400" />}
            {showAdminSecrets ? 'Hide Passwords' : 'Reveal Passwords'}
          </button>
        </div>
      )}

      {/* User Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isActive = currentUser.id === acc.id;
          const rawPwd = defaultPasswords[acc.username] || `${acc.username}123`;
          const displayPwd = isAdmin && showAdminSecrets ? rawPwd : '••••••••';

          // Hide admin accounts from non-admin users if configured
          if (!isAdmin && acc.role === 'admin' && !isActive) {
            return null; // Do not render other admin accounts to non-admin users
          }

          return (
            <div
              key={acc.id}
              className={`glass-card rounded-2xl p-5 border transition-all space-y-4 ${
                isActive
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="h-10 w-10 rounded-full object-cover border border-indigo-400/30"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">{acc.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                      {acc.role}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" /> Active Session
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Username:</span>
                  <span className="font-mono text-slate-100 font-semibold">{acc.username}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Password:</span>
                  <span className="font-mono text-indigo-300 font-semibold">{displayPwd}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Email:</span>
                  <span className="text-slate-300 truncate max-w-[150px]">{acc.email}</span>
                </div>
              </div>

              {/* Switch Account Button: Only enabled for Admin */}
              {isAdmin ? (
                <button
                  onClick={() => onSelectUser(acc)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {isActive ? 'Current Active Session' : 'Switch to Account'}
                </button>
              ) : (
                <div className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3" /> Switch Account (Admin Only)
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Profile Modal */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-white">Create New User Profile (Saved for All Apps)</h2>
            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium mb-1 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Vikram Singh"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium mb-1 block">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. vikram"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium mb-1 block">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Default: username123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium mb-1 block">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                  <option value="tenant">Tenant (GoldenPrime PG Resident)</option>
                  <option value="client">Client (Vernika Corporate / ChaknaStore)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Save Profile Across Apps
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
