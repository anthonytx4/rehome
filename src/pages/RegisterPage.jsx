import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, MapPin, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './AuthPages.module.css';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tier = searchParams.get('tier'); // breeder, royal, etc.
  const redirectPath = searchParams.get('redirect');
  const normalizedTier = tier === 'royal' ? 'breeder' : tier;
  const loginRedirect = normalizedTier
    ? `/dashboard?purchase=membership&tier=${encodeURIComponent(normalizedTier)}`
    : (redirectPath || '/dashboard');
  const loginLink = `/login${loginRedirect ? `?redirect=${encodeURIComponent(loginRedirect)}` : ''}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Please fill in all required fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    setIsLoading(true);
    try {
      await register(name, email, password, location, tier);
      toast.success(normalizedTier ? `Welcome to the ${normalizedTier} Circle!` : 'Account created!');
      if (normalizedTier) {
        navigate(`/dashboard?purchase=membership&tier=${encodeURIComponent(normalizedTier)}`, { replace: true });
      } else {
        navigate(redirectPath || '/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.iconWrap}>
            <UserPlus size={24} />
          </div>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Join the Rehome community</p>
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
                placeholder="At least 6 characters"
                className={styles.input}
                autoComplete="new-password"
              />
              <button type="button" className={styles.togglePassword} onClick={() => setShowPassword(!showPassword)}>
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
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? <span className={styles.spinner} /> : <>Create Account <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Already have an account? <Link to={loginLink} className={styles.link}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
