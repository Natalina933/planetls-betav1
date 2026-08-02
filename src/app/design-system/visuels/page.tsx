import type { CSSProperties } from "react";
import { readdir } from "fs/promises";
import {
  getCategoryReferenceGroups,
  getServiceCatalogGroups,
} from "./getServiceCatalogGroups";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  CreditCard,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Home,
  MapPin,
  Menu,
  MessageSquareText,
  Search,
  Send,
  Settings2,
  Star,
  Wrench,
  X,
} from "lucide-react";
import {
  AsyncState,
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Input,
  RequestStatusBadge,
  ServiceCategoryIcon,
  Select,
  StatsCard,
  TabButton,
  Tag,
  Textarea,
} from "@/components/ui";
import {
  DashboardGaugeIcon,
  DashboardHomeIcon,
  DashboardHousesIcon,
  PublicIcon,
} from "@/components/ui/PublicIcon";
import {
  ActivityFeed,
  CompletionStatusCard,
  DashboardPanel,
  MetricDonut,
  QuickActions,
} from "@/components/dashboard";
import {
  DASHBOARD_MISSION_PACE_LEVELS,
  getDashboardMissionPaceMetaForLevel,
  DashboardMetricCard,
  DashboardStatusBadge,
} from "@/app/components/dashboard/saas";
import { sidebarConfig } from "@/app/components/dashboard/Sidebar/sidebarconfig";
import WorkflowStatusBadge from "@/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import {
  PROFILE_VISUAL_KITS,
  PROFILE_VISUAL_KIT_IMPORT,
  type VisualKitSlice,
} from "@/app/lib/profileVisualKit";
import { DevelopmentSectionNav } from "@/components/development/DevelopmentSectionNav";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

const ICONS_DIR = path.join(process.cwd(), "public", "icons");
// const SERVICES_CATALOG_SQL = path.join(
//   process.cwd(),
//   "src",
//   "app",
//   "data",
//   "services",
//   "services_catalog_rows.sql",
// );

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

const CARD_VARIANTS = ["small", "large"] as const;

const CARD_TONES = ["elevated", "outlined", "soft", "dark"] as const;

const STATS_CARD_TONES = ["default", "soft", "dark"] as const;

const TAG_TONES = ["default", "category", "status", "neutral", "gold", "dark"] as const;

const FIELD_TONES = ["default", "soft", "dark"] as const;

const SITE_MOCKUP_NAV_ITEMS = [
  { label: "Vue d'ensemble", icon: <DashboardGaugeIcon size={18} /> },
  { label: "Logements", icon: <DashboardHomeIcon size={18} /> },
  { label: "Missions", icon: <CalendarDays size={18} /> },
  { label: "Messages", icon: <MessageSquareText size={18} /> },
  { label: "Finances", icon: <CreditCard size={18} /> },
];

const PROFILE_MOCKUPS = [
  {
    name: "Nathalie Charbonnel",
    role: "Propriétaire",
    detail: "3 logements · 1 point à corriger",
    image: "/icons/proprio_belle_epoque.png",
    tone: "owner",
  },
  {
    name: "Conciergerie Belle Rive",
    role: "Concierge",
    detail: "12 missions · 4 aujourd'hui",
    image: "/icons/concierges_belle_epoque.png",
    tone: "concierge",
  },
  {
    name: "Atelier Martin",
    role: "Artisan",
    detail: "2 devis · 1 intervention urgente",
    image: "/icons/artisans_belle_epoque.png",
    tone: "provider",
  },
];

const POPUP_MOCKUPS = [
  {
    title: "Corriger un logement",
    description: "Guide court pour traiter le premier point à revoir.",
    tone: "warning",
    action: "Commencer",
  },
  {
    title: "Valider un devis",
    description: "Résumé montant, artisan, service et prochaines étapes.",
    tone: "success",
    action: "Valider",
  },
  {
    title: "Nouveau message",
    description: "Conversation prioritaire liée à une mission en cours.",
    tone: "info",
    action: "Répondre",
  },
];

const THEME_VISUALS = [
  {
    key: "light",
    label: "Mode clair",
    source: "ThemeProvider · data-theme=\"light\"",
    description: "Base claire, lisible, utilisée par défaut.",
  },
  {
    key: "sepia",
    label: "Sepia 1900",
    source: "styles/themes/_theme.sepia.scss",
    description: "Papier ancien, or chaud, ambiance Belle Époque douce.",
  },
  {
    key: "art-deco",
    label: "Art Deco",
    source: "ThemeProvider · data-theme=\"art-deco\"",
    description: "Bords plus géométriques, accents dorés, rendu plus graphique.",
  },
  {
    key: "mucha-dark",
    label: "Mucha Nocturne",
    source: "ThemeProvider · data-theme=\"mucha-dark\"",
    description: "Version sombre, contrastée, avec accents or.",
  },
];

const REAL_POPUP_REFERENCES = [
  {
    name: "NextStepsPopup",
    source: "src/app/dashboard/concierge/NextStepsPopup.tsx",
    title: "Prochaines étapes",
    description: "Plan personnalisé après inscription ou profil incomplet.",
    tone: "success",
  },
  {
    name: "FirstLoginOnboardingPopup",
    source: "src/features/onboarding-assistant/components/FirstLoginOnboardingPopup.tsx",
    title: "Bienvenue dans votre parcours",
    description: "Popup d'accueil au premier accès, avec action principale et secondaire.",
    tone: "info",
  },
  {
    name: "ExperiencePopup",
    source: "src/app/components/popups/ExperiencePopup",
    title: "Votre expérience",
    description: "Choix du niveau d'expérience selon le profil.",
    tone: "neutral",
  },
  {
    name: "CategoryPopup",
    source: "src/app/components/popups/CategoryPopup",
    title: "Vos services",
    description: "Sélection des services et besoins pendant le parcours d'inscription.",
    tone: "warning",
  },
  {
    name: "AccessPopup",
    source: "src/app/components/popups/AccessPopup",
    title: "Accès et identité",
    description: "Étape d'inscription avec variantes propriétaire, concierge et artisan.",
    tone: "dark",
  },
  {
    name: "AvatarUpload.modal",
    source: "src/app/components/ui/AvatarUpload",
    title: "Personnaliser l'avatar",
    description: "Modale image avec zoom, déplacement, rotation, suppression et validation.",
    tone: "dark",
  },
  {
    name: "MapPopup",
    source: "src/app/components/layout/MapPopup",
    title: "Profil sur carte",
    description: "Popup de carte pour consulter un profil local.",
    tone: "info",
  },
  {
    name: "LogementCreateModal",
    source: "src/app/components/dashboard/concierge/LogementCreateModal.tsx",
    title: "Créer un logement",
    description: "Choix du mode de création côté concierge.",
    tone: "success",
  },
];

