"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import styles from "./HowItWorksSection.module.scss";

const Icons = {
  Lightbulb: dynamic(() => import("lucide-react").then(mod => mod.Lightbulb), { ssr: false }),
  Users: dynamic(() => import("lucide-react").then(mod => mod.Users), { ssr: false }),
  Handshake: dynamic(() => import("lucide-react").then(mod => mod.Handshake), { ssr: false }),
};

export function HowItWorksSection() {
  const router = useRouter();

  const steps = [
    {
      Icon: Icons.Lightbulb,
      title: "Je m’inscris",
      description: "Propriétaire, artisan ou concierge : créez votre profil gratuitement.",
      link: "/connexion",
    },
    {
      Icon: Icons.Users,
      title: "Je publie ou je cherche",
      description: "Publiez une mission ou contactez un professionnel à proximité.",
      link: "/mapwithlist",
    },
    {
      Icon: Icons.Handshake,
      title: "Je collabore",
      description: "En toute confiance grâce à notre plateforme locale et éthique.",
      link: "/a-propos",
    },
  ];

  const handleNavigation = (link: string) => {
    if (!link) return;
    router.push(link);
  };

  return (
    <section className={styles.howItWorks}>
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Comment ça marche ?
      </motion.h2>

      <div className={styles.steps}>
        {steps.map((step, index) => (
          <motion.div
            key={index}
            role="button"
            tabIndex={0}
            className={styles.step}
            onClick={() => handleNavigation(step.link)}
            onKeyDown={(e) => e.key === "Enter" && handleNavigation(step.link)}
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
              <step.Icon size={32} />
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
        ))}
      </div>
    </section>
  );
}
