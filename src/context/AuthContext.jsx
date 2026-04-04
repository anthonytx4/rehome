/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);
const DEFAULT_AUTH_REDIRECT = '/dashboard';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rehome_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [authActionPending, setAuthActionPending] = useState(false);
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setAuthActionPending(false);
    localStorage.removeItem('rehome_token');
    localStorage.removeItem('rehome_user');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (!res?.data?.user) throw new Error('Missing user data');
      setUser(res.data.user);
      setError(null);
      localStorage.setItem('rehome_user', JSON.stringify(res.data.user));
      return res.data.user;
    } catch (err) {
      clearSession();
      if (!err.response || err.response.status >= 500) {
        setError('We could not verify your session right now. Please try again in a moment.');
      } else {
        setError(null);
      }
      throw err;
    }
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      try {
        await refreshUser();
      } catch {
        // refreshUser already clears bad tokens; loading is still resolved below
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const handleAuthInvalidated = () => {
      clearSession();
      setError(null);
    };

    bootstrapSession();
    window.addEventListener('rehome:auth-invalidated', handleAuthInvalidated);

    return () => {
      cancelled = true;
      window.removeEventListener('rehome:auth-invalidated', handleAuthInvalidated);
    };
  }, [clearSession, refreshUser]);

  const login = async (email, password) => {
    setAuthActionPending(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      setError(null);
      localStorage.setItem('rehome_token', res.data.token);
      localStorage.setItem('rehome_user', JSON.stringify(res.data.user));
      return res.data;
    } catch (err) {
      setAuthActionPending(false);
      throw err;
    }
  };

  const register = async (name, email, password, location) => {
    setAuthActionPending(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password, location });
      if (!res?.data?.user) throw new Error('Invalid account data received from server.');
      setUser(res.data.user);
      setError(null);
      localStorage.setItem('rehome_token', res.data.token);
      localStorage.setItem('rehome_user', JSON.stringify(res.data.user));
      return res.data;
    } catch (err) {
      setAuthActionPending(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      void err;
    }
    clearSession();
    setError(null);
  };

  useEffect(() => {
    if (authActionPending && user) {
      setAuthActionPending(false);
    }
  }, [authActionPending, user]);

  return (
    <AuthContext.Provider value={{ user, loading, authActionPending, error, setError, login, register, logout, refreshUser, isAuthenticated: Boolean(user?.id) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
