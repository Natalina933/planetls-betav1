// src/types/profile.ts

import { Tables } from './supabase';
import { CertificationLevel, CertificationMetadata } from './certification';

/**
 * Type Profile de base depuis Supabase
 */
export type Profile = Tables<'profiles'>;

/**
 * Profile étendu avec les champs de certification
 * Ce type combine le profil Supabase avec les données de certification
 */
export interface ProfileWithCertification extends Profile {
  // Nouveaux champs de certification
  certification_level: CertificationLevel;
  certification_date: string | null;
  certification_expires_at: string | null;
  certification_metadata: CertificationMetadata | null;
}

/**
 * Données pour mettre à jour la certification d'un profil
 */
export interface ProfileCertificationUpdate {
  certification_level?: CertificationLevel;
  certification_date?: string;
  certification_expires_at?: string | null;
  certification_metadata?: CertificationMetadata;
}

/**
 * Profile complet avec toutes les relations
 * Utilisé dans les dashboards et pages de profil détaillées
 */
export interface ProfileComplete extends ProfileWithCertification {
  // Statistiques calculées
  stats?: {
    missions_completed: number;
    average_rating: number;
    total_revenue: number;
    active_contracts: number;
    response_time_hours: number;
    completion_rate: number;
    cancellation_rate: number;
  };
  
  // Relations
  services?: Array<{
    id: number;
    service: string;
    category: string;
  }>;
  
  pricing?: Array<{
    id: string;
    label: string;
    amount: number;
    unit: string;
  }>;
  
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    client_name: string;
    created_at: string;
  }>;
}

/**
 * Données minimales d'un profil pour les listes et recherches
 * Optimisé pour les performances
 */
export interface ProfileCard {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  role: string | null;
  certification_level: CertificationLevel;
  city: string | null;
  average_rating?: number;
  missions_completed?: number;
  hourly_rate?: number | null;
}

/**
 * Profil public visible par les clients
 * Exclut les données sensibles
 */
export interface PublicProfile {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  certification_level: CertificationLevel;
  location: string | null;
  service_area: string | null;
  years_experience: number | null;
  experience_level: Profile['experience_level'];
  website: string | null;
  linkedin: string | null;
  instagram: string | null;
  facebook: string | null;
  // Statistiques publiques
  average_rating?: number;
  total_reviews?: number;
  missions_completed?: number;
  response_time_hours?: number;
}

/**
 * Calcul de la complétion du profil
 */
export interface ProfileCompletion {
  percentage: number;
  missing_fields: Array<{
    field: keyof Profile;
    label: string;
    category: "required" | "recommended" | "optional";
    points: number;
  }>;
  completed_categories: {
    personal_info: boolean;
    business_info: boolean;
    services: boolean;
    pricing: boolean;
    documents: boolean;
  };
}

/**
 * Filtre de recherche de profils
 */
export interface ProfileSearchFilters {
  role?: string[];
  certification_level?: CertificationLevel[];
  location?: string;
  service_area?: string;
  min_rating?: number;
  max_hourly_rate?: number;
  experience_level?: Profile['experience_level'][];
  emergency_service?: boolean;
  services?: string[];
}

/**
 * Résultat de recherche de profils avec métadonnées
 */
export interface ProfileSearchResult {
  profiles: ProfileCard[];
  total: number;
  page: number;
  per_page: number;
  filters_applied: ProfileSearchFilters;
}

/**
 * Validation de profil pour certification
 */
export interface ProfileValidation {
  is_valid: boolean;
  errors: Array<{
    field: keyof Profile;
    message: string;
    severity: "error" | "warning";
  }>;
  warnings: Array<{
    field: keyof Profile;
    message: string;
  }>;
  completion_percentage: number;
  can_request_certification: boolean;
  missing_requirements: string[];
}

/**
 * Helper pour vérifier si un profil est complet
 */
export function isProfileComplete(profile: Profile): boolean {
  const requiredFields: (keyof Profile)[] = [
    'username',
    'email',
    'first_name',
    'last_name',
    'phone',
    'company_name',
    'siret',
    'city',
  ];
  
  return requiredFields.every(field => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  });
}

/**
 * Helper pour calculer la complétion du profil
 */
export function calculateProfileCompletion(profile: Profile): number {
  const allFields: Array<keyof Profile> = [
    'username', 'email', 'first_name', 'last_name', 'phone',
    'avatar_url', 'company_name', 'legal_form', 'siret', 'siren',
    'street_address', 'postal_code', 'city', 'country',
    'insurance_company', 'insurance_number',
    'service_area', 'hourly_rate', 'availability_hours',
    'experience_level', 'years_experience', 'certifications',
    'website', 'linkedin'
  ];

  const completedFields = allFields.filter(field => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  });

  return Math.round((completedFields.length / allFields.length) * 100);
}

/**
 * Helper pour formater le nom complet
 */
export function getFullName(profile: Profile | ProfileCard | PublicProfile): string {
  const firstName = profile.first_name || '';
  const lastName = profile.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || profile.username;
}

/**
 * Helper pour obtenir le nom d'affichage
 */
export function getDisplayName(profile: Profile | ProfileCard | PublicProfile): string {
  return profile.company_name || getFullName(profile);
}