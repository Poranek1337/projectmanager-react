import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getWorkspaceById } from '../services/workspaceFirestore';
import { db } from '@/infrastructure/firebase/firebase.js';
import { motion, useAnimation, useInView } from 'framer-motion';
import ProjectUsersPanel from '../components/project/ProjectUsersPanel';
import { getUserFromLocalStorage } from '../storage/userLocalStorage';
import { getUserFromFirestore } from '../services/userFirestore';
import InvitePopup from '../components/project/InvitePopup';
import { getTasksForProject, addTaskToProject, addNoteToTask, updateTaskStatus, updateTask, deleteTask } from '../services/taskFirestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TaskDataTableTanstack from '../components/project/TaskDataTableTanstack';
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, Legend, Pie, PieChart, Cell, ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../components/ui/chart';
import { Users, CheckCircle2, ListTodo } from 'lucide-react';
import { getInitials } from "@/utils/getInitials";
import UserAvatar from "@/components/ui/UserAvatar";

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function KanbanColumn({ status, tasks, users, currentUser }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={
      `flex-1 min-w-[300px] bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 mx-2 shadow-md transition-all duration-150 ${isOver ? 'ring-2 ring-indigo-400' : ''}`
    }>
      <h3 className="font-bold text-lg mb-4 text-zinc-700 dark:text-zinc-200">{status === 'TODO' ? 'Do zrobienia' : status === 'IN_PROGRESS' ? 'W trakcie' : 'Zrobione'}</h3>
      <SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
        {tasks.map(task => (
          <KanbanTaskCard key={task.id} task={task} users={users} currentUser={currentUser} />
        ))}
      </SortableContext>
    </div>
  );
}

