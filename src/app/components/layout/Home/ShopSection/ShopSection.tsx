import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { ButtonLink, SectionIntro } from "@/components/ui";
import styles from "./ShopSection.module.scss";

export function ShopSection() {
  return (
    <section className={styles.shop}>
      <SectionIntro
        title="Boutique et kits utiles"
        description="Une sélection de produits et kits pratiques pour accompagner l'exploitation quotidienne de vos logements."
      />
      <motion.div
        className={styles.shopContent}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ShoppingBag size={48} />
        <p>
          Découvrez nos kits d&apos;accueil, produits utiles et essentiels pensés pour les acteurs de la
          location courte durée.
        </p>
        <ButtonLink href="/shop" variant="paper" className={styles.shopButton}>
          Voir la boutique
        </ButtonLink>
      </motion.div>
    </section>
  );
}
