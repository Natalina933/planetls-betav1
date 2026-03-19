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
    <ServicesBlock title="Professionnalisez votre activité">
      <div className={styles.platformSectionContent}>
        <div className={styles.heroBanner}>
          <span className={styles.eyebrow}>Conciergerie premium</span>
          <h2 className={styles.heroTitle}>Je veux structurer ma conciergerie</h2>
          <p className={styles.heroSubtitle}>
            Structurez votre offre, vos packs, vos tarifs et votre relation propriétaire avec un
            outil pensé pour la location saisonnière.
          </p>
          <div className={styles.heroActions}>
            <ButtonLink href="/abonnement/concierge-pro" variant="primary" className={styles.heroButton}>
              Voir l&apos;offre PRO <Icons.ChevronRight size={18} />
            </ButtonLink>
            <ButtonLink href="/dashboard/owner/concierges" variant="secondary" className={styles.secondaryButton}>
              Voir les profils visibles
            </ButtonLink>
          </div>
        </div>

        <div className={styles.introBox}>
          <h3>Une base SaaS pour piloter votre activité</h3>
          <p>
            Prospection propriétaires, packs de services, devis, factures, missions, planning et
            messagerie : la plateforme centralise le cycle complet.
          </p>
        </div>

        <div className={styles.pillarsGrid}>
          <div className={styles.pillarItem}>
            <Icons.AiOutlineWechat size={24} />
            <h4>Relation client</h4>
            <p>Suivez vos conversations, relances et recommandations sans sortir du dashboard.</p>
          </div>
          <div className={styles.pillarItem}>
            <Icons.TbPackages size={24} />
            <h4>Offres structurées</h4>
            <p>Transformez vos prestations en packs clairs, tarifs liés et contrats réutilisables.</p>
          </div>
          <div className={styles.pillarItem}>
            <Icons.MdAutoMode size={24} />
            <h4>Pilotage terrain</h4>
            <p>Gardez la main sur missions, urgences, stocks et planning avec une vision centralisée.</p>
          </div>
        </div>
      </div>
    </ServicesBlock>
  );
}
