export const createTaskModel = ({ title, projectId, assignedUserIds = [], notes = [], status = 'TODO' }) => ({
  title,
  projectId,
  assignedUserIds,
  notes,
  status,
  createdAt: new Date().toISOString(),
});

export const createNoteModel = ({ taskId, userId, content }) => ({
  taskId,
  userId,
  content,
  createdAt: new Date().toISOString(),
}); 