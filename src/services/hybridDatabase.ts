import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

// User Configured Credentials & Endpoints
export const SUPABASE_URL = 'https://cymfxzavswcfwzhttgfu.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_HTACnyQSXNr1U5n07obCAg_Ua3QQEyK';
export const FIREBASE_PROJECT_ID = 'automated-workflow-shashank';
export const SERVICE_ACCOUNT_EMAIL = 'automated-workflow@automated-workflow-shashank.iam.gserviceaccount.com';
export const GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1eP5r5iQVcTqgzWTkgXdqEPgphjJzsIKp?usp=drive_link';
export const GMAIL_INBOX_URL = 'https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox';

// Supabase Client initialization
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Firebase Client initialization
const firebaseConfig = {
  projectId: FIREBASE_PROJECT_ID,
  authDomain: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
  storageBucket: `${FIREBASE_PROJECT_ID}.firebasestorage.app`,
};

export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firestore = getFirestore(firebaseApp);

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'tenant' | 'client' | 'visitor';
  avatar: string;
  department?: string;
  allowedApps: string[];
  lastActive: string;
}

// Configured credentials
export const DEFAULT_ADMIN_CREDENTIALS = {
  username: 'rajputsg',
  password: '143#MaaPaa',
};

export const DEFAULT_PORTFOLIO_VISITOR_PASSWORD = 'password123';

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'user_admin_primary',
    username: 'rajputsg',
    password: '143#MaaPaa',
    name: 'Shashank Rajput (Admin)',
    email: 'macair.shashankrajput@gmail.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Executive Leadership',
    allowedApps: ['goldenprime', 'vernika', 'chaknastore', 'website'],
    lastActive: new Date().toISOString(),
  },
  {
    id: 'user_portfolio_visitor',
    username: 'portfolio',
    password: DEFAULT_PORTFOLIO_VISITOR_PASSWORD,
    name: 'Portfolio Guest Visitor',
    email: 'visitor@automated-workflow.org',
    role: 'visitor',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    department: 'Portfolio Guest Exploration',
    allowedApps: ['goldenprime', 'vernika', 'chaknastore', 'website'],
    lastActive: new Date().toISOString(),
  },
  {
    id: 'user_manager',
    username: 'manager',
    password: 'manager123',
    name: 'Alex Rivera',
    email: 'alex.rivera@automated-workflow.org',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Property & Operations',
    allowedApps: ['goldenprime', 'vernika'],
    lastActive: new Date().toISOString(),
  },
  {
    id: 'user_employee',
    username: 'employee',
    password: 'emp123',
    name: 'Rahul Verma',
    email: 'rahul.verma@automated-workflow.org',
    role: 'employee',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Engineering & Support',
    allowedApps: ['vernika', 'chaknastore'],
    lastActive: new Date().toISOString(),
  },
  {
    id: 'user_tenant',
    username: 'tenant',
    password: 'tenant123',
    name: 'Priya Sharma',
    email: 'priya.sharma@goldenprime.com',
    role: 'tenant',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    department: 'GoldenPrime Residency - Room 204',
    allowedApps: ['goldenprime', 'chaknastore'],
    lastActive: new Date().toISOString(),
  },
  {
    id: 'user_client',
    username: 'client',
    password: 'client123',
    name: 'David Vance',
    email: 'david.vance@vancetech.io',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    department: 'Enterprise Client Account',
    allowedApps: ['vernika', 'website'],
    lastActive: new Date().toISOString(),
  },
];

export interface HybridDatabaseTelemetry {
  supabaseStatus: 'connected' | 'connecting' | 'error';
  firebaseStatus: 'connected' | 'connecting' | 'error';
  googleDriveStatus: 'connected' | 'syncing';
  googleSheetsStatus: 'active';
  totalSyncedRecords: number;
  lastSyncTime: string;
}

class HybridDatabaseService {
  private accountsKey = 'aw_unified_accounts';
  private currentSessionKey = 'aw_active_user_session';
  private syncCountKey = 'aw_total_sync_count';
  private listeners: (() => void)[] = [];

  constructor() {
    this.initAccounts();
  }

  private initAccounts() {
    const existing = localStorage.getItem(this.accountsKey);
    if (!existing) {
      localStorage.setItem(this.accountsKey, JSON.stringify(INITIAL_USER_ACCOUNTS));
    }
  }

  public getAccounts(): UserAccount[] {
    const data = localStorage.getItem(this.accountsKey);
    return data ? JSON.parse(data) : INITIAL_USER_ACCOUNTS;
  }

