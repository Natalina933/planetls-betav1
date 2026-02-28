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
            Votre navigateur ne supporte pas la lecture video.
          </video>
        ) : (
          <div className={styles.videoPlaceholder}>
            <Image
              src="/videos/Gemini_Generated_Image_mv7njvmv7njvmv7n.png"
              alt="Apercu video PlanetLS"
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
              aria-label="Lire la video de presentation"
              onClick={handlePlayClick}
              onKeyDown={(e) => e.key === "Enter" && handlePlayClick()}
            />
          </div>
        )}
      </div>

      <div className={styles.videoContent}>
        <h2 id="video-intro-title" className={styles.videoHeading}>
          Decouvrez PlanetLS en 1 minute
        </h2>

        <p id="video-intro-description" className={styles.videoDescription}>
          Une plateforme simple, intuitive et professionnelle pour gerer votre activite locative
          saisonniere.
        </p>

        <a
          href="/login"
          className={styles.CTAButton}
          aria-label="Creer votre profil gratuitement sur PlanetLS"
        >
          Creer votre profil gratuitement
        </a>

        <p className={styles.joinMessage}>
          Rejoignez PlanetLS pour structurer votre activite et trouver les bons partenaires.
        </p>
      </div>
    </section>
  );
}
