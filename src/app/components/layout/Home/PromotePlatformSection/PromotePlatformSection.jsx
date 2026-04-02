"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ButtonLink } from "@/components/ui";
import ServicesBlock from "../SectionBlock/ServicesBlock";
import styles from "./PromotePlatformSection.module.scss";

const Icons = {
  TbPackages: dynamic(() => import("react-icons/tb").then((mod) => mod.TbPackages), { ssr: false }),
  ChevronRight: dynamic(() => import("lucide-react").then((mod) => mod.ChevronRight), { ssr: false }),
  AiOutlineWechat: dynamic(() => import("react-icons/ai").then((mod) => mod.AiOutlineWechat), { ssr: false }),
  MdAutoMode: dynamic(() => import("react-icons/md").then((mod) => mod.MdAutoMode), { ssr: false }),
};

export default function PromotePlatformSection() {
  return (
    <ServicesBlock title="Développez votre activité à votre rythme">
      <div className={styles.platformSectionContent}>
        <div className={styles.heroBanner}>
          <span className={styles.eyebrow}>Conciergerie, activité locale ou complément de revenu</span>
          <h2 className={styles.heroTitle}>Je veux proposer mes services</h2>
          <p className={styles.heroSubtitle}>
            Que vous soyez une conciergerie déjà lancée ou une personne qui souhaite démarrer une
            activité complémentaire, PlanetLS vous aide à présenter vos services et à trouver vos
            premières missions.
          </p>
          <div className={styles.heroActions}>
            <ButtonLink
              href="/abonnement/concierge-pro"
              variant="primary"
              className={styles.heroButton}
            >
              Voir les options <Icons.ChevronRight size={18} />
            </ButtonLink>
            <ButtonLink
              href="/dashboard/owner/concierges"
              variant="secondary"
              className={styles.secondaryButton}
            >
              Voir les profils visibles
            </ButtonLink>
          </div>
        </div>

        <div className={styles.introBox}>
          <h3>Une base simple pour lancer ou structurer votre activité</h3>
          <p>
            Profil public, services, devis, missions, planning et messagerie : la plateforme vous
            aide à gagner en clarté, que vous soyez en phase de démarrage ou déjà plus structuré.
          </p>
        </div>

        <div className={styles.pillarsGrid}>
          <div className={styles.pillarItem}>
            <Icons.AiOutlineWechat size={24} />
            <h4>Premiers contacts</h4>
            <p>Échangez avec les propriétaires et développez votre réseau sans complexité inutile.</p>
          </div>
          <div className={styles.pillarItem}>
            <Icons.TbPackages size={24} />
            <h4>Services clairs</h4>
            <p>Présentez ce que vous proposez, vos tarifs et vos disponibilités de manière lisible.</p>
          </div>
          <div className={styles.pillarItem}>
            <Icons.MdAutoMode size={24} />
            <h4>Organisation simple</h4>
            <p>Gardez la main sur vos missions, urgences et plannings avec une vision centralisée.</p>
          </div>
        </div>
      </div>
    </ServicesBlock>
  );
}
