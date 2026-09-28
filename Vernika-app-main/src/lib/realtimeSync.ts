// Real-Time Multi-Device & Cross-Tab Synchronization Engine
import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

export interface SyncPayload {
  type: string;
  collectionName: string;
  data: any;
  timestamp: number;
  senderId?: string;
}

// 1. BroadcastChannel for instant local cross-tab communication
const CLIENT_INSTANCE_ID = typeof window !== 'undefined' 
  ? `inst-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` 
  : 'server';

let broadcastChannel: BroadcastChannel | null = null;

type IdentityResolver = (value: string) => string;
let identityResolver: IdentityResolver = (value) => value;
const IDENTITY_FIELDS = new Set(['employeeId', 'senderId', 'recipientId', 'targetUserId', 'userId', 'ownerId', 'assignedToId', 'assigneeId', 'createdBy', 'reviewerId']);

export function setIdentityResolver(resolver: IdentityResolver) {
  identityResolver = resolver;
}

export function normalizeRemoteRecord<T extends Record<string, any>>(record: T): T {
  const normalized = { ...record } as Record<string, any>;
  for (const key of IDENTITY_FIELDS) {
    if (typeof normalized[key] === 'string' && normalized[key]) normalized[key] = identityResolver(normalized[key]);
  }
  if (Array.isArray(normalized.readBy)) normalized.readBy = normalized.readBy.map((value: unknown) => typeof value === 'string' ? identityResolver(value) : value);
  return normalized as T;
}

function normalizeWriteData(data: any): any {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const normalized = { ...data };
  for (const key of IDENTITY_FIELDS) {
    if (typeof normalized[key] === 'string' && normalized[key]) normalized[key] = identityResolver(normalized[key]);
  }
  if (Array.isArray(normalized.readBy)) normalized.readBy = normalized.readBy.map((value: unknown) => typeof value === 'string' ? identityResolver(value) : value);
  return normalized;
}
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('vernika_realtime_bus');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported or failed to initialize:', e);
}

export function broadcastEvent(type: string, collectionName: string, data: any, senderId?: string) {
  const payload: SyncPayload = {
    type,
    collectionName,
    data,
    timestamp: Date.now(),
    senderId: senderId || CLIENT_INSTANCE_ID
  };

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (err) {
      console.warn('BroadcastChannel postMessage notice:', err);
    }
  }
}

export function onBroadcastEvent(callback: (payload: SyncPayload) => void): () => void {
  const channelListener = (event: MessageEvent) => {
    if (event.data && event.data.collectionName && event.data.senderId !== CLIENT_INSTANCE_ID) {
      callback(event.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', channelListener);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', channelListener);
    }
  };
}

// Safe Firestore Write with error recovery & deep sanitization
export function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj === 'function') return null;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore).filter((v) => v !== undefined);
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      // Never persist credentials or bearer material in a client-readable
      // collection. Authentication belongs to Firebase Auth, not documents.
      if (/^(password|passwordHash|token|accessToken|refreshToken|secret)$/i.test(key)) continue;
      const val = obj[key];
      if (val !== undefined) cleaned[key] = sanitizeForFirestore(val);
    }
    return cleaned;
  }
  return obj;
}

export async function syncDocToFirestore(collectionName: string, docId: string, data: any): Promise<boolean> {
  if (!auth.currentUser) {
    console.warn(`Firestore write skipped for ${collectionName}/${docId}: no authenticated Firebase user.`);
    return false;
  }
  const cleanId = String(docId).replace(/[^a-zA-Z0-9_\-]/g, '_');
  const docRef = doc(db, collectionName, cleanId);
  const sanitizedData = sanitizeForFirestore({
    ...normalizeWriteData(data),
    updatedAt: new Date().toISOString(),
    updatedByUid: auth.currentUser.uid,
    updatedByEmail: auth.currentUser.email || null,
  });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await setDoc(docRef, sanitizedData, { merge: true });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vernika:firestore-mutation', {
          detail: { collectionName, docId: cleanId, type: 'upsert' }
        }));
      }
      return true;
    } catch (err) {
      if (attempt === 2) {
        console.error(`Firestore sync failed for ${collectionName}/${docId}:`, err);
        throw err instanceof Error ? err : new Error(`Firestore sync failed for ${collectionName}/${docId}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  return false;
}

export async function deleteDocFromFirestore(collectionName: string, docId: string): Promise<boolean> {
  if (!auth.currentUser) {
    console.warn(`Firestore delete skipped for ${collectionName}/${docId}: no authenticated Firebase user.`);
    return false;
  }
  try {
    const cleanId = String(docId).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const docRef = doc(db, collectionName, cleanId);
    await deleteDoc(docRef);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vernika:firestore-mutation', {
        detail: { collectionName, docId: cleanId, type: 'delete' }
      }));
    }
    return true;
  } catch (err) {
    console.error(`Firestore delete failed for ${collectionName}/${docId}:`, err);
    throw err instanceof Error ? err : new Error(`Firestore delete failed for ${collectionName}/${docId}`);
  }
}

// 3. Batch seed helper if collection is empty
export async function seedCollectionIfEmpty<T extends { id: string }>(
  collectionName: string,
  initialItems: T[]
): Promise<void> {
  // Fixture seeding is strictly local-development-only; never repopulate production.
  const isLocalDevelopment = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isLocalDevelopment) return;
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (snap.empty && initialItems && initialItems.length > 0) {
      const batch = writeBatch(db);
      initialItems.slice(0, 50).forEach((item) => {
        const cleanId = String(item.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
        const dRef = doc(db, collectionName, cleanId);
        batch.set(dRef, sanitizeForFirestore(item));
      });
      await batch.commit();
      console.log(`Successfully seeded ${collectionName} with initial dataset.`);
    }
  } catch (err) {
    console.warn(`Seed check notice for ${collectionName}:`, err);
  }
}

export async function seedMissingDocuments<T extends { id: string }>(
  collectionName: string,
  initialItems: T[]
): Promise<void> {
  return seedCollectionIfEmpty(collectionName, initialItems);
}
