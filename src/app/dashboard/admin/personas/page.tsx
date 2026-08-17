import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/authOptions";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { Card, CardBody } from "@/components/ui";
import {
  productPersonas,
  type ProductPersona,
} from "@/app/dashboard/admin/developpement/personas/personas";
import { PersonaFlipCard } from "./PersonaFlipCard";
import styles from "../pilotage/personas/page.module.scss";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Personas | PlanetLS",
  description:
    "Personas stratégiques PlanetLS reliés au pilotage business, au contrôle détaillé et aux priorités produit.",
};

type PersonaImpactRow = {
  feature: string;
  personas: string;
  impact: string;
  urgency: string;
  businessValue: string;
  complexity: string;
};

type PersonaFamily = {
  id: string;
  title: string;
  badge: string;
  description: string;
  dashboard: string;
  offering: string;
  objective: string;
  personas: string[];
  note?: string;
};

type PersonaInsight = {
  id: string;
  title: string;
  dashboards: string;
  need: string;
  friction: string;
  kpi: string;
  hypothesis: string;
  risk: string;
};

type PersonaReferenceRow = {
  personaId: string;
  familyId: string;
  persona: string;
  profile: string;
  mainNeed: string;
  valueAdd: string;
  potential: string;
  potentialLabel: string;
};

type PersonaVisualMeta = {
  tone: "owners" | "concierges" | "providers" | "ecosystem" | "platform";
  punchline: string;
  commercialOffer: string;
  potential: string;
  visualBadge: string;
  icon: "owner" | "concierge" | "provider" | "team" | "merchant" | "admin" | "traveler";
};

const PERSONA_FAMILIES: PersonaFamily[] = [
  {
    id: "clients",
    title: "Clients",
    badge: "4 profils",
    description:
      "Les clients ne doivent pas partager un seul cockpit. Le propriétaire veut lire, arbitrer et valider. La conciergerie veut piloter l'exécution et les urgences.",
    dashboard: "Vue propriétaire simple + cockpit conciergerie plus dense selon la maturité.",
    offering: "Starter / Pro / Business selon taille du portefeuille et niveau d'automatisation.",
    objective: "Transformer un besoin de visibilité ou d'organisation en usage récurrent et en rétention.",
    personas: [
      "owner-individual",
      "owner-professional",
      "concierge-independent",
      "concierge-manager",
    ],
  },
  {
    id: "providers",
    title: "Prestataires",
    badge: "2 profils",
    description:
      "Les prestataires ont besoin d'une interface d'exécution, pas d'un back-office complexe. Le mobile, la mission et la preuve passent avant tout.",
    dashboard: "Vue terrain mobile, missions, preuves, notifications et paiement.",
    offering: "Accès missionnel simple pensé pour l'adoption rapide et la récurrence locale.",
    objective: "Fluidifier l'exécution et fiabiliser la qualité de service sans friction.",
    personas: ["team-member", "provider"],
  },
  {
    id: "ecosystem",
    title: "Écosystème",
    badge: "1 profil + roadmap",
    description:
      "Ces profils ne doivent apparaître que s'ils renforcent le cœur du SaaS. Ils servent l'expansion du réseau, pas le MVP principal.",
    dashboard: "Espace vitrine + commandes ou demandes ciblées, sans lourdeur produit.",
    offering: "Marketplace, visibilité locale, partenariats et revenus complémentaires.",
    objective: "Étendre l'écosystème professionnel sans diluer la proposition de valeur principale.",
    personas: ["local-merchant"],
    note: "Le voyageur, les agences et les apporteurs d'affaires restent des personas de roadmap à cadrer ensuite.",
  },
  {
    id: "platform",
    title: "Plateforme",
    badge: "1 profil",
    description:
      "Le persona admin n'est pas un utilisateur comme les autres. Son cockpit doit servir à arbitrer, contrôler et prioriser.",
    dashboard: "Cockpit transverse : produit, qualité, risques, business et prochaines actions.",
    offering: "Usage interne structurant, sans logique d'abonnement.",
    objective: "Garder une lecture fiable des blocages, des preuves et de la prochaine action utile.",
    personas: ["admin"],
  },
];

