'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.scss';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <nav className={styles.navbar}>
            <button className={styles.burger} onClick={toggleMenu} aria-label="Menu">
                <svg
                    className={`${styles.burgerIcon} ${isOpen ? styles.open : ''}`}
                    viewBox="0 0 100 80"
                    width="30"
                    height="30"
                >
                    <rect className={styles.bar1} width="100" height="10" rx="6" />
                    <rect className={styles.bar2} y="30" width="100" height="10" rx="6" />
                    <rect className={styles.bar3} y="60" width="100" height="10" rx="6" />
                </svg>
            </button>

            <ul className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
                <li><Link href="/home" onClick={closeMenu}>Accueil</Link></li>
                <li><Link href="/how-it-works" onClick={closeMenu}>Comment ça marche</Link></li>
                <li><Link href="/map-list" onClick={closeMenu}>Services</Link></li>
                <li><Link href="/categories" onClick={closeMenu}>Catégories</Link></li>
                <li><Link href="/contact" onClick={closeMenu}>Contact</Link></li>
                <li><Link href="/login" onClick={closeMenu}>Connexion</Link></li>
            </ul>
        </nav>
    );
}
