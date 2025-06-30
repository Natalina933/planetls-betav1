import React from 'react';
import CTAButton from '../../../common/Buttons/Bouton';
import styles from './HeroSection.module.css';

const HeroSection = () => {
    return (
        <section className={styles.hero}>
            <div className={styles.overlay} />
            <div className={styles.content}>
                <h1>Une planète de services, à votre porte</h1>
                <p>PlanetLs connecte les propriétaires, concierges et artisans autour de la location saisonnière.</p>
                <CTAButton onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}>
                    Découvrir les services
                </CTAButton>
            </div>
        </section>
    );
};

export default HeroSection;