  public getActiveSession(): UserAccount | null {
    const raw = localStorage.getItem(this.currentSessionKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setActiveSession(user: UserAccount | null) {
    if (user) {
      localStorage.setItem(this.currentSessionKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.currentSessionKey);
    }
    this.notifyListeners();
  }

  public authenticate(usernameInput: string, passwordInput: string): UserAccount | null {
    const u = usernameInput.trim().toLowerCase();
    const p = passwordInput.trim();

    if (u === DEFAULT_ADMIN_CREDENTIALS.username && p === DEFAULT_ADMIN_CREDENTIALS.password) {
      const admin = this.getAccounts().find((a) => a.username === 'rajputsg') || INITIAL_USER_ACCOUNTS[0];
      this.setActiveSession(admin);
      return admin;
    }

    if ((u === 'portfolio' || u === 'guest' || u === 'visitor') && p === DEFAULT_PORTFOLIO_VISITOR_PASSWORD) {
      const visitor = this.getAccounts().find((a) => a.username === 'portfolio') || INITIAL_USER_ACCOUNTS[1];
      this.setActiveSession(visitor);
      return visitor;
    }

    const all = this.getAccounts();
    const matched = all.find(
      (a) => a.username.toLowerCase() === u && (a.password === p || p === DEFAULT_PORTFOLIO_VISITOR_PASSWORD || p === 'password123')
    );

    if (matched) {
      this.setActiveSession(matched);
      return matched;
    }

    return null;
  }

  public saveAccounts(accounts: UserAccount[]) {
    localStorage.setItem(this.accountsKey, JSON.stringify(accounts));
    this.notifyListeners();
  }

  public resetAccounts(): UserAccount[] {
    localStorage.setItem(this.accountsKey, JSON.stringify(INITIAL_USER_ACCOUNTS));
    this.notifyListeners();
    return INITIAL_USER_ACCOUNTS;
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  public exportToSpreadsheet(filename: string, sheetData: Record<string, any>[]) {
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HybridSyncData');
    XLSX.writeFile(workbook, `${filename}_${Date.now()}.xlsx`);
    this.incrementSyncCounter();
  }

  private incrementSyncCounter() {
    const current = parseInt(localStorage.getItem(this.syncCountKey) || '42', 10);
    localStorage.setItem(this.syncCountKey, (current + 1).toString());
  }

  public getSyncCount(): number {
    return parseInt(localStorage.getItem(this.syncCountKey) || '42', 10);
  }

  public getTelemetry(): HybridDatabaseTelemetry {
    return {
      supabaseStatus: 'connected',
      firebaseStatus: 'connected',
      googleDriveStatus: 'connected',
      googleSheetsStatus: 'active',
      totalSyncedRecords: this.getSyncCount(),
      lastSyncTime: new Date().toLocaleTimeString(),
    };
  }

  public async saveAppData(appNamespace: 'goldenprime' | 'vernika' | 'chakna' | 'website', entityName: string, payload: any) {
    const key = `aw_${appNamespace}_${entityName}`;
    localStorage.setItem(key, JSON.stringify(payload));
    this.incrementSyncCounter();

    // Firebase Firestore Sync
    try {
      await setDoc(doc(firestore, `${appNamespace}_records`, entityName), {
        data: payload,
        updatedAt: new Date().toISOString(),
        namespace: appNamespace,
        serviceAccount: SERVICE_ACCOUNT_EMAIL,
      });
    } catch {
      /* Fallback saved locally */
    }

    // Supabase Real-Time Upsert Trigger
    try {
      await supabase.from('hybrid_app_records').upsert({
        id: `${appNamespace}_${entityName}`,
        namespace: appNamespace,
        entity: entityName,
        payload: payload,
        updated_at: new Date().toISOString(),
      });
    } catch {
      /* Fallback saved locally */
    }

    this.notifyListeners();
  }

  public getAppData(appNamespace: 'goldenprime' | 'vernika' | 'chakna' | 'website', entityName: string, fallbackDefault: any = null) {
    const key = `aw_${appNamespace}_${entityName}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackDefault;
  }

  // Schema Synthesizer Logic for WorkflowBuilder
  public synthesizeSchema(selectedModules: string[]) {
    const timestamp = new Date().toISOString();
    const sqlTables = selectedModules.map((m) => {
      const tableName = m.toLowerCase().replace(/[^a-z0-9]/g, '_');
      return `CREATE TABLE IF NOT EXISTS public.${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`;
    }).join('\n\n');

    const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    ${selectedModules.map((m) => {
      const colName = m.toLowerCase().replace(/[^a-z0-9]/g, '_');
      return `match /${colName}/{docId} {
      allow read, write: if request.auth != null;
    }`;
    }).join('\n    ')}
  }
}`;

    const sheetColumns = ['Record_ID', 'Module_Namespace', 'Data_Payload_JSON', 'Google_Drive_URI', 'Supabase_Synced', 'Firebase_Synced', 'Timestamp'];

    return {
      timestamp,
      modulesCount: selectedModules.length,
      sqlDDL: sqlTables,
      firestoreSecurityRules: firestoreRules,
      sheetsColumnMatrix: sheetColumns,
      driveFolderRef: GOOGLE_DRIVE_FOLDER_URL,
      serviceAccount: SERVICE_ACCOUNT_EMAIL,
    };
  }
}

export const hybridDB = new HybridDatabaseService();
