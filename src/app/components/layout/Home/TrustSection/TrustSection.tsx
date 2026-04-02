import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { SectionIntro } from "@/components/ui";
import styles from "./TrustSection.module.scss";

export function TrustSection() {
  return (
    <section className={styles.trust}>
      <SectionIntro
        title="Pourquoi nous faire confiance ?"
        description="Une base plus rassurante, plus lisible et plus professionnelle pour travailler ensemble dans la location courte durée."
      />
      <div className={styles.trustItems}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ShieldCheck size={32} />
          <h3>Échanges centralisés</h3>
          <p>Une meilleure lisibilité sur les demandes, les missions et les informations utiles.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <ShieldCheck size={32} />
          <h3>Cadre plus clair</h3>
          <p>Chaque acteur retrouve son rôle, ses outils et un parcours plus simple à suivre.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <ShieldCheck size={32} />
          <h3>Profils plus fiables</h3>
          <p>Les informations de service, les badges et la visibilité des profils renforcent la confiance.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <ShieldCheck size={32} />
          <h3>Activité mieux suivie</h3>
          <p>Documents, missions et coordination terrain sont rassemblés dans un même environnement.</p>
        </motion.div>
      </div>
    </section>
  );
}
