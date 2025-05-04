import { db } from '../infrastructure/firebase/firebase.js';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

export const checkUserEmailExists = async (email) => {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { uid: snap.docs[0].id, ...snap.docs[0].data() };
};

export const addUserToProject = async (projectId, userUid, role = 'user') => {
  const wsRef = doc(db, 'workspaces', projectId);
  const wsSnap = await getDoc(wsRef);
  if (!wsSnap.exists()) throw new Error('Projekt nie istnieje');
  const users = wsSnap.data().users || [];
  // Nie dodawaj duplikatów
  if (users.some(u => u.uid === userUid)) return;
  await updateDoc(wsRef, {
    users: [...users, { uid: userUid, role }]
  });
};

export const removeUserFromProject = async (projectId, userUid) => {
  const wsRef = doc(db, 'workspaces', projectId);
  const wsSnap = await getDoc(wsRef);
  if (!wsSnap.exists()) throw new Error('Projekt nie istnieje');
  const users = wsSnap.data().users || [];
  const updated = users.filter(u => u.uid !== userUid);
  await updateDoc(wsRef, { users: updated });
};

export const updateUserRoleInProject = async (projectId, userUid, newRole) => {
  const wsRef = doc(db, 'workspaces', projectId);
  const wsSnap = await getDoc(wsRef);
  if (!wsSnap.exists()) throw new Error('Projekt nie istnieje');
  const users = wsSnap.data().users || [];
  const updated = users.map(u => u.uid === userUid ? { ...u, role: newRole } : u);
  await updateDoc(wsRef, { users: updated });
}; 