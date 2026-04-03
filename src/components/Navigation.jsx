import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PawPrint, Search, Menu, PlusCircle, User, LogOut, LayoutDashboard, X, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Navigation.module.css';

const Navigation = ({ onOpenPost, searchQuery, onSearchChange, onOpenHowItWorks }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <Link to="/" className={styles.brand}>
          <PawPrint className={styles.brandIcon} size={28} />
          <span className={styles.brandText}>Rehome</span>
        </Link>
        
        {/* Elite Marketplace Switcher */}
        <div className={styles.marketplaceSwitcher}>
          <Link to="/" className={`${styles.switchItem} ${location.pathname === '/' ? styles.switchActive : ''}`}>
            <PawPrint size={18} />
            <span>Pets</span>
          </Link>
          <Link to="/livestock" className={`${styles.switchItem} ${location.pathname === '/livestock' ? styles.switchActive : ''}`}>
            <LayoutDashboard size={18} />
            <span>Livestock</span>
          </Link>
          <Link to="/supplies" className={`${styles.switchItem} ${location.pathname === '/supplies' ? styles.switchActive : ''}`}>
            <PlusCircle size={18} />
            <span>Supplies</span>
          </Link>
          <div 
            className={styles.switchGlow} 
            style={{ 
              transform: `translateX(${location.pathname === '/livestock' ? '100%' : location.pathname === '/supplies' ? '200%' : '0%'})` 
            }} 
          />
        </div>

        {/* Elite Marketplace Switcher */}
        <div className={styles.marketplaceSwitcher}>
          <Link to="/" className={`${styles.switchItem} ${location.pathname === '/' ? styles.switchActive : ''}`}>
            <PawPrint size={18} />
            <span>Pets</span>
          </Link>
          <Link to="/livestock" className={`${styles.switchItem} ${location.pathname === '/livestock' ? styles.switchActive : ''}`}>
            <LayoutDashboard size={18} />
            <span>Livestock</span>
          </Link>
          <Link to="/supplies" className={`${styles.switchItem} ${location.pathname === '/supplies' ? styles.switchActive : ''}`}>
            <PlusCircle size={18} />
            <span>Supplies</span>
          </Link>
          <div 
            className={styles.switchGlow} 
            style={{ 
              transform: `translateX(${location.pathname === '/livestock' ? '100%' : location.pathname === '/supplies' ? '200%' : '0%'})` 
            }} 
          />
        </div>
        
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search for pets, breeds, or shelters..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <span className={styles.navLink} onClick={onOpenHowItWorks}>About</span>
          
          {isAuthenticated ? (
            <>
              <button className={`btn ${styles.postBtn}`} onClick={onOpenPost}>
                <PlusCircle size={18} />
                List a Pet
              </button>
              <div className={styles.userMenuWrap}>
                <button className={styles.avatarBtn} onClick={() => setShowUserMenu(!showUserMenu)}>
                  <User size={20} />
                </button>
                {showUserMenu && (
                  <>
                    <div className={styles.menuBackdrop} onClick={() => setShowUserMenu(false)} />
                    <div className={styles.userMenu}>
                      <div className={styles.menuHeader}>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                      <Link to="/dashboard" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                        <LayoutDashboard size={16} /> My Dashboard
                      </Link>
                      <Link to="/messages" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                        <MessageSquare size={16} /> Messages
                      </Link>
                      {user?.email === 'admin@rehome.world' && (
                        <Link to="/admin" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                          <ShieldCheck size={16} /> Admin Panel
                        </Link>
                      )}
                      <button className={styles.menuItem} onClick={handleLogout}>
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <button className={`btn ${styles.postBtn}`} onClick={onOpenPost}>
                <PlusCircle size={18} />
                List a Pet
              </button>
              <Link to="/login" className={styles.loginBtn}>Sign In</Link>
              <Link to="/register" className={`btn btn-primary ${styles.registerBtn}`}>Sign Up</Link>
            </>
          )}
          
          <button className={styles.mobileMenu} onClick={() => setShowMobileMenu(!showMobileMenu)}>
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className={styles.mobileNav}>
          <div className={styles.mobileSwitcher}>
            <Link to="/" className={`${styles.mobileLink} ${location.pathname === '/' ? styles.mobileActive : ''}`} onClick={() => setShowMobileMenu(false)}>
              <PawPrint size={20} /> Pets
            </Link>
            <Link to="/livestock" className={`${styles.mobileLink} ${location.pathname === '/livestock' ? styles.mobileActive : ''}`} onClick={() => setShowMobileMenu(false)}>
              <LayoutDashboard size={20} /> Livestock
            </Link>
            <Link to="/supplies" className={`${styles.mobileLink} ${location.pathname === '/supplies' ? styles.mobileActive : ''}`} onClick={() => setShowMobileMenu(false)}>
              <PlusCircle size={20} /> Supplies
            </Link>
          </div>
          <span className={styles.mobileLink} onClick={() => { onOpenHowItWorks(); setShowMobileMenu(false); }}>About</span>
          <span className={styles.mobileLink} onClick={() => { onOpenPost(); setShowMobileMenu(false); }}>List a Pet</span>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={styles.mobileLink} onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
              <button className={styles.mobileLink} onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.mobileLink} onClick={() => setShowMobileMenu(false)}>Sign In</Link>
              <Link to="/register" className={styles.mobileLink} onClick={() => setShowMobileMenu(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
