import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Mail, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import styles from './AuthPages.module.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCard} aria-busy="true" aria-live="polite">
          <div className={styles.loadingSpinner} />
          <h1 className={styles.loadingTitle}>Preparing recovery</h1>
          <p className={styles.loadingCopy}>We&apos;re loading the password recovery tools.</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Enter the email address tied to your account.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setResult(res.data);
      toast.success('Password reset request received.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to start password recovery.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.surface}>
        <div className={styles.brandRow}>
          <Link to="/" className={styles.brandLink}>Rehome</Link>
          <Link to="/login" className={styles.backLink}>Back to sign in</Link>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrap}>
              <KeyRound size={24} />
            </div>
            <h1 className={styles.title}>Forgot your password?</h1>
            <p className={styles.subtitle}>Enter your account email and we&apos;ll prepare a secure reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.noticeBanner}>
              Self-serve reset emails require a connected transactional email provider. Until that is configured, this page will tell you whether reset delivery is blocked in the current environment.
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Account Email</label>
              <div className={styles.inputWrap}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={styles.input}
                  autoComplete="email"
                  disabled={submitting}
                  autoFocus
                />
              </div>
            </div>

            {result?.delivery === 'blocked_externally' && (
              <div className={styles.statusBanner} role="alert">
                <strong>Reset delivery is blocked externally.</strong> {result.blockedReason} {result.requiredSetup}
              </div>
            )}

            {result?.previewUrl && (
              <div className={styles.successBanner} role="status">
                <strong>Preview mode only:</strong> this environment can show the reset link directly for testing.
                <a href={result.previewUrl} className={styles.previewLink}>Open reset link</a>
              </div>
            )}

            {result && !result.previewUrl && result.delivery !== 'blocked_externally' && (
              <div className={styles.successBanner} role="status">
                {result.message}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? <span className={styles.spinner} /> : <>Request Reset Link <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className={styles.footer}>
            <p>Remembered your password? <Link to="/login" className={styles.link}>Sign in</Link></p>
            <p className={styles.footerNote}>For launch readiness, connect a transactional email provider before advertising this as fully self-serve recovery.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