const ELEMENT_STYLE_REFERENCES = [
  {
    name: "SiteMockupShell",
    source: "page.module.scss · .siteMockupShell",
    usage: "Structure globale d'une page dashboard avec sidebar et contenu.",
  },
  {
    name: "Topbar / TopbarActions",
    source: "page.module.scss · .siteMockupTopbar",
    usage: "Barre haute avec menu, recherche, notifications et avatar.",
  },
  {
    name: "DashboardHero",
    source: "page.module.scss · .siteMockupHero",
    usage: "Bandeau d'écran avec titre, texte court, actions et carte de statut.",
  },
  {
    name: "Button.primary / outline / ghost / paper",
    source: "@/components/ui/Button",
    usage: "Actions principales, secondaires, discrètes et dorées.",
  },
  {
    name: "DashboardMetricCard",
    source: "@/app/components/dashboard/saas",
    usage: "Compteurs SaaS avec icône, statut et badge visuel.",
  },
  {
    name: "StatsCard",
    source: "@/components/ui/StatsCard",
    usage: "Carte KPI simple avec valeur, progression et pictogramme.",
  },
  {
    name: "MetricDonut",
    source: "@/components/dashboard",
    usage: "Camembert/donut pour répartitions et complétude.",
  },
  {
    name: "ProfileSummaryCard / ProfileCard",
    source: "page.module.scss · .siteMockupProfileCard / .profileMockupCard",
    usage: "Carte profil propriétaire, concierge ou artisan.",
  },
  {
    name: "Avatar / AvatarRow",
    source: "@/components/ui/Avatar",
    usage: "Identité utilisateur, équipe, profil ou logement.",
  },
  {
    name: "InfoPanel / DivPanel",
    source: "page.module.scss · .siteMockupDivPanel",
    usage: "Bloc neutre pour aide, checklist, résumé ou message.",
  },
  {
    name: "PopupCard.warning / success / info",
    source: "page.module.scss · .popupMockupCard",
    usage: "Aperçu modal pour correction, validation ou message.",
  },
  {
    name: "Surface.soft / outlined / warning / success / dark / State.empty",
    source: "page.module.scss · .surfaceMockupGrid",
    usage: "Surfaces de fond et états réutilisables.",
  },
  {
    name: "ThemeVisualCard",
    source: "ThemeProvider + page.module.scss · .themeVisualCard",
    usage: "Comparer les thèmes light, sepia, art-deco et mucha-dark.",
  },
  {
    name: "AvatarUpload.preview",
    source: "src/app/components/ui/AvatarUpload",
    usage: "Avatar avec bouton appareil photo et modale de personnalisation.",
  },
  {
    name: "MissionVisualCard",
    source: "OwnerMissionRow / MissionDetails",
    usage: "Visuel synthèse d'une mission avec statut, date, logement et services.",
  },
  {
    name: "RequestVisualCard",
    source: "OwnerRequestSummaryCard / ServiceRequestCard",
    usage: "Visuel d'une demande avec workflow, faits clés, urgence et action.",
  },
  {
    name: "ProfileVisualCard",
    source: "ConciergePreviewCard / ProfileSummaryCard",
    usage: "Visuel profil avec cover, avatar, badges, zone et services.",
  },
  {
    name: "RealPopupCard",
    source: "NextStepsPopup, ExperiencePopup, CategoryPopup, AccessPopup...",
    usage: "Répertoire visuel des popups réellement présentes dans le code.",
  },
];

const STATUS_TONES = [
  { tone: "default", label: "Par défaut" },
  { tone: "primary", label: "Cadence calme" },
  { tone: "success", label: "Validé" },
  { tone: "warning", label: "À revoir" },
  { tone: "danger", label: "Bloquant" },
  { tone: "info", label: "Information" },
] as const;

const DESIGN_TOKEN_GROUPS = [
  {
    title: "Couleurs globales",
    items: [
      { name: "--color-primary", value: "#d4af37", usage: "Or principal de la marque." },
      { name: "--color-bg", value: "#f8f9fb", usage: "Fond général clair." },
      { name: "--color-text", value: "#2b2b2b", usage: "Texte courant." },
      { name: "--color-success", value: "#4caf50", usage: "Validation et succès." },
      { name: "--color-error", value: "#e53935", usage: "Erreur ou blocage." },
    ],
  },
  {
    title: "Typographies globales",
    items: [
      { name: "--font-title", value: "Montserrat", usage: "Titres et libellés forts." },
      { name: "--font-text", value: "Open Sans", usage: "Textes d'interface." },
      { name: "--font-primary", value: "Cormorant Garamond", usage: "Accent éditorial Belle Époque." },
    ],
  },
];

const OWNER_LOGEMENTS_VISUALS = [
  { name: "OwnerHousingSummaryDonut.Ready", label: "Prêts", value: "2/3", detail: "Disponibles", percent: 66 },
  { name: "OwnerHousingSummaryDonut.Cleaning", label: "À préparer", value: "1", detail: "Ménage", percent: 33 },
  { name: "OwnerHousingSummaryDonut.Movement", label: "Mouvements", value: "2", detail: "Arrivées/départs", percent: 67 },
  { name: "OwnerHousingSummaryDonut.KeyInfo", label: "Infos clés", value: "2/3", detail: "Capacité maximale/équipements", percent: 66 },
];

const OWNER_HOUSING_REVIEW_STEPS = [
  { name: "OwnerHousingReviewStep.Photo", label: "Photo principale", detail: "Ajoutez une photo visible du logement." },
  { name: "OwnerHousingReviewStep.Capacity", label: "Capacité maximale", detail: "Indiquez le nombre maximal de personnes autorisées." },
  { name: "OwnerHousingReviewStep.Equipments", label: "Équipements", detail: "Ajoutez les équipements importants du logement." },
];

const OWNER_LOGEMENTS_SOURCE_ELEMENTS: { name: string; source: string; usage: string }[] = [];

const POPUP_VISUAL_REFERENCES: {
  name: string;
  route: string;
  title: string;
  detail: string;
  actions: string[];
  source: string;
}[] = [];

