import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from "../hooks/auth/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";

export default function InvitationsPage() {
  const { user, loading } = useAuth();
  const [pendingInvites, setPendingInvites] = useState([]);
  const [projectNames, setProjectNames] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInvitesAndNames() {
      if (!user) return;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        let invites = userSnap.data().pendingInvites || [];
        const now = Date.now();
        // Usuń wygasłe zaproszenia
        const validInvites = invites.filter(inv => !inv.expiresAt || (inv.expiresAt.toDate ? inv.expiresAt.toDate().getTime() : inv.expiresAt) > now);
        if (validInvites.length !== invites.length) {
          await updateDoc(userRef, { pendingInvites: validInvites });
        }
        setPendingInvites(validInvites);
        // Pobierz nazwy projektów
        const ids = Array.from(new Set(validInvites.map(inv => inv.projectId)));
        const names = {};
        await Promise.all(ids.map(async (id) => {
          const wsRef = doc(db, 'workspaces', id);
          const wsSnap = await getDoc(wsRef);
          if (wsSnap.exists()) {
            names[id] = wsSnap.data().title || id;
          } else {
            names[id] = id;
          }
        }));
        setProjectNames(names);
      }
    }
    fetchInvitesAndNames();
  }, [user]);

  const handleAcceptInvite = async (invite) => {
    setError(""); setSuccess("");
    const wsRef = doc(db, 'workspaces', invite.projectId);
    const wsSnap = await getDoc(wsRef);
    if (!wsSnap.exists()) { setError("Projekt nie istnieje."); return; }
    const users = wsSnap.data().users || [];
    const members = wsSnap.data().members || [];
    if (!users.some(u => u.uid === user.uid)) {
      await updateDoc(wsRef, { users: [...users, { uid: user.uid, role: 'user' }] });
    }
    if (!members.includes(user.uid)) {
      await updateDoc(wsRef, { members: [...members, user.uid] });
    }
    // Usuń zaproszenie
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const invites = (userSnap.data().pendingInvites || []).filter(i => i.projectId !== invite.projectId);
    await updateDoc(userRef, { pendingInvites: invites });
    setPendingInvites(invites);
    setSuccess("Dołączono do projektu!");
    // Odśwież Sidebar i widok Shared
    setTimeout(() => window.location.reload(), 500);
  };

  const handleRejectInvite = async (invite) => {
    setError(""); setSuccess("");
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const invites = (userSnap.data().pendingInvites || []).filter(i => i.projectId !== invite.projectId);
    await updateDoc(userRef, { pendingInvites: invites });
    setPendingInvites(invites);
    setSuccess("Zaproszenie odrzucone.");
  };

  if (!user && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background dark:bg-zinc-900">
        <Card className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/80 p-8 rounded-xl shadow-xl">
          <CardTitle className="mb-4">Nie jesteś zalogowany!</CardTitle>
          <Button onClick={() => navigate("/login?redirect=" + encodeURIComponent(window.location.pathname))}>
            Przejdź do logowania
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[60vh]">
      <h2 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-zinc-100 tracking-tight">Zaproszenia do projektów</h2>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          <AlertTitle>Sukces</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {pendingInvites.length === 0 ? (
        <Card className="p-8 flex items-center justify-center bg-muted/50 dark:bg-zinc-800 border-dashed border-2 border-zinc-200 dark:border-zinc-700">
          <span className="text-zinc-400 text-lg">Brak zaproszeń.</span>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pendingInvites.map((invite, idx) => (
            <Card key={invite.projectId} className="transition-shadow hover:shadow-lg bg-background dark:bg-zinc-900">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                    Zaproszenie
                  </Badge>
                  <span className="text-xs text-zinc-400 ml-auto">{invite.expiresAt?.toDate ? invite.expiresAt.toDate().toLocaleString() : ""}</span>
                </div>
                <CardTitle className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {projectNames[invite.projectId] || <span className="italic text-zinc-400">{invite.projectId}</span>}
                </CardTitle>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Właściciel: <span className="font-medium text-zinc-700 dark:text-zinc-200">{invite.ownerEmail}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-500"
                    onClick={() => handleAcceptInvite(invite)}
                  >
                    Akceptuj
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRejectInvite(invite)}
                  >
                    Odrzuć
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 