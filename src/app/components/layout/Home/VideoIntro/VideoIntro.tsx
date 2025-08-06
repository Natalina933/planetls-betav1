import React from 'react';
import styles from './VideoIntro.module.scss';
import Image from 'next/image';

const VideoIntro = () => (
    <div className={styles.videoIntroSection}>
        {/* Remarque : <img />, et non <image /> */}
        <Image
            src="/images/plateform.jpg"
            width={900}
            height={275}
            loading="lazy"
            decoding="async"
            title="Découvrez PlanetLS en 1 minute"
            aria-labelledby="video-intro-title"
            alt="Présentation de PlanetLS"
            className={styles.videoImage}
        />

        <div className={styles.videoContent}>
            <h2 className={styles.videoHeading}>🎥 Découvrez PlanetLS en 1 minute</h2>
            <p className={styles.videoDescription}>
                Une plateforme <strong>simple, intuitive et professionnelle</strong> pour gérer votre activité locative courte durée.<br />
                📅 Planning • 🧼 Ménage • 🔧 Maintenance • 📊 Comptabilité…<br />
                Tout est centralisé, accessible depuis mobile ou web.
            </p>
            <ul className={styles.featureList}>
                <li>✅ Solution <strong>sécurisée et personnalisée</strong></li>
                <li>✅ Interface <strong>mobile & web fluide</strong></li>
                <li>✅ <strong>Des centaines de pros</strong> à proximité</li>
            </ul>
            <a
                href="/concierge-guide"
                className={styles.CTAButton}
                role="button"
                aria-label="Créer votre profil gratuitement sur PlanetLS"
            >
                Créez votre profil gratuitement
            </a>
            <p className={styles.joinMessage}>
                📣 <em>Rejoignez-nous dès aujourd’hui sur PlanetLS.com</em>
            </p>
        </div>
    </div>
);

export default VideoIntro;