const PERSONA_INSIGHTS: PersonaInsight[] = [
  {
    id: "clients",
    title: "Clients",
    dashboards: "Vue propriétaire rassurante ou cockpit conciergerie selon le niveau d'opérations.",
    need:
      "Visibilité, preuves, simplicité côté propriétaire ; organisation et automatisation côté conciergerie.",
    friction: "Soit trop peu d'informations pour décider, soit trop de complexité pour agir vite.",
    kpi: "Activation J+7, taux de devis acceptés, missions closes sans friction, rétention par segment.",
    hypothesis: "Séparer clairement lecture propriétaire et cockpit conciergerie accélère l'adoption.",
    risk: "Un même écran pour tous finit par ne vraiment aider personne.",
  },
  {
    id: "providers",
    title: "Prestataires",
    dashboards: "Interface mobile d'exécution, checklists, preuves et paiements.",
    need: "Consignes nettes, contexte local, changements visibles tout de suite.",
    friction: "Demandes imprécises, changements tardifs, paiement peu lisible.",
    kpi: "Taux d'acceptation mission, délai de clôture, délai moyen de paiement, récurrence locale.",
    hypothesis: "Une expérience missionnelle ultra simple augmente l'acceptation et la qualité terrain.",
    risk: "Si l'interface ressemble à un back-office, l'usage s'effondre.",
  },
  {
    id: "ecosystem",
    title: "Écosystème",
    dashboards: "Espace léger de visibilité et de commandes, activé seulement quand le cœur métier est stable.",
    need: "Visibilité ciblée, opportunités qualifiées, logique de partenariat plus que simple vitrine.",
    friction: "Rôles flous, parcours trop générique, faible lisibilité de la valeur business.",
    kpi: "Nombre de partenaires actifs, commandes récurrentes, conversion marketplace.",
    hypothesis: "Un écosystème vertical bien cadré renforce la différenciation PlanetLS.",
    risk: "Lancer trop tôt ces rôles peut disperser le produit.",
  },
  {
    id: "platform",
    title: "Plateforme",
    dashboards: "Cockpit admin relié au business plan, au contrôle détaillé et au développement.",
    need: "Voir les vrais blocages, arbitrer vite et relier produit, business et exécution.",
    friction: "Signaux éclatés, priorités floues, décisions sans contexte partagé.",
    kpi: "Temps de reprise projet, sujets critiques visibles, rythme de fermeture P0/P1, cohérence roadmap.",
    hypothesis: "Un référentiel personas par famille améliore la priorisation et la lecture des arbitrages.",
    risk: "Des personas décoratifs sans effet sur les décisions alourdissent le cockpit.",
  },
];

