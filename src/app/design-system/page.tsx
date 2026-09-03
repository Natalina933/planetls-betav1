import Link from "next/link";
import type { Route } from "next";
import { ArtDecoMarketplaceShowcase } from "@/components/features/artDecoMarketplace";
import { DevelopmentSectionNav } from "@/components/development/DevelopmentSectionNav";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select, Textarea } from "@/components/ui";
import styles from "./page.module.scss";

const FOUNDATION_ITEMS = [
  {
    title: "Tokens canoniques",
    detail: "Couleurs, espacements, rayons, ombres et motions via `--ds-*`.",
  },
  {
    title: "Primitives partagees",
    detail: "Button, Badge, Card, Input, Select et Textarea via `@/components/ui`.",
  },
  {
    title: "Methode cible",
    detail: "Nouveaux ecrans sur primitives UI, anciens styles gardes en compatibilite.",
  },
] as const;

const WORKBENCH_ITEMS = [
  {
    title: "/design-system",
    detail: "Fondations officielles et composants de base a reutiliser.",
    href: "/design-system" as Route,
  },
  {
    title: "/design-system/admin-dashboard",
    detail: "Prototype de composition admin sans donnees reelles ni logique metier.",
    href: "/design-system/admin-dashboard" as Route,
  },
  {
    title: "/design-system/concierge-dashboard",
    detail: "Prototype concierge avec donnees de demonstration et etats comparables.",
    href: "/design-system/concierge-dashboard" as Route,
  },
  {
    title: "/design-system/visuels",
    detail: "Atelier large: themes, icones, popups, cards et references par espace.",
    href: "/design-system/visuels" as Route,
  },
] as const;

const REFERENCE_RULES = [
  "Cette page fixe les regles et les composants cibles.",
  "L'atelier visuel montre les variantes et les exemples reels sans redefinir les APIs.",
  "Les prototypes restent des maquettes : aucune donnee ou action ne doit etre comprise comme reelle.",
  "Le README de src/components/ui est la reference technique des imports et des types.",
] as const;

const COVERAGE_ITEMS = [
  "Couleurs, surfaces et etats semantiques",
  "Boutons, badges, cartes et champs standards",
  "Prototype admin comme page temoin de composition",
  "Bibliotheque visuelle plus large dans `/design-system/visuels`",
] as const;

const GAP_ITEMS = [
  "Contrat Table + filtres, documente et demontre dans le prototype concierge",
  "Exemples relies aux espaces proprietaire, concierge et artisan",
  "Bonnes et mauvaises pratiques directement visibles sur la page",
  "Cartographie claire entre composant officiel, prototype et ecran reel",
] as const;

const TABLE_CONTRACT_ITEMS = [
  "Titre ou caption, colonnes explicites, ligne avec identifiant stable et action principale facultative.",
  "Recherche, statut, periode, role, tri et pagination seulement lorsqu'ils servent le parcours.",
  "Par defaut, defilement horizontal mobile; cartes uniquement si les details restent complets et accessibles.",
] as const;

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
          <Link href={"/design-system/concierge-dashboard" as Route}>Prototype concierge</Link>
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
      <section className={styles.auditSection} aria-labelledby="design-system-audit-title">
        <div className={styles.catalogueHeading}>
          <p>Lecture du socle reel</p>
          <h2 id="design-system-audit-title">Ce que couvre deja le referentiel</h2>
          <span>La page officielle reste courte, mais elle s'appuie sur des pages temoins et sur les composants reellement presents dans le depot.</span>
        </div>
        <div className={styles.auditGrid}>
          {FOUNDATION_ITEMS.map((item) => (
            <article key={item.title} className={styles.auditCard}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
        <div className={styles.workspaceGrid}>
          {WORKBENCH_ITEMS.map((item) => (
            <Link key={item.title} href={item.href} className={styles.workspaceCard}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </Link>
          ))}
        </div>
        <div className={styles.coverageGrid}>
          <Card tone="outlined" variant="small">
            <CardHeader>Deja visible</CardHeader>
            <CardBody>
              <ul className={styles.ruleList}>
                {COVERAGE_ITEMS.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </CardBody>
          </Card>
          <Card tone="outlined" variant="small">
            <CardHeader>A completer ensuite</CardHeader>
            <CardBody>
              <ul className={styles.ruleList}>
                {GAP_ITEMS.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </CardBody>
          </Card>
        </div>
        <div className={styles.referenceRules}>
          <strong>Organisation officielle du referentiel</strong>
          <ul className={styles.ruleList}>
            {REFERENCE_RULES.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </div>
        <div className={styles.tableContract}>
          <strong>Contrat transverse Table + filtres</strong>
          <ul className={styles.ruleList}>{TABLE_CONTRACT_ITEMS.map((item) => <li key={item}>{item}</li>)}</ul>
          <Link href={"/design-system/concierge-dashboard" as Route}>Voir la demonstration missions filtrees</Link>
        </div>
      </section>
      <ArtDecoMarketplaceShowcase />
    </>
  );
}
