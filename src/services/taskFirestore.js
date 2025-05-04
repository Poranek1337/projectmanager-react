import { db } from '../infrastructure/firebase/firebase.js';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { createTaskModel, createNoteModel } from '../models/taskModel';

// Dodaj nowy task do projektu
export const addTaskToProject = async (projectId, title, assignedUserIds = [], status = 'TODO') => {
  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    console.error('BŁĄD: Nieprawidłowy projectId przy tworzeniu taska:', projectId);
    throw new Error('Nieprawidłowy projectId przy tworzeniu taska!');
  }
  console.log('Tworzę taska dla projectId:', projectId, 'title:', title, 'assignedUserIds:', assignedUserIds, 'status:', status);
  const task = createTaskModel({ title, projectId, assignedUserIds, status });
  const docRef = await addDoc(collection(db, 'tasks'), task);
  return { ...task, id: docRef.id };
};

// Pobierz taski dla projektu
export const getTasksForProject = async (projectId) => {
  console.log('Pobieram taski dla projectId:', projectId);
  const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
  const snap = await getDocs(q);
  const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log('Znalezione taski:', tasks);
  return tasks;
};

// Zmień status taska
export const updateTaskStatus = async (taskId, status) => {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, { status });
};

// Dodaj notatkę do taska
export const addNoteToTask = async (taskId, userId, content) => {
  const note = createNoteModel({ taskId, userId, content });
  const taskRef = doc(db, 'tasks', taskId);
  const snap = await getDoc(taskRef);
  let notes = [];
  if (snap.exists()) {
    const data = snap.data();
    notes = Array.isArray(data.notes) ? data.notes : [];
  }
  await updateDoc(taskRef, {
    notes: [...notes, note]
  });
  return note;
};

// Pobierz notatki z taska
export const getNotesForTask = async (taskId) => {
  const taskRef = doc(db, 'tasks', taskId);
  const snap = await getDoc(taskRef);
  if (!snap.exists()) return [];
  return snap.data().notes || [];
};

// Edytuj taska (tytuł, przypisani)
export const updateTask = async (taskId, { title, assignedUserIds }) => {
  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, { title, assignedUserIds });
};

// Usuń taska
export const deleteTask = async (taskId) => {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
}; 