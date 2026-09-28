import { initializeApp } from 'firebase/app';
import { getAuth, inMemoryPersistence, setPersistence, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, deleteDoc, doc, getFirestore, onSnapshot, query, setDoc, where } from 'firebase/firestore';

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0833693805.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0833693805',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
if (!config.apiKey) throw new Error('VITE_FIREBASE_API_KEY is required');

const accounts = {
  admin: { email: 'rajputsg@vernika.io', password: process.env.ADMIN_PASSWORD },
  nistha: { email: 'nistha@vernika.io', password: process.env.NISTHA_PASSWORD },
  aditya: { email: 'aditya@vernika.io', password: process.env.ADITYA_PASSWORD },
};
for (const [key, account] of Object.entries(accounts)) if (!account.password) throw new Error(`${key} password environment variable is required`);

const DATABASE_ID = process.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f';
const sessions = {};
async function login(key, account) {
  const app = initializeApp(config, `realtime-test-${key}`);
  const auth = getAuth(app);
  await setPersistence(auth, inMemoryPersistence);
  const credential = await signInWithEmailAndPassword(auth, account.email, account.password);
  sessions[key] = { app, auth, db: getFirestore(app, DATABASE_ID), uid: credential.user.uid };
}

const runId = `__realtime_test_${Date.now()}`;
const unsubscribers = [];
const seen = { nistha: false, aditya: false };
const events = [];
const tempTasks = {};

async function main() {
  await Promise.all(Object.entries(accounts).map(([key, account]) => login(key, account)));
  tempTasks.nistha = `${runId}_nistha`;
  tempTasks.aditya = `${runId}_aditya`;

  for (const key of ['nistha', 'aditya']) {
    const employee = sessions[key];
    const taskQuery = query(collection(employee.db, 'tasks'), where('assignedToId', '==', employee.uid));
    unsubscribers.push(onSnapshot(taskQuery, (snapshot) => {
      const match = snapshot.docs.find((item) => item.data().testRunId === runId);
      if (match && !seen[key]) {
        seen[key] = true;
        events.push({ account: key, event: 'added', taskId: match.id, receivedAt: new Date().toISOString() });
      }
    }, (error) => events.push({ account: key, event: 'listener-error', error: error.code || error.message })));
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));
  for (const key of ['nistha', 'aditya']) {
    const taskId = tempTasks[key];
    await setDoc(doc(sessions.admin.db, 'tasks', taskId), {
      id: taskId,
      title: 'Temporary realtime propagation verification',
      description: runId,
      status: 'Todo',
      priority: 'Low',
      assignedToId: sessions[key].uid,
      assignedTo: key === 'nistha' ? 'Nistha Singh' : 'Aditya Singh',
      testRunId: runId,
      createdBy: sessions.admin.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const deadline = Date.now() + 30000;
  while (!(seen.nistha && seen.aditya) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 250));
  if (!(seen.nistha && seen.aditya)) throw new Error(`Live propagation timeout: ${JSON.stringify({ seen, events })}`);
  console.log(JSON.stringify({ runId, authenticated: { admin: sessions.admin.uid, nistha: sessions.nistha.uid, aditya: sessions.aditya.uid }, propagation: seen, events }, null, 2));
}

try {
  await main();
} finally {
  for (const unsubscribe of unsubscribers) unsubscribe();
  if (sessions.admin?.db) {
    for (const taskId of Object.values(tempTasks)) {
      try { await deleteDoc(doc(sessions.admin.db, 'tasks', taskId)); } catch (error) { console.error(`Cleanup failed for ${taskId}: ${error.code || error.message}`); }
    }
  }
}
