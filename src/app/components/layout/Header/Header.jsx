
"use client";
import Link from 'next/link';
import Navbar from '../Navbar/Navbar';
import styles from './Header.module.scss'; // Assurez-vous que le fichier CSS est correctement importé

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <Link href="/">PlanetLs</Link>
            </div>
            <Navbar />
        </header>
    );
}