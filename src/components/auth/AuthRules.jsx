import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../common/Loading';

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading, authActionPending } = useAuth();
  if (loading || authActionPending) return <Loading message="Loading your account" />;
  if (isAuthenticated) return children;
  const redirect = `${location.pathname}${location.search}${location.hash}`;
  return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
};

export const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading, authActionPending } = useAuth();
  if (loading || authActionPending) return <Loading message="Loading admin tools" />;
  if (!isAuthenticated || user?.email !== 'admin@rehome.world') {
    return <Navigate to="/" replace />;
  }
  return children;
};