const DONUT_USAGE_REFERENCES = [
  {
    profile: "Propriétaires",
    usage: "Synthèse logements, préparation, mouvements voyageurs et complétude.",
    component: "MetricDonut",
  },
  {
    profile: "Concierges",
    usage: "Répartition missions à planifier, en cours, urgentes ou terminées.",
    component: "MetricDonut",
  },
  {
    profile: "Artisans",
    usage: "Répartition devis, interventions, urgences et demandes acceptées.",
    component: "MetricDonut",
  },
  {
    profile: "Administrateur",
    usage: "Vue globale par statut, profil, source ou niveau de priorité.",
    component: "VisualPieChart / MetricDonut",
  },
];

const COMPONENT_SOURCE_REFERENCES = [
  {
    title: "Cartes dashboard",
    importPath: "@/components/dashboard",
    items: "DashboardPanel, QuickActions, ActivityFeed, MetricDonut, CompletionStatusCard",
    usage: "Blocs réutilisables pour les pages d'accueil propriétaire, concierge, artisan et admin.",
  },
  {
    title: "Cartes SaaS",
    importPath: "@/app/components/dashboard/saas",
    items: "DashboardMetricCard, DashboardStatusBadge, cadence missions",
    usage: "Compteurs courts du tableau de bord avec statut visuel cohérent.",
  },
  {
    title: "Icônes communes",
    importPath: "@/components/ui/PublicIcon",
    items: "DashboardGaugeIcon, DashboardHomeIcon, DashboardHousesIcon, PublicIcon",
    usage: "Source unique pour tableau de bord, logements, tous les logements et assets publics.",
  },
  {
    title: "Interface de base",
    importPath: "@/components/ui",
    items: "Button, ButtonLink, Badge, Tag, Input, Select, Textarea, Checkbox",
    usage: "Boutons, champs, pastilles et états courts à reprendre au lieu de classes locales répétées.",
  },
  {
    title: "Statuts demandes",
    importPath: "@/components/ui + WorkflowStatusBadge",
    items: "RequestStatusBadge, WorkflowStatusBadge",
    usage: "Demandes, devis, missions et workflow avec libellé métier lisible.",
  },
  {
    title: "Kits profils",
    importPath: "@/app/lib/profileVisualKit",
    items: "PROFILE_VISUAL_KITS",
    usage: "Couleurs, surfaces, graphiques et composants nommés par profil.",
  },
];

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

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function ProfileKitCard({ kit }: { kit: (typeof PROFILE_VISUAL_KITS)[number] }) {
  return (
    <article
      key={kit.id}
      className={styles.profileKitCard}
      style={{ "--kit-accent": kit.accent } as CSSProperties}
    >
      <div className={styles.profileKitHead}>
        <Image
          src={kit.image}
          alt=""
          width={86}
          height={86}
          className={styles.profileKitImage}
          unoptimized
        />
        <div>
          <p className={styles.eyebrow}>{kit.id}</p>
          <h3>{kit.title}</h3>
          <p>{kit.persona}</p>
        </div>
      </div>

      <div className={styles.profileKitTokens}>
        <div>
          <strong>Couleurs nommées</strong>
          {kit.colors.map((token) => (
            <span key={token.name}>
              <i style={{ background: token.value }} />{" "}
              <code>{token.name}</code> {token.value}
            </span>
          ))}
        </div>
        <div>
          <strong>Typos nommées</strong>
          {kit.typography.map((token) => (
            <span key={token.name}>
              <code>{token.name}</code> {token.value}
            </span>
          ))}
        </div>
        <div>
          <strong>Éléments nommés</strong>
          {kit.components.map((component) => (
            <span key={component.name}>
              <code>{component.name}</code> {component.label}
            </span>
          ))}
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
  );
}