function KanbanTaskCard({ task, users, currentUser }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  const assignedUsers = users.filter(u => task.assignedUserIds.includes(u.uid));
  const maxAvatars = 3;
  const visibleUsers = assignedUsers.slice(0, maxAvatars);
  const extraCount = assignedUsers.length - maxAvatars;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-4 bg-white dark:bg-zinc-800 rounded-lg shadow p-4 border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{task.title}</span>
        <div className={
          visibleUsers.length > 1
            ? "flex items-center -space-x-3"
            : "flex items-center"
        }>
          {visibleUsers.map((u, idx) => (
            <UserAvatar
              key={u.uid}
              user={u}
              className="border-2 border-white dark:border-zinc-800 rounded-full bg-zinc-200 text-zinc-700 font-bold text-xs"
              size="w-8 h-8"
              style={visibleUsers.length > 1 ? { zIndex: 10 - idx } : {}}
            />
          ))}
          {extraCount > 0 && (
            <span
              className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs border-2 border-white dark:border-zinc-800"
              style={{ zIndex: 10 - maxAvatars }}
            >
              +{extraCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function UserMultiSelect({ users, value, onChange, placeholder = "Wybierz użytkowników" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = React.useRef(null);
  const filtered = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const handleSelect = (uid) => {
    if (value.includes(uid)) {
      onChange(value.filter(id => id !== uid));
    } else {
      onChange([...value, uid]);
    }
    setOpen(false);
  };
  // Zamykaj dropdown po kliknięciu poza nim
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex flex-wrap gap-2 mb-1 min-h-[36px]">
        {value.map(uid => {
          const u = users.find(u => u.uid === uid);
          if (!u) return null;
          return (
            <span key={uid} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-xs max-w-[120px] truncate">
              <UserAvatar user={u} className="w-5 h-5" size="w-5 h-5" />
              <span>{
                (u.firstName || u.lastName)
                  ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                  : (u.email
                      ? u.email
                      : (u.role === 'owner' ? 'Właściciel' : (u.uid || 'Nieznany')))
              }</span>
              <button type="button" className="ml-1 text-zinc-400 hover:text-red-500" onClick={() => onChange(value.filter(id => id !== uid))}>&times;</button>
            </span>
          );
        })}
      </div>
      <div
        tabIndex={0}
        className="w-full flex items-center justify-between border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md px-3 py-2 text-sm cursor-pointer focus:ring-2 focus:ring-indigo-500 transition shadow-sm"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={"text-zinc-400 select-none" + (value.length ? " hidden" : "")}>{placeholder}</span>
        <span className="ml-auto text-zinc-400">▼</span>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-700 max-h-56 overflow-auto animate-fade-in">
          <input
            type="text"
            autoFocus
            placeholder="Szukaj..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-transparent outline-none text-sm mb-1"
          />
          <ul role="listbox">
            {filtered.length === 0 && (
              <li className="px-4 py-2 text-zinc-400 text-sm">Brak wyników</li>
            )}
            {filtered.filter(u => u && u.uid).map(u => (
              <li
                key={u.uid}
                role="option"
                aria-selected={value.includes(u.uid)}
                className={
                  "flex items-center gap-2 px-4 py-2 cursor-pointer select-none transition-colors rounded " +
                  (value.includes(u.uid)
                    ? "bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100")
                }
                onClick={() => handleSelect(u.uid)}
              >
                <UserAvatar user={u} className="w-6 h-6" size="w-6 h-6" />
                <span>{
                  (u.firstName || u.lastName)
                    ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                    : (u.email
                        ? u.email
                        : (u.role === 'owner' ? 'Właściciel' : (u.uid || 'Nieznany')))
                }</span>
                {value.includes(u.uid) && <span className="ml-auto text-indigo-500 font-bold">✓</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TaskCreateModal({ open, onClose, users, onCreate, initialTitle = '', initialAssigned = [], isEdit = false }) {
  const [title, setTitle] = useState(() => initialTitle);
  const [assigned, setAssigned] = useState(() => initialAssigned);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edytuj zadanie' : 'Stwórz nowe zadanie'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Tytuł zadania"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-lg px-4 py-3 rounded-lg border focus:ring-2 focus:ring-indigo-500"
            maxLength={120}
          />
          <div>
            <Input
              type="text"
              placeholder="Szukaj użytkownika..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-2"
            />
            <UserMultiSelect users={users} value={assigned} onChange={setAssigned} placeholder="Wybierz użytkowników" />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!title || assigned.length === 0) {
                setError('Podaj tytuł i wybierz przynajmniej jednego użytkownika');
                return;
              }
              onCreate({ title, assignedUserIds: assigned });
              setTitle('');
              setAssigned([]);
              setError(null);
              onClose();
            }}
            variant="primary"
          >
            {isEdit ? 'Zapisz zmiany' : 'Stwórz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDetailsModal({ open, onClose, task, users }) {
  if (!task) return null;
  const creator = users.find(u => u.uid === task.createdBy) || null;
  const assigned = users.filter(u => task.assignedUserIds.includes(u.uid));
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Szczegóły zadania</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <span className="font-semibold">Tytuł:</span> <span className="break-words">{task.title}</span>
          </div>
          <div>
            <span className="font-semibold">Utworzono:</span> {task.createdAt ? format(new Date(task.createdAt), 'dd.MM.yyyy HH:mm') : '-'}
          </div>
          <div>
            <span className="font-semibold">Twórca:</span> {creator ? `${creator.firstName} ${creator.lastName}` : 'Nieznany'}
          </div>
          <div>
            <span className="font-semibold">Przypisani:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {assigned.map(u => (
                <Avatar key={u.uid} className="w-5 h-5">
                  <AvatarImage src={u.photo} alt={u.firstName} />
                  <AvatarFallback>{getInitials(u)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          <div>
            <span className="font-semibold">Notatki:</span>
            <ul className="mt-2 space-y-2">
              {task.notes && task.notes.length > 0 ? (
                task.notes.map((n, idx) => {
                  const user = users.find(u => u.uid === n.userId);
                  return (
                    <li key={idx} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={user?.photo} alt={user?.firstName} />
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user ? `${user.firstName} ${user.lastName}` : n.userId}</span>
                        <span className="text-xs text-zinc-400 ml-2">{n.createdAt ? format(new Date(n.createdAt), 'dd.MM.yyyy HH:mm') : ''}</span>
                      </div>
                      <div className="text-zinc-700 dark:text-zinc-200">{n.content}</div>
                    </li>
                  );
                })
              ) : (
                <li className="text-zinc-400 dark:text-zinc-500">Brak notatek</li>
              )}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Skeleton = ({ width = 100, height = 20 }) => (
  <div className="bg-gray-200 rounded animate-pulse" style={{ width, height }} />
);

// Komponent animowanego licznika
function AnimatedNumber({ value, duration = 1, className = '' }) {
  const controls = useAnimation();
  const ref = useRef();
  const [display, setDisplay] = React.useState(0);
  useEffect(() => {
    controls.start({ val: value, transition: { duration, ease: 'easeOut' } });
  }, [value]);
  useEffect(() => {
    controls.set({ val: 0 });
    controls.start({ val: value, transition: { duration, ease: 'easeOut' } });
  }, [value]);
  return (
    <motion.span
      className={className}
      animate={controls}
      initial={{ val: 0 }}
      transition={{ duration, ease: 'easeOut' }}
      onUpdate={latest => setDisplay(Math.round(latest.val))}
    >
      {display}
    </motion.span>
  );
}

const ProjectPanel = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [usersPanelOpen, setUsersPanelOpen] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const currentUser = getUserFromLocalStorage();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [projectUsers, setProjectUsers] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [sortKey, setSortKey] = useState('title');
  const [sortDir, setSortDir] = useState('asc');
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // ref do animacji wykresów
  const chartRef = useRef(null);
  const isInView = useInView(chartRef, { once: true, margin: '-100px' });

  const fetchProject = async () => {
    const ws = await getWorkspaceById(db, id);
    setProject(ws);
    let users = ws?.users || [];
    let ownerUser = null;
    // Pobierz pełne dane wszystkich użytkowników (łącznie z ownerem)
    const userDetails = [];
    // Dodaj ownera na początek
    if (ws?.owner) {
      ownerUser = await getUserFromFirestore(db, ws.owner);
      if (ownerUser) {
        ownerUser = { ...ownerUser, uid: ws.owner, role: 'owner' };
        userDetails.push(ownerUser);
      }
    }
    // Dodaj pozostałych użytkowników (bez duplikatu ownera)
    for (const u of users) {
      if (u.uid === ws.owner) continue;
      const data = await getUserFromFirestore(db, u.uid);
      if (data) userDetails.push({ ...data, uid: u.uid, role: u.role });
    }
    setProjectUsers(userDetails);
    if (ownerUser) {
      setOwnerName(`${ownerUser.firstName || ''} ${ownerUser.lastName || ''}`.trim() || ownerUser.email || ws.owner);
    }
  };

  const fetchTasks = async () => {
    if (!id) return;
    setLoadingTasks(true);
    const t = await getTasksForProject(id);
    setTasks(t);
    setLoadingTasks(false);
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, [id]);

  const handleAddTask = async ({ title, assignedUserIds }) => {
    // Jeśli nie wybrano żadnych użytkowników, przypisz wszystkich z workspace
    const assigned = assignedUserIds && assignedUserIds.length > 0 ? assignedUserIds : projectUsers.map(u => u.uid);
    await addTaskToProject(id, title, assigned, 'TODO');
    fetchTasks();
  };

  const handleAddNote = async (taskId, content) => {
    if (!currentUser) return;
    await addNoteToTask(taskId, currentUser.uid, content);
    fetchTasks();
  };

  const handleEditTask = async (taskId, title, assignedUserIds) => {
    await updateTask(taskId, { title, assignedUserIds });
    fetchTasks();
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    fetchTasks();
  };

  // Filtruj taski wg checkboxa
  const filteredTasks = showOnlyAssigned && currentUser
    ? tasks.filter(t => t.assignedUserIds.includes(currentUser.uid))
    : tasks;

  // Sortowanie tasków do tabeli
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let valA, valB;
    if (sortKey === 'title') {
      valA = a.title.toLowerCase();
      valB = b.title.toLowerCase();
    } else if (sortKey === 'status') {
      valA = a.status;
      valB = b.status;
    } else if (sortKey === 'assigned') {
      valA = a.assignedUserIds.length;
      valB = b.assignedUserIds.length;
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Kanban - drag & drop
  const kanbanTasks = TASK_STATUSES.map(status => ({
    status,
    tasks: filteredTasks.filter(t => t.status === status)
  }));

  const allTaskIds = filteredTasks.map(t => t.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeTask = filteredTasks.find(t => t.id === active.id);
    if (!activeTask) return;
    let overColumn = null;
    // Jeśli przeciągamy na kolumnę (dropzone kolumny)
    if (TASK_STATUSES.includes(over.id)) {
      overColumn = over.id;
    } else {
      // Jeśli przeciągamy na inny task, znajdź jego status
      overColumn = kanbanTasks.find(col => col.tasks.some(t => t.id === over.id))?.status;
    }
    if (overColumn && activeTask.status !== overColumn) {
      await updateTaskStatus(activeTask.id, overColumn);
      fetchTasks();
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Statystyki liczbowe
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const todoTasks = tasks.filter(t => t.status === 'TODO').length;
  const usersCount = projectUsers.length;
  const donePercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Dane do wykresu statusów
  const chartData = [
    { status: 'Do zrobienia', value: todoTasks },
    { status: 'W trakcie', value: inProgressTasks },
    { status: 'Zrobione', value: doneTasks },
  ];
  // Dane do wykresu kołowego
  const pieData = [
    { name: 'Ukończone', value: doneTasks },
    { name: 'Pozostałe', value: totalTasks - doneTasks },
  ];
  // Dane do wykresu zadań na użytkownika
  const userTaskData = projectUsers.map(u => ({
    name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.email || u.uid),
    value: tasks.filter(t => t.assignedUserIds.includes(u.uid)).length,
  }));

  // Dane do wykresu liniowego aktywności (ostatnie 14 dni)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d;
  });
  const activityData = days.map(date => {
    const dayStr = date.toISOString().slice(0, 10);
    return {
      day: date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }),
      value: tasks.filter(t => t.createdAt && t.createdAt.slice(0, 10) === dayStr).length,
    };
  });

  const handleEditClick = (task) => {
    setEditTask(task);
    setEditOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-6 border-b bg-white shadow-sm rounded-t-xl"
        style={{ borderTop: `6px solid ${project?.color || '#6366f1'}` }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full" style={{ background: project?.color || '#6366f1' }} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project ? project.title : <Skeleton width={120} />}</h1>
            <div className="text-gray-500">{project?.description || <Skeleton width={200} />}</div>
            <div className="text-xs text-gray-400">Właściciel: {ownerName || <Skeleton width={80} />}</div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex gap-2"
        >
          <Button onClick={() => setCreateOpen(true)} variant="primary">Create Task</Button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition" onClick={() => setUsersPanelOpen(true)}>Zarządzaj</button>
          {project && currentUser && (project.owner === currentUser.uid || (project.users || []).some(u => u.uid === currentUser.uid && u.role === 'admin')) && (
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg shadow hover:bg-gray-200 transition" onClick={() => setInviteOpen(true)}>Udostępnij</button>
          )}
        </motion.div>
      </header>
      <ProjectUsersPanel
        project={{ ...(project || {}), users: projectUsers }}
        currentUser={currentUser}
        open={usersPanelOpen}
        onClose={() => setUsersPanelOpen(false)}
        refresh={fetchProject}
      />
      {inviteOpen && project && (
        <InvitePopup projectId={project.id} onClose={() => setInviteOpen(false)} />
      )}
      <TaskCreateModal open={createOpen} onClose={() => setCreateOpen(false)} users={projectUsers} onCreate={handleAddTask} />
      <TaskCreateModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        users={projectUsers}
        onCreate={async ({ title, assignedUserIds }) => {
          await handleEditTask(editTask.id, title, assignedUserIds);
          setEditOpen(false);
        }}
        initialTitle={editTask?.title || ''}
        initialAssigned={editTask?.assignedUserIds || []}
        isEdit={true}
      />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 p-4 grid grid-cols-1 gap-6"
      >
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 mb-6" ref={chartRef}>
          <h2 className="font-semibold text-2xl mb-6 text-indigo-700">Statystyki projektu</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center gap-4 bg-indigo-50 dark:bg-zinc-800 rounded-lg p-4 shadow-sm">
              <ListTodo className="w-8 h-8 text-indigo-500" />
              <div>
                <div className="text-2xl font-bold text-indigo-700">
                  <AnimatedNumber value={totalTasks} />
                </div>
                <div className="text-xs text-gray-500">Wszystkich zadań</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-green-50 dark:bg-zinc-800 rounded-lg p-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  <AnimatedNumber value={donePercent} />%
                </div>
                <div className="text-xs text-gray-500">Ukończonych zadań</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-blue-50 dark:bg-zinc-800 rounded-lg p-4 shadow-sm">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  <AnimatedNumber value={usersCount} />
                </div>
                <div className="text-xs text-gray-500">Użytkowników</div>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Wykres słupkowy statusy */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.1, duration: 0.7, ease: 'easeOut' }}
            >
              <ChartContainer config={{}} className="min-h-[220px] w-full">
                <div className="font-semibold mb-2 text-center">Zadania wg statusu</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} accessibilityLayer>
                    <XAxis dataKey="status" tickLine={false} tickMargin={10} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent nameKey="status" />} />
                    <Bar dataKey="value" radius={6} fill={COLORS[0]} isAnimationActive={true} animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </motion.div>
            {/* Wykres kołowy ukończone */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
            >
              <ChartContainer config={{}} className="min-h-[220px] w-full flex flex-col items-center justify-center">
                <div className="font-semibold mb-2 text-center">Ukończone zadania</div>
                <PieChart width={180} height={200}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    fill={COLORS[1]}
                    label={({ percent }) => percent > 0 ? `${Math.round(percent * 100)}%` : ''}
                    isAnimationActive={true}
                    animationDuration={900}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            </motion.div>
            {/* Wykres liniowy aktywność */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
            >
              <ChartContainer config={{}} className="min-h-[220px] w-full">
                <div className="font-semibold mb-2 text-center">Aktywność (nowe zadania / dzień)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={activityData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={false} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<ChartTooltipContent nameKey="day" />} />
                    <Line type="monotone" dataKey="value" stroke={COLORS[3]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={true} animationDuration={900} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </motion.div>
          </motion.div>
        </section>
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-semibold text-lg">Tablica Kanban</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlyAssigned}
                onChange={e => setShowOnlyAssigned(e.target.checked)}
              />
              Pokaż tylko moje zadania
            </label>
          </div>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={allTaskIds} strategy={rectSortingStrategy}>
              <div className="flex w-full gap-4 overflow-x-auto pb-2">
                {kanbanTasks.map(col => (
                  <KanbanColumn
                    key={col.status}
                    status={col.status}
                    tasks={col.tasks}
                    users={projectUsers}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-semibold text-lg">Tabela zadań</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlyAssigned}
                onChange={e => setShowOnlyAssigned(e.target.checked)}
              />
              Pokaż tylko moje zadania
            </label>
          </div>
          <TaskDataTableTanstack
            tasks={sortedTasks}
            users={projectUsers}
            onEdit={handleEditClick}
            onDelete={handleDeleteTask}
            onAddNote={handleAddNote}
            onRowClick={task => { setDetailsTask(task); setDetailsOpen(true); }}
          />
        </section>
      </motion.main>
      <TaskDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} task={detailsTask} users={projectUsers} />
    </div>
  );
};

export default ProjectPanel; 