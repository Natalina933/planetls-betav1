import { CalendarCheck, Shield, FileText, UserCheck, Users } from "lucide-react";

export interface Service {
  title: string;
  description: string;
  icon: React.ElementType;
  keyPoint: string;
}

export const services: Service[] = [
  {
    title: "Tableau de bord centralisé",
    description:
      "Pilotez toutes vos activités en un coup d'œil, visualisez les données clés en temps réel et prenez des décisions éclairées, quel que soit votre rôle.",
    icon: CalendarCheck,
    keyPoint: "Gain de temps",
  },
  {
    title: "Pilotage intelligent & automatisation",
    description:
      "Optimisez votre organisation grâce à un planning partagé intuitif, des automatisations intelligentes et des rapports détaillés pour gagner du temps.",
    icon: Shield,
    keyPoint: "Automatisation",
  },
  {
    title: "Sécurité renforcée & gestion documentaire",
    description:
      "Sécurisez vos accès, centralisez vos documents sensibles et profitez d'une gestion simplifiée, transparente et conforme, en toute sérénité.",
    icon: FileText,
    keyPoint: "Accès sécurisé",
  },
  {
    title: "Espace membre & support dédié",
    description:
      "Un espace membre privé avec un accompagnement personnalisé et une assistance réactive, pour une expérience utilisateur fluide et sécurisée.",
    icon: UserCheck,
    keyPoint: "Support dédié",
  },
  {
    title: "Gestion multi-profils",
    description:
      "Gérez facilement les accès et les permissions selon chaque rôle (propriétaire, concierge, artisan, etc.) pour une solution vraiment polyvalente.",
    icon: Users,
    keyPoint: "Pour tous les profils",
  },
];
