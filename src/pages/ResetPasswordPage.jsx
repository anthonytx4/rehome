import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import styles from './AuthPages.module.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const token = searchParams.get('token') || '';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error('This reset link is missing a token. Request a new one.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setComplete(true);
      window.dispatchEvent(new CustomEvent('rehome:auth-invalidated'));
      toast.success('Password updated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Unable to reset password.');
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
            <h1 className={styles.title}>Reset your password</h1>
            <p className={styles.subtitle}>Create a new password for your Rehome account.</p>
          </div>

          {!token ? (
            <div className={styles.form}>
              <div className={styles.statusBanner} role="alert">
                This reset link is incomplete. Request a new password reset email to continue.
              </div>
              <Link to="/forgot-password" className={styles.submitBtn}>Request New Reset Link</Link>
            </div>
          ) : complete ? (
            <div className={styles.form}>
              <div className={styles.successBanner} role="status">
                Your password has been updated. Sign in with your new credentials.
              </div>
              <Link to="/login" className={styles.submitBtn}>Go to Sign In</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>New Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className={styles.input}
                    autoComplete="new-password"
                    disabled={submitting}
                    autoFocus
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={submitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Confirm Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your new password"
                    className={styles.input}
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? <span className={styles.spinner} /> : <>Update Password <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          <div className={styles.footer}>
            <p>Need another link? <Link to="/forgot-password" className={styles.link}>Request a fresh reset</Link></p>
            <p className={styles.footerNote}>Reset links expire automatically for security.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
