"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Briefcase, Handshake, Lightbulb, User, Users } from "lucide-react";
import { ButtonLink, SectionIntro, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import styles from "./HowItWorksSection.module.scss";

interface Step {
  Icon: LucideIcon;
  title: string;
  description: string;
  link: string;
}

interface StepCategory {
  label: string;
  icon: LucideIcon;
  ctaLabel: string;
  ctaLink: string;
  steps: Step[];
}

const stepsByCategory: Record<string, StepCategory> = {
  proprietaires: {
    label: "Proprietaires",
    icon: Users,
    ctaLabel: "Trouver une conciergerie",
    ctaLink: "/dashboard/owner/concierges",
    steps: [
      {
        Icon: Lightbulb,
        title: "Publiez votre besoin",
        description: "Decrivez votre logement, votre zone et le niveau d'accompagnement attendu.",
        link: "/login",
      },
      {
        Icon: Briefcase,
        title: "Comparez les profils",
        description: "Consultez les avis, les badges PRO, les tarifs et les services avant de contacter.",
        link: "/dashboard/owner/concierges",
      },
      {
        Icon: Handshake,
        title: "Pilotez vos priorites",
        description: "Suivez devis, factures, missions et messages dans un espace unique oriente action.",
        link: "/dashboard/owner",
      },
    ],
  },
  concierges: {
    label: "Concierges",
    icon: User,
    ctaLabel: "Demarrer ma conciergerie",
    ctaLink: "/abonnement/concierge-pro",
    steps: [
      {
        Icon: Lightbulb,
        title: "Structurez votre offre",
        description: "Creez votre fiche, vos packs, vos tarifs et vos zones d'intervention.",
        link: "/dashboard/concierge/profile?tab=fiche",
      },
      {
        Icon: Users,
        title: "Prospectez les proprietaires",
        description: "Activez la recherche, ouvrez des conversations et transformez vos prises de contact.",
        link: "/dashboard/concierge/recherche",
      },
      {
        Icon: Handshake,
        title: "Pilotez l'operationnel",
        description: "Gerez logements, missions, planning, documents et suivi financier depuis le dashboard.",
        link: "/dashboard/concierge",
      },
    ],
  },
  professionnels: {
    label: "Prestataires",
    icon: Briefcase,
    ctaLabel: "Explorer la plateforme",
    ctaLink: "/home",
    steps: [
      {
        Icon: Users,
        title: "Accedez au reseau local",
        description: "Positionnez votre savoir-faire aupres des concierges et proprietaires actifs.",
        link: "/home",
      },
      {
        Icon: Lightbulb,
        title: "Recevez des missions ciblees",
        description: "Travaillez avec des demandes plus lisibles et un cadre plus professionnel.",
        link: "/home",
      },
      {
        Icon: Handshake,
        title: "Renforcez votre visibilite",
        description: "Capitalisez sur la recommandation, les avis et la qualite d'execution.",
        link: "/home",
      },
    ],
  },
};

const StepCard = ({ step, index }: { step: Step; index: number }) => {
  const router = useRouter();

  return (
    <motion.button
      type="button"
      aria-label={step.title}
      className={styles.step}
      onClick={() => router.push(step.link)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
    >
      <div className={styles.icon}>
        <step.Icon size={30} strokeWidth={2} />
      </div>
      <h3>{step.title}</h3>
      <p>{step.description}</p>
    </motion.button>
  );
};

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className={styles.howItWorks}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={styles.intro}
      >
        <SectionIntro title="Comment ca marche ?" />
      </motion.div>

      <Tabs defaultValue="concierges">
        <TabsList variant="showcase">
          {Object.entries(stepsByCategory).map(([key, category]) => (
            <TabsTrigger key={key} variant="showcase" value={key}>
              <category.icon className={styles.tabIcon} size={20} strokeWidth={2} />
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(stepsByCategory).map(([key, category]) => (
          <TabsContent key={key} value={key} variant="showcase">
            <div className={styles.steps}>
              {category.steps.map((step, index) => (
                <StepCard key={`${key}-${index}`} step={step} index={index} />
              ))}
            </div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={styles.ctaWrap}
            >
              <ButtonLink href={category.ctaLink} variant="paper" size="lg" className={styles.cta}>
                {category.ctaLabel}
              </ButtonLink>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
