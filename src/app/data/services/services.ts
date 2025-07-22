import {
  CalendarCheck,
  Shield,
  FileText,
  UserCheck,
  Zap,
} from "lucide-react";

export interface Service {
  title: string;
  description: string;
  icon: React.ElementType;
  keyPoint: string; // clé d'appartenance
}

export const services: Service[] = [
  {
    title: "Tableau de bord centralisé",
    description:
      "Pilotez toutes vos activités en un coup d'œil et prenez des décisions éclairées.",
    icon: CalendarCheck,
    keyPoint: "Gain de temps",
  },
  {
    title: "Pilotage intelligent & automatisation",
    description:
      "Planification intelligente, rappels, tâches récurrentes — tout est synchronisé.",
    icon: Zap,
    keyPoint: "Automatisation",
  },
  {
    title: "Sécurité renforcée & gestion documentaire",
    description:
      "Contrats, factures, accès sécurisés : tout est chiffré et centralisé.",
    icon: Shield,
    keyPoint: "Accès sécurisé",
  },
  {
    title: "Espace membre & support dédié",
    description:
      "Assistance réactive, espace privé, gestion de profil et historique des missions.",
    icon: UserCheck,
    keyPoint: "Support dédié",
  },
  {
    title: "Plateforme adaptable à tous",
    description:
      "Fonctionnalités adaptées propriétaires, concierges et artisans.",
    icon: FileText,
    keyPoint: "Pour tous les profils",
  },
];
