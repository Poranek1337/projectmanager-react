import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createInvite } from "@/services/inviteService";

function getCurrentUserUid() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user?.uid || null;
  } catch {
    return null;
  }
}

export default function InviteUserDialog({ open, onOpenChange, projectId }) {
  const [hours, setHours] = useState(48);
  const [maxUses, setMaxUses] = useState(1);
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setInviteLink("");
    setCopied(false);
    if (!hours || hours < 1 || hours > 168) {
      setError("Podaj liczbę godzin (1-168)." );
      return;
    }
    if (!maxUses || maxUses < 1 || maxUses > 100) {
      setError("Podaj liczbę użyć (1-100)." );
      return;
    }
    setLoading(true);
    try {
      const createdBy = getCurrentUserUid();
      const link = await createInvite(projectId, Number(hours), Number(maxUses), createdBy);
      setInviteLink(window.location.origin + '/manager' + link);
    } catch (err) {
      setError("Błąd generowania linku: " + (err.message || err));
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setInviteLink("");
    setError("");
    setCopied(false);
    setHours(48);
    setMaxUses(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full rounded-2xl p-0 bg-white shadow-2xl border animate-in fade-in-50 zoom-in-95 duration-300 overflow-hidden">
        <div className="rounded-2xl bg-white/80 shadow-lg p-8 m-2">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-extrabold mb-2 text-center tracking-tight">Zaproś użytkownika</DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-zinc-700 text-center text-base">Wygeneruj link zaproszenia do projektu o ID: <span className="font-mono text-indigo-600">{projectId}</span>.</div>
          <form onSubmit={handleGenerate} className="flex flex-col gap-5">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-base font-semibold mb-1 text-zinc-800">Ważność (godziny)</label>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  className="rounded-xl border-2 border-zinc-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition px-4 py-2 text-base shadow-sm bg-white/90"
                />
              </div>
              <div className="flex-1">
                <label className="block text-base font-semibold mb-1 text-zinc-800">Liczba użyć</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={maxUses}
                  onChange={e => setMaxUses(e.target.value)}
                  className="rounded-xl border-2 border-zinc-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition px-4 py-2 text-base shadow-sm bg-white/90"
                />
              </div>
            </div>
            {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
            <div className="flex flex-row gap-3 mt-2 justify-end">
              <Button type="button" variant="ghost" onClick={handleClose} className="text-gray-500 rounded-xl px-6 py-2 text-base">Anuluj</Button>
              <Button type="submit" className="bg-indigo-600 text-white rounded-xl px-6 py-2 text-base shadow-md hover:bg-indigo-700 transition" disabled={loading}>{loading ? 'Generowanie...' : 'Wygeneruj link'}</Button>
            </div>
          </form>
          {inviteLink && (
            <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200 flex flex-col items-center gap-2">
              <div className="text-sm text-zinc-700 mb-1">Link zaproszenia:</div>
              <div className="font-mono text-indigo-700 text-sm break-all select-all mb-2">{inviteLink}</div>
              <Button size="sm" className="bg-indigo-600 text-white rounded px-4 py-1 text-sm" onClick={handleCopy}>{copied ? 'Skopiowano!' : 'Kopiuj link'}</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 