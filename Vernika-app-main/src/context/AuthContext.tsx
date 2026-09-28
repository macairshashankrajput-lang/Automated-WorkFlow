import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuxStatus, Employee, ClientAccount } from '../types';
import { auth, db, signInWithGoogle, signInWithEmailAndPassword, logOut, onAuthStateChanged, testConnection, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, query, where, limit } from 'firebase/firestore';
import { sanitizeForFirestore } from '../lib/realtimeSync';

export interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  authReady: boolean;
  demoUsers: User[];
  login: (identifier: string, password?: string, roleType?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  switchUser: (targetUser: User) => void;
  updateUser: (updatedData: Partial<User>) => void;
  setAuxStatus: (status: AuxStatus, reason?: string) => void;
  openRoleWindow: (roleOrUsername: string) => void;
  // Session Security & Inactivity Timeout Controls
  sessionTimeoutMinutes: number;
  setSessionTimeoutMinutes: (mins: number) => void;
  sessionExpiredReason: string | null;
  clearSessionExpiredReason: () => void;
  showInactivityWarning: boolean;
  inactivitySecondsLeft: number;
  extendSession: () => void;
}

const allowDemoUsers = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const demoUsers: User[] = allowDemoUsers ? [
  // Admin Personas
  {
    id: 'emp-1',
    name: 'Shashank Rajput',
    email: 'shashank@vernika.io',
    username: 'shashank',
    password: 'password123',
    role: 'admin',
    department: 'Engineering & Technology',
    title: 'Chief Technology Officer & Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-01-15',
    phone: '+1 (555) 234-8901',
    location: 'San Francisco, CA (HQ)',
    auxStatus: 'Available',
    auxStartTime: '09:00 AM',
    allowedModules: [
      'dashboard', 'employees', 'workflow', 'documents', 'attendance', 'leaves', 'departments', 
      'positions', 'projects', 'tasks', 'crm', 'invoicing', 'chat', 
      'announcements', 'orgtree', 'ai_assistant', 'settings', 
      'aux_status', 'payroll', 'expenses', 'clients', 'meetings', 'sheets', 'tracking'
    ]
  },
  {
    id: 'emp-2',
    name: 'Elena Rostova',
    email: 'elena@vernika.io',
    username: 'elena',
    password: 'password123',
    role: 'admin',
    department: 'Product & Design',
    title: 'VP of Product Experience',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-03-01',
    phone: '+1 (555) 345-6789',
    location: 'San Francisco, CA (HQ)',
    auxStatus: 'Available',
    auxStartTime: '09:00 AM',
    allowedModules: [
      'dashboard', 'employees', 'workflow', 'documents', 'attendance', 'leaves', 'departments', 
      'positions', 'projects', 'tasks', 'crm', 'invoicing', 'chat', 
      'announcements', 'orgtree', 'ai_assistant', 'settings', 
      'aux_status', 'payroll', 'expenses', 'clients', 'meetings', 'sheets', 'tracking'
    ]
  },
  {
    id: 'emp-3',
    name: 'Marcus Vance',
    email: 'marcus@vernika.io',
    username: 'marcus',
    password: 'password123',
    role: 'admin',
    department: 'Sales & Business Dev',
    title: 'Head of Strategic Growth',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-04-10',
    phone: '+1 (555) 456-7890',
    location: 'New York, NY',
    auxStatus: 'Available',
    auxStartTime: '08:45 AM',
    allowedModules: [
      'dashboard', 'employees', 'workflow', 'documents', 'attendance', 'leaves', 'departments', 
      'positions', 'projects', 'tasks', 'crm', 'invoicing', 'chat', 
      'announcements', 'orgtree', 'ai_assistant', 'settings', 
      'aux_status', 'payroll', 'expenses', 'clients', 'meetings', 'sheets', 'tracking'
    ]
  },

  // Employee Personas
  {
    id: 'emp-4',
    name: 'Priya Sharma',
    email: 'priya@vernika.io',
    username: 'priya',
    password: 'password123',
    role: 'employee',
    department: 'Engineering & Technology',
    title: 'Senior Cloud Engineer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-06-20',
    phone: '+1 (555) 567-8934',
    location: 'San Francisco, CA (HQ)',
    auxStatus: 'Available',
    auxStartTime: '09:15 AM',
    allowedModules: [
      'dashboard', 'attendance', 'leaves', 'projects', 'tasks', 
      'chat', 'announcements', 'ai_assistant', 'aux_status', 
      'payroll', 'expenses', 'meetings', 'sheets', 'mail', 'calendar'
    ]
  },
  {
    id: 'emp-5',
    name: 'Liam O\'Connor',
    email: 'liam@vernika.io',
    username: 'liam',
    password: 'password123',
    role: 'employee',
    department: 'Engineering & Technology',
    title: 'Full Stack Developer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-08-15',
    phone: '+1 (555) 678-9045',
    location: 'Remote (Seattle, WA)',
    auxStatus: 'Break',
    auxStartTime: '11:30 AM',
    allowedModules: [
      'dashboard', 'attendance', 'leaves', 'projects', 'tasks', 
      'chat', 'announcements', 'aux_status', 'payroll', 'expenses', 'meetings', 'sheets', 'mail', 'calendar'
    ]
  },
  {
    id: 'emp-6',
    name: 'Aria Montgomery',
    email: 'aria@vernika.io',
    username: 'aria',
    password: 'password123',
    role: 'employee',
    department: 'Marketing & Growth',
    title: 'Growth Marketing Director',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-09-01',
    phone: '+1 (555) 789-0156',
    location: 'Chicago, IL',
    auxStatus: 'Training',
    auxStartTime: '10:15 AM',
    allowedModules: [
      'dashboard', 'attendance', 'leaves', 'projects', 'tasks', 
      'chat', 'announcements', 'aux_status', 'payroll', 'expenses', 'meetings', 'sheets', 'mail', 'calendar'
    ]
  },
  {
    id: 'emp-7',
    name: 'Devon Miles',
    email: 'devon@vernika.io',
    username: 'devon',
    password: 'password123',
    role: 'employee',
    department: 'Human Resources',
    title: 'HR & People Operations Lead',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-10-15',
    phone: '+1 (555) 890-1267',
    location: 'San Francisco, CA (HQ)',
    auxStatus: 'Available',
    auxStartTime: '08:30 AM',
    allowedModules: [
      'dashboard', 'attendance', 'leaves', 'projects', 'tasks', 
      'chat', 'announcements', 'aux_status', 'payroll', 'expenses', 'meetings', 'sheets', 'mail', 'calendar'
    ]
  },
  {
    id: 'emp-8',
    name: 'Rachel Green',
    email: 'rachel@vernika.io',
    username: 'rachel',
    password: 'password123',
    role: 'employee',
    department: 'Human Resources',
    title: 'Senior Talent Partner',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-11-01',
    phone: '+1 (555) 901-2378',
    location: 'Remote (Austin, TX)',
    auxStatus: 'Lunch',
    auxStartTime: '12:45 PM',
    allowedModules: [
      'dashboard', 'attendance', 'leaves', 'projects', 'tasks', 
      'chat', 'announcements', 'aux_status', 'payroll', 'expenses', 'meetings', 'sheets', 'mail', 'calendar'
    ]
  },

  // Client Personas
  {
    id: 'cli-1',
    name: 'Alexander Cross',
    email: 'alex@apexfinancials.com',
    username: 'client_apex',
    password: 'password123',
    role: 'client',
    clientId: 'cli-1',
    clientCompany: 'Apex Global Financials',
    department: 'Executive Client',
    title: 'Chief Financial Officer & Client Lead',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-05-10',
    phone: '+1 (415) 890-3412',
    location: 'New York, NY',
    allowedModules: [
      'client_dashboard', 'client_projects', 'client_invoices', 
      'client_deliverables', 'client_support', 'chat', 'meetings'
    ]
  },
  {
    id: 'cli-2',
    name: 'Sarah Jenkins',
    email: 'sarah@peakvc.com',
    username: 'client_peak',
    password: 'password123',
    role: 'client',
    clientId: 'cli-2',
    clientCompany: 'Peak Venture Capital',
    department: 'Executive Client',
    title: 'Managing Partner & Client Lead',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-07-22',
    phone: '+1 (212) 555-0199',
    location: 'Boston, MA',
    allowedModules: [
      'client_dashboard', 'client_projects', 'client_invoices', 
      'client_deliverables', 'client_support', 'chat', 'meetings'
    ]
  },
  {
    id: 'cli-3',
    name: 'Carlos Rivera',
    email: 'carlos@vanguardlogistics.com',
    username: 'client_vanguard',
    password: 'password123',
    role: 'client',
    clientId: 'cli-3',
    clientCompany: 'Vanguard Logistics',
    department: 'Executive Client',
    title: 'VP of Global Operations',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    joinedDate: '2023-08-05',
    phone: '+1 (312) 440-9821',
    location: 'Chicago, IL',
    allowedModules: [
      'client_dashboard', 'client_projects', 'client_invoices', 
      'client_deliverables', 'client_support', 'chat', 'meetings'
    ]
  }
] : [];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session Security & Inactivity Timeout Configuration
  const [sessionTimeoutMinutes, setSessionTimeoutMinutesState] = useState<number>(() => {
    try {
      const savedMins = localStorage.getItem('vernika_session_timeout');
      if (savedMins && !isNaN(Number(savedMins))) {
        return Number(savedMins);
      }
    } catch {}
    return 15; // Default 15 minutes session timeout
  });

  const [sessionExpiredReason, setSessionExpiredReason] = useState<string | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState<boolean>(false);
  const [inactivitySecondsLeft, setInactivitySecondsLeft] = useState<number>(60);
  const lastActiveRef = React.useRef<number>(Date.now());

  const setSessionTimeoutMinutes = (mins: number) => {
    setSessionTimeoutMinutesState(mins);
    try {
      localStorage.setItem('vernika_session_timeout', mins.toString());
    } catch {}
  };

  const clearSessionExpiredReason = () => {
    setSessionExpiredReason(null);
  };

  const extendSession = () => {
    lastActiveRef.current = Date.now();
    try {
      localStorage.setItem('vernika_last_active', Date.now().toString());
    } catch {}
    setShowInactivityWarning(false);
  };

  const [authReady, setAuthReady] = useState(false);
  const resolvedProfileIdRef = React.useRef<string | null>(null);

  const [user, setUser] = useState<User | null>(() => {
    // Production sessions must be restored only from Firebase Auth. Local demo
    // snapshots are allowed exclusively on localhost to prevent stale profiles
    // from mounting before Firebase resolves the current account.
    if (!allowDemoUsers) return null;
    // Check if session has expired based on last active timestamp
    let isSessionExpired = false;
    let savedLastActive = 0;
    try {
      const storedLastActive = localStorage.getItem('vernika_last_active');
      if (storedLastActive) {
        savedLastActive = Number(storedLastActive);
      }
    } catch {}

    const savedTimeoutMins = Number(localStorage.getItem('vernika_session_timeout') || '15');
    const timeoutMs = savedTimeoutMins * 60 * 1000;

    if (savedLastActive > 0 && Date.now() - savedLastActive > timeoutMs) {
      isSessionExpired = true;
    }

    if (isSessionExpired) {
      try {
        sessionStorage.removeItem('vernika_auth_user');
        localStorage.removeItem('vernika_auth_user');
      } catch {}
      return null;
    }

    // URL query parameters are never trusted for identity or role selection.
    // A session may only be restored from Firebase Authentication or an
    // explicitly local, non-production demo session.

    // 2. Check session storage for isolated window session
    try {
      const sessionSaved = sessionStorage.getItem('vernika_auth_user');
      if (sessionSaved) {
        return JSON.parse(sessionSaved);
      }
    } catch {
      // ignore
    }

    // 3. Fallback to localStorage
    try {
      const saved = localStorage.getItem('vernika_auth_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      return null;
    }
    return null;
  });

  // Track user activity (mousemove, keydown, click, touch, scroll)
  useEffect(() => {
    if (!user) return;

    // Set initial last active timestamp
    lastActiveRef.current = Date.now();
    try {
      localStorage.setItem('vernika_last_active', Date.now().toString());
    } catch {}

    let lastThrottle = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastThrottle > 2000) { // Throttle to every 2 seconds
        lastThrottle = now;
        lastActiveRef.current = now;
        try {
          localStorage.setItem('vernika_last_active', now.toString());
        } catch {}
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [user]);

  // Check inactivity timeout every 1 second
  useEffect(() => {
    if (!user) {
      setShowInactivityWarning(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      // Also check cross-tab last active timestamp from localStorage
      let remoteLastActive = lastActiveRef.current;
      try {
        const stored = localStorage.getItem('vernika_last_active');
        if (stored) {
          const num = Number(stored);
          if (num > remoteLastActive) remoteLastActive = num;
        }
      } catch {}

      const elapsed = now - remoteLastActive;
      const timeoutMs = sessionTimeoutMinutes * 60 * 1000;
      const warningThresholdMs = Math.max(0, timeoutMs - 60000); // 60s warning

      if (elapsed >= timeoutMs) {
        // Log out immediately on timeout
        logout();
        setSessionExpiredReason(
          `Your session automatically terminated due to ${sessionTimeoutMinutes} minutes of inactivity for workspace data protection.`
        );
        setShowInactivityWarning(false);
      } else if (elapsed >= warningThresholdMs) {
        setShowInactivityWarning(true);
        const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
        setInactivitySecondsLeft(remaining);
      } else {
        setShowInactivityWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, sessionTimeoutMinutes]);

  // Test Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
        setUser(null);
        setAuthReady(true);
        return;
      }
      const tokenResult = await fbUser.getIdTokenResult(true);
      const isAdminUser = tokenResult.claims.admin === true;

      // Firebase custom claims distinguish administrators, but Client accounts
      // intentionally do not use an admin claim. Resolve the canonical client
      // profile first so auth-state restoration cannot misroute a Client into
      // the Employee portal.
      let clientProfile: Record<string, any> | null = null;
      let employeeProfile: Record<string, any> | null = null;
      if (!isAdminUser && fbUser.email) {
        // Client identity is authoritative. Resolve the UID-keyed client first and
        // never read employee data for a confirmed client session. This prevents
        // legacy duplicate employee records from contaminating client hydration.
        const directClient = await getDoc(doc(db, 'clients', fbUser.uid));
        if (directClient.exists()) {
          clientProfile = { id: directClient.id, ...directClient.data() };
        } else {
          const clientMatches = await getDocs(query(collection(db, 'clients'), where('email', '==', fbUser.email), limit(1)));
          const clientMatch = clientMatches.docs[0];
          if (clientMatch) clientProfile = { id: clientMatch.id, ...clientMatch.data() };
        }
        if (!clientProfile) {
          const usernameCandidates = Array.from(new Set([fbUser.displayName, fbUser.email.split('@')[0], fbUser.email].filter(Boolean).map((value) => String(value).trim())));
          for (const candidate of usernameCandidates) {
            const usernameMatches = await getDocs(query(collection(db, 'clients'), where('username', '==', candidate), limit(1)));
            const usernameMatch = usernameMatches.docs[0];
            if (usernameMatch) {
              clientProfile = { id: usernameMatch.id, ...usernameMatch.data() };
              break;
            }
          }
        }
        if (!clientProfile) {
          const directEmployee = await getDoc(doc(db, 'employees', fbUser.uid));
          if (directEmployee.exists()) employeeProfile = { id: directEmployee.id, ...directEmployee.data() };
          if (!employeeProfile) {
            const employeeMatches = await getDocs(query(collection(db, 'employees'), where('email', '==', fbUser.email), limit(1)));
            const employeeMatch = employeeMatches.docs[0];
            if (employeeMatch) employeeProfile = { id: employeeMatch.id, ...employeeMatch.data() };
          }
        }
      }
      resolvedProfileIdRef.current = clientProfile?.id || employeeProfile?.id || fbUser.uid;

      setUser((prev) => {
        if (prev && prev.email === fbUser.email && prev.role === 'client' && clientProfile) return prev;
        const isClientUser = Boolean(clientProfile);
        return {
          id: fbUser.uid,
          name: clientProfile?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Enterprise User',
          email: clientProfile?.email || fbUser.email || 'user@vernika.io',
          username: clientProfile?.username,
          role: isAdminUser ? 'admin' : isClientUser ? 'client' : employeeProfile?.role || 'employee',
          department: clientProfile?.department || employeeProfile?.department || (isClientUser ? 'Executive Client' : 'Corporate Cloud Operations'),
          title: clientProfile?.position || clientProfile?.title || employeeProfile?.position || (isAdminUser ? 'Enterprise Administrator' : isClientUser ? 'Client Lead' : 'Staff Specialist'),
          avatar: clientProfile?.avatar || fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          status: clientProfile?.status === 'On Leave' ? 'On Leave' : 'Active',
          joinedDate: clientProfile?.joinDate || clientProfile?.joinedDate || new Date().toISOString().split('T')[0],
          phone: clientProfile?.phone || '+1 (555) 019-2831',
          location: clientProfile?.location || 'Global Workspace',
          auxStatus: clientProfile?.auxStatus || 'Available',
          auxStartTime: clientProfile?.auxStartTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          clientId: clientProfile?.clientId || clientProfile?.id,
          clientCompany: clientProfile?.company || clientProfile?.clientCompany,
          loginEnabled: (clientProfile?.loginEnabled ?? employeeProfile?.loginEnabled) !== false,
          isDepartmentHead: employeeProfile?.isDepartmentHead === true || employeeProfile?.role === 'department_head',
          managedDepartment: employeeProfile?.managedDepartment || employeeProfile?.department,
          grantableModules: Array.isArray(employeeProfile?.grantableModules) ? employeeProfile.grantableModules : [],
          canAssignProjects: employeeProfile?.canAssignProjects === true,
          allowedModules: (Array.isArray(clientProfile?.allowedModules) ? clientProfile.allowedModules : Array.isArray(employeeProfile?.allowedModules) ? employeeProfile.allowedModules : null) || (isAdminUser
            ? ['dashboard', 'employees', 'attendance', 'leaves', 'departments', 'positions', 'projects', 'tasks', 'crm', 'invoicing', 'chat', 'announcements', 'orgtree', 'ai_assistant', 'settings', 'aux_status', 'payroll', 'expenses', 'clients', 'meetings', 'sheets', 'tracking']
            : isClientUser
              ? ['client_dashboard', 'client_projects', 'client_invoices', 'client_deliverables', 'client_support', 'chat', 'meetings']
              : ['dashboard', 'attendance', 'leaves', 'projects', 'tasks', 'chat', 'announcements', 'aux_status', 'payroll', 'expenses', 'meetings'])
        };
      });
        setAuthReady(true);
      } catch (error) {
        console.error('Firebase profile hydration failed; keeping shell safe:', error);
        setUser(null);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for staff profiles & AUX status across devices.
  // Client sessions are intentionally excluded: a client can have a legacy employee
  // record with the same email, and merging that record would silently remount the
  // client as an employee after the initial role resolution.
  useEffect(() => {
    if (!user?.id || user.role === 'client') return;
    const cleanId = String(user.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
    let emailUnsub: (() => void) | undefined;
    const applyRemote = (remoteData: Record<string, any>) => {
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...remoteData,
          role: prev.role,
          clientId: prev.clientId,
          clientCompany: prev.clientCompany,
          allowedModules: Array.isArray(remoteData.allowedModules) ? remoteData.allowedModules : prev.allowedModules,
          id: auth.currentUser?.uid || prev.id,
          firebaseUid: auth.currentUser?.uid || prev.id,
          profileId: remoteData.id || (prev as User & { profileId?: string }).profileId,
          email: remoteData.email || prev.email,
          auxStatus: remoteData.auxStatus || prev.auxStatus || 'Available',
          auxStartTime: remoteData.auxStartTime || prev.auxStartTime,
        };
      });
    };
    const unsub = onSnapshot(doc(db, 'employees', cleanId), (snap) => {
      if (snap.exists()) {
        applyRemote(snap.data());
        return;
      }
      if (!user.email) return;
      emailUnsub?.();
      emailUnsub = onSnapshot(
        query(collection(db, 'employees'), where('email', '==', user.email), limit(1)),
        (emailSnap) => {
          const match = emailSnap.docs[0];
          if (match) applyRemote({ id: match.id, ...match.data() });
        },
        (err) => console.warn('User email profile sync notice:', err.message)
      );
    }, (err) => console.warn('User profile sync notice:', err.message));

    return () => {
      unsub();
      emailUnsub?.();
    };
  }, [user?.id, user?.email, user?.role]);

  useEffect(() => {
    if (user) {
      try {
        const { password: _password, ...safeUser } = user;
        sessionStorage.setItem('vernika_auth_user', JSON.stringify(safeUser));
        localStorage.setItem('vernika_auth_user', JSON.stringify(safeUser));
      } catch {}
    } else {
      try {
        sessionStorage.removeItem('vernika_auth_user');
        localStorage.removeItem('vernika_auth_user');
      } catch {}
    }
  }, [user]);

  // A logout or inactivity timeout in one tab invalidates the session in all
  // other tabs that share the same browser profile.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'vernika_logout_event' && event.newValue) {
        setUser(null);
        setSessionExpiredReason('This session was signed out from another device or browser tab.');
      }
      if (event.key === 'vernika_auth_user' && event.newValue === null) {
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const loginWithGoogle = async () => {
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        const tokenResult = await fbUser.getIdTokenResult(true);
        const isAdminUser = tokenResult.claims.admin === true;
        const loggedUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Enterprise User',
          email: fbUser.email || 'user@vernika.io',
          role: isAdminUser ? 'admin' : 'employee',
          department: 'Corporate Cloud Operations',
          title: isAdminUser ? 'Enterprise Administrator' : 'Staff Specialist',
          avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          status: 'Active',
          joinedDate: new Date().toISOString().split('T')[0],
          phone: '+1 (555) 019-2831',
          location: 'Global Workspace',
          auxStatus: 'Available',
          auxStartTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          allowedModules: isAdminUser
            ? ['dashboard', 'employees', 'attendance', 'leaves', 'departments', 'positions', 'projects', 'tasks', 'crm', 'invoicing', 'chat', 'announcements', 'orgtree', 'ai_assistant', 'settings', 'aux_status', 'payroll', 'expenses', 'clients', 'meetings']
            : ['dashboard', 'attendance', 'leaves', 'projects', 'tasks', 'chat', 'announcements', 'ai_assistant', 'aux_status', 'payroll', 'expenses', 'meetings']
        };
        setUser(loggedUser);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/user-cancelled' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        return;
      }
      throw err;
    }
  };

  const login = async (identifier: string, password?: string, roleType?: string): Promise<boolean> => {
    const cleanId = identifier.trim().toLowerCase();
    const authIdentifier = cleanId.includes('@') ? cleanId : `${cleanId}@vernika.io`;
    if (!cleanId || !password) return false;

    try {
      const credential = await signInWithEmailAndPassword(auth, authIdentifier, password);
      const firebaseUser = credential.user;
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const claims = tokenResult.claims as { admin?: boolean };

      const toUser = (data: Record<string, any>, id: string, fallbackRole: UserRole): User => ({
        id,
        name: data.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Workspace User',
        email: data.email || firebaseUser.email || cleanId,
        username: data.username,
        role: fallbackRole,
        department: data.department || 'Corporate Operations',
        title: data.position || data.title || (claims.admin ? 'Enterprise Administrator' : 'Staff Specialist'),
        avatar: data.avatar || firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: data.status === 'On Leave' ? 'On Leave' : 'Active',
        joinedDate: data.joinDate || data.joinedDate || new Date().toISOString().split('T')[0],
        phone: data.phone || '',
        location: data.location || 'Global Workspace',
        auxStatus: data.auxStatus || 'Available',
        auxStartTime: data.auxStartTime,
        leavesBalance: data.leavesBalance,
        allowedModules: Array.isArray(data.allowedModules) ? data.allowedModules : undefined,
        loginEnabled: data.loginEnabled !== false,
        clientId: data.clientId,
        clientCompany: data.company || data.clientCompany,
        bio: data.bio,
        skills: data.skills,
      });

      let profile: Record<string, any> | null = null;
      const directEmployee = await getDoc(doc(db, 'employees', firebaseUser.uid));
      if (directEmployee.exists()) {
        profile = { id: directEmployee.id, ...directEmployee.data() };
      } else if (firebaseUser.email) {
        const employeeQuery = await getDoc(doc(db, 'employees', firebaseUser.email));
        if (employeeQuery.exists()) {
          profile = { id: employeeQuery.id, ...employeeQuery.data() };
        } else {
          const employeeMatches = await getDocs(query(collection(db, 'employees'), where('email', '==', firebaseUser.email), limit(1)));
          const employeeMatch = employeeMatches.docs[0];
          if (employeeMatch) profile = { id: employeeMatch.id, ...employeeMatch.data() };
        }
      }

      // A user may have a legacy/duplicate employee document with the same email.
      // When the Client portal is explicitly selected, resolve the client profile first
      // so a stale employee record cannot silently grant the wrong portal.
      if (!claims.admin && roleType === 'client' && firebaseUser.email) {
        const clientByUid = await getDoc(doc(db, 'clients', firebaseUser.uid));
        if (clientByUid.exists()) {
          profile = { id: clientByUid.id, ...clientByUid.data() };
        } else {
          const clientMatches = await getDocs(query(collection(db, 'clients'), where('email', '==', firebaseUser.email), limit(1)));
          const clientMatch = clientMatches.docs[0];
          if (clientMatch) profile = { id: clientMatch.id, ...clientMatch.data() };
        }
        if (!profile || String(profile.role || '').toLowerCase() !== 'client') {
          const usernameCandidates = Array.from(new Set([identifier.trim(), cleanId, authIdentifier, firebaseUser.email || ''].filter(Boolean)));
          for (const candidate of usernameCandidates) {
            const usernameMatches = await getDocs(query(collection(db, 'clients'), where('username', '==', candidate), limit(1)));
            const usernameMatch = usernameMatches.docs[0];
            if (usernameMatch) {
              profile = { id: usernameMatch.id, ...usernameMatch.data() };
              break;
            }
          }
        }
      }

      const requestedProfileRole = String(profile?.role || '').toLowerCase();
      let actualRole: UserRole = claims.admin ? 'admin' : requestedProfileRole === 'client' || roleType === 'client' && profile?.company ? 'client' : 'employee';
      if (!profile && !claims.admin && firebaseUser.email) {
        const clientQuery = await getDoc(doc(db, 'clients', firebaseUser.uid));
        if (clientQuery.exists()) {
          profile = { id: clientQuery.id, ...clientQuery.data() };
          actualRole = 'client';
        } else {
          const clientMatches = await getDocs(query(collection(db, 'clients'), where('email', '==', firebaseUser.email), limit(1)));
          const clientMatch = clientMatches.docs[0];
          if (clientMatch) {
            profile = { id: clientMatch.id, ...clientMatch.data() };
            actualRole = 'client';
          }
        }
      }

      if (!profile && !claims.admin) {
        await logOut();
        return false;
      }
      if (roleType && actualRole !== roleType) {
        await logOut();
        return false;
      }

      resolvedProfileIdRef.current = profile?.id || firebaseUser.uid;
      setUser(toUser(profile || {}, firebaseUser.uid, actualRole));
      return true;
    } catch (error) {
      console.warn('Firebase credential authentication failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await logOut();
    } catch (e) {
      // ignore
    }
    resolvedProfileIdRef.current = null;
    setUser(null);
    try {
      sessionStorage.removeItem('vernika_auth_user');
      localStorage.removeItem('vernika_auth_user');
      localStorage.setItem('vernika_logout_event', String(Date.now()));
    } catch {}
  };

  const openRoleWindow = (roleOrUsername: string) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('portal', roleOrUsername);
      const w = window.open(url.toString(), '_blank');
      if (!w) {
         window.location.href = url.toString();
      }
    } catch {
      // fallback
      const w = window.open(`/?portal=${roleOrUsername}`, '_blank');
      if (!w) {
         window.location.href = `/?portal=${roleOrUsername}`;
      }
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (!user || user.role !== newRole) {
      console.warn('Role switching is disabled for authenticated sessions; sign in with an authorized Firebase account.');
    }
  };

  const switchUser = (targetUser: User) => {
    if (targetUser.id !== auth.currentUser?.uid) {
      console.warn('User switching is disabled for authenticated sessions; use Firebase Authentication for account changes.');
      return;
    }
    setUser((current) => current ? { ...current, ...targetUser, id: auth.currentUser?.uid || current.id, auxStatus: targetUser.auxStatus || current.auxStatus || 'Available' } : targetUser);
  };

  const updateUser = async (updatedData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
    if (auth.currentUser?.uid) {
      try {
        const sanitized = sanitizeForFirestore(updatedData);
        await setDoc(doc(db, 'employees', auth.currentUser.uid), sanitized, { merge: true });
        if (resolvedProfileIdRef.current && resolvedProfileIdRef.current !== auth.currentUser.uid) {
          await setDoc(doc(db, 'employees', resolvedProfileIdRef.current), sanitized, { merge: true });
        }
      } catch (err) {
        console.warn('Failed to sync updateUser to Firestore:', err);
      }
    }
  };

  const setAuxStatus = async (status: AuxStatus, reason?: string) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        auxStatus: status,
        auxStartTime: nowStr,
      };
    });
    if (auth.currentUser?.uid) {
      try {
        const payload = sanitizeForFirestore({ auxStatus: status, auxStartTime: nowStr, auxReason: reason || null, firebaseUid: auth.currentUser.uid });
        await setDoc(doc(db, 'employees', auth.currentUser.uid), payload, { merge: true });
        if (resolvedProfileIdRef.current && resolvedProfileIdRef.current !== auth.currentUser.uid) {
          await setDoc(doc(db, 'employees', resolvedProfileIdRef.current), payload, { merge: true });
        }
      } catch (err) {
        console.warn('Failed to sync setAuxStatus to Firestore:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'admin',
        isAuthenticated: !!user,
        authReady,
        demoUsers,
        login,
        loginWithGoogle,
        logout,
        switchRole,
        switchUser,
        updateUser,
        setAuxStatus,
        openRoleWindow,
        sessionTimeoutMinutes,
        setSessionTimeoutMinutes,
        sessionExpiredReason,
        clearSessionExpiredReason,
        showInactivityWarning,
        inactivitySecondsLeft,
        extendSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
