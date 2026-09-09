import { Badge, Button, Card, CardBody, CardHeader, Input, Select, Textarea } from "@/components/ui";
import { colors, spacing, typography, shadows } from "@/styles/tokens";
import { ArtDecoMarketplaceShowcase } from "../_components/ArtDecoMarketplaceShowcase";
import styles from "../atelier.module.scss";
import { LayoutMotionExamples } from "../_components/LayoutMotionExamples";

const palette = [
  ["Actions", colors.primary], ["Surfaces", colors.surface],
  ["Texte", colors.textPrimary], ["Réussite", colors.success],
  ["Attention", colors.warning], ["Erreur", colors.error],
] as const;

export default function FoundationsPage() {
  return <main className={styles.page}>
    <header className={styles.header}><span className={styles.eyebrow}>01 · Fondations</span><h1>Fondations du Design System PlanetLS</h1><p>Les repères communs à tous les espaces.</p></header>
    <h2>Couleurs</h2>
    <div className={styles.grid}>{palette.map(([label, color]) => <article key={label} className={styles.card}><span className={styles.swatch} style={{ backgroundColor: color }} /><strong>{label}</strong></article>)}</div>
    <h2>Typographie et rythme</h2>
    <div className={styles.grid}>
      <article className={styles.card} style={{ fontFamily: typography.heading }}><h3>Des titres lisibles</h3><p style={{ fontFamily: typography.body }}>Un texte simple et une hiérarchie commune.</p></article>
      <article className={styles.card} style={{ gap: spacing[5], boxShadow: shadows.sm }}><strong>Des espaces pour respirer</strong><p>Des marges régulières et des ombres discrètes.</p></article>
    </div>
    <h2>Composants de base</h2>
    <div className={styles.grid}>
      <Card><CardHeader>Actions</CardHeader><CardBody><div className={styles.examples}><Button>Action principale</Button><Button variant="outline">Action secondaire</Button></div></CardBody></Card>
      <Card><CardHeader>Statuts</CardHeader><CardBody><div className={styles.examples}><Badge variant="success">Terminée</Badge><Badge variant="warning">En attente</Badge><Badge variant="danger">Annulée</Badge></div></CardBody></Card>
      <Card><CardHeader>Champs</CardHeader><CardBody><div className={styles.examples}><Input id="foundation-label" label="Libellé" placeholder="Exemple" /><Select id="foundation-choice" label="Choix"><option>Option</option></Select><Textarea id="foundation-note" label="Note" rows={2} /></div></CardBody></Card>
    </div>
    <details className={styles.details}><summary>Sections partagées et animations</summary><LayoutMotionExamples /></details>
    <details className={styles.details}><summary>Exemple de composition Art déco</summary><ArtDecoMarketplaceShowcase /></details>
    <details className={styles.details}><summary>Règles de composition</summary><p>Réutiliser les mêmes boutons, cartes et champs. Limiter chaque zone à une action principale. Prévoir les états de chargement, vides et d’erreur.</p><p>Pour les tableaux : titre explicite, colonnes nommées, identifiants stables et filtres utiles. Sur mobile, conserver toutes les informations, sous forme de cartes ou avec un défilement horizontal.</p></details>
  </main>;
}