const PERSONA_REFERENCE_ROWS: PersonaReferenceRow[] = [
  {
    personaId: "owner-individual",
    familyId: "clients",
    persona: "🏠 Propriétaire autonome",
    profile: "1 à 2 logements",
    mainNeed: "Gérer simplement ses locations",
    valueAdd: "Planning, missions, prestataires, documents, dépenses",
    potential: "⭐⭐⭐",
    potentialLabel: "Bon potentiel",
  },
  {
    personaId: "owner-professional",
    familyId: "clients",
    persona: "🏘️ Propriétaire multi-biens",
    profile: "Plusieurs locations saisonnières",
    mainNeed: "Centraliser et automatiser",
    valueAdd: "Multi-logements, reporting, automatisations, IA",
    potential: "⭐⭐⭐⭐⭐",
    potentialLabel: "Très fort potentiel",
  },
  {
    personaId: "concierge-independent",
    familyId: "clients",
    persona: "🔑 Concierge indépendante",
    profile: "Travaille seule, souvent en co-hôte",
    mainNeed: "Organiser ses logements et interventions",
    valueAdd: "Planning, missions, propriétaires, voyageurs, facturation",
    potential: "⭐⭐⭐⭐",
    potentialLabel: "Fort potentiel",
  },
  {
    personaId: "concierge-manager",
    familyId: "clients",
    persona: "🏢 Conciergerie professionnelle",
    profile: "Équipe + nombreux logements",
    mainNeed: "Piloter toute l'activité",
    valueAdd: "Équipe, planning, missions, KPI, automatisations, facturation",
    potential: "⭐⭐⭐⭐⭐",
    potentialLabel: "Très fort potentiel",
  },
  {
    personaId: "provider",
    familyId: "providers",
    persona: "🔧 Artisan / prestataire",
    profile: "Plombier, électricien, ménage, jardinier…",
    mainNeed: "Trouver et gérer des missions",
    valueAdd: "Demandes, devis, planning, preuves, facturation",
    potential: "⭐⭐⭐",
    potentialLabel: "Bon potentiel",
  },
  {
    personaId: "team-member",
    familyId: "providers",
    persona: "🧹 Prestataire récurrent",
    profile: "Ménage, linge, maintenance…",
    mainNeed: "Organiser des interventions régulières",
    valueAdd: "Planning récurrent, checklists, notifications, suivi",
    potential: "⭐⭐⭐⭐",
    potentialLabel: "Fort potentiel",
  },
  {
    personaId: "local-merchant",
    familyId: "ecosystem",
    persona: "🛍️ Partenaire / fournisseur",
    profile: "Linge, équipements, déco, consommables…",
    mainNeed: "Vendre aux professionnels du secteur",
    valueAdd: "Marketplace et visibilité ciblée",
    potential: "⭐⭐⭐⭐",
    potentialLabel: "Fort potentiel",
  },
  {
    personaId: "admin",
    familyId: "platform",
    persona: "🛡️ Administrateur PlanetLS",
    profile: "Toi puis ton équipe",
    mainNeed: "Piloter la plateforme",
    valueAdd: "Utilisateurs, abonnements, litiges, paiements, KPI",
    potential: "Interne",
    potentialLabel: "Usage interne",
  },
];

const PERSONA_IMPACT_ROWS: PersonaImpactRow[] = [
  {
    feature: "Preuves de réalisation",
    personas: "Clients, Prestataires",
    impact: "Fort",
    urgency: "Haute",
    businessValue: "Confiance, validation, réduction des litiges",
    complexity: "Moyenne",
  },
  {
    feature: "Automatisation check-out / relances",
    personas: "Clients, Plateforme",
    impact: "Fort",
    urgency: "Haute",
    businessValue: "Temps gagné, baisse des urgences",
    complexity: "Moyenne",
  },
  {
    feature: "Marketplace artisans contextualisée",
    personas: "Prestataires, Clients",
    impact: "Fort",
    urgency: "Moyenne",
    businessValue: "Liquidité locale, récurrence, différenciation",
    complexity: "Élevée",
  },
  {
    feature: "Pilotage portefeuille multi-logements",
    personas: "Clients, Plateforme",
    impact: "Fort",
    urgency: "Moyenne",
    businessValue: "Upsell, rétention, lisibilité business",
    complexity: "Élevée",
  },
  {
    feature: "Planning mobile terrain",
    personas: "Prestataires, Clients",
    impact: "Fort",
    urgency: "Moyenne",
    businessValue: "Exécution plus fluide, moins d'oublis",
    complexity: "Moyenne",
  },
  {
    feature: "Contrôle détaillé par famille de personas",
    personas: "Plateforme",
    impact: "Moyen",
    urgency: "Moyenne",
    businessValue: "Priorisation plus juste, meilleur pilotage",
    complexity: "Faible",
  },
];

function getPersonasByIds(ids: string[]) {
  return ids
    .map((id) => productPersonas.find((persona) => persona.id === id))
    .filter(Boolean) as ProductPersona[];
}

function getPersonaReference(personaId: string) {
  return PERSONA_REFERENCE_ROWS.find((row) => row.personaId === personaId);
}

function getPersonaFocus(persona: ProductPersona) {
  if (persona.id.startsWith("owner")) return "Décision, transparence, preuves";
  if (persona.id.startsWith("concierge")) return "Organisation, automatisation, qualité";
  if (persona.id === "team-member") return "Exécution terrain, checklists, réactivité";
  if (persona.id === "provider") return "Mission claire, exécution, paiement";
  if (persona.id === "local-merchant") return "Partenariat, visibilité, commandes récurrentes";
  if (persona.id === "admin") return "Arbitrage, contrôle, priorisation";
  return "Usage, valeur, pilotage";
}

