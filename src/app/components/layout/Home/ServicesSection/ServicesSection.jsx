// src/app/components/layout/Home/ServicesSection/ServicesSection.jsx
"use client";
import React from 'react';
import SectionBlock from '../../../shared/SectionBlock/SectionBlock'; // Assurez-vous que le chemin est correct
import ServiceList from '../../../services/ServiceList'; // Assurez-vous que le chemin est correct vers votre ServiceList
import styles from "./ServicesSection.module.scss";
/**
 * Composant représentant la section "Nos services" de la page d'accueil.
 * Il utilise le composant générique SectionBlock pour sa structure et inclut la liste des services.
 */
export default function ServicesSection() {
    return (
        <section className={styles.servicesSection}>
            <SectionBlock
                title="Découvrer notre Plateforme de gestion tout-en-un"
                subtitle="La solution en ligne pour l’ensemble des acteurs de la location saisonnière"
                description="Une application et une plateforme entièrement sécurisées, pensées pour automatiser la gestion, fluidifier la communication, et vous assister à chaque étape, que vous soyez propriétaire, professionnel, ou en quête de solutions fiables."
            >
                <ServiceList />
                <div className={styles.ctaZone}>
                    <a className={styles.ctaButton} href="/inscription" aria-label="Essayer la plateforme gratuitement" >
                        Essayer gratuitement
                    </a>
                    <span className={styles.ctaSub}>
                        Assistance personnalisée  &  offres sans commission.
                    </span>
                </div>
            </SectionBlock>
        </section>
    );
}