import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, MapPin, Eye, EyeOff, ArrowRight } from 'lucide-react';
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

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated, loading, authActionPending, error } = useAuth();
  const [searchParams] = useSearchParams();
  const tier = searchParams.get('tier'); // breeder, royal, etc.
  const normalizedTier = tier === 'royal' ? 'breeder' : tier;
  const requestedRedirect = normalizeAuthRedirect(searchParams.get('redirect'), DEFAULT_AUTH_REDIRECT);
  const nextPath = normalizedTier
    ? normalizeAuthRedirect(`/dashboard?purchase=membership&tier=${encodeURIComponent(normalizedTier)}`, DEFAULT_AUTH_REDIRECT)
    : requestedRedirect;
  const loginLink = nextPath === DEFAULT_AUTH_REDIRECT
    ? '/login'
    : `/login?redirect=${encodeURIComponent(nextPath)}`;
  const isSubmitting = isLoading || authActionPending;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCard} aria-busy="true" aria-live="polite">
          <div className={styles.loadingSpinner} />
          <h1 className={styles.loadingTitle}>Preparing your account</h1>
          <p className={styles.loadingCopy}>We’re checking your current session before opening the registration form.</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={nextPath} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return toast.error('Please fill in all required fields');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password, location.trim());
      toast.success(normalizedTier ? `Your ${normalizedTier} membership setup is ready.` : 'Account created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
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
              <UserPlus size={24} />
            </div>
            <h1 className={styles.title}>Create your account</h1>
            <p className={styles.subtitle}>Create a secure account to list animals, save favorites, and keep buyer conversations organized.</p>
            {error && <div className={styles.statusBanner} role="alert">{error}</div>}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Full Name *</label>
              <div className={styles.inputWrap}>
                <User size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Mitchell"
                  className={styles.input}
                  autoComplete="name"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email *</label>
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
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password *</label>
              <div className={styles.inputWrap}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={styles.input}
                  autoComplete="new-password"
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

            <div className={styles.field}>
              <label className={styles.label}>Location</label>
              <div className={styles.inputWrap}>
                <MapPin size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Austin, TX"
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? <span className={styles.spinner} /> : <>Create Account <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className={styles.footer}>
            <p>Already have an account? <Link to={loginLink} className={styles.link}>Sign in</Link></p>
            <p className={styles.footerNote}>You can finish setup first, then choose listings, billing, or membership from your dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
