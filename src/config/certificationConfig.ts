// src/config/certificationConfig.ts

import { 
  Shield, 
  ShieldCheck, 
  Star, 
  Crown, 
  Zap 
} from "lucide-react";
import { 
  CertificationLevel, 
  CertificationBadge,
  CertificationThresholds 
} from "@/types/certification";

/**
 * Configuration complète des badges de certification
 * Définit l'apparence, les bénéfices et les couleurs de chaque niveau
 */
export const CERTIFICATION_CONFIG: Record<CertificationLevel, CertificationBadge> = {
  none: {
    level: "none",
    label: "Non certifié",
    description: "Profil non vérifié",
    color: "#95a5a6",
    bgColor: "#ecf0f1",
    borderColor: "#bdc3c7",
    icon: Shield,
    benefits: [
      "Création de profil gratuite",
      "Accès aux fonctionnalités de base",
    ],
    priority: 0,
    commission_discount: 0,
  },

  verified: {
    level: "verified",
    label: "Profil Vérifié",
    description: "Identité et coordonnées vérifiées",
    color: "#3498db",
    bgColor: "#ebf5fb",
    borderColor: "#85c1e9",
    icon: ShieldCheck,
    benefits: [
      "✓ Badge de confiance visible sur votre profil",
      "✓ Identité vérifiée par nos équipes",
      "✓ Accès aux missions standards",
      "✓ Augmentation de 30% de visibilité",
    ],
    priority: 1,
    commission_discount: 0,
  },

  certified: {
    level: "certified",
    label: "Profil Certifié",
    description: "Documents professionnels validés et missions réussies",
    color: "#27ae60",
    bgColor: "#eafaf1",
    borderColor: "#82e0aa",
    icon: Star,
    benefits: [
      "🌟 Visibilité prioritaire dans les recherches",
      "🌟 Badge certifié doré sur votre profil",
      "🌟 Accès aux clients Premium",
      "🌟 Support prioritaire par email",
      "🌟 Augmentation de 50% de visibilité",
      "🌟 Profil mis en avant 2x plus souvent",
    ],
    priority: 2,
    commission_discount: 0,
  },

  premium: {
    level: "premium",
    label: "Certification Premium",
    description: "Excellence prouvée et performance exceptionnelle",
    color: "#f39c12",
    bgColor: "#fef5e7",
    borderColor: "#f8c471",
    icon: Crown,
    benefits: [
      "👑 Placement en tête de liste systématique",
      "👑 Badge Premium doré avec animation",
      "👑 Commission réduite de 10%",
      "👑 Accès aux missions VIP haute valeur",
      "👑 Support prioritaire 24/7 par téléphone",
      "👑 Tableau de bord analytique avancé",
      "👑 Augmentation de 80% de visibilité",
      "👑 Mention 'Recommandé par PlanetLs'",
    ],
    priority: 3,
    commission_discount: 10,
  },

  elite: {
    level: "elite",
    label: "Certification Elite",
    description: "Top 1% des prestataires - Excellence absolue",
    color: "#8e44ad",
    bgColor: "#f4ecf7",
    borderColor: "#bb8fce",
    icon: Zap,
    benefits: [
      "⚡ Visibilité exclusive Top 1%",
      "⚡ Badge Elite violet avec effet premium",
      "⚡ Commission réduite de 20%",
      "⚡ Missions exclusives haute valeur (5000€+)",
      "⚡ Account manager personnel dédié",
      "⚡ Formation continue gratuite",
      "⚡ Invitations événements VIP PlanetLs",
      "⚡ Programme de parrainage rémunéré",
      "⚡ Priorité absolue dans toutes les recherches",
      "⚡ Mention 'Partenaire Elite PlanetLs'",
    ],
    priority: 4,
    commission_discount: 20,
  },
};

/**
 * Seuils de critères pour chaque niveau de certification
 * Utilisé pour la validation automatique et le calcul de progression
 */
export const CERTIFICATION_THRESHOLDS: CertificationThresholds = {
  verified: {
    profile_completion: 80, // %
  },
  certified: {
    profile_completion: 95, // %
    minimum_missions: 5,
    minimum_rating: 4.5,
    max_complaints: 0,
  },
  premium: {
    profile_completion: 100, // %
    minimum_missions: 20,
    minimum_rating: 4.8,
    max_response_time: 2, // heures
    min_completion_rate: 95, // %
    minimum_testimonials: 5,
  },
  elite: {
    profile_completion: 100, // %
    minimum_missions: 50,
    minimum_rating: 4.95,
    max_response_time: 1, // heure
    min_completion_rate: 98, // %
    max_cancellation_rate: 1, // %
    minimum_awards: 1,
  },
};

/**
 * Labels des critères en français pour l'affichage
 */
