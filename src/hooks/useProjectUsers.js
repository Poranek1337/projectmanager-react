import { useState, useEffect, useMemo } from 'react';
import { checkUserEmailExists, removeUserFromProject, updateUserRoleInProject } from '../services/projectUsersFirestore';
import { getUserFromFirestore } from '../services/userFirestore';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

export function useProjectUsers(project, currentUser, refresh) {
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState({});
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [success, setSuccess] = useState('');

  const canManage = currentUser?.uid === project.owner || project.users?.find(u => u.uid === currentUser?.uid && u.role === 'admin');

  useEffect(() => {
    const fetchUsers = async () => {
      if (project.users && project.users.length > 0) {
        const details = {};
        await Promise.all(project.users.map(async (u) => {
          const data = await getUserFromFirestore(db, u.uid);
          if (data) details[u.uid] = data;
        }));
        setUserDetails(details);
      } else {
        setUserDetails({});
      }
    };
    fetchUsers();
  }, [project.users]);

  const handleCheckEmail = async (e) => {
    setEmail(e.target.value);
    setError('');
    setSuccess('');
    if (e.target.value.includes('@')) {
      const user = await checkUserEmailExists(e.target.value);
      setEmailValid(!!user);
    } else {
      setEmailValid(null);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    const user = await checkUserEmailExists(email);
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setError('Nie znaleziono użytkownika.');
        setLoading(false);
        return;
      }
      let pendingInvites = userSnap.data().pendingInvites || [];
      const now = Date.now();
      pendingInvites = pendingInvites.filter(inv => inv && inv.projectId && (!inv.expiresAt || (inv.expiresAt.toDate ? inv.expiresAt.toDate().getTime() : inv.expiresAt) > now));
      pendingInvites = pendingInvites.map(inv => ({
        projectId: inv?.projectId || '',
        projectName: inv?.projectName || '',
        ownerId: inv?.ownerId || '',
        ownerEmail: inv?.ownerEmail || '',
        expiresAt: inv?.expiresAt || null,
      }));
      if (pendingInvites.some(inv => inv.projectId === project.id)) {
        setError('Zaproszenie już zostało wysłane.');
        setLoading(false);
        return;
      }
      await updateDoc(userRef, {
        pendingInvites: [
          ...pendingInvites,
          {
            projectId: project.id || '',
            projectName: project.name || '',
            ownerId: currentUser.uid || '',
            ownerEmail: currentUser.email || '',
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 3600 * 1000)),
          },
        ],
      });
      setSuccess('Zaproszenie zostało wysłane!');
      setEmail('');
      setEmailValid(null);
      refresh();
    } else {
      setError('Nie znaleziono użytkownika o tym adresie email.');
    }
    setLoading(false);
  };

  const handleRemove = async (uid) => {
    setLoading(true);
    await removeUserFromProject(project.id, uid);
    refresh();
    setLoading(false);
  };

  const handleRoleChange = async (uid, currentRole) => {
    setLoading(true);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await updateUserRoleInProject(project.id, uid, newRole);
    refresh();
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    if (!project.users) return [];
    return project.users
      .map(u => ({ ...u, ...userDetails[u.uid] }))
      .filter(u => {
        const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        return (
          name.includes(search.toLowerCase()) ||
          email.includes(search.toLowerCase()) ||
          u.uid.includes(search)
        );
      })
      .sort((a, b) => {
        const roleOrder = { owner: 0, admin: 1, user: 2 };
        return (roleOrder[a.role] - roleOrder[b.role]) || (a.firstName || '').localeCompare(b.firstName || '');
      });
  }, [project.users, userDetails, search]);

  const handleLeaveProject = async () => {
    if (!window.confirm('Czy na pewno chcesz opuścić ten projekt?')) return;
    setLoading(true);
    const wsRef = doc(db, 'workspaces', project.id);
    const wsSnap = await getDoc(wsRef);
    if (!wsSnap.exists()) {
      setError('Projekt nie istnieje.');
      setLoading(false);
      return;
    }
    const members = wsSnap.data().members || [];
    const users = wsSnap.data().users || [];
    const newMembers = members.filter(uid => uid !== currentUser.uid);
    const newUsers = users.filter(u => u.uid !== currentUser.uid);
    await updateDoc(wsRef, {
      members: newMembers,
      users: newUsers,
    });
    setLoading(false);
    window.location.reload();
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten projekt? Tej operacji nie można cofnąć!')) return;
    setLoading(true);
    const wsRef = doc(db, 'workspaces', project.id);
    await deleteDoc(wsRef);
    setLoading(false);
    window.location.reload();
  };

  return {
    email, emailValid, loading, error, userDetails, search, menuOpen, success,
    setEmail, setSearch, setMenuOpen,
    canManage, handleCheckEmail, handleAdd, handleRemove, handleRoleChange,
    filteredUsers, handleLeaveProject, handleDeleteProject
  };
} 