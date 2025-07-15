"use client";
import React from 'react';
import { TbPackages } from "react-icons/tb";
import SectionBlock from '../../../shared/SectionBlock/SectionBlock';
import styles from "./PromotePlatformSection.module.scss";
import { ChevronRight } from 'lucide-react'; 
import { AiOutlineWechat } from "react-icons/ai";
import { MdAutoMode } from "react-icons/md"; 

export default function PromotePlatformSection() {
    return (
        <SectionBlock title="La Puissance de la Gestion en Ligne">
            <div className={styles.platformSectionContent}>

                {/* Bloc de mise en avant */}
                <div className={styles.heroBanner}>
                    <h2 className={styles.heroTitle}>JE VEUX OUVRIR MA CONCIERGERIE</h2>
                    <p className={styles.heroSubtitle}>Besoin d'accompagnement pour démarrer ?</p>
                    <a href="/concierge-guide" className={styles.heroButton}>
                        En savoir plus <ChevronRight size={18} />
                    </a>
                </div>

                {/* Introduction à la gestion */}
                <div className={styles.introBox}>
                    <h3>Découvrir la Gestion locative en ligne</h3>
                    <p>
                        Notre plateforme vous accompagne, quel que soit le profil de vos clients.
                        Profitez d'outils innovants pour gérer, communiquer et automatiser votre activité.
                    </p>
                </div>

                {/* Les 3 piliers sous forme de grille avec icônes */}
                <div className={styles.pillarsGrid}>
                    <div className={styles.pillarItem}>
                        <AiOutlineWechat />
                        <h4>COMMUNICATION</h4>
                        <p>Accélérez votre croissance grâce à des outils puissants et intuitifs.</p>
                    </div>
                    <div className={styles.pillarItem}>
                        <TbPackages />
                        <h4>GESTION</h4>
                        <p>Des experts à vos côtés pour piloter votre projet de A à Z.</p>
                    </div>
                    <div className={styles.pillarItem}>
<MdAutoMode />
                        <h4>AUTOMATISATION</h4>
                        <p>Libérez du temps en automatisant les tâches répétitives.</p>
                    </div>
                </div>
            </div>

        </SectionBlock>
    );
}