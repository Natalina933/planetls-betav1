import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./ShopSection.module.scss";

export function ShopSection() {
  return (
    <section className={styles.shop}>
      <h2>Notre boutique locale</h2>
      <motion.div
        className={styles.shopContent}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ShoppingBag size={48} />
        <p>
          Découvrez nos kits d&apos;accueil, objets déco et produits artisanaux conçus pour les
          acteurs de la location saisonnière.
        </p>
        <button className={styles.shopButton}>Voir la boutique</button>
      </motion.div>
    </section>
  );
}
