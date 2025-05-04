import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ErrorMessage from '../ui/ErrorMessage';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, googleProvider } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { saveUserToLocalStorage } from '@/storage/userLocalStorage';
import { saveUserToFirestoreIfNotExists } from '@/services/userFirestore';
import { getUserDataFromFirebaseUser } from '@/models/userModel';
import { useAuthForm } from '../../hooks/auth/useAuthForm';

const AuthContainer = ({ onAuthSuccess }) => {
  const {
    isLogin, formData, isLoading, error,
    toggleForm, handleChange, handleSubmit, handleGoogleAuth
  } = useAuthForm(onAuthSuccess);

  return (
    <div className="w-screen h-screen min-h-screen flex flex-col md:flex-row bg-black text-white">
      {/* Left Side */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-zinc-900 p-12 relative overflow-hidden h-full">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse at 20% 30%, #f8ecd6 0%, #e0d7fa 40%, #b6b6f8 70%, #7a7adf 100%)',
          }}
        />
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundImage: 'url(/assets/noise.png)',
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
            opacity: 0.7,
          }}
        />
        <div className="relative z-20">
          <div className="flex items-center gap-2 text-lg font-semibold mb-8">
            <span className="text-2xl">⌘</span>
            <span>ProjectManager</span>
          </div>
        </div>
        <div className="mb-4 relative z-20">
          <blockquote className="text-lg font-medium mb-2">
            "ProjectManager to nowoczesna aplikacja do zarządzania projektami, która pozwala zespołom pracować szybciej, wygodniej i skuteczniej. Wszystko w jednym miejscu."
          </blockquote>
          <span className="text-sm text-zinc-400">Twój zespół, Twoje projekty, Twój sukces.</span>
        </div>
      </div>
      {/* Right Side */}
      <div className="flex flex-1 flex-col justify-center items-center w-full md:w-1/2 bg-black h-full">
        <div className="w-full flex flex-col gap-6 items-center justify-center">
          <div className="flex justify-end w-full max-w-md">
            <Button
              variant="outline"
              className="border-zinc-700 text-white bg-transparent hover:bg-zinc-800"
              onClick={toggleForm}
            >
              {isLogin ? 'Utwórz konto' : 'Zaloguj się'}
            </Button>
          </div>
          <div className="w-full max-w-md">
            {isLogin ? (
              <LoginForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                formData={formData}
                onChange={handleChange}
                onSwitch={toggleForm}
              />
            ) : (
              <RegisterForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                formData={formData}
                onChange={handleChange}
                onSwitch={toggleForm}
              />
            )}
          </div>
          <Button
            type="button"
            className="w-full max-w-md bg-white text-black font-semibold hover:bg-zinc-200 flex items-center justify-center gap-2"
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_17_40)">
                <path d="M47.5 24.5C47.5 22.8 47.3 21.2 47 19.7H24V28.3H37.2C36.7 31.1 34.9 33.4 32.2 34.9V40.1H39.7C44.1 36.1 47.5 30.8 47.5 24.5Z" fill="#4285F4"/>
                <path d="M24 48C30.5 48 35.9 45.9 39.7 40.1L32.2 34.9C30.2 36.2 27.5 37.1 24 37.1C17.7 37.1 12.2 32.9 10.4 27.3H2.6V32.7C6.4 40.1 14.5 48 24 48Z" fill="#34A853"/>
                <path d="M10.4 27.3C9.9 25.9 9.6 24.5 9.6 23C9.6 21.5 9.9 20.1 10.4 18.7V13.3H2.6C0.9 16.6 0 20.2 0 24C0 27.8 0.9 31.4 2.6 34.7L10.4 27.3Z" fill="#FBBC05"/>
                <path d="M24 9.9C27.1 9.9 29.8 11 31.8 12.9L39.8 5C35.9 1.3 30.5 0 24 0C14.5 0 6.4 7.9 2.6 15.3L10.4 22.7C12.2 17.1 17.7 12.9 24 12.9V9.9Z" fill="#EA4335"/>
              </g>
              <defs>
                <clipPath id="clip0_17_40">
                  <rect width="48" height="48" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            {isLogin ? 'Zaloguj się przez Google' : 'Zarejestruj się przez Google'}
          </Button>
          <div className="w-full max-w-md">
            <ErrorMessage error={error} />
          </div>
          <p className="text-xs text-zinc-500 text-center mt-2 w-full max-w-md">
            Klikając kontynuuj, akceptujesz nasze{' '}
            <a href="#" className="underline underline-offset-2">
              Warunki korzystania
            </a>{' '}
            oraz{' '}
            <a href="#" className="underline underline-offset-2">
              Politykę prywatności
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
