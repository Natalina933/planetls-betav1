"use client";

import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarRange,
  CircleDollarSign,
  Clock3,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import styles from "./UnifiedRoleDashboard.module.scss";

type DashboardRole = "owner" | "concierge" | "artisan";

interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon?: ReactNode;
}

interface DashboardAction {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  tone?: "primary" | "secondary" | "ghost";
}

interface DashboardDisclosureItem {
  id: string;
  label: string;
  summary: string;
  content: ReactNode;
}

interface DashboardSectionBlock {
  id: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
}

interface UnifiedRoleDashboardProps {
  role: DashboardRole;
  title: string;
  subtitle: string;
  experienceBadge: string;
  statusLabel: string;
  kpis: DashboardKpi[];
  actions: DashboardAction[];
  leftPrimary: ReactNode;
  leftSecondary?: ReactNode;
  mapModule?: ReactNode;
  pricingModule?: ReactNode;
  availabilityModule?: ReactNode;
  mainSections?: DashboardSectionBlock[];
  sidebarSections?: DashboardSectionBlock[];
  disclosures?: DashboardDisclosureItem[];
  className?: string;
}

const ROLE_META: Record<
  DashboardRole,
  {
    eyebrow: string;
    lead: string;
    quickNote: string;
  }
> = {
  owner: {
    eyebrow: "Espace patrimoine",
    lead: "Une lecture calme de votre exploitation, pensée pour arbitrer sans friction.",
    quickNote: "Le pilotage met en avant la clarté, la confiance et la projection patrimoniale.",
  },
  concierge: {
    eyebrow: "Espace conciergerie",
    lead: "Un cockpit de service haut de gamme qui garde l'essentiel visible au premier regard.",
    quickNote: "Les modules détaillés restent accessibles sans surcharger la lecture opérationnelle.",
  },
  artisan: {
    eyebrow: "Espace savoir-faire",
    lead: "Un poste de travail précis pour suivre les demandes, les zones et la disponibilité terrain.",
    quickNote: "L'interface valorise la matière, le geste métier et la lisibilité technique.",
  },
};

const DEFAULT_KPI_ICONS = [
  <CircleDollarSign key="revenue" size={24} />,
  <CalendarRange key="calendar" size={24} />,
  <ShieldCheck key="shield" size={24} />,
  <Clock3 key="clock" size={24} />,
];

