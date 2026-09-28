const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp();
const auth = admin.auth();
const db = getFirestore(admin.app(), 'ai-studio-vernikaapp-8707d070-17aa-4c19-ac02-f2098c36884f');

const profiles = [
  { name: 'Shashank Rajput', username: 'shashank', email: 'shashank@vernika.io', role: 'admin', department: 'Engineering & Technology', position: 'Chief Technology Officer & Administrator' },
  { name: 'Elena Rostova', username: 'elena', email: 'elena@vernika.io', role: 'admin', department: 'Product & Design', position: 'VP of Product Experience' },
  { name: 'Marcus Vance', username: 'marcus', email: 'marcus@vernika.io', role: 'admin', department: 'Sales & Business Dev', position: 'Head of Global Sales' },
  { name: 'Priya Sharma', username: 'priya', email: 'priya@vernika.io', role: 'employee', department: 'Engineering & Technology', position: 'Senior Cloud Engineer' },
  { name: "Liam O'Connor", username: 'liam', email: 'liam@vernika.io', role: 'employee', department: 'Engineering & Technology', position: 'Full Stack Developer' },
  { name: 'Aria Montgomery', username: 'aria', email: 'aria@vernika.io', role: 'employee', department: 'Marketing & Growth', position: 'Growth Marketing Director' },
  { name: 'David Chen', username: 'david', email: 'david@vernika.io', role: 'employee', department: 'Finance & Operations', position: 'Finance Operations Manager' },
  { name: 'Rachel Green', username: 'rachel', email: 'rachel@vernika.io', role: 'employee', department: 'Human Resources', position: 'Senior Talent Acquisition Specialist' },
  { name: 'Alexander Cross', username: 'client_apex', email: 'alex@apexfinancials.com', role: 'client', company: 'Apex Global Financials' },
  { name: 'Sarah Jenkins', username: 'client_peak', email: 'sarah@peakvc.com', role: 'client', company: 'Peak Venture Capital' },
  { name: 'Carlos Rivera', username: 'client_vanguard', email: 'carlos@vanguardlogistics.com', role: 'client', company: 'Vanguard Logistics' },
];

async function upsertAuthUser(profile) {
  let user;
  try {
    user = await auth.getUserByEmail(profile.email);
    user = await auth.updateUser(user.uid, {
      displayName: profile.name,
      password: 'password123',
      disabled: false,
    });
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
    user = await auth.createUser({
      email: profile.email,
      password: 'password123',
      displayName: profile.name,
      disabled: false,
    });
  }
  if (profile.role === 'admin') {
    await auth.setCustomUserClaims(user.uid, { admin: true });
    await db.doc(`admins/${user.uid}`).set({ uid: user.uid, email: profile.email, role: 'admin', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  return user;
}

async function main() {
  for (const profile of profiles) {
    const user = await upsertAuthUser(profile);
    const collectionName = profile.role === 'client' ? 'clients' : 'employees';
    await db.doc(`${collectionName}/${user.uid}`).set({
      ...profile,
      id: user.uid,
      firebaseUid: user.uid,
      loginEnabled: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      migratedFrom: profile.username,
    }, { merge: true });
    console.log(`${profile.role.padEnd(8)} ${profile.email} -> ${user.uid}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
