'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.scss';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLUListElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Ajout : fermer le menu avec Escape (accessibilité clavier)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <nav className={styles.navbar} aria-label="Navigation principale">
      <button
        className={`${styles.burger} ${isOpen ? styles.open : ''}`}
        onClick={toggleMenu}
        aria-label="Menu principal"
        aria-expanded={isOpen}
        aria-controls="main-menu"
      >
        <span />
        <span />
        <span />
      </button>

      <ul
        id="main-menu"
        ref={navRef}
        className={`${styles.menu} ${isOpen ? styles.open : ''}`}
        aria-label="Menu principal"
      >
        <li>
          <Link href="/home" onClick={closeMenu}>Accueil</Link>
        </li>
        <li>
          <Link href="/how-it-works" onClick={closeMenu}>Comment ça marche</Link>
        </li>
        <li>
          <Link href="/map-list" onClick={closeMenu}>Services</Link>
        </li>
        <li>
          <Link href="/categories" onClick={closeMenu}>Catégories</Link>
        </li>
        <li>
          <Link href="/contact" onClick={closeMenu}>Contact</Link>
        </li>
        <li>
          <Link href="/login" onClick={closeMenu}>Connexion</Link>
        </li>
      </ul>
    </nav>
  );
}
