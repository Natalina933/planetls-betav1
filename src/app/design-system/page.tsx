import Link from "next/link";
import type { Route } from "next";
import { ArtDecoMarketplaceShowcase } from "@/components/features/artDecoMarketplace";
import { DevelopmentSectionNav } from "@/components/development/DevelopmentSectionNav";
import styles from "./page.module.scss";

export default function DesignSystemPage() {
  return (
    <>
      <div className={styles.developmentNav}><DevelopmentSectionNav active="design-system" /></div>
      <section className={styles.visualReferenceCallout}>
        <div>
          <p>Atelier de cohérence</p>
          <h1>Référentiel visuel</h1>
          <span>Icônes, boutons, badges, cartes et cadences regroupés au même endroit.</span>
        </div>
        <Link href={"/design-system/visuels" as Route}>Ouvrir les visuels</Link>
      </section>
      <ArtDecoMarketplaceShowcase />
    </>
  );
}
