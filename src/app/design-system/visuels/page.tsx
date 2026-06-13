import type { CSSProperties } from "react";
import { readdir } from "fs/promises";
import path from "path";
import Image from "next/image";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Home,
  MessageSquareText,
} from "lucide-react";
import { Badge, Button, ButtonLink, Card, CardBody, CardHeader, ServiceCategoryIcon, StatsCard } from "@/components/ui";
import { DashboardGaugeIcon, DashboardHomeIcon, DashboardHousesIcon, PublicIcon } from "@/components/ui/PublicIcon";
import {
  DASHBOARD_MISSION_PACE_LEVELS,
  getDashboardMissionPaceMetaForLevel,
  DashboardMetricCard,
  DashboardStatusBadge,
} from "@/app/components/dashboard/saas";
import { sidebarConfig } from "@/app/components/dashboard/Sidebar/sidebarconfig";
import { PROFILE_VISUAL_KITS, PROFILE_VISUAL_KIT_IMPORT, type VisualKitSlice } from "@/app/lib/profileVisualKit";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

const ICONS_DIR = path.join(process.cwd(), "public", "icons");

const SERVICE_CATEGORIES = [
  "Ménage",
  "Linge",
  "Accueil voyageurs",
  "Maintenance",
  "Courses",
  "Administratif",
  "Extérieur",
  "Sécurité",
  "Confort",
  "Éco",
  "Photo",
  "Conciergerie",
  "Artisan",
];

const BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "paper",
  "dark",
] as const;

const BADGE_VARIANTS = [
  "neutral",
  "gold",
  "dark",
  "success",
  "warning",
  "danger",
  "info",
  "progress",
] as const;

const STATUS_TONES = [
  { tone: "default", label: "Par défaut" },
  { tone: "primary", label: "Cadence calme" },
  { tone: "success", label: "Validé" },
  { tone: "warning", label: "À revoir" },
  { tone: "danger", label: "Bloquant" },
  { tone: "info", label: "Information" },
] as const;

const ROLE_VISUAL_GROUPS = [
  {
    id: "common",
    title: "Communs",
    subtitle: "À garder identique dans tous les espaces",
    image: null,
    items: [
      { label: "Vue d'ensemble", icon: <DashboardGaugeIcon size={28} />, ref: "DashboardGaugeIcon" },
      { label: "Logement", icon: <DashboardHomeIcon size={28} />, ref: "DashboardHomeIcon" },
      { label: "Tous les logements", icon: <DashboardHousesIcon size={32} />, ref: "DashboardHousesIcon" },
      { label: "Statut SaaS", icon: <CheckCircle2 size={28} />, ref: "DashboardStatusBadge" },
    ],
  },
  {
    id: "owner",
    title: "Propriétaires",
    subtitle: "Patrimoine, logements, demandes et validation",
    image: "/icons/proprio_belle_epoque.png",
    items: [
      { label: "Logements", icon: <DashboardHomeIcon size={28} />, ref: "DashboardHomeIcon" },
      { label: "Conciergeries", icon: <ServiceCategoryIcon category="Conciergerie" size={28} />, ref: "ServiceCategoryIcon" },
      { label: "Missions voyageurs", icon: <CalendarDays size={28} />, ref: "CalendarDays" },
      { label: "À revoir", icon: <AlertTriangle size={28} />, ref: "warning" },
    ],
  },
  {
    id: "concierge",
    title: "Concierges",
    subtitle: "Missions, propriétaires, logements et services",
    image: "/icons/concierges_belle_epoque.png",
    items: [
      { label: "Missions", icon: <CalendarDays size={28} />, ref: "CalendarDays" },
      { label: "Propriétaires", icon: <ServiceCategoryIcon category="Proprietaire" size={28} />, ref: "ServiceCategoryIcon" },
      { label: "Services", icon: <ServiceCategoryIcon category="Ménage" size={28} />, ref: "ServiceCategoryIcon" },
      { label: "Cadence", icon: getDashboardMissionPaceMetaForLevel("soft").icon, ref: "mission pace" },
    ],
  },
  {
    id: "provider",
    title: "Artisans",
    subtitle: "Interventions, clients, planning et devis",
    image: "/icons/artisans_belle_epoque.png",
    items: [
      { label: "Interventions", icon: <ServiceCategoryIcon category="Artisan" size={28} />, ref: "ServiceCategoryIcon" },
      { label: "Clients", icon: <ServiceCategoryIcon category="Conciergerie" size={28} />, ref: "ServiceCategoryIcon" },
      { label: "Planning", icon: <CalendarDays size={28} />, ref: "CalendarDays" },
      { label: "Alertes", icon: <AlertTriangle size={28} />, ref: "AlertTriangle" },
    ],
  },
];

