import React, { useState, useEffect, useContext } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import SettingsDialog from './SettingsDialog';
import { AuthContext } from '../../App';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getUserFromLocalStorage, getUserUidFromLocalStorage } from '../../storage/userLocalStorage';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useInvitations } from '../../hooks/useInvitations';
import { getUserWorkspaces } from '../../services/workspaceFirestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getUserFromFirestore } from '../../services/userFirestore';
import { ChartContainer } from '../ui/chart';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer as RechartsResponsiveContainer, Legend as RechartsLegend, LabelList } from 'recharts';
import { useAuth } from '../../hooks/auth/useAuth';

function getInitials(name, surname) {
  if (!name && !surname) return '?';
  return `${name?.[0] || ''}${surname?.[0] || ''}`.toUpperCase() || '?';
}

function getProfileFromStorage() {
  try {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

function saveProfileToStorage(profile) {
  const completeProfile = { 
    ...profile
  };
  localStorage.setItem('user', JSON.stringify(completeProfile));
}

const Dashboard = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const { profile, user, setProfile, setUser, handleProfileChange, handleProfileSave } = useUserProfile();
  const { pendingInvites, handleAcceptInvite, handleRejectInvite } = useInvitations(user);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const authContext = useContext(AuthContext);
  const [stats, setStats] = useState([
    { label: 'Do zrobienia', value: 0, description: 'Zadania do zrobienia' },
    { label: 'W trakcie', value: 0, description: 'Zadania w trakcie realizacji' },
    { label: 'Zrobione', value: 0, description: 'Zadania ukończone' },
  ]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [workspaceTitles, setWorkspaceTitles] = useState({});
  const [assigneesMap, setAssigneesMap] = useState({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      let uid = user?.uid || getUserUidFromLocalStorage();
      if (!uid) return;
      // Pobierz wszystkie workspace'y, gdzie user jest ownerem lub członkiem
      const workspaces = await getUserWorkspaces(db, uid);
      const workspaceIds = workspaces.map(ws => ws.id);
      // Stwórz mapę id -> title
      const wsTitles = {};
      workspaces.forEach(ws => { wsTitles[ws.id] = ws.title; });
      setWorkspaceTitles(wsTitles);
      // Pobierz wszystkie taski ze wszystkich tych projektów
      let allTasks = [];
      for (const wsId of workspaceIds) {
        const q = query(collection(db, 'tasks'), where('projectId', '==', wsId));
        const snap = await getDocs(q);
        allTasks = allTasks.concat(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      // Pobierz dane wszystkich unikalnych assignedUserIds
      const allUserIds = Array.from(new Set(allTasks.flatMap(t => t.assignedUserIds || [])));
      const assignees = {};
      await Promise.all(allUserIds.map(async (uid) => {
        if (!assignees[uid]) {
          const user = await getUserFromFirestore(db, uid);
          assignees[uid] = user;
        }
      }));
      setAssigneesMap(assignees);
      // Statystyki
      const todo = allTasks.filter(t => t.status === 'TODO').length;
      const inProgress = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const done = allTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
      setStats([
        { label: 'Do zrobienia', value: todo, description: 'Zadania do zrobienia' },
        { label: 'W trakcie', value: inProgress, description: 'Zadania w trakcie realizacji' },
        { label: 'Zrobione', value: done, description: 'Zadania ukończone' },
      ]);
      // Ostatnio dodane (ze wszystkich projektów, sortuj po dacie lub id)
      const sortedAll = [...allTasks].sort((a, b) => {
        const aTime = a.createdAt?.seconds || (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() / 1000 : 0);
        const bTime = b.createdAt?.seconds || (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() / 1000 : 0);
        if (bTime !== aTime) return bTime - aTime;
        // Fallback: sortuj po id jeśli brak daty lub są równe
        return b.id.localeCompare(a.id);
      });
      setRecentlyAdded(sortedAll.slice(0, 6).map(t => ({ name: t.title, project: t.projectId })));
      // Zadania przypisane do mnie
      const assigned = allTasks.filter(t => t.assignedUserIds?.includes(uid));
      setAssignedTasks(assigned.map(t => ({
        ...t,
        name: t.title,
        assignees: t.assignedUserIds?.length || 0,
        project: t.projectId,
        due: t.dueDate ? new Date(t.dueDate.seconds * 1000).toLocaleDateString() : '-',
        notes: t.notes ? t.notes.length : '-',
        status: t.status
      })));
    };
    fetchDashboardData();
    // Dodaj listener na zmiany w taskach jeśli chcesz live update (np. przez onSnapshot)
  }, [user]);

  useEffect(() => {
    if (authUser) {
      const stored = localStorage.getItem('user');
      if (stored) {
        setProfile(JSON.parse(stored));
        setUser(authUser);
      } else {
        // Jeśli nie ma w localStorage, pobierz z authUser i zapisz do localStorage
        const newProfile = {
          firstName: authUser.displayName?.split(' ')[0] || '',
          lastName: authUser.displayName?.split(' ')[1] || '',
          photo: authUser.photoURL || '',
        };
        setProfile(newProfile);
        setUser(authUser);
        localStorage.setItem('user', JSON.stringify(newProfile));
      }
    }
  }, [authUser, setProfile, setUser]);

  if (authLoading || (!authUser && !user)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-lg text-zinc-500">Ładowanie...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              {profile?.photo ? (
                <img 
                  src={profile.photo} 
                  alt="Profilowe" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 shadow-md" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                    setProfile(prev => ({ ...prev, photo: '' }));
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center border-2 border-indigo-500 shadow-md">
                  <span className="text-xl font-bold text-indigo-700">{getInitials(profile.firstName, profile.lastName)}</span>
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Dzień dobry, {(() => {
                    const localUser = getUserFromLocalStorage();
                    if (localUser?.firstName && localUser.firstName.length > 0) {
                      return localUser.firstName;
                    } else if (localUser?.email) {
                      return localUser.email.split('@')[0];
                    } else {
                      return 'Użytkowniku';
                    }
                  })()}!
                </h1>
                <p className="text-gray-400 text-sm">Short description will be placed right over here</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-300">Customize</Button>
          <Button className="bg-indigo-600 text-white">+ Create New</Button>
        </div>
      </div>
      <div className="flex gap-4 mb-8">
        <Button variant={activeTab === 'dashboard' ? 'default' : 'outline'} onClick={() => setActiveTab('dashboard')}>Dashboard</Button>
      </div>
      {activeTab === 'dashboard' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6 flex flex-col gap-2 bg-white shadow-sm">
                <div className="text-3xl font-bold text-indigo-600">{stat.value}</div>
                <div className="text-gray-900 font-semibold">{stat.label}</div>
                <div className="text-gray-400 text-sm">{stat.description}</div>
                <Button variant="outline" className="mt-2 w-fit border-gray-200">View details →</Button>
              </Card>
            ))}
          </div>
          {/* Recently Added & Task Completion Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-white shadow-sm">
              <div className="font-semibold mb-2">Recently Added</div>
              <ul className="text-gray-700 text-sm divide-y">
                {recentlyAdded.map((item, idx) => (
                  <li key={idx} className="py-2 flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-gray-400">/ {workspaceTitles[item.project] ? `w ${workspaceTitles[item.project]}` : ''}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 bg-white shadow-sm flex flex-col">
              <div className="font-semibold mb-2">Task Completion Rate</div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <ChartContainer className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
                  <RechartsResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 14, fontWeight: 500 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 14, fontWeight: 500 }} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: 12, background: '#fff', boxShadow: '0 4px 24px #6366f122' }}
                        itemStyle={{ fontWeight: 500 }}
                        labelStyle={{ color: '#6366f1', fontWeight: 600 }}
                      />
                      <RechartsLegend verticalAlign="bottom" height={36} />
                      <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1200}>
                        <LabelList dataKey="value" position="top" fontSize={16} fontWeight={600} fill="#333" />
                      </Bar>
                    </BarChart>
                  </RechartsResponsiveContainer>
                </ChartContainer>
              </div>
            </Card>
          </div>
          {/* Assigned to me */}
          <Card className="p-6 bg-white shadow-sm mb-8">
            <div className="font-semibold mb-2">Assigned to me</div>
            <div className="flex gap-4 mb-2 text-sm">
              <span className="font-medium text-indigo-600">Wszystkie zadania {assignedTasks.length}</span>
              <span className="text-gray-400">Zrobione {assignedTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length}</span>
              <span className="text-gray-400">Delegowane {assignedTasks.filter(t => (t.assignedUserIds?.length || 0) > 1).length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left">
                    <th className="py-2">Task Name</th>
                    <th className="py-2">Assignee</th>
                    <th className="py-2">Projects</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedTasks.map((task, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2">{task.name}</td>
                      <td className="py-2">
                        {Array.isArray(task.assignedUserIds) && task.assignedUserIds.length > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            {task.assignedUserIds.map((uid, i) => {
                              const user = assigneesMap[uid];
                              let initials = '?';
                              if (user) {
                                initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
                              }
                              return (
                                <span key={i} className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white -ml-2 first:ml-0 flex items-center justify-center text-xs font-bold text-gray-600">
                                  {initials !== '' ? initials.toUpperCase() : '?'}
                                </span>
                              );
                            })}
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td className="py-2">{workspaceTitles[task.project] ? workspaceTitles[task.project] : task.project}</td>
                      <td className="py-2">{task.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      {activeTab === 'invitations' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Zaproszenia do projektów</h2>
          {pendingInvites.length === 0 ? (
            <div className="text-gray-500">Brak zaproszeń.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="py-2">Projekt</th>
                  <th className="py-2">Właściciel (email)</th>
                  <th className="py-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvites.map((invite, idx) => (
                  <tr key={invite.projectId} className="border-t">
                    <td className="py-2">{invite.projectName}</td>
                    <td className="py-2">{invite.ownerEmail}</td>
                    <td className="py-2 flex gap-2">
                      <Button size="sm" className="bg-green-600 text-white" onClick={() => handleAcceptInvite(invite)}>Akceptuj</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectInvite(invite)}>Odrzuć</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} onLogout={authContext?.handleLogout} />
    </>
  );
};

export default Dashboard;