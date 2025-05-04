
export const saveUserToLocalStorage = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
};

export const getUserFromLocalStorage = () => {
  const user = localStorage.getItem('user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const removeUserFromLocalStorage = () => {
  localStorage.removeItem('user');
};

export const getUserUidFromLocalStorage = () => {
  const user = getUserFromLocalStorage();
  return user?.uid || null;
}; 