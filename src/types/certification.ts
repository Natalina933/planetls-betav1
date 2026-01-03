// src/types/certification.ts

import { LucideIcon } from "lucide-react";

/**
 * Niveaux de certification disponibles
 * - none: Aucune certification
 * - verified: Profil vérifié (identité confirmée)
 * - certified: Profil certifié (documents validés)
 * - premium: Certification premium (performance prouvée)
 * - elite: Certification elite (excellence reconnue)
 */
export type CertificationLevel = 
  | "none" 
  | "verified" 
  | "certified" 
  | "premium" 
  | "elite";

/**
 * Configuration d'un badge de certification
 * Définit l'apparence et les bénéfices de chaque niveau
 */
export interface CertificationBadge {
  level: CertificationLevel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
  benefits: string[];
  priority: number; // Pour le ranking dans les recherches
  commission_discount: number; // Réduction commission en %
}

/**
 * Statut de certification actuel avec progression
 * Utilisé pour afficher la progression vers le prochain niveau
 */
export interface CertificationStatus {
  current_level: CertificationLevel;
  next_level: CertificationLevel | null;
  progress_percentage: number;
  missing_criteria: CriterionStatus[];
  obtained_at: string | null;
  expires_at: string | null;
  can_renew: boolean;
  days_until_expiration: number | null;
}

/**
 * État d'un critère individuel
 */
export interface CriterionStatus {
  key: string;
  label: string;
  description: string;
  is_met: boolean;
  current_value: number | boolean | string;
  required_value: number | boolean | string;
  progress_percentage?: number;
}

/**
 * Données de certification complètes d'un profil
 */
export interface ProfileCertification {
  profile_id: string;
  level: CertificationLevel;
  criteria_met: Record<string, boolean>;
  validation_date: string;
  expiration_date: string | null;
  validator_id: string | null;
  notes: string | null;
  metadata: CertificationMetadata;
}

/**
 * Critères de base pour tous les niveaux
 */
export interface BaseCriteria {
  profile_complete_percentage: number;
  email_confirmed: boolean;
  phone_confirmed: boolean;
}

/**
 * Critères pour le niveau "verified"
 */
export interface VerifiedCriteria extends BaseCriteria {
  identity_verified: boolean;
  profile_photo_uploaded: boolean;
}

/**
 * Critères pour le niveau "certified"
 */
export interface CertifiedCriteria extends VerifiedCriteria {
  siret_validated: boolean;
  insurance_validated: boolean;
  insurance_company: string | null;
  insurance_number: string | null;
  minimum_missions_completed: number;
  minimum_rating: number;
  no_active_complaints: boolean;
  business_documents_uploaded: boolean;
}

/**
 * Critères pour le niveau "premium"
 */
export interface PremiumCriteria extends CertifiedCriteria {
  missions_completed: number;
  average_rating: number;
  response_time_hours: number;
  completion_rate_percentage: number;
  certifications_uploaded: boolean;
  professional_photos: boolean;
  client_testimonials: number;
}

/**
 * Critères pour le niveau "elite"
 */
export interface EliteCriteria extends PremiumCriteria {
  missions_completed_elite: number;
  perfect_rating: boolean;
  zero_cancellations_last_year: boolean;
  special_training_completed: boolean;
  featured_by_admin: boolean;
  mentor_status: boolean;
  industry_awards: number;
}

/**
 * Union de tous les types de critères
 */
export type CertificationCriteria = 
  | BaseCriteria
  | VerifiedCriteria
  | CertifiedCriteria
  | PremiumCriteria
  | EliteCriteria;

/**
 * Historique de certification
 * Trace toutes les modifications de certification
 */
export interface CertificationHistory {
  id: string;
  profile_id: string;
  old_level: CertificationLevel;
  new_level: CertificationLevel;
  reason: string;
  validated_by: string | null;
  validator_name: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Métadonnées de certification stockées en JSONB
 * Contient des informations supplémentaires sur la validation
 */
export interface CertificationMetadata {
  auto_validated: boolean;
  validation_source: "admin" | "automatic" | "api" | "manual_review";
  criteria_snapshot: Record<string, boolean | number | string>;
  notes: string | null;
  documents_verified: string[];
  last_review_date: string;
  reviewer_comments: string | null;
  flags: string[];
  performance_metrics: {
    missions_completed: number;
    average_rating: number;
    response_time_hours: number;
    completion_rate: number;
    cancellation_rate: number;
  };
}

/**
 * Requête de certification
 * Utilisée quand un utilisateur demande une certification
 */
export interface CertificationRequest {
  profile_id: string;
  requested_level: CertificationLevel;
  supporting_documents: string[];
  message: string | null;
  created_at: string;
  status: "pending" | "approved" | "rejected" | "under_review";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

/**
 * Seuils de critères pour chaque niveau
 * Utilisé pour la validation automatique
 */
export interface CertificationThresholds {
  verified: {
    profile_completion: 80; // %
  };
  certified: {
    profile_completion: 95; // %
    minimum_missions: 5;
    minimum_rating: 4.5;
    max_complaints: 0;
  };
  premium: {
    profile_completion: 100; // %
    minimum_missions: 20;
    minimum_rating: 4.8;
    max_response_time: 2; // heures
    min_completion_rate: 95; // %
    minimum_testimonials: 5;
  };
  elite: {
    profile_completion: 100; // %
    minimum_missions: 50;
    minimum_rating: 4.95;
    max_response_time: 1; // heure
    min_completion_rate: 98; // %
    max_cancellation_rate: 1; // %
    minimum_awards: 1;
  };
}

/**
 * Options d'affichage du badge
 */
export interface BadgeDisplayOptions {
  size: "xs" | "sm" | "md" | "lg" | "xl";
  showLabel: boolean;
  showIcon: boolean;
  showTooltip: boolean;
  variant: "default" | "compact" | "detailed";
  animated: boolean;
}

/**
 * Props communes pour les composants de certification
 */
export interface CertificationComponentProps {
  certificationLevel: CertificationLevel;
  className?: string;
  onClick?: () => void;
}

/**
 * Statistiques de certification pour le dashboard admin
 */
export interface CertificationStats {
  total_profiles: number;
  by_level: Record<CertificationLevel, number>;
  pending_requests: number;
  certifications_this_month: number;
  average_time_to_certify_days: number;
  renewal_rate_percentage: number;
}

/**
 * Configuration de notification pour expiration
 */
export interface CertificationNotificationConfig {
  notify_days_before: number[];
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
}

/**
 * Type guard pour vérifier le niveau de certification
 */
export function isCertificationLevel(value: unknown): value is CertificationLevel {
  return typeof value === "string" && 
    ["none", "verified", "certified", "premium", "elite"].includes(value);
}

/**
 * Type guard pour vérifier si un profil est certifié
 */
export function isCertified(level: CertificationLevel): boolean {
  return level !== "none";
}

/**
 * Type guard pour vérifier si un profil est premium ou plus
 */
export function isPremiumOrAbove(level: CertificationLevel): boolean {
  return level === "premium" || level === "elite";
}