import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

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
      setUser(null);
      setAuthActionPending(false);
      localStorage.removeItem('rehome_token');
      localStorage.removeItem('rehome_user');
    };

    bootstrapSession();
    window.addEventListener('rehome:auth-invalidated', handleAuthInvalidated);

    return () => {
      cancelled = true;
      window.removeEventListener('rehome:auth-invalidated', handleAuthInvalidated);
    };
  }, []);

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      localStorage.setItem('rehome_user', JSON.stringify(res.data.user));
      return res.data.user;
    } catch (err) {
      setUser(null);
      localStorage.removeItem('rehome_token');
      localStorage.removeItem('rehome_user');
      throw err;
    }
  };

  const login = async (email, password) => {
    setAuthActionPending(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
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
    try {
      const res = await api.post('/auth/register', { name, email, password, location });
      setUser(res.data.user);
      localStorage.setItem('rehome_token', res.data.token);
      localStorage.setItem('rehome_user', JSON.stringify(res.data.user));
      return res.data;
    } catch (err) {
      setAuthActionPending(false);
      throw err;
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    setAuthActionPending(false);
    localStorage.removeItem('rehome_token');
    localStorage.removeItem('rehome_user');
  };

  useEffect(() => {
    if (authActionPending && user) {
      setAuthActionPending(false);
    }
  }, [authActionPending, user]);

  return (
    <AuthContext.Provider value={{ user, loading, authActionPending, error, setError, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
