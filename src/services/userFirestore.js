
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getUserDataFromFirebaseUser } from '../models/userModel';

export const getUserFromFirestore = async (db, uid) => {
  const userDocRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userDocRef);
  return userSnap.exists() ? userSnap.data() : null;
};

export const saveUserToFirestore = async (db, userData) => {
  const userDocRef = doc(db, 'users', userData.uid);
  await setDoc(userDocRef, userData);
};

export const saveUserToFirestoreIfNotExists = async (db, user, extra = {}) => {
  const existingUser = await getUserFromFirestore(db, user.uid);
  if (existingUser) {
    return existingUser;
  } else {
    const userData = getUserDataFromFirebaseUser(user, extra);
    await saveUserToFirestore(db, userData);
    return userData;
  }
}; 