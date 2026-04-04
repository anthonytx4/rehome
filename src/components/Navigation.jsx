import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PawPrint, Search, Menu, PlusCircle, User, LogOut, LayoutDashboard, X, MessageSquare, ShieldCheck, Beef, ShoppingBag, Bell, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import usePaymentConfig from '../hooks/usePaymentConfig';
import useNotifications from '../hooks/useNotifications';
import toast from 'react-hot-toast';
import styles from './Navigation.module.css';

const Navigation = ({ onOpenPost, searchQuery, onSearchChange, onOpenHowItWorks }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { configured: paymentsConfigured } = usePaymentConfig();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const notifications = useNotifications({ isAuthenticated, user, paymentsConfigured });

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
        
        {/* Elite Marketplace Switcher — desktop/tablet */}
        <div className={styles.marketplaceSwitcher}>
          <Link to="/" className={`${styles.switchItem} ${location.pathname === '/' ? styles.switchActive : ''}`}>
            <PawPrint size={16} />
            <span>Pets</span>
          </Link>
          <Link to="/livestock" className={`${styles.switchItem} ${location.pathname === '/livestock' ? styles.switchActive : ''}`}>
            <Beef size={16} />
            <span>Livestock</span>
          </Link>
          <Link to="/supplies" className={`${styles.switchItem} ${location.pathname === '/supplies' ? styles.switchActive : ''}`}>
            <ShoppingBag size={16} />
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
            placeholder={
              location.pathname === '/livestock' ? "Search cattle, horses, poultry..." :
              location.pathname === '/supplies' ? "Search soaps, brushes, bulk lots..." :
              "Search for pets, breeds, or shelters..."
            }
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.navLink} onClick={onOpenHowItWorks}>About</button>
          
          {isAuthenticated ? (
            <>
              <button className={`btn ${styles.postBtn}`} onClick={onOpenPost}>
                <PlusCircle size={18} />
                {location.pathname === '/livestock' ? 'List Livestock' : 
                 location.pathname === '/supplies' ? 'List Supplies' : 
                 'List a Pet'}
              </button>
              <div className={styles.userMenuWrap}>
                <button
                  className={styles.notificationBtn}
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {notifications.totalCount > 0 && (
                    <span className={styles.notificationCount}>
                      {notifications.totalCount > 9 ? '9+' : notifications.totalCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <>
                    <div className={styles.menuBackdrop} onClick={() => setShowNotifications(false)} />
                    <div className={styles.notificationMenu}>
                      <div className={styles.menuHeader}>
                        <strong>Notifications</strong>
                        <span>{notifications.totalCount > 0 ? `${notifications.totalCount} updates waiting` : 'You are all caught up'}</span>
                      </div>

                      {notifications.alerts.length > 0 && (
                        <div className={styles.notificationSection}>
                          <div className={styles.notificationSectionLabel}><AlertTriangle size={14} /> Alerts</div>
                          {notifications.alerts.map((item) => (
                            <Link key={item.id} to={item.href} className={styles.notificationItem} onClick={() => setShowNotifications(false)}>
                              <div className={styles.notificationIconWrap}><AlertTriangle size={16} /></div>
                              <div className={styles.notificationText}>
                                <strong>{item.title}</strong>
                                <p>{item.body}</p>
                                <span>{item.meta}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {notifications.messages.length > 0 && (
                        <div className={styles.notificationSection}>
                          <div className={styles.notificationSectionLabel}><MessageSquare size={14} /> Messages</div>
                          {notifications.messages.map((item) => (
                            <Link key={item.id} to={item.href} className={styles.notificationItem} onClick={() => setShowNotifications(false)}>
                              <div className={styles.notificationIconWrap}><MessageSquare size={16} /></div>
                              <div className={styles.notificationText}>
                                <strong>{item.title}</strong>
                                <p>{item.body}</p>
                                <span>{item.meta}</span>
                              </div>
                              <div className={styles.notificationPill}>{item.count}</div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {notifications.newListings.length > 0 && (
                        <div className={styles.notificationSection}>
                          <div className={styles.notificationSectionLabel}><Sparkles size={14} /> New Listings</div>
                          {notifications.newListings.map((item) => (
                            <Link key={item.id} to={item.href} className={styles.notificationItem} onClick={() => setShowNotifications(false)}>
                              <div className={styles.notificationThumb}>
                                {item.image ? <img src={item.image} alt={item.title} /> : <Sparkles size={16} />}
                              </div>
                              <div className={styles.notificationText}>
                                <strong>{item.title}</strong>
                                <p>{item.body}</p>
                                <span>{item.meta}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {notifications.totalCount === 0 && !notifications.loading && (
                        <div className={styles.notificationEmpty}>No new messages, alerts, or listings right now.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className={styles.userMenuWrap}>
                <button className={styles.avatarBtn} onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}>
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
                {location.pathname === '/livestock' ? 'List Livestock' : 
                 location.pathname === '/supplies' ? 'List Supplies' : 
                 'List a Pet'}
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

      {/* Sub-nav strip — mobile only, always visible */}
      <div className={styles.subNav}>
        <Link to="/" className={`${styles.subNavItem} ${location.pathname === '/' ? styles.subNavActive : ''}`}>
          <PawPrint size={16} /> Pets
        </Link>
        <Link to="/livestock" className={`${styles.subNavItem} ${location.pathname === '/livestock' ? styles.subNavActive : ''}`}>
          <Beef size={16} /> Livestock
        </Link>
        <Link to="/supplies" className={`${styles.subNavItem} ${location.pathname === '/supplies' ? styles.subNavActive : ''}`}>
          <ShoppingBag size={16} /> Supplies
        </Link>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className={styles.mobileNav}>
          <div className={styles.mobileSwitcher}>
            <Link to="/" className={`${styles.mobileLink} ${location.pathname === '/' ? styles.mobileActive : ''}`} onClick={() => setShowMobileMenu(false)}>
              <PawPrint size={16} /> Pets
            </Link>
            <Link to="/livestock" className={`${styles.mobileLink} ${location.pathname === '/livestock' ? styles.mobileActive : ''}`} onClick={() => setShowMobileMenu(false)}>
              <Beef size={16} /> Livestock
            </Link>
            <Link to="/supplies" className={`${styles.mobileLink} ${location.pathname === '/supplies' ? styles.mobileActive : ''}`} onClick={() => setShowMobileMenu(false)}>
              <ShoppingBag size={16} /> Supplies
            </Link>
          </div>
          <button type="button" className={styles.mobileLink} onClick={() => { onOpenHowItWorks(); setShowMobileMenu(false); }}>About</button>
          <button type="button" className={styles.mobileLink} onClick={() => { onOpenPost(); setShowMobileMenu(false); }}>
            {location.pathname === '/livestock' ? 'List Livestock' : 
             location.pathname === '/supplies' ? 'List Supplies' : 
             'List a Pet'}
          </button>
          {isAuthenticated ? (
            <>
              <button type="button" className={styles.mobileLink} onClick={() => { setShowNotifications(true); setShowMobileMenu(false); }}>
                <Bell size={16} /> Notifications {notifications.totalCount > 0 ? `(${notifications.totalCount})` : ''}
              </button>
              <Link to="/dashboard" className={styles.mobileLink} onClick={() => setShowMobileMenu(false)}>Dashboard</Link>
              <button className={styles.mobileLink} onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.mobileLink} onClick={() => setShowMobileMenu(false)}>
                <Bell size={16} /> Notifications
              </Link>
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
