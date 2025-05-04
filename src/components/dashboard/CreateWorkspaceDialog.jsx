import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e42", // Orange
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#fbbf24", // Yellow
];

export default function CreateWorkspaceDialog({ open, onOpenChange, onCreated, userUid }) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Tytuł jest wymagany.");
      return;
    }
    if (!color) {
      setError("Wybierz kolor projektu.");
      return;
    }
    setLoading(true);
    try {
      if (onCreated) {
        await onCreated({
          title: title.trim(),
          color,
          description: description.trim(),
          owner: userUid,
        });
      }
      setTitle("");
      setColor(COLORS[0]);
      setDescription("");
      onOpenChange(false);
    } catch (err) {
      setError("Błąd podczas tworzenia: " + (err.message || err));
    }
    setLoading(false);
  };

  const handleClose = () => {
    setTitle("");
    setColor(COLORS[0]);
    setDescription("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full rounded-3xl p-0 bg-gradient-to-br from-white to-indigo-50 shadow-2xl border-0 animate-in fade-in-50 zoom-in-95 duration-300 overflow-hidden">
        <div className="rounded-2xl bg-white/80 shadow-lg p-8 m-2">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-extrabold mb-2 text-center tracking-tight">Utwórz nowy workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-7">
            <div>
              <label className="block text-base font-semibold mb-1 text-zinc-800">Tytuł <span className="text-red-500">*</span></label>
              <Input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nazwa projektu/workspace"
                required
                className="rounded-xl border-2 border-zinc-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition px-4 py-2 text-base shadow-sm bg-white/90"
              />
            </div>
            <div>
              <label className="block text-base font-semibold mb-1 text-zinc-800">Kolor <span className="text-red-500">*</span></label>
              <div className="flex gap-3 mt-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${color === c ? 'border-indigo-600 ring-2 ring-indigo-400 scale-110 shadow-lg' : 'border-zinc-200 hover:scale-105 hover:shadow-md'}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Wybierz kolor ${c}`}
                  >
                    {color === c && (
                      <span className="block w-3 h-3 rounded-full border-2 border-white bg-white/30" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-base font-semibold mb-1 text-zinc-800">Opis</label>
              <Input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Opcjonalny opis projektu"
                className="rounded-xl border-2 border-zinc-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition px-4 py-2 text-base shadow-sm bg-white/90"
              />
            </div>
            {error && <div className="text-red-500 text-sm mt-1 text-center font-medium">{error}</div>}
            <div className="flex flex-row gap-3 mt-6 justify-end">
              <Button type="button" variant="ghost" onClick={handleClose} className="text-gray-500 rounded-xl px-6 py-2 text-base">Anuluj</Button>
              <Button type="submit" className="bg-indigo-600 text-white rounded-xl px-6 py-2 text-base shadow-md hover:bg-indigo-700 transition" disabled={loading}>{loading ? 'Tworzenie...' : 'Utwórz'}</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 