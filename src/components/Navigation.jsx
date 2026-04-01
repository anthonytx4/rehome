import React from 'react';
import { PawPrint, Search, Menu, PlusCircle } from 'lucide-react';
import styles from './Navigation.module.css';

const Navigation = ({ onOpenPost }) => {
  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <div className={styles.brand}>
          <PawPrint className={styles.brandIcon} size={28} />
          <span className={styles.brandText}>Rehome</span>
        </div>
        
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search for pets, breeds, or shelters..." 
            className={styles.searchInput}
          />
        </div>

        <div className={styles.actions}>
          <span className={styles.navLink}>Adopt</span>
          <span className={styles.navLinkPremium}>For Breeders</span>
          <button className={`btn ${styles.postBtn}`} onClick={onOpenPost}>
            <PlusCircle size={18} />
            List a Pet
          </button>
          <button className={styles.mobileMenu}>
            <Menu size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
