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
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('rehome_token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('rehome_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('rehome_token');
          localStorage.removeItem('rehome_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    localStorage.setItem('rehome_token', res.data.token);
    localStorage.setItem('rehome_user', JSON.stringify(res.data.user));
    return res.data;
  };

  const register = async (name, email, password, location) => {
    const res = await api.post('/auth/register', { name, email, password, location });
    setUser(res.data.user);
    localStorage.setItem('rehome_token', res.data.token);
    localStorage.setItem('rehome_user', JSON.stringify(res.data.user));
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    localStorage.removeItem('rehome_token');
    localStorage.removeItem('rehome_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