function DesignTokenSection() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Couleurs & typos</p>
          <h2>Tokens nommés pour supprimer, remplacer ou réutiliser</h2>
        </div>
        <code>variables.css + profileVisualKit.ts</code>
      </div>
      <div className={styles.tokenGroupGrid}>
        {DESIGN_TOKEN_GROUPS.map((group) => (
          <article key={group.title} className={styles.tokenGroup}>
            <h3>{group.title}</h3>
            {group.items.map((token) => (
              <div key={token.name} className={styles.tokenRow}>
                <span
                  className={styles.tokenSwatch}
                  style={{ background: token.value.startsWith("#") ? token.value : undefined }}
                />
                <div>
                  <code>{token.name}</code>
                  <strong>{token.value}</strong>
                  <p>{token.usage}</p>
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileKitSection() {
  return (
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
          <ProfileKitCard key={kit.id} kit={kit} />
        ))}
      </div>
    </section>
  );
}

function OwnerLogementsSection() {
  return (
    <section className={styles.section} id="owner-logements-reference">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Page réelle owner</p>
          <h2>Visuels de /dashboard/owner/logements</h2>
        </div>
        <code>HousingListPage + HousingListPage.module.scss</code>
      </div>

      <div className={styles.namedElementGrid}>
        {OWNER_LOGEMENTS_VISUALS.map((card) => (
          <article key={card.name} className={styles.namedElementCard}>
            <code>{card.name}</code>
            <MetricDonut
              label={card.label}
              value={card.value}
              detail={card.detail}
              percent={card.percent}
            />
          </article>
        ))}
      </div>

      <div className={styles.ownerLogementPreview}>
        <div className={styles.ownerReviewPanelPreview}>
          <span className={styles.ownerPreviewIcon}>
            <AlertTriangle size={22} />
          </span>
          <div>
            <code>OwnerHousingReviewPanel</code>
            <strong>1 logement à revoir</strong>
            <p>
              Ouvrez le premier logement, complétez les points signalés, puis
              revenez ici pour vérifier que la liste diminue.
            </p>
          </div>
          <span className={styles.ownerPreviewAction}>Commencer</span>
        </div>

        <article className={styles.ownerHousingCardPreview}>
          <div className={styles.ownerHousingImagePreview}>
            <Image
              src="/images/default-logement.png"
              alt="Aperçu logement"
              width={420}
              height={260}
              unoptimized
            />
            <span className={styles.ownerStatusPreview}>À revoir</span>
            <span className={styles.ownerCityPreview}>Paris</span>
          </div>
          <div className={styles.ownerHousingBodyPreview}>
            <code>OwnerHousingCard</code>
            <p className={styles.ownerHousingEyebrowPreview}>Appartement</p>
            <h3>Appartement exemple</h3>
            <span className={styles.ownerCapacityPreview}>
              Capacité maximale · 4 personnes
            </span>
            <p>
              Carte utilisée sur la page logements propriétaire : image, statut,
              ville, capacité, équipements et checklist de correction.
            </p>
            <div className={styles.ownerEquipmentPreview}>
              <span>Wifi</span>
              <span>Linge</span>
              <span>Climatisation</span>
            </div>
            <div className={styles.ownerChecklistPreview}>
              <strong>Éléments nommés dans la checklist</strong>
              {OWNER_HOUSING_REVIEW_STEPS.map((step, index) => (
                <div key={step.name}>
                  <span>{index + 1}</span>
                  <div>
                    <code>{step.name}</code>
                    <b>{step.label}</b>
                    <p>{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function DonutReferenceSection() {
  return (
    <section className={styles.section} id="camemberts-donuts">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Camemberts visibles</p>
          <h2>Donuts métier à réutiliser dans tous les profils</h2>
        </div>
        <code>MetricDonut + profileVisualKit charts</code>
      </div>

      <div className={styles.donutGrid}>
        {OWNER_LOGEMENTS_VISUALS.map((card) => (
          <article key={`donut-${card.name}`} className={styles.donutCard}>
            <MetricDonut
              label={card.label}
              value={card.value}
              detail={card.detail}
              percent={card.percent}
            />
            <div>
              <code>{card.name}</code>
              <p>Version complète utilisée pour une synthèse lisible.</p>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.compactDonutRail}>
        {OWNER_LOGEMENTS_VISUALS.slice(0, 3).map((card) => (
          <MetricDonut
            key={`compact-${card.name}`}
            label={card.label}
            value={card.value}
            detail={card.detail}
            percent={card.percent}
            compact
          />
        ))}
      </div>

      <div className={styles.componentUseGrid}>
        {DONUT_USAGE_REFERENCES.map((item) => (
          <article key={item.profile}>
            <strong>{item.profile}</strong>
            <p>{item.usage}</p>
            <code>{item.component}</code>
          </article>
        ))}
      </div>
    </section>
  );
}

function BusinessComponentsSection() {
  return (
    <section className={styles.section} id="composants-metier">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Bibliothèque métier</p>
          <h2>Composants déjà prêts pour organiser tous les profils</h2>
        </div>
        <span className={styles.smallText}>
          À reprendre avant de créer un nouveau visuel local.
        </span>
      </div>

      <div className={styles.componentShowcaseGrid}>
        <DashboardPanel
          title="Panneau dashboard"
          action={
            <ButtonLink href="/design-system/visuels" variant="ghost" size="sm">
              Modèle
            </ButtonLink>
          }
          className={styles.componentPanel}
        >
          <div className={styles.panelPreviewList}>
            <span>
              <ClipboardList size={17} />
              Logements à corriger
            </span>
            <span>
              <Settings2 size={17} />
              Règles visuelles communes
            </span>
            <span>
              <Send size={17} />
              Action guidée
            </span>
          </div>
        </DashboardPanel>

        <QuickActions
          title="Actions rapides"
          actions={[
            {
              label: "Corriger le logement",
              href: "/design-system/visuels",
              description: "Entrer dans le premier point à revoir.",
              badge: "Étape 1",
            },
            {
              label: "Vérifier la fiche",
              href: "/design-system/visuels",
              description: "Contrôler photo, capacité maximale et équipements.",
              badge: "Étape 2",
            },
          ]}
        />

        <ActivityFeed
          title="Activité récente"
          items={[
            {
              id: "visual-activity-owner",
              title: "Capacité maximale complétée",
              description: "La fiche logement peut sortir des points à corriger.",
              dateLabel: "Aujourd'hui",
              statusLabel: "Logement",
              href: "/design-system/visuels",
              actionLabel: "Voir",
            },
            {
              id: "visual-activity-mission",
              title: "Cadence missions mise à jour",
              description: "Le badge cadence garde le même modèle visuel.",
              dateLabel: "Cette semaine",
              statusLabel: "Missions",
            },
          ]}
        />

        <CompletionStatusCard
          title="Complétude logement"
          description="Modèle pour guider le propriétaire étape par étape."
          percentage={72}
          completedCount={5}
          totalCount={7}
          missingItems={["Photo principale", "Équipements"]}
        />

        <Card className={styles.componentPanel}>
          <CardHeader>
            <h3>Statuts métier</h3>
            <p>Demandes, workflow et cartes SaaS.</p>
          </CardHeader>
          <CardBody>
            <div className={styles.statusPreviewStack}>
              <RequestStatusBadge status="NEW" />
              <RequestStatusBadge status="QUOTE_SENT" />
              <RequestStatusBadge status="ACCEPTED" />
              <WorkflowStatusBadge value="IN_PROGRESS" />
              <WorkflowStatusBadge value="COMPLETED" />
              <DashboardStatusBadge tone="warning" label="À revoir" />
            </div>
          </CardBody>
        </Card>

        <Card className={styles.componentPanel}>
          <CardHeader>
            <h3>Champs et filtres</h3>
            <p>Un même modèle de formulaire pour les espaces.</p>
          </CardHeader>
          <CardBody>
            <div className={styles.formPreview}>
              <Input id="visual-reference-title" label="Titre" defaultValue="Appartement Belle Époque" />
              <Select id="visual-reference-profile" label="Profil" defaultValue="owner">
                <option value="owner">Propriétaire</option>
                <option value="concierge">Concierge</option>
                <option value="provider">Artisan</option>
              </Select>
              <Textarea
                id="visual-reference-note"
                label="Note"
                defaultValue="Texte d'aide court et actionnable."
                rows={3}
              />
              <Checkbox id="visual-reference-check" label="Visible dans le référentiel" defaultChecked />
            </div>
          </CardBody>
        </Card>

        <Card className={styles.componentPanel}>
          <CardHeader>
            <h3>Petits éléments</h3>
            <p>Identité, tags, onglets et états vides.</p>
          </CardHeader>
          <CardBody>
            <div className={styles.smallElementsPreview}>
              <Avatar name="Nathalie Charbonnel" size="md" />
              <Tag tone="gold">Propriétaire</Tag>
              <Tag tone="category">Logement</Tag>
              <TabButton active icon={<DashboardGaugeIcon size={16} />}>Vue</TabButton>
              <AsyncState isEmpty emptyLabel="Aucun élément à afficher.">
                <span />
              </AsyncState>
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

function CompleteSiteMockupSection() {
  const calmPace = getDashboardMissionPaceMetaForLevel("calm");

  return (
    <section className={styles.section} id="maquette-complete-site">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Maquette complète</p>
          <h2>Site, profils, boutons, cards, div, popups et avatars</h2>
        </div>
        <code>Référence visuelle globale</code>
      </div>

      <div className={styles.siteMockupShell}>
        <aside className={styles.siteMockupSidebar}>
          <code className={styles.elementName}>SiteMockupSidebar</code>
          <div className={styles.siteMockupBrand}>
            <code className={styles.elementName}>BrandBlock</code>
            <span><DashboardGaugeIcon size={22} /></span>
            <strong>PlanetLS</strong>
          </div>
          <nav className={styles.siteMockupNav} aria-label="Navigation maquette">
            <code className={styles.elementName}>DashboardNavItem</code>
            {SITE_MOCKUP_NAV_ITEMS.map((item) => (
              <span key={item.label}>
                {item.icon}
                {item.label}
              </span>
            ))}
          </nav>
        </aside>

        <div className={styles.siteMockupContent}>
          <header className={styles.siteMockupTopbar}>
            <code className={styles.elementName}>Topbar</code>
            <Button variant="ghost" size="sm" aria-label="Menu">
              <Menu size={17} />
            </Button>
            <div className={styles.siteMockupSearch}>
              <code className={styles.elementName}>SearchField.preview</code>
              <Search size={16} />
              <span>Rechercher un logement, une mission, un profil...</span>
            </div>
            <div className={styles.siteMockupActions}>
              <code className={styles.elementName}>TopbarActions</code>
              <Button variant="ghost" size="sm" aria-label="Notifications">
                <Bell size={17} />
              </Button>
              <Avatar name="Nathalie Charbonnel" size="sm" />
            </div>
          </header>

          <section className={styles.siteMockupHero}>
            <code className={styles.elementName}>DashboardHero</code>
            <div>
              <p className={styles.eyebrow}>Tableau de bord propriétaire</p>
              <h3>Ce qui demande votre attention aujourd'hui</h3>
              <p>
                Un écran lisible avec action principale, cartes de statut,
                profil, services et popup de correction.
              </p>
              <div className={styles.siteMockupButtonRow}>
                <code className={styles.elementName}>ButtonRow</code>
                <Button variant="primary">Corriger le logement</Button>
                <Button variant="outline">Voir les missions</Button>
                <Button variant="ghost">Plus tard</Button>
              </div>
            </div>
            <div className={styles.siteMockupHeroVisual}>
              <code className={styles.elementName}>DashboardMetricCard.warning</code>
              <DashboardMetricCard
                label="Logements"
                value="1"
                detail="1 logement à revoir"
                icon={<DashboardHomeIcon size={18} />}
                statusLabel="À revoir"
                statusTone="warning"
                statusIcon={<AlertTriangle size={18} />}
                statusIconOnly
              />
            </div>
          </section>

          <div className={styles.siteMockupDashboardGrid}>
            <div className={styles.namedPreview}>
              <code className={styles.elementName}>DashboardMetricCard.cadence</code>
              <DashboardMetricCard
                label="Missions"
                value="0"
                detail="Aucune mission aujourd'hui"
                icon={<CalendarDays size={18} />}
                statusLabel={calmPace.label}
                statusTone={calmPace.tone}
                statusIcon={calmPace.icon}
                statusIconOnly
                statusText={calmPace.label}
              />
            </div>
            <div className={styles.namedPreview}>
              <code className={styles.elementName}>StatsCard.default</code>
              <StatsCard
                label="Messages"
                value="4"
                hint="Messages non lus"
                trend="Info"
                progress={28}
                visual={<MessageSquareText size={30} />}
                visualLabel="Messages"
              />
            </div>
            <div className={styles.namedPreview}>
              <code className={styles.elementName}>MetricDonut.compact</code>
              <MetricDonut label="Prêts" value="2/3" detail="Logements" percent={66} compact />
            </div>
          </div>

          <div className={styles.siteMockupLowerGrid}>
            <article className={styles.siteMockupProfileCard}>
              <code className={styles.elementName}>ProfileSummaryCard</code>
              <div className={styles.siteMockupProfileHead}>
                <code className={styles.elementName}>ProfileHeader</code>
                <Image
                  src="/icons/proprio_belle_epoque.png"
                  alt=""
                  width={84}
                  height={84}
                  unoptimized
                />
                <div>
                  <Badge variant="gold">Profil propriétaire</Badge>
                  <h3>Nathalie Charbonnel</h3>
                  <p>Paris · 3 logements · capacité maximale renseignée</p>
                </div>
              </div>
              <div className={styles.siteMockupProfileFacts}>
                <code className={styles.elementName}>ProfileFactChips</code>
                <span><Star size={15} /> 4,8 qualité</span>
                <span><MapPin size={15} /> Paris centre</span>
                <span><CheckCircle2 size={15} /> Fiche presque complète</span>
              </div>
              <div className={styles.siteMockupAvatarRow}>
                <code className={styles.elementName}>AvatarRow</code>
                <Avatar name="Nathalie Charbonnel" size="sm" />
                <Avatar name="Belle Rive" size="md" />
                <Avatar name="Atelier Martin" size="lg" />
              </div>
            </article>

            <article className={styles.siteMockupDivPanel}>
              <code className={styles.elementName}>InfoPanel / DivPanel</code>
              <div>
                <span className={styles.siteMockupIconBadge}><Settings2 size={18} /></span>
                <div>
                  <strong>Div / panneau réutilisable</strong>
                  <p>Bloc neutre pour checklist, résumé, aide ou information.</p>
                </div>
              </div>
              <div className={styles.siteMockupChecklist}>
                <code className={styles.elementName}>ChecklistChips</code>
                <span><CheckCircle2 size={15} /> Photo principale</span>
                <span><AlertTriangle size={15} /> Équipements à compléter</span>
                <span><CheckCircle2 size={15} /> Capacité maximale</span>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div className={styles.siteMockupReferenceGrid}>
        <article className={styles.siteMockupReferenceCard}>
          <code className={styles.elementName}>ProfileCard.variants</code>
          <strong>Profils</strong>
          <div className={styles.profileMockupGrid}>
            {PROFILE_MOCKUPS.map((profile) => (
              <div key={profile.name} className={styles.profileMockupCard} data-tone={profile.tone}>
                <code className={styles.elementName}>ProfileCard.{profile.tone}</code>
                <Image src={profile.image} alt="" width={64} height={64} unoptimized />
                <div>
                  <Badge variant="neutral">{profile.role}</Badge>
                  <h3>{profile.name}</h3>
                  <p>{profile.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.siteMockupReferenceCard}>
          <code className={styles.elementName}>PopupCard.variants</code>
          <strong>Popups / modales</strong>
          <div className={styles.popupMockupGrid}>
            {POPUP_MOCKUPS.map((popup) => (
              <div key={popup.title} className={styles.popupMockupCard} data-tone={popup.tone}>
                <code className={styles.elementName}>PopupCard.{popup.tone}</code>
                <div className={styles.popupMockupTopbar}>
                  <span>{popup.title}</span>
                  <X size={16} />
                </div>
                <p>{popup.description}</p>
                <div>
                  <Button variant={popup.tone === "warning" ? "paper" : "primary"} size="sm">
                    {popup.action}
                  </Button>
                  <Button variant="ghost" size="sm">Annuler</Button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.siteMockupReferenceCard}>
          <code className={styles.elementName}>SurfaceTone.variants</code>
          <strong>Surfaces et états</strong>
          <div className={styles.surfaceMockupGrid}>
            <span data-tone="soft"><code>Surface.soft</code>Surface douce</span>
            <span data-tone="outlined"><code>Surface.outlined</code>Contour</span>
            <span data-tone="warning"><code>Surface.warning</code>Attention</span>
            <span data-tone="success"><code>Surface.success</code>Validé</span>
            <span data-tone="dark"><code>Surface.dark</code>Contraste</span>
            <span data-tone="empty"><code>State.empty</code>État vide</span>
          </div>
        </article>
      </div>
    </section>
  );
}

function ElementNameDirectorySection() {
  return (
    <section className={styles.section} id="repertoire-elements">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Noms des éléments</p>
          <h2>Répertoire pour reprendre rapidement un style</h2>
        </div>
        <code>chercher par nom dans le code</code>
      </div>

      <div className={styles.elementDirectoryGrid}>
        {ELEMENT_STYLE_REFERENCES.map((item) => (
          <article key={item.name} className={styles.elementDirectoryCard}>
            <code>{item.name}</code>
            <strong>{item.source}</strong>
            <p>{item.usage}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ThemesAndBusinessVisualsSection() {
  return (
    <section className={styles.section} id="themes-popups-metier">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Thèmes et visuels métier</p>
          <h2>Avatar photo, popups, mission, demande et profil</h2>
        </div>
        <code>ThemeProvider + composants métier</code>
      </div>

      <div className={styles.themeVisualGrid}>
        {THEME_VISUALS.map((theme) => (
          <article key={theme.key} className={styles.themeVisualCard} data-theme-preview={theme.key}>
            <code>{theme.source}</code>
            <div className={styles.themeVisualSurface}>
              <span>{theme.label}</span>
              <strong>{theme.key}</strong>
              <p>{theme.description}</p>
              <div>
                <Button variant={theme.key === "mucha-dark" ? "dark" : "primary"} size="sm">Action</Button>
                <Badge variant={theme.key === "sepia" || theme.key === "art-deco" ? "gold" : "neutral"}>
                  Badge
                </Badge>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.businessVisualGrid}>
        <article className={styles.avatarUploadPreview}>
          <code>AvatarUpload · imageWrapper + cameraButton + modal</code>
          <div className={styles.avatarUploadVisual}>
            <div className={styles.avatarUploadCircle}>
              <Image
                src="/icons/proprio_belle_epoque.png"
                alt=""
                width={130}
                height={130}
                unoptimized
              />
              <span className={styles.avatarCameraButton}>
                <Camera size={16} />
              </span>
            </div>
            <div>
              <strong>Avatar avec appareil photo</strong>
              <p>Visuel à reprendre pour profil, concierge, artisan et logement.</p>
              <div className={styles.avatarUploadControls}>
                <span><Camera size={14} /> Changer l'image</span>
                <span>Zoom</span>
                <span>Rotation</span>
              </div>
            </div>
          </div>
        </article>

        <article className={styles.missionVisualCard}>
          <code>OwnerMissionRow / MissionDetails</code>
          <div className={styles.missionVisualTop}>
            <span className={styles.missionStatusBadge}>En cours</span>
            <Badge variant="gold">Mission voyageurs</Badge>
          </div>
          <h3>Ménage entre voyageurs</h3>
          <p><Home size={15} /> Appartement Belle Époque · Paris</p>
          <div className={styles.missionVisualMeta}>
            <span><CalendarDays size={15} /> Aujourd'hui</span>
            <span><Clock3 size={15} /> 11:30 - 14:00</span>
            <span><Wrench size={15} /> Conciergerie Belle Rive</span>
          </div>
          <div className={styles.missionVisualServices}>
            <Tag tone="category">Ménage</Tag>
            <Tag tone="category">Linge</Tag>
            <Tag tone="status">Contrôle qualité</Tag>
          </div>
          <Button variant="outline" size="sm">Voir la mission</Button>
        </article>

        <article className={styles.requestVisualCard}>
          <code>OwnerRequestSummaryCard / ServiceRequestCard</code>
          <div className={styles.requestVisualHeader}>
            <RequestStatusBadge status="IN_DISCUSSION" />
            <Tag tone="gold">Urgent</Tag>
          </div>
          <h3>Recherche conciergerie pour arrivées voyageurs</h3>
          <p>Besoin d'un partenaire local pour check-in, ménage et suivi voyageurs.</p>
          <div className={styles.requestFactGrid}>
            <span><strong>Paris</strong><small>Zone</small></span>
            <span><strong>48 h</strong><small>Délai</small></span>
            <span><strong>3</strong><small>Réponses</small></span>
          </div>
          <div className={styles.requestWorkflow}>
            <span data-state="done">Envoyée</span>
            <span data-state="active">Discussion</span>
            <span>Devis</span>
          </div>
          <Button variant="primary" size="sm">Ouvrir la demande</Button>
        </article>

        <article className={styles.profileVisualCard}>
          <code>ConciergePreviewCard / ProfileSummaryCard</code>
          <div className={styles.profileVisualCover}>
            <Image
              src="/images/carousel/planetls-private-concierge-voyageurs.png"
              alt=""
              width={520}
              height={180}
              unoptimized
            />
            <Badge variant="warning">PRO</Badge>
          </div>
          <div className={styles.profileVisualIdentity}>
            <Avatar name="Conciergerie Belle Rive" size="lg" />
            <div>
              <h3>Conciergerie Belle Rive</h3>
              <p><MapPin size={14} /> Paris · 4,8 / 5 · 24 avis</p>
            </div>
          </div>
          <div className={styles.profileVisualTags}>
            <Tag tone="category">Accueil voyageurs</Tag>
            <Tag tone="category">Ménage</Tag>
            <Tag tone="category">Maintenance légère</Tag>
          </div>
          <Button variant="outline" size="sm">Voir le profil</Button>
        </article>
      </div>

      <div className={styles.realPopupGrid}>
        {REAL_POPUP_REFERENCES.map((popup) => (
          <article key={popup.name} className={styles.realPopupCard} data-tone={popup.tone}>
            <code>{popup.name}</code>
            <span>{popup.source}</span>
            <div className={styles.realPopupWindow}>
              <button type="button" aria-label={`Fermer ${popup.name}`}>
                <X size={15} />
              </button>
              <p className={styles.eyebrow}>Popup utilisée</p>
              <h3>{popup.title}</h3>
              <p>{popup.description}</p>
              <div>
                <Button variant={popup.tone === "dark" ? "dark" : "primary"} size="sm">Action</Button>
                <Button variant="ghost" size="sm">Fermer</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StyleInventorySection() {
  return (
    <section className={styles.section} id="styles-ui">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Styles UI récupérés</p>
          <h2>Boutons, cards, badges, tags, stats et champs</h2>
        </div>
        <code>@/components/ui</code>
      </div>

      <div className={styles.styleInventoryGrid}>
        <Card className={styles.styleInventoryPanel}>
          <CardHeader>
            <h3>Boutons</h3>
            <p>{BUTTON_VARIANTS.length} variantes · 3 tailles</p>
          </CardHeader>
          <CardBody>
            <div className={styles.buttonMatrix}>
              {BUTTON_VARIANTS.map((variant) => (
                <div key={`button-${variant}`}>
                  <Button variant={variant} size="sm">{variant} sm</Button>
                  <Button variant={variant}>{variant} md</Button>
                  <Button variant={variant} size="lg">{variant} lg</Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className={styles.styleInventoryPanel}>
          <CardHeader>
            <h3>Cards</h3>
            <p>{CARD_VARIANTS.length} formats · {CARD_TONES.length} tons</p>
          </CardHeader>
          <CardBody>
            <div className={styles.cardMatrix}>
              {CARD_TONES.map((tone) => (
                <Card key={`card-${tone}`} tone={tone} variant="small" interactive>
                  <CardHeader>
                    <strong>{tone}</strong>
                  </CardHeader>
                  <CardBody>
                    <p>Card réutilisable avec header, body et footer.</p>
                  </CardBody>
                  <CardFooter>
                    <Badge variant={tone === "dark" ? "gold" : "neutral"}>{CARD_VARIANTS.join(" / ")}</Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className={styles.styleInventoryPanel}>
          <CardHeader>
            <h3>StatsCard</h3>
            <p>Variantes de cartes KPI</p>
          </CardHeader>
          <CardBody>
            <div className={styles.statsToneGrid}>
              {STATS_CARD_TONES.map((tone, index) => (
                <StatsCard
                  key={`stats-${tone}`}
                  label={`Stats ${tone}`}
                  value={`${index + 1}`}
                  hint="Modèle réutilisable"
                  trend="KPI"
                  tone={tone}
                  progress={(index + 1) * 28}
                  visual={<DashboardGaugeIcon size={30} />}
                  visualLabel={`Stats ${tone}`}
                />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className={styles.styleInventoryPanel}>
          <CardHeader>
            <h3>Badges et tags</h3>
            <p>Statuts courts et libellés de catégorie</p>
          </CardHeader>
          <CardBody>
            <div className={styles.badgeRow}>
              {BADGE_VARIANTS.map((variant) => (
                <Badge key={`style-badge-${variant}`} variant={variant}>{variant}</Badge>
              ))}
            </div>
            <div className={styles.badgeRow}>
              {TAG_TONES.map((tone) => (
                <Tag key={`style-tag-${tone}`} tone={tone}>{tone}</Tag>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className={styles.styleInventoryPanel}>
          <CardHeader>
            <h3>Champs</h3>
            <p>{FIELD_TONES.length} tons pour Input, Select et Textarea</p>
          </CardHeader>
          <CardBody>
            <div className={styles.fieldToneGrid}>
              {FIELD_TONES.map((tone) => (
                <div key={`field-${tone}`}>
                  <Input id={`input-${tone}`} label={`Input ${tone}`} tone={tone} defaultValue="Exemple" />
                  <Select id={`select-${tone}`} label={`Select ${tone}`} tone={tone} defaultValue="one">
                    <option value="one">Option une</option>
                    <option value="two">Option deux</option>
                  </Select>
                  <Textarea id={`textarea-${tone}`} label={`Textarea ${tone}`} tone={tone} rows={2} defaultValue="Note courte" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

function CategoryReferenceSection({
  groups,
}: {
  groups: Awaited<ReturnType<typeof getCategoryReferenceGroups>>;
}) {
  const total = groups.reduce((sum, group) => sum + group.categories.length, 0);

  return (
    <section className={styles.section} id="categories-metier">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Catégories métier</p>
          <h2>Toutes les catégories SQL avec icônes et images</h2>
        </div>
        <code>{total} catégories · categories_rows.sql</code>
      </div>

      <div className={styles.categoryReferenceGrid}>
        {groups.map((group) => (
          <article key={group.groupKey} className={styles.categoryReferenceGroup}>
            <div className={styles.categoryReferenceHeader}>
              <strong>{group.groupKey}</strong>
              <span>{group.categories.length} catégorie(s)</span>
            </div>
            <div className={styles.categoryReferenceList}>
              {group.categories.map((category) => (
                <div key={category.key} className={styles.categoryReferenceItem}>
                  <div className={styles.categoryReferenceImage}>
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt=""
                        width={120}
                        height={84}
                        unoptimized
                      />
                    ) : (
                      <ServiceCategoryIcon category={category.label} size={36} />
                    )}
                  </div>
                  <div className={styles.categoryReferenceBody}>
                    <div>
                      <span className={styles.categoryReferenceIcon}>
                        <ServiceCategoryIcon category={category.label} size={24} />
                      </span>
                      <strong>{category.label}</strong>
                    </div>
                    <p>{category.description}</p>
                    <div className={styles.categoryReferenceMeta}>
                      <code>{category.key}</code>
                      <code>{category.icon}</code>
                      <code>{category.newId}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SourceConsolidationSection() {
  return (
    <section className={styles.section} id="sources-a-consolider">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Organisation</p>
          <h2>Sources à utiliser pour alléger le code</h2>
        </div>
        <span className={styles.smallText}>
          Cette liste sert de carte avant de supprimer, remplacer ou fusionner.
        </span>
      </div>

      <div className={styles.sourceAuditGrid}>
        {COMPONENT_SOURCE_REFERENCES.map((item) => (
          <article key={item.title} className={styles.sourceAuditCard}>
            <strong>{item.title}</strong>
            <code>{item.importPath}</code>
            <p>{item.usage}</p>
            <span>{item.items}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function VisualReferencePage() {
  const icons = await getPublicIcons();
  const categoryReferenceGroups = await getCategoryReferenceGroups();
  const serviceCatalogGroups = await getServiceCatalogGroups();
  const serviceCatalogCount = serviceCatalogGroups.reduce(
    (sum, group) => sum + group.services.length,
    0,
  );
  const ownerCalmPace = getDashboardMissionPaceMetaForLevel("calm");

  return (
    <main className={styles.page}>
      <div className={styles.developmentNav}>
        <DevelopmentSectionNav active="design-system" />
        <Link href="/design-system" className={styles.backToDesignSystem}>Retour au Design system</Link>
      </div>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Design system interne</p>
          <h1>Référentiel visuel</h1>
          <p>
            Une page atelier pour voir les visuels utilisés dans le code,
            comparer les modèles et réutiliser les mêmes composants partout
            pendant la construction.
          </p>
        </div>
        <div className={styles.heroMeta}>
          <strong>{icons.length}</strong>
          <span>assets dans public/icons</span>
        </div>
      </section>

      {/* ── Par espace ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Par espace</p>
            <h2>Commun, propriétaires, concierges, artisans</h2>
          </div>
          <span className={styles.smallText}>
            Compare les différences et ce qui doit rester commun.
          </span>
        </div>

        <div className={styles.roleGrid}>
          {ROLE_VISUAL_GROUPS.map((group) => (
            <article
              key={group.id}
              className={`${styles.roleCard} ${styles[`role-${group.id}`]}`}
            >
              <div className={styles.roleCardHeader}>
                {group.image ? (
                  <Image
                    src={group.image}
                    alt=""
                    width={92}
                    height={92}
                    className={styles.roleImage}
                    unoptimized
                  />
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
                  <div
                    key={`${group.id}-${item.label}`}
                    className={styles.roleVisualItem}
                  >
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

      {/* ── Kits profils réels ── */}
      <ProfileKitSection />

      <CompleteSiteMockupSection />

      <ThemesAndBusinessVisualsSection />

      <ElementNameDirectorySection />

      <DonutReferenceSection />

      <BusinessComponentsSection />

      <StyleInventorySection />

      {/* ── Couleurs & typos ── */}
      <DesignTokenSection />

      <SourceConsolidationSection />

      <CategoryReferenceSection groups={categoryReferenceGroups} />

      {/* ── Owner logements ── */}
      <OwnerLogementsSection />

      {/* ── Sources page réelle ── */}
      {OWNER_LOGEMENTS_SOURCE_ELEMENTS.length > 0 && (
        <section className={styles.section} id="owner-logements-source-map">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Sources page réelle</p>
              <h2>Tout ce qui compose /dashboard/owner/logements</h2>
            </div>
            <code>route + composant partagé + styles owner</code>
          </div>
          <div className={styles.sourceMapGrid}>
            {OWNER_LOGEMENTS_SOURCE_ELEMENTS.map((item) => (
              <article key={item.name} className={styles.sourceMapCard}>
                <code>{item.name}</code>
                <strong>{item.source}</strong>
                <p>{item.usage}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Popups & modales ── */}
      {POPUP_VISUAL_REFERENCES.length > 0 && (
        <section className={styles.section} id="popup-reference">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Popups & modales utilisées</p>
              <h2>Inventaire visuel nommé des fenêtres à réutiliser</h2>
            </div>
            <span className={styles.smallText}>
              Chaque popup affiche son nom, sa source et ses actions.
            </span>
          </div>
          <div className={styles.popupReferenceGrid}>
            {POPUP_VISUAL_REFERENCES.map((popup) => (
              <article key={popup.name} className={styles.popupReferenceCard}>
                <div className={styles.popupReferenceTopbar}>
                  <code>{popup.name}</code>
                  <span>{popup.route}</span>
                </div>
                <div className={styles.popupReferenceWindow}>
                  <button type="button" aria-label={`Aperçu fermeture ${popup.name}`}>×</button>
                  <p className={styles.eyebrow}>Popup</p>
                  <h3>{popup.title}</h3>
                  <p>{popup.detail}</p>
                  <div className={styles.popupOptionPreview}>
                    <span>Option / champ principal</span>
                    <span>État sélectionné</span>
                    <span>Message d'aide</span>
                  </div>
                  <div className={styles.popupActionRow}>
                    {popup.actions.map((action) => (
                      <span key={`${popup.name}-${action}`}>{action}</span>
                    ))}
                  </div>
                </div>
                <code>{popup.source}</code>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Composants de base ── */}
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
                  <Button key={variant} variant={variant}>{variant}</Button>
                ))}
                <ButtonLink href="/design-system/visuels" variant="secondary">
                  Lien modèle <ArrowRight size={15} />
                </ButtonLink>
              </div>
              <p className={styles.note}>
                Import conseillé : `Button`, `ButtonLink` depuis `@/components/ui`.
              </p>
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
                  <Badge key={variant} variant={variant}>{variant}</Badge>
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

      {/* ── Icônes dashboard ── */}
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

      {/* ── Dashboard SaaS ── */}
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

      {/* ── Cadence ── */}
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
              C&apos;est le rendu utilisé sur le dashboard propriétaire quand la
              journée est calme.
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
                <DashboardStatusBadge
                  label={meta.label}
                  tone={meta.tone}
                  icon={meta.icon}
                  iconOnly
                />
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

      {/* ── Services ── */}
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

      {/* ── Catalogue complet ── */}
      <section className={styles.section} id="services-catalog-reference">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Catalogue complet</p>
            <h2>Tous les services et leurs icônes</h2>
          </div>
          <code>{serviceCatalogCount} services · services_catalog_rows.sql</code>
        </div>

        <div className={styles.serviceCatalogGrid}>
          {serviceCatalogGroups.map((group) => (
            <article key={group.category} className={styles.serviceCatalogGroup}>
              <div className={styles.serviceCatalogHeader}>
                <span>
                  <ServiceCategoryIcon category={group.category} size={30} />
                </span>
                <div>
                  <strong>{group.category}</strong>
                  <code>{group.services.length} services</code>
                </div>
              </div>
              <div className={styles.serviceCatalogList}>
                {group.services.map((service) => (
                  <div key={service.id} className={styles.serviceCatalogItem}>
                    <span>
                      <ServiceCategoryIcon category={service.category} size={22} />
                    </span>
                    <div>
                      <strong>{service.service}</strong>
                      <p>{service.description}</p>
                      <code>{service.category} · #{service.id}</code>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Inventaire icons ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Inventaire</p>
            <h2>Tous les fichiers de public/icons</h2>
          </div>
          <span className={styles.smallText}>
            Ajoutez un fichier ici, il remonte dans cette grille.
          </span>
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

      {/* ── Règles simples ── */}
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
