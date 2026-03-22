// src/types/index.ts

/**
 * Barrel export pour centraliser tous les types
 * Permet d'importer facilement : import { CertificationLevel, Profile } from '@/types'
 */

// ============================================================
// TYPES SUPABASE (Base de données)
// ============================================================
export * from './supabase';

// ============================================================
// TYPES CERTIFICATION
// ============================================================
export type {
  CertificationLevel,
  CertificationBadge,
  CertificationStatus,
  CriterionStatus,
  ProfileCertification,
  BaseCriteria,
  VerifiedCriteria,
  CertifiedCriteria,
  PremiumCriteria,
  EliteCriteria,
  CertificationCriteria,
  CertificationHistory,
  CertificationMetadata,
  CertificationRequest,
  CertificationThresholds,
  BadgeDisplayOptions,
  CertificationComponentProps,
  CertificationStats,
  CertificationNotificationConfig,
} from './certification';

export {
  isCertificationLevel,
  isCertified,
  isPremiumOrAbove,
} from './certification';

// ============================================================
// TYPES PROFILE
// ============================================================
export type {
  Profile,
  ProfileWithCertification,
  ProfileCertificationUpdate,
  ProfileComplete,
  ProfileCard,
  PublicProfile,
  ProfileCompletion,
  ProfileSearchFilters,
  ProfileSearchResult,
  ProfileValidation,
} from './profile';

export {
  isProfileComplete,
  calculateProfileCompletion,
  getFullName,
  getDisplayName,
} from './profile';

export type {
  ServiceCatalogRow,
  PackageRow,
  PricingPackageRow,
  ContractTemplateRow,
  DefaultPackTemplate,
} from './servicePackages';

export {
  DEFAULT_SERVICE_PACK_TEMPLATES,
  normalizeServicePackageText,
  normalizeServicePackageName,
  formatServicePackageMoney,
} from './servicePackages';
