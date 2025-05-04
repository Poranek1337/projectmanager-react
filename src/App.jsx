import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import TabBar from './components/ui/TabBar'
import AuthContainer from './components/auth/AuthContainer'
import Dashboard from './components/dashboard/Dashboard'
import { Button } from './components/ui/button'
import { NotificationProvider } from "./NotificationContext";
import { auth, onAuthStateChanged, signOut } from '@/infrastructure/firebase/firebase.js';
import ProjectPanel from './pages/ProjectPanel';
import MainLayout from './layouts/MainLayout';
import InvitePage from './pages/InvitePage';
import InvitationsPage from './pages/InvitationsPage';
import MyTasksPage from './pages/MyTasksPage';
import SettingsPage from './pages/SettingsPage';

const routerOptions = {
  future: {
    v7_startTransition: true
  }
};

const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
        setUserData(user);
      } else {
        setAuthenticated(false);
        setUserData(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user) => {
    setAuthenticated(true);
    setUserData(user);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthenticated(false);
    setUserData(null);
    localStorage.clear();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ authenticated, userData, handleAuthSuccess, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

const PrivateRoute = ({ children }) => {
  const { authenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authenticated) {
      navigate('/login', { replace: true });
    }
  }, [authenticated, navigate]);

  if (!authenticated) {
    return null;
  }

  return children;
};

const App = () => {
  const isElectron = window?.electron !== undefined;

  const DashboardPage = () => {
    const { userData, handleLogout } = useAuth();
    return (
      <Dashboard />
    );
  };

  const LoginPage = () => {
    const { handleAuthSuccess } = useAuth();
    return (
      <AuthContainer onAuthSuccess={handleAuthSuccess} />
    );
  };

  useEffect(() => {
    if (isElectron) {
      document.body.classList.add('electron');
      document.body.style.background = 'transparent';
      document.body.style.backdropFilter = 'blur(10px)';
    } else {
      document.body.classList.remove('electron');
      document.body.style.background = '';
      document.body.style.backdropFilter = '';
    }
  }, [isElectron]);

  return (
    <BrowserRouter basename="/manager" {...routerOptions}>
      <NotificationProvider>
        <AuthProvider>
          <div className={`min-h-screen ${isElectron ? 'bg-transparent backdrop-blur-sm' : 'bg-gradient-to-b from-blue-50 to-indigo-100'}`}>
            <div className={`flex flex-col items-center justify-center p-0 ${isElectron ? 'min-h-[calc(100vh-3rem)]' : 'min-h-screen'}`}>
              <Routes>
                <Route path="/" element={<AuthContext.Consumer>
                  {({ authenticated }) =>
                    authenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
                  }
                </AuthContext.Consumer>} />
                <Route path="/invite/:token" element={<InvitePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/project/:id" element={<ProjectPanel />} />
                  <Route path="/invitations" element={<InvitationsPage />} />
                  <Route path="/my-tasks" element={<MyTasksPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;
export { AuthContext };
