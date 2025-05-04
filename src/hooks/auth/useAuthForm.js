import { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, googleProvider } from '@/infrastructure/firebase/firebase.js';
import { db } from '@/infrastructure/firebase/firebase.js';
import { saveUserToLocalStorage } from '@/storage/userLocalStorage';
import { saveUserToFirestoreIfNotExists } from '@/services/userFirestore';
import { getUserDataFromFirebaseUser } from '@/models/userModel';

export function useAuthForm(onAuthSuccess) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
    setFormData({ email: '', password: '', firstName: '', lastName: '' });
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
    const user = userCredential.user;
    const userData = await saveUserToFirestoreIfNotExists(db, user);
    if (!userData?.uid) {
      alert("Błąd: Brak UID użytkownika po zalogowaniu!");
      return;
    }
    saveUserToLocalStorage(userData);
    if (onAuthSuccess) onAuthSuccess(user);
  };

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName) {
      throw new Error('Podaj imię i nazwisko');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
    const user = userCredential.user;
    const userData = getUserDataFromFirebaseUser(user, {
      firstName: formData.firstName,
      lastName: formData.lastName,
    });
    const { saveUserToFirestore } = await import('@/services/userFirestore');
    await saveUserToFirestore(db, userData);
    if (!userData?.uid) {
      alert("Błąd: Brak UID użytkownika po rejestracji!");
      return;
    }
    saveUserToLocalStorage(userData);
    if (onAuthSuccess) onAuthSuccess(user);
    window.location.href = "/dashboard";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (err) {
      setError(err.message || 'Wystąpił błąd');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userData = await saveUserToFirestoreIfNotExists(db, user);
      if (!userData?.uid) {
        alert("Błąd: Brak UID użytkownika po Google Auth!");
        return;
      }
      saveUserToLocalStorage(userData);
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      setError(err.message || 'Błąd logowania przez Google');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLogin, formData, isLoading, error,
    toggleForm, handleChange, handleSubmit, handleGoogleAuth
  };
} 