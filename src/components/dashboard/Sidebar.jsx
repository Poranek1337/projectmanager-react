import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { getUserFromLocalStorage, getUserUidFromLocalStorage } from '../../storage/userLocalStorage';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import CreateWorkspaceDialog from './CreateWorkspaceDialog';
import { Button } from '../ui/button';
import { getUserFromFirestore } from '../../services/userFirestore';
import SettingsDialog from './SettingsDialog';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { createWorkspace } from '../../services/workspaceFirestore';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [myWorkspaces, setMyWorkspaces] = useState([]);
  const [sharedWorkspaces, setSharedWorkspaces] = useState([]);
  const [sharedOwners, setSharedOwners] = useState({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const user = getUserFromLocalStorage();
  const uid = user?.uid || getUserUidFromLocalStorage();
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const fetchWorkspaces = async () => {
    if (uid) {
      // Moje projekty (owner)
      const qMy = query(collection(db, 'workspaces'), where('owner', '==', uid));
      const mySnapshot = await getDocs(qMy);
      const my = [];
      mySnapshot.forEach((doc) => {
        my.push({ id: doc.id, ...doc.data() });
      });
      setMyWorkspaces(my);
      // Udostępnione (członek, ale nie owner)
      const qShared = query(collection(db, 'workspaces'), where('members', 'array-contains', uid));
      const sharedSnapshot = await getDocs(qShared);
      const shared = [];
      const ownerUids = new Set();
      sharedSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.owner !== uid) {
          shared.push({ id: doc.id, ...data });
          ownerUids.add(data.owner);
        }
      });
      setSharedWorkspaces(shared);
      // Pobierz dane właścicieli
      const owners = {};
      await Promise.all(Array.from(ownerUids).map(async (ownerUid) => {
        const ownerData = await getUserFromFirestore(db, ownerUid);
        owners[ownerUid] = ownerData;
      }));
      setSharedOwners(owners);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    // eslint-disable-next-line
  }, [uid, createDialogOpen]);

  useEffect(() => {
    const fetchPendingInvites = async () => {
      if (uid) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setPendingInvitesCount((userSnap.data().pendingInvites || []).length);
        }
      }
    };
    fetchPendingInvites();
  }, [uid]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.reload();
  };

  const handleCreateWorkspace = async ({ title, color, description }) => {
    try {
      await createWorkspace(db, uid, { title, color, description });
      setCreateDialogOpen(false);
      fetchWorkspaces();
    } catch (err) {
      alert('Błąd podczas tworzenia workspace: ' + (err.message || err));
    }
  };

  return (
    <>
      <aside className="w-64 bg-white border-r flex flex-col p-6 gap-4 shadow-xl">
        <div className="flex items-center gap-2 mb-8">
          <img src="/assets/logo.svg" alt="Logo" className="w-7 h-7" />
          <span className="text-lg font-semibold text-indigo-600 tracking-tight">ProjectManager</span>
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          <a href="/dashboard" className={`font-semibold rounded-lg px-3 py-2 ${location.pathname === '/dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-100'}`}>Dashboard</a>
          <a href="/my-tasks" className={`text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2 ${location.pathname === '/my-tasks' ? 'text-indigo-600 bg-indigo-50' : ''}`}>My Tasks</a>
          <a
            href="/invitations"
            className={`text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2 flex justify-between ${location.pathname === '/invitations' ? 'text-indigo-600 bg-indigo-50' : ''}`}
          >
            Invitations
            {pendingInvitesCount > 0 && (
              <span className="flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold rounded-full w-6 h-6 text-xs ml-2 shadow-sm">
                {pendingInvitesCount}
              </span>
            )}
          </a>
          <div className="mt-4 text-xs text-gray-400 uppercase tracking-wider">Analyze</div>
          <a href="#" className="text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2">Milestone</a>
          <a href="#" className="text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2">Project Based</a>
          <a href="#" className="text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2">Achieved Recently</a>
          <a href="#" className="text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2">Reporting</a>
          <div className="mt-4 text-xs text-gray-400 uppercase tracking-wider">Workspace</div>
          {/* My projects */}
          <div className="text-xs text-gray-500 font-semibold mt-2 mb-1 ml-2">My projects</div>
          {myWorkspaces.length === 0 && (
            <span className="text-gray-400 text-xs px-3">Brak własnych projektów</span>
          )}
          {myWorkspaces.map(ws => {
            const isActive = location.pathname === `/project/${ws.id}`;
            return (
              <a
                key={ws.id}
                href="#"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer ${isActive ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                style={{ borderLeft: `4px solid ${ws.color}` }}
                onClick={e => {
                  e.preventDefault();
                  navigate(`/project/${ws.id}`);
                }}
              >
                <span className="w-3 h-3 rounded-full" style={{ background: ws.color }}></span>
                {ws.title}
              </a>
            );
          })}
          {/* Shared projects */}
          <div className="text-xs text-gray-500 font-semibold mt-4 mb-1 ml-2">Shared</div>
          {sharedWorkspaces.length === 0 && (
            <span className="text-gray-400 text-xs px-3">Brak udostępnionych projektów</span>
          )}
          {sharedWorkspaces.map(ws => {
            const isActive = location.pathname === `/project/${ws.id}`;
            const owner = sharedOwners[ws.owner];
            return (
              <a
                key={ws.id}
                href="#"
                className={`flex flex-col items-start gap-0 rounded-lg px-3 py-2 cursor-pointer ${isActive ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                style={{ borderLeft: `4px solid ${ws.color}` }}
                onClick={e => {
                  e.preventDefault();
                  navigate(`/project/${ws.id}`);
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: ws.color }}></span>
                  {ws.title}
                </div>
                <span className="text-xs text-gray-400 ml-5">Właściciel: {owner ? (owner.firstName || owner.email || owner.uid) : '...'}</span>
              </a>
            );
          })}
          <a href="#" className="text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-2 font-medium" onClick={e => { e.preventDefault(); setCreateDialogOpen(true); }}>+ Create Workspace</a>
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <a href="#" className="text-gray-400 text-sm">Help center</a>
          <button type="button" className="text-gray-400 text-sm hover:text-indigo-600 transition-colors text-left" onClick={() => setSettingsOpen(true)}>
            Ustawienia profilu
          </button>
        </div>
        <CreateWorkspaceDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handleCreateWorkspace}
          userUid={uid}
        />
      </aside>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} onLogout={handleLogout} />
    </>
  );
};

export default Sidebar; 