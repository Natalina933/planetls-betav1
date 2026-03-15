import {
  CalendarCheck,
  FileText,
  GraduationCap,
  Leaf,
  Shield,
  ShoppingCart,
  UserCheck,
  Zap,
} from "lucide-react";

export type ServicePosterTone = "gold" | "navy" | "emerald" | "plum" | "copper";
export type ServicePosterLayout = "classic" | "sunrise" | "gallery" | "ornate";

export interface Service {
  title: string;
  description: string;
  icon: React.ElementType;
  keyPoint: string;
  quote: string;
  posterLabel: string;
  posterTone: ServicePosterTone;
  posterLayout: ServicePosterLayout;
}

export const services: Service[] = [
  {
    title: "Tableau de bord centralisé",
    description:
      "Pilotez toutes vos activités en un coup d'œil et prenez des décisions éclairées.",
    icon: CalendarCheck,
    keyPoint: "Gain de temps",
    quote:
      "Ce que l'on conçoit bien s'énonce clairement, et les décisions s'éclairent d'un simple regard.",
    posterLabel: "Pilotage",
    posterTone: "gold",
    posterLayout: "classic",
  },
  {
    title: "Pilotage intelligent & automatisation",
    description:
      "Planification intelligente, rappels, tâches récurrentes : tout est synchronisé.",
    icon: Zap,
    keyPoint: "Automatisation",
    quote:
      "Automatise ce qui est répétitif, pour te consacrer à ce qui compte.",
    posterLabel: "Automatiser",
    posterTone: "navy",
    posterLayout: "sunrise",
  },
  {
    title: "Sécurité renforcée & gestion documentaire",
    description:
      "Contrats, factures, accès sécurisés : tout est chiffré et centralisé.",
    icon: Shield,
    keyPoint: "Accès sécurisé",
    quote:
      "La confiance naît là où la sécurité est invisible mais omniprésente.",
    posterLabel: "Securiser",
    posterTone: "emerald",
    posterLayout: "gallery",
  },
  {
    title: "Espace membre & support dédié",
    description:
      "Assistance réactive, espace privé, gestion de profil et historique des missions.",
    icon: UserCheck,
    keyPoint: "Support dédié",
    quote: "Être entouré, c'est déjà avancer.",
    posterLabel: "Accompagner",
    posterTone: "plum",
    posterLayout: "ornate",
  },
  {
    title: "Plateforme adaptable à tous",
    description:
      "Fonctionnalités adaptées aux propriétaires, concierges et artisans.",
    icon: FileText,
    keyPoint: "Pour tous les profils",
    quote: "Chaque métier mérite ses outils, chaque profil son espace.",
    posterLabel: "Adapter",
    posterTone: "copper",
    posterLayout: "gallery",
  },
  {
    title: "Apprentissage et savoir-faire",
    description:
      "Partage d'expertise, tutoriels, échanges de bonnes pratiques : développez vos compétences.",
    icon: GraduationCap,
    keyPoint: "Valorisation du savoir",
    quote: "Le savoir se multiplie lorsqu'on le partage.",
    posterLabel: "Transmettre",
    posterTone: "gold",
    posterLayout: "sunrise",
  },
  {
    title: "Collaboration locale et éthique",
    description:
      "Favorisez les échanges de proximité, soutenez l'économie locale et collaborez en toute confiance.",
    icon: Leaf,
    keyPoint: "Collaboration locale",
    quote:
      "Ce qui est proche est précieux. Ensemble, nous faisons vivre le territoire.",
    posterLabel: "Relier",
    posterTone: "emerald",
    posterLayout: "ornate",
  },
  {
    title: "Boutique PlanetLS",
    description:
      "Accédez à nos packs premium pour booster votre activité : outils avancés, support prioritaire et offres exclusives.",
    icon: ShoppingCart,
    keyPoint: "Offres premium",
    quote:
      "Investir dans les bons outils, c'est accélérer votre réussite.",
    posterLabel: "Elever",
    posterTone: "copper",
    posterLayout: "classic",
  },
];
