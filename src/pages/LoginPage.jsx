import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './AuthPages.module.css';

const DEFAULT_AUTH_REDIRECT = '/dashboard';
const normalizeAuthRedirect = (value, fallback = DEFAULT_AUTH_REDIRECT) => {
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('?') || trimmed.startsWith('#') || /^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
    return fallback;
  }

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const pathname = normalized.split(/[?#]/)[0];
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/login/') || pathname.startsWith('/register/')) {
    return fallback;
  }

  return normalized;
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, loading, authActionPending, error } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectPath = normalizeAuthRedirect(searchParams.get('redirect'), DEFAULT_AUTH_REDIRECT);
  const registerLink = redirectPath === DEFAULT_AUTH_REDIRECT
    ? '/register'
    : `/register?redirect=${encodeURIComponent(redirectPath)}`;
  const isSubmitting = isLoading || authActionPending;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCard} aria-busy="true" aria-live="polite">
          <div className={styles.loadingSpinner} />
          <h1 className={styles.loadingTitle}>Checking your session</h1>
          <p className={styles.loadingCopy}>We’re making sure your account is ready before we show the sign-in form.</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error('Please fill in all fields');

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.surface}>
        <div className={styles.brandRow}>
          <Link to="/" className={styles.brandLink}>Rehome</Link>
          <Link to="/" className={styles.backLink}>Back to marketplace</Link>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap}>
              <LogIn size={24} />
            </div>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in to manage your listings, messages, favorites, and billing.</p>
            {error && <div className={styles.statusBanner} role="alert">{error}</div>}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <div className={styles.inputWrap}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={styles.input}
                  autoComplete="email"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldHeader}>
                <label className={styles.label}>Password</label>
                <Link to="/forgot-password" className={styles.inlineLink}>Forgot password?</Link>
              </div>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={styles.input}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? <span className={styles.spinner} /> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className={styles.footer}>
            <p>Don&apos;t have an account? <Link to={registerLink} className={styles.link}>Create one</Link></p>
            <p><Link to="/forgot-password" className={styles.link}>Reset my password</Link></p>
            <p className={styles.footerNote}>Secure sign-in for buyers, sellers, and marketplace managers.</p>
          </div>

          {import.meta.env.DEV && (
            <div className={styles.demoHint}>
              <strong>Dev only:</strong> sarah@example.com / password123
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
