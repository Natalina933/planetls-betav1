import Link from "next/link";
import type { Route } from "next";
import { ArtDecoMarketplaceShowcase } from "@/components/features/artDecoMarketplace";
import { DevelopmentSectionNav } from "@/components/development/DevelopmentSectionNav";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select, Textarea } from "@/components/ui";
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
        <div className={styles.calloutActions}>
          <Link href={"/design-system/admin-dashboard" as Route}>Prototype admin</Link>
          <Link href={"/design-system/visuels" as Route}>Ouvrir les visuels</Link>
        </div>
      </section>
      <section className={styles.catalogue} aria-labelledby="catalogue-title">
        <div className={styles.catalogueHeading}>
          <p>Phase 1 - source officielle</p>
          <h2 id="catalogue-title">Fondations du Design System PlanetLS</h2>
          <span>Les nouveaux ecrans utilisent les tokens <code>--ds-*</code> et les primitives de <code>src/components/ui</code>.</span>
        </div>
        <div className={styles.tokenGrid}>
          <article><span className={styles.primarySwatch} />Primaire et actions</article>
          <article><span className={styles.surfaceSwatch} />Surfaces et bordures</article>
          <article><span className={styles.successSwatch} />Etats semantiques</article>
        </div>
        <div className={styles.componentGrid}>
          <Card tone="soft" variant="small"><CardHeader>Actions</CardHeader><CardBody><Button>Action principale</Button><Button variant="outline">Secondaire</Button></CardBody></Card>
          <Card tone="soft" variant="small"><CardHeader>Statuts</CardHeader><CardBody><div className={styles.badgeRow}><Badge variant="success">Terminee</Badge><Badge variant="warning">En attente</Badge><Badge variant="danger">Annulee</Badge></div></CardBody></Card>
          <Card tone="soft" variant="small"><CardHeader>Champs</CardHeader><CardBody><Input id="design-system-input" label="Libelle" placeholder="Exemple" /><Select id="design-system-select" label="Choix"><option>Option</option></Select><Textarea id="design-system-textarea" label="Note" rows={2} /></CardBody></Card>
        </div>
      </section>
      <ArtDecoMarketplaceShowcase />
    </>
  );
}
