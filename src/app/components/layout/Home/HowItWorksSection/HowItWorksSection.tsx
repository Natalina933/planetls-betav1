"use client";

import { motion } from "framer-motion";
import { Lightbulb, Users, Handshake } from "lucide-react";
import styles from "./HowItWorksSection.module.scss";

const steps = [
    {
        icon: <Lightbulb size={32} />,
        title: "Je m’inscris",
        description: "Propriétaire, artisan ou concierge : créez votre profil gratuitement.",
        link: "/connexion"
    },
    {
        icon: <Users size={32} />,
        title: "Je publie ou je cherche",
        description: "Publiez une mission ou contactez un professionnel à proximité.",
        link: "/mapwithlist"
    },
    {
        icon: <Handshake size={32} />,
        title: "Je collabore",
        description: "En toute confiance grâce à notre plateforme locale et éthique.",
        link: "/a-propos"
    }
];

export function HowItWorksSection() {
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
                        className={styles.step}
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
                            {step.icon}
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