function getPersonaNeeds(persona: ProductPersona) {
  if (persona.id === "owner-individual") {
    return ["Tableau de bord clair", "Preuves photo", "Notifications simples", "Processus guidés"];
  }
  if (persona.id === "owner-professional") {
    return ["Vue portefeuille", "Lecture financière", "Alertes consolidées", "Responsabilités explicites"];
  }
  if (persona.id === "concierge-independent" || persona.id === "concierge-manager") {
    return ["Planning puissant", "Automations conditionnelles", "Réseau d'artisans", "Suivi des missions"];
  }
  if (persona.id === "team-member") {
    return ["Vue mobile nette", "Checklist immédiate", "Signalement rapide", "Consignes à jour"];
  }
  if (persona.id === "provider") {
    return ["Fiches missions claires", "Preuves simples à envoyer", "Paiement intégré", "Mobile léger"];
  }
  if (persona.id === "local-merchant") {
    return ["Catalogue simple", "Demandes ciblées", "Conditions visibles", "Récurrence locale"];
  }
  if (persona.id === "admin") {
    return ["Priorités lisibles", "KPI fiables", "Décisions tracées", "Vue transverse claire"];
  }
  return ["Interface claire", "Contexte utile", "Actions simples", "Suivi visible"];
}

function getDashboardType(persona: ProductPersona) {
  if (persona.id.startsWith("owner")) return "Vue propriétaire";
  if (persona.id.startsWith("concierge")) return "Cockpit conciergerie";
  if (persona.id === "team-member") return "Vue terrain";
  if (persona.id === "provider") return "Vue prestataire";
  if (persona.id === "local-merchant") return "Espace partenaire";
  if (persona.id === "admin") return "Cockpit admin";
  return "Vue dédiée";
}

function getPersonaVisualMeta(persona: ProductPersona): PersonaVisualMeta {
  if (persona.id === "owner-individual") {
    return {
      tone: "owners",
      punchline: "Je veux savoir si mon logement est prêt sans y passer la journée.",
      commercialOffer: "Starter / Gratuit",
      potential: "★★★",
      visualBadge: "1 à 2 logements",
      icon: "owner",
    };
  }
  if (persona.id === "owner-professional") {
    return {
      tone: "owners",
      punchline: "Je veux piloter plusieurs biens sans ouvrir cinq outils différents.",
      commercialOffer: "Offre Pro",
      potential: "★★★★★",
      visualBadge: "4 à 15 logements",
      icon: "owner",
    };
  }
  if (persona.id === "concierge-independent") {
    return {
      tone: "concierges",
      punchline: "Je dois voir mes urgences du jour tout de suite.",
      commercialOffer: "MVP prioritaire",
      potential: "★★★★",
      visualBadge: "Co-hôte / indépendante",
      icon: "concierge",
    };
  }
  if (persona.id === "concierge-manager") {
    return {
      tone: "concierges",
      punchline: "Je veux gérer l'équipe, la qualité et la marge au même endroit.",
      commercialOffer: "Offre Business",
      potential: "★★★★★",
      visualBadge: "Équipe + portefeuille",
      icon: "concierge",
    };
  }
  if (persona.id === "team-member") {
    return {
      tone: "providers",
      punchline: "Dites-moi où aller, quoi faire et comment clôturer vite.",
      commercialOffer: "Vue terrain",
      potential: "★★★★",
      visualBadge: "Ménage / linge / terrain",
      icon: "team",
    };
  }
  if (persona.id === "provider") {
    return {
      tone: "providers",
      punchline: "Une bonne mission doit être claire avant même que je parte.",
      commercialOffer: "Sur mesure",
      potential: "★★★",
      visualBadge: "Artisan / réparation",
      icon: "provider",
    };
  }
  if (persona.id === "local-merchant") {
    return {
      tone: "ecosystem",
      punchline: "Je cherche des commandes régulières, pas seulement une vitrine de plus.",
      commercialOffer: "Marketplace B2B",
      potential: "★★★★",
      visualBadge: "Produits & visibilité",
      icon: "merchant",
    };
  }
  return {
    tone: "platform",
    punchline: "Je veux voir ce qui fonctionne, ce qui bloque et quelle action lancer ensuite.",
    commercialOffer: "Interne",
    potential: "Interne",
    visualBadge: "Supervision plateforme",
    icon: "admin",
  };
}