function ActionButton({ action }: { action: DashboardAction }) {
  const classNames = [styles.actionButton];

  if (action.tone === "secondary") classNames.push(styles.secondaryAction);
  else if (action.tone === "ghost") classNames.push(styles.ghostAction);
  else classNames.push(styles.primaryAction);

  const content = (
    <>
      <span>{action.label}</span>
      <ArrowUpRight size={16} />
    </>
  );

  if (action.href) {
    return (
      <a href={action.href} className={classNames.join(" ")}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={classNames.join(" ")}>
      {content}
    </button>
  );
}

function DashboardPanel({
  eyebrow,
  title,
  description,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className={styles.panelCard}>
      <header className={styles.panelHeader}>
        <div>
          <p className={styles.panelEyebrow}>{eyebrow}</p>
          <h2>{title}</h2>
          {description ? <p className={styles.panelDescription}>{description}</p> : null}
        </div>
        {aside ? <div className={styles.panelAside}>{aside}</div> : null}
      </header>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

export default function UnifiedRoleDashboard({
  role,
  title,
  subtitle,
  experienceBadge,
  statusLabel,
  kpis,
  actions,
  leftPrimary,
  leftSecondary,
  mapModule,
  pricingModule,
  availabilityModule,
  mainSections = [],
  sidebarSections = [],
  disclosures = [],
  className,
}: UnifiedRoleDashboardProps) {
  const roleMeta = ROLE_META[role];
  const rootClassName = className ? `${styles.dashboardRoot} ${className}` : styles.dashboardRoot;

  return (
    <main className={rootClassName}>
      <section className={styles.heroCard}>
        <div className={styles.heroOrnament} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>{roleMeta.eyebrow}</span>
          <div className={styles.heroHeadline}>
            <div className={styles.heroTitleWrap}>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <div className={styles.heroBadges}>
              <span className={styles.experienceBadge}>
                <Sparkles size={14} />
                {experienceBadge}
              </span>
              <span className={styles.statusBadge}>{statusLabel}</span>
            </div>
          </div>
          <p className={styles.heroLead}>{roleMeta.lead}</p>
        </div>

        <div className={styles.heroActions}>
          {actions.map((action) => (
            <ActionButton key={action.id} action={action} />
          ))}
        </div>
      </section>

      <section className={styles.kpiSection} aria-label="Indicateurs principaux">
        {kpis.slice(0, 4).map((kpi, index) => (
          <article key={kpi.id} className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              {kpi.icon ?? DEFAULT_KPI_ICONS[index] ?? <BriefcaseBusiness size={24} />}
            </div>
            <div className={styles.kpiContent}>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <p>{kpi.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.dashboardGrid}>
        <div className={styles.mainColumn}>
          <DashboardPanel
            eyebrow="Pilotage métier"
            title="Vue principale"
            description={roleMeta.quickNote}
            aside={
              <span className={styles.frameBadge}>
                <MapPinned size={14} />
                Lecture unifiée
              </span>
            }
          >
            {leftPrimary}
          </DashboardPanel>

          {mapModule ? (
            <DashboardPanel
              eyebrow="Territoire & missions"
              title="Couverture géographique"
              description="Le sélecteur géographique et la cartographie restent visibles sans rompre la continuité visuelle."
            >
              {mapModule}
            </DashboardPanel>
          ) : null}

          {leftSecondary ? (
            <DashboardPanel
              eyebrow="Compléments"
              title="Historique et modules contextuels"
              description="Les informations secondaires sont présentes mais hiérarchisées pour éviter la surcharge cognitive."
            >
              {leftSecondary}
            </DashboardPanel>
          ) : null}

          {mainSections.map((section) => (
            <DashboardPanel key={section.id} eyebrow="Repère visuel" title={section.title} description={section.subtitle}>
              {section.content}
            </DashboardPanel>
          ))}
        </div>

        <aside className={styles.sidebarColumn}>
          <DashboardPanel
            eyebrow="Réglages rapides"
            title="Pilotage opérationnel"
            description="Les actions fréquentes restent à portée de main, avec détails avancés révélés à la demande."
          >
            <div className={styles.sidebarStack}>
              {pricingModule ? (
                <div className={styles.embeddedModule}>
                  <div className={styles.embeddedHeader}>
                    <h3>Tarification</h3>
                    <span>Segmentation patrimoniale</span>
                  </div>
                  {pricingModule}
                </div>
              ) : null}

              {availabilityModule ? (
                <div className={styles.embeddedModule}>
                  <div className={styles.embeddedHeader}>
                    <h3>Disponibilités</h3>
                    <span>Présence hebdomadaire</span>
                  </div>
                  {availabilityModule}
                </div>
              ) : null}

              {sidebarSections.map((section) => (
                <div key={section.id} className={styles.embeddedModule}>
                  <div className={styles.embeddedHeader}>
                    <h3>{section.title}</h3>
                    {section.subtitle ? <span>{section.subtitle}</span> : null}
                  </div>
                  {section.content}
                </div>
              ))}

              {disclosures.length > 0 ? (
                <div className={styles.disclosureList}>
                  {disclosures.map((item) => (
                    <details key={item.id} className={styles.disclosureCard}>
                      <summary>
                        <span>{item.label}</span>
                        <small>{item.summary}</small>
                      </summary>
                      <div className={styles.disclosureBody}>{item.content}</div>
                    </details>
                  ))}
                </div>
              ) : null}
            </div>
          </DashboardPanel>
        </aside>
      </section>
    </main>
  );
}
