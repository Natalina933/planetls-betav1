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
    label: "Propriétaires",
    icon: Users,
    ctaLabel: "Trouver une conciergerie",
    ctaLink: "/dashboard/owner/concierges",
    steps: [
      {
        Icon: Lightbulb,
        title: "Publiez votre besoin",
        description:
          "Décrivez votre logement, votre zone et le niveau d'accompagnement attendu.",
        link: "/login",
      },
      {
        Icon: Briefcase,
        title: "Comparez les profils",
        description:
          "Consultez les services, les zones d'intervention, les badges et les informations utiles avant de contacter.",
        link: "/dashboard/owner/concierges",
      },
      {
        Icon: Handshake,
        title: "Pilotez vos priorités",
        description:
          "Suivez devis, documents, missions et messages dans un espace plus lisible et orienté action.",
        link: "/dashboard/owner",
      },
    ],
  },
  concierges: {
    label: "Concierges et indépendants",
    icon: User,
    ctaLabel: "Démarrer mon activité",
    ctaLink: "/abonnement/concierge-pro",
    steps: [
      {
        Icon: Lightbulb,
        title: "Créez votre profil",
        description:
          "Présentez vos services, vos disponibilités, vos tarifs et votre zone d'intervention, même si vous démarrez.",
        link: "/dashboard/concierge/profile?tab=fiche",
      },
      {
        Icon: Users,
        title: "Trouvez vos premiers clients",
        description:
          "Activez la recherche, ouvrez des conversations et développez votre activité à votre rythme.",
        link: "/dashboard/concierge/recherche",
      },
      {
        Icon: Handshake,
        title: "Organisez vos missions",
        description:
          "Gérez logements, planning, documents et interventions depuis un espace simple à utiliser au quotidien.",
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
        title: "Accédez au réseau local",
        description:
          "Positionnez votre savoir-faire auprès des conciergeries, des indépendants et des propriétaires actifs.",
        link: "/home",
      },
      {
        Icon: Lightbulb,
        title: "Recevez des missions ciblées",
        description:
          "Travaillez avec des demandes plus claires et un cadre plus professionnel.",
        link: "/home",
      },
      {
        Icon: Handshake,
        title: "Renforcez votre visibilité",
        description:
          "Mettez en avant votre fiabilité, vos services et la qualité de vos interventions.",
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
        <SectionIntro
          title="Comment ça marche ?"
          description="Un parcours simple pour mettre en relation les bons acteurs, lancer les demandes et mieux suivre l'activité, que vous soyez déjà structuré ou en train de démarrer."
        />
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
