// Model taska i notatki do obsługi zadań projektowych
export const createTaskModel = ({ title, projectId, assignedUserIds = [], notes = [], status = 'TODO' }) => ({
  title,
  projectId,
  assignedUserIds,
  notes, // tablica notatek lub pusta
  status,
  createdAt: new Date().toISOString(),
});

// Model notatki
export const createNoteModel = ({ taskId, userId, content }) => ({
  taskId,
  userId,
  content,
  createdAt: new Date().toISOString(),
}); 