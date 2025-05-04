import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

export default function SettingsPage() {
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
  }, []);

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
    <div className="max-w-xl mx-auto mt-12 bg-white rounded-2xl shadow-2xl border p-8 animate-in fade-in-50 zoom-in-95 duration-300">
      <h1 className="text-3xl font-bold mb-6 text-center">Ustawienia profilu</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-6">
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
          <Button type="submit" className="bg-indigo-600 text-white" disabled={loading}>{loading ? 'Zapisywanie...' : 'Zapisz'}</Button>
        </div>
      </form>
    </div>
  );
} 