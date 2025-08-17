"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import * as Tabs from "@radix-ui/react-tabs";
import styles from "./HowItWorksSection.module.scss";
import type { LucideIcon } from "lucide-react";
import { Lightbulb, Users, Handshake, User, Briefcase } from "lucide-react";

// Typage des étapes
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
    label: "Propriétaires",
    icon: Users,
    ctaLabel: "Trouver une conciergerie ou un pro local",
    ctaLink: "/homeowners",
    steps: [
      {
        Icon: Lightbulb,
        title: "Simplifiez votre gestion locative",
        description: "Accédez à des conciergeries indépendantes pour gérer votre logement en toute sérénité.",
        link: "/homeowners",
      },
      {
        Icon: Briefcase,
        title: "Trouvez des professionnels de confiance",
        description: "Jardinier, décorateur, électricien… sélectionnez les bons prestataires près de chez vous.",
        link: "/partners",
      },
      {
        Icon: Handshake,
        title: "Offrez une expérience exceptionnelle à vos voyageurs",
        description: "Valorisez votre bien, optimisez vos revenus et améliorez vos avis clients.",
        link: "/a-propos",
      },
    ],
  },
  concierges: {
    label: "Concierges",
    icon: User,
    ctaLabel: "Je m’inscris comme concierge",
    ctaLink: "/connexion",
    steps: [
      {
        Icon: Lightbulb,
        title: "Trouvez des logements à gérer près de chez vous",
        description: "Recevez des alertes dès qu’un propriétaire publie une demande correspondant à vos services.",
        link: "/mapwithlist",
      },
      {
        Icon: Users,
        title: "Proposez vos services en quelques clics",
        description: "Créez votre profil, détaillez vos prestations et commencez à recevoir des missions.",
        link: "/connexion",
      },
      {
        Icon: Handshake,
        title: "Collaborez en toute confiance",
        description: "Paiements sécurisés, évaluations vérifiées et accompagnement local.",
        link: "/a-propos",
      },
    ],
  },
  professionnels: {
    label: "Professionnels locaux",
    icon: Briefcase,
    ctaLabel: "Proposer mon savoir-faire",
    ctaLink: "/pros",
    steps: [
      {
        Icon: Users,
        title: "Rejoignez une communauté active",
        description: "Accédez à des demandes concrètes : jardinage, déco, électricité, entretien…",
        link: "/pros",
      },
      {
        Icon: Lightbulb,
        title: "Gérez vos missions facilement",
        description: "Créez devis & factures, suivez vos paiements sans commission.",
        link: "/pros",
      },
      {
        Icon: Handshake,
        title: "Valorisez votre savoir-faire",
        description: "Collectez des avis clients, gagnez en visibilité locale et développez votre activité.",
        link: "/pros",
      },
    ],
  },
};


// Composant StepCard
const StepCard = ({ step, index }: { step: Step; index: number }) => {
  const router = useRouter();

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={step.title}
      className={styles.step}
      onClick={() => router.push(step.link)}
      onKeyDown={(e) => e.key === "Enter" && router.push(step.link)}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
    >
      <motion.div
        className={styles.icon}
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.3 + 0.1, duration: 0.5, ease: "easeOut" }}
      >
        <step.Icon size={32} strokeWidth={2} />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.3 + 0.2, duration: 0.5, ease: "easeOut" }}
      >
        {step.title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.3 + 0.3, duration: 0.5, ease: "easeOut" }}
      >
        {step.description}
      </motion.p>
    </motion.div>
  );
};

// Composant principal
export function HowItWorksSection() {
  const router = useRouter();

  return (
    <section className={styles.howItWorks}>
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Comment ça marche ?
      </motion.h2>

      <Tabs.Root defaultValue="concierges" className={styles.tabs}>
        <Tabs.List className={styles.tabsList}>
          {Object.entries(stepsByCategory).map(([key, category]) => (
            <Tabs.Trigger key={key} className={styles.tabTrigger} value={key}>
              <category.icon className={styles.tabIcon} size={20} strokeWidth={2} />
              {category.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {Object.entries(stepsByCategory).map(([key, category]) => (
          <Tabs.Content key={key} value={key} className={styles.tabContent}>
            <div className={styles.steps}>
              {category.steps.map((step, index) => (
                <StepCard key={index} step={step} index={index} />
              ))}
            </div>
            <motion.button
              className={styles.cta}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(category.ctaLink)}
            >
              {category.ctaLabel}
            </motion.button>
          </Tabs.Content>
        ))}
      </Tabs.Root>

    </section>
  );
}
