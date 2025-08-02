'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav className={styles.navbar}>

        <button
          className={`${styles.burger} ${isOpen ? styles.open : ''}`}
          onClick={toggleMenu}
          aria-label="Menu"
          aria-expanded={isOpen}
          aria-controls="main-menu"
        >
          <span />
          <span />
          <span />
        </button>

        <ul id="main-menu" className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
          <li><Link href="/home" onClick={closeMenu}>Accueil</Link></li>
          <li><Link href="/how-it-works" onClick={closeMenu}>Comment ça marche</Link></li>
          <li><Link href="/map-list" onClick={closeMenu}>Services</Link></li>
          <li><Link href="/categories" onClick={closeMenu}>Catégories</Link></li>
          <li><Link href="/contact" onClick={closeMenu}>Contact</Link></li>
          <li><Link href="/login" onClick={closeMenu}>Connexion</Link></li>
        </ul>
      </nav>
    </>
  );
}