function PersonaFamilyPanel({ family }: { family: PersonaFamily }) {
  const personas = getPersonasByIds(family.personas);

  return (
    <details className={styles.foldSection} open>
      <summary className={styles.foldSummary}>
        <div className={styles.foldSummaryCopy}>
          <span className={styles.familyEyebrow}>{family.title}</span>
          <strong>{family.description}</strong>
        </div>
        <div className={styles.foldSummaryMeta}>
          <span className={styles.familyBadge}>{family.badge}</span>
          <span className={styles.foldChevron} aria-hidden="true">
            <ChevronDown size={18} />
          </span>
        </div>
      </summary>

      <Card tone="outlined" className={styles.familyPanel}>
        <CardBody className={styles.familyBody}>
          <div className={styles.familyMeta}>
            <article className={styles.familyMetaCard}>
              <span>Dashboard type</span>
              <p>{family.dashboard}</p>
            </article>
            <article className={styles.familyMetaCard}>
              <span>Logique d'offre</span>
              <p>{family.offering}</p>
            </article>
            <article className={styles.familyMetaCard}>
              <span>Objectif produit</span>
              <p>{family.objective}</p>
            </article>
          </div>

          <div className={styles.familyPersonas}>
            {personas.map((persona) => {
              const visualMeta = getPersonaVisualMeta(persona);
              const reference = getPersonaReference(persona.id);

              return (
                <PersonaFlipCard
                  key={persona.id}
                  name={persona.name}
                  role={persona.role}
                  image={persona.image}
                  imageAlt={`Portrait de ${persona.name}`}
                  segment={persona.segment}
                  primaryDevice={persona.primaryDevice}
                  digitalLevel={persona.digitalLevel}
                  status={persona.status}
                  dashboardType={getDashboardType(persona)}
                  focus={getPersonaFocus(persona)}
                  punchline={visualMeta.punchline}
                  quote={persona.quote}
                  visualBadge={visualMeta.visualBadge}
                  commercialOffer={visualMeta.commercialOffer}
                  potential={reference?.potential ?? visualMeta.potential}
                  context={persona.context}
                  needs={getPersonaNeeds(persona)}
                  goals={persona.goals}
                  frustrations={persona.frustrations}
                  priorityFeatures={persona.priorityFeatures}
                  firstValue={persona.firstValue}
                  tone={visualMeta.tone}
                  icon={visualMeta.icon}
                  profileLabel={reference?.profile ?? persona.segment}
                  mainNeed={reference?.mainNeed ?? getPersonaNeeds(persona)[0]}
                  platformValue={reference?.valueAdd ?? persona.firstValue}
                  potentialLabel={reference?.potentialLabel ?? visualMeta.commercialOffer}
                />
              );
            })}

            {family.id === "ecosystem" ? (
              <PersonaFlipCard
                name="Voyageur"
                role="Persona optionnel"
                image="/avatars/marie.png"
                imageAlt="Illustration du persona voyageur"
                segment="Roadmap future"
                primaryDevice="Mobile"
                digitalLevel="Intermédiaire"
                status="À cadrer"
                dashboardType="Espace séjour léger"
                focus="Arrivée, support, incidents"
                punchline="Je veux arriver, comprendre et signaler un problème sans friction."
                visualBadge="Roadmap future"
                commercialOffer="Espace séjour"
                potential="Optionnel"
                context="Le voyageur existe déjà comme bénéficiaire opérationnel du séjour, mais il n'a pas encore de persona dédié assez mature pour piloter une roadmap autonome."
                needs={["Messages automatisés", "Support rapide", "Check-in / out simple"]}
                goals={["Check-in fluide", "Communication claire", "Séjour sans incident"]}
                frustrations={["Instructions confuses", "Problèmes non résolus", "Manque de réactivité"]}
                priorityFeatures={["Parcours d'arrivée", "Support incident", "Informations de séjour"]}
                firstValue="Comprendre immédiatement comment arriver et quoi faire en cas de problème."
                tone="ecosystem"
                icon="traveler"
                backTitle="Persona futur"
                profileLabel="Utilisateur final du séjour"
                mainNeed="Comprendre vite son arrivée et être aidé en cas d'incident"
                platformValue="Messages d'arrivée, support, informations de séjour"
                potentialLabel="Piste future"
              />
            ) : null}
          </div>

          {family.note ? <p className={styles.familyNote}>{family.note}</p> : null}
        </CardBody>
      </Card>
    </details>
  );
}

