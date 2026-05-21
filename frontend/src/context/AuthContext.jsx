import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await apiClient('/auth/user/');
      setUser(userData);
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      await apiClient('/auth/login/', {
        body: { username, password }
      });
      await checkAuth();
    } catch (error) {
      throw error;
    }
  };

  const loginWithToken = async () => {
      await checkAuth();
  };

  const register = async (data) => {
    try {
      await apiClient('/auth/registration/', {
        body: data
      });
      await checkAuth();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient('/auth/logout/', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
