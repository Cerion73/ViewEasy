import React, { createContext, useContext, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const ws = new WebSocket('ws://localhost:8000/ws/notifications/');
      
      ws.onopen = () => {
        console.log('Connected to notifications WebSocket');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          const msg = data.data;
          toast(msg.message || msg, {
            icon: '🔔',
            duration: 5000,
            style: {
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            },
          });
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from notifications WebSocket');
      };

      setSocket(ws);

      return () => {
        ws.close();
      };
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ socket }}>
      {children}
      <Toaster position="top-right" />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
