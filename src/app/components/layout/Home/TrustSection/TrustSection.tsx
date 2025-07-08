import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./TrustSection.module.scss";
export function TrustSection() {
    return (
        <section className={styles.trust}>
            <h2>Pourquoi nous faire confiance ?</h2>
            <div className={styles.trustItems}>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <ShieldCheck size={32} />
                    <h3>Paiement sécurisé</h3>
                    <p>Transactions protégées et données chiffrées.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <ShieldCheck size={32} />
                    <h3>Plateforme éthique</h3>
                    <p>Charte RSE et transparence garantie.</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <ShieldCheck size={32} />
                    <h3>Identité vérifiée</h3>
                    <p>Profils authentifiés pour plus de confiance.</p>
                </motion.div>
            </div>
        </section>
    );
}