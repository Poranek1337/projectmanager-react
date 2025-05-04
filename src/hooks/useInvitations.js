import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useInvitations(user) {
  const [pendingInvites, setPendingInvites] = useState([]);

  useEffect(() => {
    if (user?.uid) {
      const fetchInvites = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setPendingInvites(userSnap.data().pendingInvites || []);
        }
      };
      fetchInvites();
    }
  }, [user]);

  const handleAcceptInvite = async (invite) => {
    const wsRef = doc(db, 'workspaces', invite.projectId);
    const wsSnap = await getDoc(wsRef);
    if (!wsSnap.exists()) return;
    const users = wsSnap.data().users || [];
    if (!users.some(u => u.uid === user.uid)) {
      await updateDoc(wsRef, {
        users: [...users, { uid: user.uid, role: 'user' }],
      });
    }
    // Usuń zaproszenie
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const invites = (userSnap.data().pendingInvites || []).filter(i => i.projectId !== invite.projectId);
    await updateDoc(userRef, { pendingInvites: invites });
    setPendingInvites(invites);
  };

  const handleRejectInvite = async (invite) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const invites = (userSnap.data().pendingInvites || []).filter(i => i.projectId !== invite.projectId);
    await updateDoc(userRef, { pendingInvites: invites });
    setPendingInvites(invites);
  };

  return { pendingInvites, handleAcceptInvite, handleRejectInvite };
} 