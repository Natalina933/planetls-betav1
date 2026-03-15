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
    title: "Tableau de bord centralise",
    description:
      "Pilotez toutes vos activites en un coup d'oeil et prenez des decisions eclairees.",
    icon: CalendarCheck,
    keyPoint: "Gain de temps",
    quote:
      "Ce que l'on concoit bien s'enonce clairement, et les decisions s'eclairent d'un simple regard.",
    posterLabel: "Pilotage",
    posterTone: "gold",
    posterLayout: "classic",
  },
  {
    title: "Pilotage intelligent & automatisation",
    description:
      "Planification intelligente, rappels, taches recurrentes : tout est synchronise.",
    icon: Zap,
    keyPoint: "Automatisation",
    quote:
      "Automatise ce qui est repetitif, pour te consacrer a ce qui compte.",
    posterLabel: "Automatiser",
    posterTone: "navy",
    posterLayout: "sunrise",
  },
  {
    title: "Securite renforcee & gestion documentaire",
    description:
      "Contrats, factures, acces securises : tout est chiffre et centralise.",
    icon: Shield,
    keyPoint: "Acces securise",
    quote:
      "La confiance nait la ou la securite est invisible mais omnipresente.",
    posterLabel: "Securiser",
    posterTone: "emerald",
    posterLayout: "gallery",
  },
  {
    title: "Espace membre & support dedie",
    description:
      "Assistance reactive, espace prive, gestion de profil et historique des missions.",
    icon: UserCheck,
    keyPoint: "Support dedie",
    quote: "Etre entoure, c'est deja avancer.",
    posterLabel: "Accompagner",
    posterTone: "plum",
    posterLayout: "ornate",
  },
  {
    title: "Plateforme adaptable a tous",
    description:
      "Fonctionnalites adaptees aux proprietaires, concierges et artisans.",
    icon: FileText,
    keyPoint: "Pour tous les profils",
    quote: "Chaque metier merite ses outils, chaque profil son espace.",
    posterLabel: "Adapter",
    posterTone: "copper",
    posterLayout: "gallery",
  },
  {
    title: "Apprentissage et savoir-faire",
    description:
      "Partage d'expertise, tutoriels, echanges de bonnes pratiques : developpez vos competences.",
    icon: GraduationCap,
    keyPoint: "Valorisation du savoir",
    quote: "Le savoir se multiplie lorsqu'on le partage.",
    posterLabel: "Transmettre",
    posterTone: "gold",
    posterLayout: "sunrise",
  },
  {
    title: "Collaboration locale et ethique",
    description:
      "Favorisez les echanges de proximite, soutenez l'economie locale et collaborez en toute confiance.",
    icon: Leaf,
    keyPoint: "Collaboration locale",
    quote:
      "Ce qui est proche est precieux. Ensemble, nous faisons vivre le territoire.",
    posterLabel: "Relier",
    posterTone: "emerald",
    posterLayout: "ornate",
  },
  {
    title: "Boutique PlanetLS",
    description:
      "Accedez a nos packs premium pour booster votre activite : outils avances, support prioritaire et offres exclusives.",
    icon: ShoppingCart,
    keyPoint: "Offres premium",
    quote:
      "Investir dans les bons outils, c'est accelerer votre reussite.",
    posterLabel: "Elever",
    posterTone: "copper",
    posterLayout: "classic",
  },
];
