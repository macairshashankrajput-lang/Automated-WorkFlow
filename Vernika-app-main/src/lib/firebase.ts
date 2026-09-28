import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import supabaseConfig from '../../supabase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Keep a durable local cache for reconnects and coordinated browser tabs.
// Some restricted browsers do not support multi-tab persistence, so fall back
// to the standard Firestore client without preventing the app from starting.
let dbInstance;
try {
  dbInstance = initializeFirestore(
    app,
    { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
    firebaseConfig.firestoreDatabaseId
  );
} catch (error) {
  console.warn('Durable Firestore cache unavailable; using memory cache.', error);
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}
export const db = dbInstance;
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1');
export const googleProvider = new GoogleAuthProvider();

export interface ProvisionProfileInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee' | 'client';
  username?: string;
  loginEnabled?: boolean;
  [key: string]: unknown;
}

export async function provisionProfile(input: ProvisionProfileInput) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in with Firebase to create a profile.');
  const idToken = await currentUser.getIdToken();
  const response = await fetch(`${supabaseConfig.url}/functions/v1/${supabaseConfig.functionName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      apikey: supabaseConfig.publishableKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Profile provisioning failed (${response.status}).`);
  }
  return payload as { uid: string; email: string; role: string; collection: string; created: boolean };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection: Client is offline or initializing.");
    }
    return false;
  }
}

// Auth Helpers
export { signInWithEmailAndPassword };

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/user-cancelled' ||
      error?.message?.includes('popup-closed-by-user') ||
      error?.message?.includes('cancelled-popup-request')
    ) {
      // User closed the popup or cancelled the request - benign user action
      return null;
    }
    console.error("Google sign in error:", error);
    throw error;
  }
}

export interface WorkspaceDocumentRequest {
  documentType: string;
  templateId?: string;
  title?: string;
  employeeName?: string;
  parentFolderId?: string;
  mergeData: Record<string, unknown>;
}

export async function getWorkspaceConfig() {
  const callable = httpsCallable<unknown, { spreadsheetId: string; spreadsheetUrl: string; templates: Record<string, string>; secretValuesIncluded: false }>(functions, 'getWorkspaceConfig');
  const result = await callable({});
  return result.data;
}

export async function generateWorkspaceDocument(input: WorkspaceDocumentRequest) {
  const callable = httpsCallable<WorkspaceDocumentRequest, { documentId: string; name: string; webViewLink: string; documentType: string }>(functions, 'generateWorkspaceDocument');
  const result = await callable(input);
  return result.data;
}

export async function syncWorkspaceSheet(input: { spreadsheetId?: string; sheetName: string; rows: unknown[][]; direction?: string }) {
  const callable = httpsCallable<typeof input, { spreadsheetId: string; sheetName: string; rowsWritten: number }>(functions, 'syncWorkspaceSheet');
  const result = await callable(input);
  return result.data;
}

export async function syncAllWorkspaceSheets() {
  const callable = httpsCallable<Record<string, never>, { ok: boolean; results: Array<{ sheetName: string; rowsWritten: number }> }>(functions, 'syncAllWorkspaceSheets');
  const result = await callable({});
  return result.data;
}

export async function logOut() {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };
