"use client";

import { motion } from "framer-motion";
import { Lightbulb, Users, Handshake} from "lucide-react";
import styles from "./HowItWorksSection.module.scss";

const steps = [
    {
        icon: <Lightbulb size={32} />,
        title: "Je m’inscris",
        description: "Propriétaire, artisan ou concierge : créez votre profil gratuitement."
    },
    {
        icon: <Users size={32} />,
        title: "Je publie ou je cherche",
        description: "Publiez une mission ou contactez un professionnel à proximité."
    },
    {
        icon: <Handshake size={32} />,
        title: "Je collabore",
        description: "En toute confiance grâce à notre plateforme locale et éthique."
    }
];

export function HowItWorksSection() {
    return (
        <section className={styles.howItWorks}>
            <h2>Comment ça marche ?</h2>
            <div className={styles.steps}>
                {steps.map((step, index) => (
                    <motion.div
                        key={index}
                        className={styles.step}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                    >
                        <div className={styles.icon}>{step.icon}</div>
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}