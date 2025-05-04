import React, { createContext, useContext, useState, useCallback } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);

  const showNotification = useCallback(({ title, description, variant = "destructive" }) => {
    setNotification({ title, description, variant });
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {visible && notification && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in-50 slide-in-from-top-4 w-[420px]">
          <Alert variant={notification.variant}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{notification.title}</AlertTitle>
            <AlertDescription>{notification.description}</AlertDescription>
          </Alert>
        </div>
      )}
    </NotificationContext.Provider>
  );
}; 