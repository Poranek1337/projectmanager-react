import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { checkUserEmailExists, addUserToProject, removeUserFromProject, updateUserRoleInProject } from '../../services/projectUsersFirestore';
import { getUserFromFirestore } from '../../services/userFirestore';
import { db } from '../../lib/firebase';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useProjectUsers } from '../../hooks/useProjectUsers';
import UserRow from './UserRow';

const roleColors = {
  owner: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900',
  admin: 'bg-gradient-to-r from-indigo-400 to-indigo-600 text-indigo-50',
  user: 'bg-gradient-to-r from-gray-200 to-gray-400 text-gray-700 dark:from-gray-700 dark:to-gray-900 dark:text-gray-100',
};

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  user: 'User',
};

const ProjectUsersPanel = ({ project, currentUser, open, onClose, refresh }) => {
  const {
    email, emailValid, loading, error, userDetails, search, menuOpen, success,
    setEmail, setSearch, setMenuOpen,
    canManage, handleCheckEmail, handleAdd, handleRemove, handleRoleChange,
    filteredUsers, handleLeaveProject, handleDeleteProject
  } = useProjectUsers(project, currentUser, refresh);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-8 max-w-2xl w-full flex flex-col gap-6 border border-zinc-200 dark:border-zinc-800 relative">
          {/* Przycisk trzech kropek w prawym górnym rogu */}
          <div className="absolute right-6 top-6 z-10">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              onClick={() => setMenuOpen(m => !m)}
              aria-label="Więcej akcji"
            >
              <span className="sr-only">Więcej akcji</span>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg py-1 animate-in fade-in-50">
                {currentUser?.uid === project.owner ? (
                  <button
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800"
                    onClick={() => { setMenuOpen(false); handleDeleteProject(); }}
                  >
                    Usuń projekt
                  </button>
                ) : (
                  <button
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800"
                    onClick={() => { setMenuOpen(false); handleLeaveProject(); }}
                  >
                    Opuść projekt
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">Zarządzanie użytkownikami</h2>
            <Input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj po imieniu, nazwisku, emailu lub UID..."
              className="w-full md:w-72"
              aria-label="Szukaj użytkownika"
            />
          </div>
          {canManage && (
            <div className="flex gap-2 items-center">
              <Input
                type="email"
                value={email}
                onChange={handleCheckEmail}
                placeholder="Email użytkownika"
                className={`flex-1 ${emailValid === true ? 'border-green-500' : emailValid === false ? 'border-red-500' : ''}`}
                aria-label="Dodaj użytkownika po emailu"
              />
              <Button
                disabled={!emailValid || loading}
                onClick={handleAdd}
                className="bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Dodaj
              </Button>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertTitle>Błąd</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="w-full">
              <AlertTitle>Sukces</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="overflow-x-auto rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-zinc-500 dark:text-zinc-400 text-left">
                  <th className="py-2 px-3">Użytkownik</th>
                  <th className="py-2 px-3">Rola</th>
                  {canManage && <th className="py-2 px-3">Akcje</th>}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 3 : 2} className="py-4 text-center text-zinc-400">Brak użytkowników</td>
                  </tr>
                )}
                {filteredUsers.map(u => (
                  <UserRow
                    key={u.uid}
                    user={u}
                    userDetails={userDetails}
                    project={project}
                    canManage={canManage}
                    currentUser={currentUser}
                    loading={loading}
                    handleRoleChange={handleRoleChange}
                    handleRemove={handleRemove}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="outline" className="mt-4" onClick={onClose}>Zamknij</Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectUsersPanel; 