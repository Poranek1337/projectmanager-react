const API_URL = '/api/auth';

export const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const data = await response.json();
    setAuthData(data);
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    setAuthData(data);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const setAuthData = (data) => {
  if (data) {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userData', JSON.stringify({
      email: data.email,
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName
    }));
  } else {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const getUserData = () => {
  const userDataString = localStorage.getItem('userData');
  return userDataString ? JSON.parse(userDataString) : null;
};

const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const decodedToken = decodeJWT(token);
    if (!decodedToken) return false;

    const currentTime = Date.now() / 1000;
    return decodedToken.exp > currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

export const logout = () => {
  setAuthData(null);
};
