import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { db, auth } from "@/infrastructure/firebase/firebase.js";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

export default function SettingsDialog({ open, onOpenChange, onLogout }) {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    photo: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        photo: user.photo || "",
      });
      setPreview(user.photo || "");
    }
  }, [open]);

  useEffect(() => {
    if (!photoFile) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(photoFile);
  }, [photoFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setPhotoFile(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let photoURL = profile.photo;
      if (photoFile) {
        photoURL = preview;
      }
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          firstName: profile.firstName,
          lastName: profile.lastName,
          photo: photoURL,
        });
        await updateProfile(auth.currentUser, {
          displayName: `${profile.firstName} ${profile.lastName}`,
          photoURL,
        });
        const updated = { ...user, ...profile, photo: photoURL };
        localStorage.setItem("user", JSON.stringify(updated));
        setSuccess("Zapisano zmiany!");
        setPhotoFile(null);
        setProfile((prev) => ({ ...prev, photo: photoURL }));
      }
    } catch (err) {
      setError("Błąd podczas zapisu: " + (err.message || err));
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full rounded-2xl p-0 bg-white shadow-2xl border animate-in fade-in-50 zoom-in-95 duration-300 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-2">
          <DialogTitle className="text-2xl font-bold mb-1">Ustawienia profilu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="flex flex-col gap-6 px-8 py-6 bg-white">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              {preview ? (
                <AvatarImage src={preview} alt="Podgląd" />
              ) : (
                <AvatarFallback>
                  {(profile.firstName?.[0] || "") + (profile.lastName?.[0] || "")}
                </AvatarFallback>
              )}
            </Avatar>
            <label className="block">
              <span className="text-sm text-zinc-700">Zdjęcie profilowe</span>
              <Input type="file" accept="image/*" onChange={handlePhotoChange} className="mt-1" />
            </label>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              name="firstName"
              placeholder="Imię"
              value={profile.firstName}
              onChange={handleChange}
              required
            />
            <Input
              type="text"
              name="lastName"
              placeholder="Nazwisko"
              value={profile.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={profile.email}
            disabled
          />
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Błąd</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="success">
              <AlertTitle>Sukces</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-row gap-2 mt-4 justify-end">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-500">Anuluj</Button>
            <Button type="submit" className="bg-indigo-600 text-white" disabled={loading}>{loading ? 'Zapisywanie...' : 'Zapisz'}</Button>
          </div>
        </form>
        <div className="border-t px-8 py-4 bg-white flex justify-end">
          <Button type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={onLogout}>
            Wyloguj się
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 