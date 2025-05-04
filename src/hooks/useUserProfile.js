import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useUserProfile() {
  const [profile, setProfile] = useState({ firstName: '', lastName: '', photo: '' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const authUser = JSON.parse(localStorage.getItem('firebase:authUser')) || JSON.parse(localStorage.getItem('pm_session'));
    setUser(authUser);
    if (authUser?.uid) {
      const saveUserToFirestore = async () => {
        const userRef = doc(db, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName || '',
            photoURL: authUser.photoURL || '',
            createdAt: new Date().toISOString(),
          });
        }
      };
      saveUserToFirestore();
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile({
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          photo: parsed.photo || authUser.photoURL || '',
        });
      } else {
        setProfile({
          firstName: authUser.displayName?.split(' ')[0] || '',
          lastName: authUser.displayName?.split(' ')[1] || '',
          photo: authUser.photoURL || '',
        });
      }
    }
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem('user', JSON.stringify(newProfile));
  };

  return { profile, user, setProfile, setUser, handleProfileChange, handleProfileSave };
} 