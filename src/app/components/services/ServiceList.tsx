// src/app/components/layout/PlatformIntroSection/PlatformIntroSection.jsx
"use client";
import React from "react";
import Head from 'next/head';
import Image from "next/image";
import { CalendarCheck, Shield, FileText, UserCheck, ArrowRight } from "lucide-react"; // Ajout de ArrowRight
import styles from "./ServiceList.module.scss"; // Chemin du style CORRIGÉ
import clsx from "clsx";

// --- Data -----------------------------------------------------
interface Service {
  title: string;
  description: string;
  icon: React.ElementType;
}

const services: Service[] = [
  {
    title: "Tableau de bord centralisé",
    description:
      "Pilotez toutes vos activités en un coup d'œil, visualisez les données clés en temps réel et prenez des décisions éclairées, quel que soit votre rôle.",
    icon: CalendarCheck,
  },
  {
    title: "Pilotage intelligent & automatisation",
    description:
      "Optimisez votre organisation grâce à un planning partagé intuitif, des automatisations intelligentes et des rapports détaillés pour gagner du temps.",
    icon: Shield,
  },
  {
    title: "Sécurité renforcée & gestion documentaire",
    description:
      "Sécurisez vos accès, centralisez vos documents sensibles et profitez d'une gestion simplifiée, transparente et conforme, en toute sérénité.",
    icon: FileText,
  },
  {
    title: "Espace membre & support dédié",
    description:
      "Un espace membre privé avec un accompagnement personnalisé et une assistance réactive, pour une expérience utilisateur fluide et sécurisée.",
    icon: UserCheck,
  },
];

// --- Components -----------------------------------------------
function ServiceCard({ title, description, icon: Icon }: Service) {
  return (
    <div className={styles.serviceCard}>
      <span className={styles.serviceCardIconWrap} aria-hidden="true">
        <Icon className={styles.serviceCardIcon} />
      </span>
      <h3 className={styles.serviceCardTitle}>{title}</h3>
      <p className={styles.serviceCardDesc}>{description}</p>
    </div>
  );
}

export default function PlatformIntroSection() { // Renommage du composant
  return (
    <>
      <Head>
        <title>Découvrez Notre Plateforme de Gestion Intuitive et Complète</title>
        <meta name="description" content="Une plateforme de gestion pensée pour tous : propriétaires, concierges, artisans. Centralisez, automatisez, sécurisez et simplifiez toutes vos activités." />
        <meta name="keywords" content="plateforme de gestion, tableau de bord, automatisation, sécurité documentaire, espace membre, assistance, outils professionnels, propriétaires, concierges, artisans, gestion immobilière, gestion de services" />
        {/* Open Graph Tags pour le partage social */}
        <meta property="og:title" content="Plateforme de Gestion Intuitive pour Tous Vos Besoins" />
        <meta property="og:description" content="Découvrez une solution centralisée, sécurisée et automatisée, conçue pour simplifier la gestion de toutes vos activités, quelle que soit votre catégorie d'utilisateur." />
        <meta property="og:image" content="/images/social-share-platform.jpg" />
        <meta property="og:url" content="https://votre-site.com/plateforme" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <section className={styles.platformSection}>
        <header className={styles.platformHeader}>
          <h2 className={styles.sectionTitle}>Votre Plateforme de Gestion Unique et Intuitive</h2>
          <p className={styles.sectionIntro}>
            Conçue pour <span className={styles.highlightText}>simplifier la vie de toutes les catégories professionnelles</span>, notre plateforme centralise vos outils, automatise vos tâches et sécurise vos données. Que vous soyez <strong className={styles.userCategory}>propriétaire, concierge ou artisan</strong>, gagnez en efficacité et en sérénité.
          </p>
          <a href="#contact" className={styles.ctaButton}>
            Découvrir la Plateforme <ArrowRight className={styles.ctaIcon} />
          </a>
        </header>

        {/* Illustration immersive Art Nouveau */}
        <div className={styles.platformIllustration}>
          {/* texture décorative de fond via pseudo-éléments en CSS */}
          {/* <Image
            src="/images/plateform.jpg"
            alt="Illustration moderne de l'interface de la plateforme de gestion"
            fill
            sizes="(max-width:768px) 100vw, 800px"
            className={styles.platformIllustrationImg}
            priority
          /> */}
          {/* moodboard superposé (optionnel) */}
          <div className={styles.platformIllustrationInset}>
            <Image
              src="/images/moodboard.png"
              alt="Moodboard visuel illustrant l'approche design et l'expérience utilisateur"
              width={420}
              height={280}
              className={styles.platformIllustrationInsetImg}
            />
          </div>
        </div>

        {/* Liste de points clés en puces stylisées */}
        <ul className={clsx(styles.keyPoints, styles["keyPoints--chips"])}>
          <li>Gain de temps considérable</li>
          <li>Accès sécurisé et centralisé</li>
          <li>Optimisation des processus</li>
          <li>Support client dédié</li>
          <li>Adapté à tous les profils</li>
        </ul>

        {/* Grille de services */}
        <div className={styles.serviceGrid}>
          {services.map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>
      </section>
    </>
  );
}