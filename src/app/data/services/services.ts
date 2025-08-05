import {
  CalendarCheck,
  Shield,
  FileText,
  UserCheck,
  Zap,
  GraduationCap,
  Leaf,
} from "lucide-react";

export interface Service {
  title: string;
  description: string;
  icon: React.ElementType;
  keyPoint: string;
  quote: string; // citation dynamique
}

export const services: Service[] = [
  {
    title: "Tableau de bord centralisé",
    description:
      "Pilotez toutes vos activités en un coup d'œil et prenez des décisions éclairées.",
    icon: CalendarCheck,
    keyPoint: "Gain de temps",
    quote: "Ce que l'on conçoit bien s’énonce clairement, et les décisions s’éclairent d’un simple regard.",
  },
  {
    title: "Pilotage intelligent & automatisation",
    description:
      "Planification intelligente, rappels, tâches récurrentes — tout est synchronisé.",
    icon: Zap,
    keyPoint: "Automatisation",
    quote: "Automatise ce qui est répétitif, pour te consacrer à ce qui compte.",
  },
  {
    title: "Sécurité renforcée & gestion documentaire",
    description:
      "Contrats, factures, accès sécurisés : tout est chiffré et centralisé.",
    icon: Shield,
    keyPoint: "Accès sécurisé",
    quote: "La confiance naît là où la sécurité est invisible mais omniprésente.",
  },
  {
    title: "Espace membre & support dédié",
    description:
      "Assistance réactive, espace privé, gestion de profil et historique des missions.",
    icon: UserCheck,
    keyPoint: "Support dédié",
    quote: "Être entouré, c’est déjà avancer.",
  },
  {
    title: "Plateforme adaptable à tous",
    description:
      "Fonctionnalités adaptées propriétaires, concierges et artisans.",
    icon: FileText,
    keyPoint: "Pour tous les profils",
    quote: "Chaque métier mérite ses outils, chaque profil son espace.",
  },
  {
    title: "Apprentissage et savoir-faire",
    description:
      "Partage d’expertise, tutoriels, échanges de bonnes pratiques : développez vos compétences.",
    icon: GraduationCap,
    keyPoint: "Valorisation du savoir",
    quote: "Le savoir se multiplie lorsqu’on le partage.",
  },
  {
    title: "Collaboration locale et éthique",
    description:
      "Favorisez les échanges de proximité, soutenez l'économie locale et collaborez en toute confiance.",
    icon: Leaf,
    keyPoint: "Collaboration locale",
    quote: "Ce qui est proche est précieux. Ensemble, nous faisons vivre le territoire.",
  },
];
