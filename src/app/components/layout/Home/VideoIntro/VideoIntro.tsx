"use client";

import React, { useState } from "react";
import styles from "./VideoIntro.module.scss";
import Image from "next/image";
import { PlayCircle } from "lucide-react";


export default function VideoIntro() {
    const [showVideo, setShowVideo] = useState(false);

    const handlePlayClick = () => {
        setShowVideo(true);
    };

    return (
        <section className={styles.videoIntroSection} aria-labelledby="video-intro-title">
            <div className={styles.videoWrapper}>
                {showVideo ? (
                    <video
                        className={styles.videoPlayer}
                        src="/videos/PlanetLs.mp4"
                        poster="/images/plateform.jpg"
                        controls
                        playsInline
                        autoPlay
                        muted
                        preload="metadata"
                        width={900}
                        height={510}
                        aria-describedby="video-intro-description"
                    >
                        Votre navigateur ne supporte pas la lecture vidéo.
                    </video>
                ) : (
<div className={styles.videoPlaceholder}>
  <Image
    src="/videos/Gemini_Generated_Image_mv7njvmv7njvmv7n.png"
    alt="Aperçu vidéo PlanetLS"
    fill
    className={styles.videoPoster}
    priority
  />
  <PlayCircle
    size={64}
    strokeWidth={2}
    className={styles.playButton}
    role="button"
    tabIndex={0}
    aria-label="Lire la vidéo de présentation"
    onClick={handlePlayClick}
    onKeyDown={(e) => e.key === "Enter" && handlePlayClick()}
  />
</div>
                )}
            </div>

            <div className={styles.videoContent}>
                <h2 id="video-intro-title" className={styles.videoHeading}>
                    🎥 Découvrez PlanetLS en 1 minute
                </h2>

                <p id="video-intro-description" className={styles.videoDescription}>
                    Une plateforme <strong>simple, intuitive et professionnelle</strong> pour gérer votre activité locative courte durée.
                </p>

                <div className={styles.featureList}>
                    <div className={styles.featureItem}>
                        <Image
                            src="/icons/check-gold-light.png"
                            alt=""
                            aria-hidden="true"
                            width={24}
                            height={24}
                            className={styles.checkIcon}
                        />
                        <span>Solution <strong>sécurisée et personnalisée</strong></span>
                    </div>
                    <div className={styles.featureItem}>
                        <Image
                            src="/icons/check-gold-light.png"
                            alt=""
                            aria-hidden="true"
                            width={24}
                            height={24}
                            className={styles.checkIcon}
                        />
                        <span>Interface <strong>mobile & web fluide</strong></span>
                    </div>
                    <div className={styles.featureItem}>
                        <Image
                            src="/icons/check-gold-light.png"
                            alt=""
                            aria-hidden="true"
                            width={24}
                            height={24}
                            className={styles.checkIcon}
                        />
                        <span><strong>Des centaines de pros</strong> à proximité</span>
                    </div>
                </div>

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
            </div>        </section>
    );
}