export const CRITERIA_LABELS: Record<string, string> = {
  // Profil
  profile_completion: "Profil complété",
  email_confirmed: "Email confirmé",
  phone_confirmed: "Téléphone confirmé",
  identity_verified: "Identité vérifiée",
  profile_photo_uploaded: "Photo de profil",
  
  // Documents
  siret_validated: "SIRET validé",
  insurance_validated: "Assurance RC Pro validée",
  insurance_company: "Compagnie d'assurance",
  insurance_number: "N° de contrat d'assurance",
  business_documents_uploaded: "Documents professionnels",
  certifications_uploaded: "Certifications professionnelles",
  
  // Performance
  minimum_missions_completed: "Missions réalisées",
  missions_completed: "Missions complétées",
  missions_completed_elite: "Missions complétées (Elite)",
  minimum_rating: "Note minimum",
  average_rating: "Note moyenne",
  perfect_rating: "Note parfaite (5/5)",
  
  // Qualité de service
  response_time_hours: "Temps de réponse",
  completion_rate_percentage: "Taux de complétion",
  no_active_complaints: "Aucune réclamation",
  zero_cancellations_last_year: "Aucune annulation (12 mois)",
  
  // Extras
  professional_photos: "Photos professionnelles",
  client_testimonials: "Témoignages clients",
  special_training_completed: "Formation spécialisée",
  featured_by_admin: "Mis en avant par l'équipe",
  mentor_status: "Statut de mentor",
  industry_awards: "Prix et distinctions",
};

/**
 * Descriptions détaillées des critères
 */
export const CRITERIA_DESCRIPTIONS: Record<string, string> = {
  profile_completion: "Remplissez au minimum {value}% de votre profil",
  email_confirmed: "Confirmez votre adresse email via le lien reçu",
  phone_confirmed: "Validez votre numéro de téléphone par SMS",
  identity_verified: "Envoyez une pièce d'identité pour vérification",
  siret_validated: "SIRET vérifié auprès de l'INSEE",
  insurance_validated: "Attestation RC Pro vérifiée et à jour",
  minimum_missions_completed: "Complétez au moins {value} missions avec succès",
  minimum_rating: "Maintenez une note moyenne de {value}/5 minimum",
  response_time_hours: "Répondez aux demandes en moins de {value}h",
  completion_rate_percentage: "Maintenez un taux de complétion de {value}%",
  no_active_complaints: "Aucune réclamation client active",
  professional_photos: "Ajoutez au moins 3 photos professionnelles",
  client_testimonials: "Obtenez au moins {value} témoignages clients",
};

/**
 * Ordre de priorité des niveaux (pour le tri)
 */
export const CERTIFICATION_PRIORITY: Record<CertificationLevel, number> = {
  none: 0,
  verified: 1,
  certified: 2,
  premium: 3,
  elite: 4,
};

/**
 * Durée de validité de chaque certification (en jours)
 * null = pas d'expiration
 */
export const CERTIFICATION_VALIDITY_DAYS: Record<CertificationLevel, number | null> = {
  none: null,
  verified: null, // Permanente une fois obtenue
  certified: 365, // 1 an
  premium: 365, // 1 an
  elite: 365, // 1 an
};

/**
 * Délais de notification avant expiration (en jours)
 */
export const EXPIRATION_NOTIFICATION_DAYS = [30, 15, 7, 3, 1];

/**
 * Helper: Obtenir la configuration d'un niveau
 */
export function getCertificationConfig(level: CertificationLevel): CertificationBadge {
  return CERTIFICATION_CONFIG[level];
}

/**
 * Helper: Obtenir les seuils d'un niveau
 */
export function getCertificationThresholds(level: CertificationLevel) {
  if (level === "none") return null;
  return CERTIFICATION_THRESHOLDS[level];
}

/**
 * Helper: Obtenir le prochain niveau
 */
export function getNextLevel(currentLevel: CertificationLevel): CertificationLevel | null {
  const levels: CertificationLevel[] = ["none", "verified", "certified", "premium", "elite"];
  const currentIndex = levels.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex === levels.length - 1) return null;
  return levels[currentIndex + 1];
}

/**
 * Helper: Obtenir le niveau précédent
 */
export function getPreviousLevel(currentLevel: CertificationLevel): CertificationLevel | null {
  const levels: CertificationLevel[] = ["none", "verified", "certified", "premium", "elite"];
  const currentIndex = levels.indexOf(currentLevel);
  if (currentIndex <= 0) return null;
  return levels[currentIndex - 1];
}

/**
 * Helper: Vérifier si un niveau est supérieur à un autre
 */
export function isLevelHigherThan(level1: CertificationLevel, level2: CertificationLevel): boolean {
  return CERTIFICATION_PRIORITY[level1] > CERTIFICATION_PRIORITY[level2];
}

/**
 * Helper: Obtenir tous les niveaux dans l'ordre
 */
export function getAllLevels(): CertificationLevel[] {
  return ["none", "verified", "certified", "premium", "elite"];
}

/**
 * Helper: Obtenir tous les niveaux certifiés (sans "none")
 */
export function getCertifiedLevels(): CertificationLevel[] {
  return ["verified", "certified", "premium", "elite"];
}