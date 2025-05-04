import React, { useState, useContext } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import { Outlet } from 'react-router-dom';
import SettingsDialog from '../components/dashboard/SettingsDialog';
import { AuthContext } from '../App';

const MainLayout = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { handleLogout } = useContext(AuthContext);

  return (
    <div className="fixed inset-0 flex bg-gradient-to-br from-indigo-50 to-blue-100">
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      <main className="flex-1 p-10 overflow-y-auto">
        <Outlet />
      </main>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} onLogout={handleLogout} />
    </div>
  );
};

export default MainLayout; 