import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { ButtonLink, SectionIntro } from "@/components/ui";
import styles from "./ShopSection.module.scss";

export function ShopSection() {
  return (
    <section className={styles.shop}>
      <SectionIntro
        title="Notre boutique locale"
        description="Une selection d'objets, kits et produits utiles pour enrichir l'experience voyageur."
      />
      <motion.div
        className={styles.shopContent}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ShoppingBag size={48} />
        <p>
          Decouvrez nos kits d'accueil, objets deco et produits artisanaux concus pour les acteurs
          de la location saisonniere.
        </p>
        <ButtonLink href="/shop" variant="paper" className={styles.shopButton}>
          Voir la boutique
        </ButtonLink>
      </motion.div>
    </section>
  );
}
