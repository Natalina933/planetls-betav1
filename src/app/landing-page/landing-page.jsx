// app/coming-soon/page.tsx
"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import styles from "./LandingPage.module.scss";

export default function ComingSoonPage() {
    return (
        <main className={styles.container}>
            <motion.div
                className={styles.card}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className={styles.logo}>PlanetLS</h1>
                <p className={styles.tagline}>La location saisonnière réinventée</p>

                <motion.p
                    className={styles.subtitle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Notre plateforme arrive très bientôt. Soyez les premiers informés !
                </motion.p>

                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    <input type="email" placeholder="Votre adresse email" required />
                    <button type="submit">Prévenir moi</button>
                </form>

                <div className={styles.socials}>
                    <a href="https://facebook.com" target="_blank" aria-label="Facebook">
                        <Facebook size={24} />
                    </a>
                    <a href="https://instagram.com" target="_blank" aria-label="Instagram">
                        <Instagram size={24} />
                    </a>
                    <a href="https://linkedin.com" target="_blank" aria-label="LinkedIn">
                        <Linkedin size={24} />
                    </a>
                </div>
            </motion.div>
        </main>
    );
}
