export const getUserDataFromFirebaseUser = (user, extra = {}) => {
  const displayName = user.displayName || '';
  const [firstName, lastName] = displayName.split(' ');
  return {
    uid: user.uid,
    email: user.email,
    firstName: extra.firstName || firstName || '',
    lastName: extra.lastName || lastName || '',
    photo: user.photoURL || '',
    createdAt: new Date().toISOString(),
  };
}; 