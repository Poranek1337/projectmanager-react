import React, { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, increment, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../infrastructure/firebase/firebase.js";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getWorkspaceById } from "../../services/workspaceFirestore";
import { useNavigate } from "react-router-dom";

export default function AcceptInviteButton({ invite, user, refresh }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [owner, setOwner] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOwner() {
      const ws = await getWorkspaceById(db, invite.projectId);
      setOwner(ws?.owner || null);
    }
    fetchOwner();
  }, [invite.projectId]);

  const isOwner = user?.uid && owner && user.uid === owner;

  const handleAccept = async () => {
    setStatus("Przetwarzanie...");
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await updateDoc(doc(db, "workspaces", invite.projectId), {
        members: arrayUnion(user.uid),
      });
      const wsRef = doc(db, "workspaces", invite.projectId);
      const wsSnap = await getDoc(wsRef);
      const users = wsSnap.data().users || [];
      if (!users.some(u => u.uid === user.uid)) {
        await updateDoc(wsRef, {
          users: [...users, { uid: user.uid, role: "user" }]
        });
      }
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          firstName: user.displayName ? user.displayName.split(' ')[0] : '',
          lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
          photo: user.photoURL || '',
          createdAt: new Date().toISOString(),
        });
      }
      await updateDoc(doc(db, "invites", invite.id), {
        usedCount: increment(1),
      });
      setSuccess("Dołączono do projektu!");
      setStatus("");
      if (typeof refresh === 'function') {
        refresh();
      }
      setTimeout(() => {
        navigate("/dashboard?tab=shared");
      }, 1200);
    } catch (e) {
      setError("Błąd: " + e.message);
      setStatus("");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto p-4 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
      {isOwner && (
        <Alert variant="destructive" className="w-full">
          <AlertTitle>Nie można zaakceptować zaproszenia</AlertTitle>
          <AlertDescription>Nie możesz zaakceptować zaproszenia do własnego projektu.</AlertDescription>
        </Alert>
      )}
      <Button
        onClick={handleAccept}
        disabled={loading || isOwner}
        aria-busy={loading}
        className="w-full text-base font-semibold"
      >
        {loading ? "Przetwarzanie..." : "Akceptuj zaproszenie"}
      </Button>
      {success && (
        <Alert variant="default" className="w-full">
          <AlertTitle>Sukces</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="w-full">
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 