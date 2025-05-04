import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';


export const createWorkspace = async (db, userUid, { title, description, color }) => {
  if (!userUid) throw new Error('Brak UID użytkownika');

  const wsDocRef = await addDoc(collection(db, 'workspaces'), {
    title,
    description,
    color,
    createdAt: serverTimestamp(),
    owner: userUid,
  });

  const userRef = doc(db, 'users', userUid);
  await updateDoc(userRef, {
    workspaces: arrayUnion(wsDocRef.id)
  });

  const wsSnap = await getDoc(wsDocRef);
  return { id: wsDocRef.id, ...wsSnap.data() };
};


export const getUserWorkspaces = async (db, userUid) => {
  const userRef = doc(db, 'users', userUid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return [];
  const userData = userSnap.data();
  const workspaceIds = userData.workspaces || [];
  const ws = [];
  for (const wsId of workspaceIds) {
    const wsRef = doc(db, 'workspaces', wsId);
    const wsSnap = await getDoc(wsRef);
    if (wsSnap.exists()) {
      ws.push({ id: wsSnap.id, ...wsSnap.data() });
    }
  }
  return ws;
};

export const getWorkspaceById = async (db, id) => {
  const wsRef = doc(db, 'workspaces', id);
  const wsSnap = await getDoc(wsRef);
  if (!wsSnap.exists()) return null;
  return { id: wsSnap.id, ...wsSnap.data() };
}; 