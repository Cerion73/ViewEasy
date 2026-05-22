import React, { createContext, useContext, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [syncTrigger, setSyncTrigger] = useState(0);

  useEffect(() => {
    let ws;
    if (user) {
      const connectWebSocket = async () => {
        try {
          const res = await apiClient('/auth/ws-ticket/');
          ws = new WebSocket(`ws://localhost:8000/ws/notifications/?ticket=${res.ticket}`);
          
          ws.onopen = () => {
            console.log('Connected to notifications WebSocket');
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
              const msg = data.data;
              
              if (msg === 'TASK_SYNC') {
                  setSyncTrigger(prev => prev + 1);
                  return;
              }

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
        } catch (err) {
          console.error("Failed to fetch WS ticket", err);
        }
      };

      connectWebSocket();

      return () => {
        if (ws) ws.close();
      };
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ socket, syncTrigger }}>
      {children}
      <Toaster position="top-right" />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
