import React, { useRef, useState } from 'react';
import styles from './VideoIntro.module.scss';

const VideoIntro = () => {
    // Typage explicite de la ref HTMLVideoElement ou null au départ
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const [isMuted, setIsMuted] = useState(true);

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            videoRef.current.muted = newMuted;
            setIsMuted(newMuted);
            if (!newMuted) {
                videoRef.current.play();
            }
        }
    };

    return (
        <div className={styles.videoIntroSection}>
            <video
                ref={videoRef}
                className={styles.videoPlayer}
                src="/videos/PlanetLs.mp4"
                poster="/images/plateform.jpg"
                controls
                playsInline
                autoPlay
                muted={isMuted}
                preload="metadata"
                width={900}
                height={510}
                aria-labelledby="video-intro-title"
                style={{
                    borderRadius: '1.1rem',
                    border: '2px solid #b88b4a',
                    background: '#fffbe6',
                    boxShadow: '0 8px 36px rgba(184,139,74,0.12)'
                }}
            >
                Votre navigateur ne supporte pas la lecture vidéo.
            </video>

            <button
                onClick={toggleMute}
                aria-pressed={!isMuted}
                className={styles.soundToggleBtn}
            >
                {isMuted ? 'Activer le son' : 'Couper le son'}
            </button>

            <div className={styles.videoContent}>
                <h2 id="video-intro-title" className={styles.videoHeading}>
                    🎥 Découvrez PlanetLS en 1 minute
                </h2>
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
};

export default VideoIntro;