export default async function AdminPersonasPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "admin" && role !== "super_admin") {
    redirect("/login");
  }

  const strategicPersonas = getPersonasByIds(PERSONA_FAMILIES.flatMap((family) => family.personas));
  const validatedCount = strategicPersonas.filter((persona) => persona.status === "Validé").length;
  const navItems = [
    { label: "Vue d'ensemble", href: "/dashboard/admin" },
    { label: "Pilotage business", href: "/dashboard/admin/pilotage" },
    { label: "Modèle financier", href: "/dashboard/admin/modele-financier" },
    { label: "Personas", href: "/dashboard/admin/personas" },
    { label: "Contrôle détaillé", href: "/dashboard/admin/controle" },
    { label: "Développement", href: "/dashboard/admin/developpement" },
  ] as const;
  const notifications = [
    {
      id: "persona-note",
      title: "Le persona voyageur reste optionnel et à cadrer plus tard.",
      href: "/dashboard/admin/personas",
    },
  ] as const;

  return (
    <DashboardLayout
      persona="admin"
      title="Personas"
      subtitle="Les profils qui orientent stratégie, contrôle détaillé et priorités produit."
      navTitle="Pilotage admin"
      navItems={[...navItems]}
      stats={[
        { label: "Familles", value: String(PERSONA_FAMILIES.length), hint: "Clients à plateforme" },
        { label: "Profils actifs", value: String(strategicPersonas.length), hint: "Socle structuré" },
        { label: "Validés", value: String(validatedCount), hint: "Par l'usage" },
        { label: "Usage attendu", value: "Roadmap + UX + business", hint: "Pilotage continu" },
      ]}
      actions={[]}
      hideQuickActions
      activity={[]}
      hideSidebarNav
      hideNotifications
      notifications={notifications.map((item) => ({ ...item, level: "info" as const }))}
      hideShortcuts
      shortcuts={[
        { label: "Pilotage", href: "/dashboard/admin/pilotage" },
        { label: "Modèle financier", href: "/dashboard/admin/modele-financier" },
        { label: "Personas", href: "/dashboard/admin/personas" },
        { label: "Contrôle", href: "/dashboard/admin/controle" },
        { label: "Développement", href: "/dashboard/admin/developpement" },
      ]}
      profile={{ name: "Direction PlanetLS", subtitle: "Référentiel personas", badge: "Stratégique" }}
    >
      <section className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Admin → Personas</span>
            <h2>Un référentiel pour aligner les priorités business, produit et opérationnelles</h2>
            <p>
              Cette page sert à comprendre rapidement quels profils PlanetLS doit mieux servir,
              quels besoins doivent guider les arbitrages et où concentrer les prochains efforts.
              Elle transforme les personas en outil de pilotage concret pour la roadmap, l'UX et le
              contrôle détaillé.
            </p>
          </div>
          <div className={styles.heroStats}>
            <article>
              <strong>Lecture rapide</strong>
              <span>Profil, besoin principal, valeur PlanetLS et potentiel de chaque persona</span>
            </article>
            <article>
              <strong>Arbitrage</strong>
              <span>Contexte, objectifs, frictions et priorités à transformer en décisions produit</span>
            </article>
            <article>
              <strong>Structure</strong>
              <span>Familles lisibles, comparaison plus simple et vision cohérente entre dashboards</span>
            </article>
            <article>
              <strong>Usage</strong>
              <span>Un support commun pour cadrer la roadmap, l'UX et les opportunités business</span>
            </article>
          </div>
        </section>

        <section className={styles.sectionStack}>
          <DashboardPanel title="Référentiel des profils cibles">
            <div className={styles.sectionHeader}>
              <h3>Tableau de lecture rapide des personas payants et stratégiques</h3>
              <p>
                Ce tableau reprend les profils, besoins, apports PlanetLS et potentiel de monétisation
                que tu veux voir clairement avant les cartes détaillées.
              </p>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Profil</th>
                    <th>Besoin principal</th>
                    <th>Ce que PlanetLS lui apporte</th>
                    <th>Potentiel payant</th>
                  </tr>
                </thead>
                <tbody>
                  {PERSONA_REFERENCE_ROWS.map((row) => (
                    <tr key={row.personaId}>
                      <td>{row.persona}</td>
                      <td>{row.profile}</td>
                      <td>{row.mainNeed}</td>
                      <td>{row.valueAdd}</td>
                      <td>{row.potential}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Architecture des personas">
            <div className={styles.sectionHeader}>
              <h3>Quatre familles, plusieurs dashboards, une seule logique produit</h3>
              <p>
                PlanetLS doit parler différemment aux clients, aux prestataires, à l'écosystème et
                à la plateforme. Chaque famille peut maintenant se plier ou se déplier avec une
                flèche pour garder une vue desktop plus propre.
              </p>
            </div>
            <div className={styles.familyGrid}>
              {PERSONA_FAMILIES.map((family) => (
                <PersonaFamilyPanel key={family.id} family={family} />
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Insights par famille">
            <div className={styles.sectionHeader}>
              <h3>Ce qui doit alimenter le contrôle détaillé</h3>
              <p>
                Besoins, dashboards, KPI, hypothèses à tester et risques par grande famille, avec
                repli par section pour éviter une lecture trop longue.
              </p>
            </div>
            <div className={styles.insightGrid}>
              {PERSONA_INSIGHTS.map((item) => (
                <details key={item.id} className={styles.foldSection} open>
                  <summary className={styles.foldSummary}>
                    <div className={styles.foldSummaryCopy}>
                      <span className={styles.familyEyebrow}>Insights</span>
                      <strong>{item.title}</strong>
                    </div>
                    <span className={styles.foldChevron} aria-hidden="true">
                      <ChevronDown size={18} />
                    </span>
                  </summary>
                  <Card tone="soft" className={styles.insightCard}>
                    <CardBody className={styles.insightBody}>
                      <p><span>Dashboard</span>{item.dashboards}</p>
                      <p><span>Besoin</span>{item.need}</p>
                      <p><span>Friction</span>{item.friction}</p>
                      <p><span>KPI</span>{item.kpi}</p>
                      <p><span>Hypothèse</span>{item.hypothesis}</p>
                      <p><span>Risque</span>{item.risk}</p>
                    </CardBody>
                  </Card>
                </details>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Chantiers structurants par persona">
            <div className={styles.sectionHeader}>
              <h3>Lecture complémentaire pour arbitrer la roadmap</h3>
              <p>
                Ce tableau ne reprend pas le référentiel de profils ci-dessus. Il ajoute une lecture
                plus produit pour relier familles, urgence, valeur business et complexité.
              </p>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Personas concernés</th>
                    <th>Impact</th>
                    <th>Urgence</th>
                    <th>Valeur business</th>
                    <th>Complexité</th>
                  </tr>
                </thead>
                <tbody>
                  {PERSONA_IMPACT_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      <td>{row.personas}</td>
                      <td>{row.impact}</td>
                      <td>{row.urgency}</td>
                      <td>{row.businessValue}</td>
                      <td>{row.complexity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardPanel>
        </section>

        <div className={styles.inlineLinks}>
          <Link href="/dashboard/admin/modele-financier" className={styles.inlineLink}>
            Voir le modèle financier <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard/admin/controle" className={styles.inlineLink}>
            Voir les implications dans Contrôle détaillé <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard/admin/developpement" className={styles.inlineLink}>
            Relire les priorités de développement <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard/admin/pilotage" className={styles.inlineLink}>
            Revenir au pilotage business <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}