function getPieSegments(slices: VisualKitSlice[]) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let cursor = 0;

  return slices.map((slice) => {
    const percent = total > 0 ? slice.value / total : 0;
    const dash = `${percent * 100} ${100 - percent * 100}`;
    const segment = { ...slice, percent, dash, offset: -cursor };
    cursor += percent * 100;
    return segment;
  });
}

function VisualPieChart({ slices, label }: { slices: VisualKitSlice[]; label: string }) {
  const segments = getPieSegments(slices);

  return (
    <div className={styles.pieChart} role="img" aria-label={label}>
      <svg viewBox="0 0 42 42" aria-hidden="true">
        <circle className={styles.pieTrack} cx="21" cy="21" r="15.9155" />
        {segments.map((segment) => (
          <circle
            key={segment.label}
            className={styles.pieSlice}
            cx="21"
            cy="21"
            r="15.9155"
            stroke={segment.color}
            strokeDasharray={segment.dash}
            strokeDashoffset={segment.offset}
          />
        ))}
        <circle className={styles.pieHole} cx="21" cy="21" r="9.4" />
      </svg>
      <strong>{slices.reduce((sum, slice) => sum + slice.value, 0)}%</strong>
    </div>
  );
}

function formatIconLabel(fileName: string) {
  return fileName
    .replace(/\.(svg|png|jpg|jpeg|webp)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getPublicIcons() {
  const files = await readdir(ICONS_DIR);
  return files
    .filter((file) => /\.(svg|png|jpg|jpeg|webp)$/i.test(file))
    .sort((left, right) => left.localeCompare(right, "fr"));
}

export default async function VisualReferencePage() {
  const icons = await getPublicIcons();
  const ownerCalmPace = getDashboardMissionPaceMetaForLevel("calm");

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Design system interne</p>
          <h1>Référentiel visuel</h1>
          <p>
            Une page atelier pour voir les visuels utilisés dans le code, comparer les modèles et réutiliser les mêmes
            composants partout pendant la construction.
          </p>
        </div>
        <div className={styles.heroMeta}>
          <strong>{icons.length}</strong>
          <span>assets dans public/icons</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Par espace</p>
            <h2>Commun, propriétaires, concierges, artisans</h2>
          </div>
          <span className={styles.smallText}>Compare les différences et ce qui doit rester commun.</span>
        </div>

        <div className={styles.roleGrid}>
          {ROLE_VISUAL_GROUPS.map((group) => (
            <article key={group.id} className={`${styles.roleCard} ${styles[`role-${group.id}`]}`}>
              <div className={styles.roleCardHeader}>
                {group.image ? (
                  <Image src={group.image} alt="" width={92} height={92} className={styles.roleImage} unoptimized />
                ) : (
                  <span className={styles.roleCommonIcon}>
                    <DashboardGaugeIcon size={38} />
                  </span>
                )}
                <div>
                  <h3>{group.title}</h3>
                  <p>{group.subtitle}</p>
                </div>
              </div>

              <div className={styles.roleVisualList}>
                {group.items.map((item) => (
                  <div key={`${group.id}-${item.label}`} className={styles.roleVisualItem}>
                    <span>{item.icon}</span>
                    <div>
                      <strong>{item.label}</strong>
                      <code>{item.ref}</code>
                    </div>
                  </div>
                ))}
              </div>

              {group.id !== "common" ? (
                <div className={styles.roleSidebarList}>
                  {(group.id === "owner"
                    ? sidebarConfig.owner
                    : group.id === "concierge"
                      ? sidebarConfig.concierge
                      : sidebarConfig.provider
                  )
                    .slice(0, 6)
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <span key={`${group.id}-${item.path}`}>
                          {Icon ? <Icon size={16} /> : null}
                          {item.label}
                        </span>
                      );
                    })}
                </div>
              ) : (
                <div className={styles.roleSidebarList}>
                  <span><DashboardGaugeIcon size={16} /> Dashboard</span>
                  <span><DashboardHomeIcon size={16} /> Logement</span>
                  <span><DashboardHousesIcon size={16} /> Liste logements</span>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>


      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Kits profils réels</p>
            <h2>Propriétaire, concierge et artisan prêts à réutiliser</h2>
          </div>
          <code>{PROFILE_VISUAL_KIT_IMPORT}</code>
        </div>

        <div className={styles.profileKitGrid}>
          {PROFILE_VISUAL_KITS.map((kit) => (
            <article key={kit.id} className={styles.profileKitCard} style={{ "--kit-accent": kit.accent } as CSSProperties}>
              <div className={styles.profileKitHead}>
                <Image src={kit.image} alt="" width={86} height={86} className={styles.profileKitImage} unoptimized />
                <div>
                  <p className={styles.eyebrow}>{kit.id}</p>
                  <h3>{kit.title}</h3>
                  <p>{kit.persona}</p>
                </div>
              </div>

              <div className={styles.profileKitSurfaces}>
                {kit.surfaces.map((surface) => (
                  <div key={`${kit.id}-${surface.label}`} className={styles.profileKitSurface}>
                    <strong>{surface.label}</strong>
                    <p>{surface.description}</p>
                    <code>{surface.token}</code>
                    <span>{surface.usage}</span>
                  </div>
                ))}
              </div>

              {kit.charts.map((chart) => (
                <div key={chart.title} className={styles.profileKitChart}>
                  <VisualPieChart slices={chart.slices} label={chart.title} />
                  <div>
                    <strong>{chart.title}</strong>
                    <p>{chart.description}</p>
                    <ul>
                      {chart.slices.map((slice) => (
                        <li key={slice.label}>
                          <span style={{ background: slice.color }} />
                          {slice.label} <b>{slice.value}%</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>À réutiliser</p>
            <h2>Composants de base</h2>
          </div>
          <code>/design-system/visuels</code>
        </div>

        <div className={styles.guidelineGrid}>
          <Card className={styles.guidelineCard}>
            <CardHeader>
              <h3>Boutons</h3>
              <p>Utiliser Button ou ButtonLink</p>
            </CardHeader>
            <CardBody>
              <div className={styles.buttonGrid}>
                {BUTTON_VARIANTS.map((variant) => (
                  <Button key={variant} variant={variant}>
                    {variant}
                  </Button>
                ))}
                <ButtonLink href="/design-system/visuels" variant="secondary">
                  Lien modèle <ArrowRight size={15} />
                </ButtonLink>
              </div>
              <p className={styles.note}>Import conseillé : `Button`, `ButtonLink` depuis `@/components/ui`.</p>
            </CardBody>
          </Card>

          <Card className={styles.guidelineCard}>
            <CardHeader>
              <h3>Badges</h3>
              <p>Statuts courts et cohérents</p>
            </CardHeader>
            <CardBody>
              <div className={styles.badgeRow}>
                {BADGE_VARIANTS.map((variant) => (
                  <Badge key={variant} variant={variant}>
                    {variant}
                  </Badge>
                ))}
              </div>
              <div className={styles.statusRow}>
                {STATUS_TONES.map((item) => (
                  <DashboardStatusBadge key={item.tone} tone={item.tone} label={item.label} />
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Navigation</p>
            <h2>Icônes principales du dashboard</h2>
          </div>
          <span className={styles.smallText}>Même icône, même sens, partout.</span>
        </div>

        <div className={styles.iconUseGrid}>
          <article>
            <span><DashboardGaugeIcon size={34} /></span>
            <strong>Tableau de bord / Vue d&apos;ensemble</strong>
            <code>DashboardGaugeIcon</code>
          </article>
          <article>
            <span><DashboardHomeIcon size={34} /></span>
            <strong>Logements / Ajouter un logement</strong>
            <code>DashboardHomeIcon</code>
          </article>
          <article>
            <span><DashboardHousesIcon size={38} /></span>
            <strong>Tous les logements</strong>
            <code>DashboardHousesIcon</code>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Dashboard SaaS</p>
            <h2>Cartes, compteurs et statuts</h2>
          </div>
          <span className={styles.smallText}>Base à reprendre pour les 4 espaces.</span>
        </div>

        <div className={styles.statsGrid}>
          <StatsCard
            label="Logements"
            value="3"
            hint="1 logement à revoir"
            trend="À corriger"
            progress={66}
            visual={<DashboardHomeIcon size={34} />}
            visualLabel="Logements"
          />
          <StatsCard
            label="Missions"
            value="5"
            hint="Journée active"
            trend="Cadence"
            progress={78}
            visual={<CalendarDays size={34} />}
            visualLabel="Missions"
          />
          <StatsCard
            label="Finances"
            value="2/1"
            hint="Devis et facture à valider"
            trend="À traiter"
            progress={42}
            visual={<CircleDollarSign size={34} />}
            visualLabel="Finances"
          />
          <StatsCard
            label="Messages"
            value="4"
            hint="Messages non lus"
            trend="Info"
            progress={28}
            visual={<MessageSquareText size={34} />}
            visualLabel="Messages"
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Cadence</p>
            <h2>Visuels missions</h2>
          </div>
          <ButtonLink href="/cadences" variant="outline" size="sm">
            Voir la page cadences
          </ButtonLink>
        </div>

        <div className={styles.ownerPacePreview}>
          <div>
            <p className={styles.eyebrow}>Exemple exact propriétaire</p>
            <h3>Carte Missions avec badge cadence</h3>
            <span>
              C&apos;est le rendu utilisé sur le dashboard propriétaire quand la journée est calme.
            </span>
          </div>
          <div className={styles.ownerMetricExample}>
            <DashboardMetricCard
              label="Missions"
              value="0"
              detail="Aucune mission aujourd'hui"
              icon={<CalendarDays size={18} />}
              statusLabel={ownerCalmPace.label}
              statusTone={ownerCalmPace.tone}
              statusIcon={ownerCalmPace.icon}
              statusIconOnly
              statusText={ownerCalmPace.label}
            />
          </div>
        </div>

        <div className={styles.badgePaceGrid}>
          {DASHBOARD_MISSION_PACE_LEVELS.map((level) => {
            const meta = getDashboardMissionPaceMetaForLevel(level);
            return (
              <article key={`badge-${level}`}>
                <DashboardStatusBadge label={meta.label} tone={meta.tone} icon={meta.icon} iconOnly />
                <div>
                  <strong>{meta.label}</strong>
                  <span>Badge réel dashboardSaaS</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.paceGrid}>
          {DASHBOARD_MISSION_PACE_LEVELS.map((level) => {
            const meta = getDashboardMissionPaceMetaForLevel(level);
            return (
              <article key={level} className={styles.paceCard}>
                <span className={styles.pacePreview}>
                  <PublicIcon src={meta.iconSrc} label={meta.label} size={76} decorative />
                </span>
                <div>
                  <strong>{meta.label}</strong>
                  <span>{level}</span>
                  <code>{meta.iconSrc}</code>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Services</p>
            <h2>Catégories et pictogrammes</h2>
          </div>
          <code>ServiceCategoryIcon</code>
        </div>

        <div className={styles.serviceGrid}>
          {SERVICE_CATEGORIES.map((category) => (
            <article key={category}>
              <ServiceCategoryIcon category={category} size={30} />
              <strong>{category}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Inventaire</p>
            <h2>Tous les fichiers de public/icons</h2>
          </div>
          <span className={styles.smallText}>Ajoutez un fichier ici, il remonte dans cette grille.</span>
        </div>

        <div className={styles.assetGrid}>
          {icons.map((file) => {
            const src = `/icons/${encodeURIComponent(file)}`;
            const label = formatIconLabel(file);
            const isSvg = file.toLowerCase().endsWith(".svg");

            return (
              <article key={file} className={styles.assetCard}>
                <span className={styles.assetPreview}>
                  {isSvg ? (
                    <PublicIcon src={src} label={label} size={38} decorative />
                  ) : (
                    <Image src={src} alt="" width={44} height={44} unoptimized />
                  )}
                </span>
                <strong>{label}</strong>
                <code>{file}</code>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Règles simples</p>
            <h2>Pour alléger le code</h2>
          </div>
        </div>
        <div className={styles.rulesGrid}>
          <article>
            <CheckCircle2 />
            <strong>Boutons</strong>
            <p>Créer avec `Button` ou `ButtonLink`, puis éviter les classes locales type `primaryButton` répétées.</p>
          </article>
          <article>
            <Activity />
            <strong>Statuts</strong>
            <p>Utiliser `Badge` pour les petits statuts et `DashboardStatusBadge` pour les cartes SaaS.</p>
          </article>
          <article>
            <Home />
            <strong>Icônes dashboard</strong>
            <p>Garder `DashboardGaugeIcon`, `DashboardHomeIcon`, `DashboardHousesIcon` comme source unique.</p>
          </article>
          <article>
            <AlertTriangle />
            <strong>À revoir</strong>
            <p>Le ton `warning` doit rester doré, avec pictogramme triangle quand il signale une action.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
