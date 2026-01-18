"use client";

import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./ConciergeProfilePage.module.scss";

import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
import InputWithValidation from "@/app/components/ui/InputWithValidation/InputWithValidation";
import {
  CONCIERGE_TABS,
  ConciergeTabId,
} from "@/app/components/dashboard/concierge/conciergeTabsConfig";
import ProfileSummary from "@/app/components/dashboard/concierge/ProfileSummary/ProfileSummary";
import MissionDetails from "@/app/components/dashboard/concierge/MissionDetails/MissionDetails";
import SocialLinksManager from "@/app/components/dashboard/SocialLinksManager/SocialLinksManager";
import MissionZoneAvailability from "@/app/components/missions/MissionZoneAvailability";
import type { MissionAvailability } from "@/app/components/missions/types";

import {
  FiBarChart,
  FiBriefcase,
  FiMapPin as FiMapPinOutline,
  FiShield as FiShieldOutline,
  FiGlobe,
  FiTarget,
  FiClock as FiClockOutline,
  FiDollarSign as FiDollarSignOutline,
  FiUsers,
  FiFile,
  FiStar as FiStarOutline,
  FiCheckCircle as FiCheckCircleOutline,
  FiSliders,
  FiTrendingUp,
} from "react-icons/fi";

import {
  User as LucideUser,
  Shield,
  DollarSign,
  ChevronDown,
  Save,
  X as LucideX,
  Edit2,
  MapPin,
  Phone as LucidePhone,
  Mail as LucideMail,
  Star,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const DEFAULT_AVATAR = "/icons/account-svgrepo-com.svg";

type TabId = ConciergeTabId;

export interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  additional_info: string | null;
  category: string;
  created_at: string;
  location: string | null;
  option: string | null;
  search_target: string | null;
  role: string | null;
  travel_fee: number | null;
  avatar_scale: number | null;
  avatar_offset_x?: number | null;
  avatar_offset_y?: number | null;
  avatar_rotation?: number | null;
  company_name: string | null;
  legal_form: string | null;
  siret: string | null;
  siren: string | null;
  vat_number: string | null;
  street_address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
  insurance_number: string | null;
  insurance_company: string | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  certifications: string | null;
  mission_settings: string | null;
  years_experience: number | null;
  experience_level: "debutant" | "intermediaire" | "experimente" | null;
  iban: string | null;
  bic: string | null;
}

const formatExperienceLabel = (
  level: "debutant" | "intermediaire" | "experimente" | null,
): string => {
  switch (level) {
    case "debutant":
      return "Débutant";
    case "intermediaire":
      return "Petite expérience";
    case "experimente":
      return "Expérimenté";
    default:
      return "Non renseigné";
  }
};

const normalizeSectionId = (title: string) =>
  title.replace(/[^a-zA-Z0-9]/g, "_");

export default function ConciergeProfilePage() {
  const { update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Extraire le tab de manière stable avec useMemo
  const tabFromUrl = useMemo(() => {
    const tab = searchParams.get("tab") as TabId;
    return CONCIERGE_TABS.some((t) => t.id === tab) ? tab : "fiche";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [normalizeSectionId("Informations personnelles")]: true,
    [normalizeSectionId("Services & Zone d'intervention")]: true,
    [normalizeSectionId("Ma grille tarifaire")]: true,
  });

  // const isEditing = editingSection !== null;

  // ✅ Synchroniser activeTab avec l'URL
  useEffect(() => {
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

  // ✅ Charger le profil une seule fois au montage
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profiles/current");
        const data: Profile | { error: string } = await response.json();

        if (!isMounted) return;

        if ("error" in data) {
          throw new Error(data.error);
        }

        if (data.avatar_url && data.avatar_url.includes("/avatars//")) {
          data.avatar_url = data.avatar_url.replace(
            "/avatars/avatars/",
            "/avatars/",
          );
        }

        setProfile(data);
        setEditProfile(data);
      } catch (error: unknown) {
        if (!isMounted) return;

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        console.error(
          "[ConciergeProfilePage] Erreur lors du chargement du profil:",
          errorMessage,
        );
        setErrorMsg(errorMessage);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!editProfile) return;

    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setEditProfile((prev) =>
        prev ? { ...prev, [name]: checked } : prev,
      );
      return;
    }

    // ✅ Correction: utiliser value au lieu de checked
    setEditProfile((prev) =>
      prev ? { ...prev, [name]: value } : prev,
    );

    let errorMessage = "";

    if (name === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      errorMessage = emailRegex.test(value) ? "" : "Email invalide";
    }

    if (name === "phone" && value) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      errorMessage = phoneRegex.test(value) ? "" : "Téléphone invalide";
    }

    if (name === "siret" && value) {
      const siretRegex = /^[0-9]{14}$/;
      errorMessage = siretRegex.test(value.replace(/\s/g, ""))
        ? ""
        : "SIRET invalide (14 chiffres)";
    }

    if (name === "siren" && value) {
      const sirenRegex = /^[0-9]{9}$/;
      errorMessage = sirenRegex.test(value.replace(/\s/g, ""))
        ? ""
        : "SIREN invalide (9 chiffres)";
    }

    if (name === "postal_code" && value) {
      const postalRegex = /^[0-9]{5}$/;
      errorMessage = postalRegex.test(value)
        ? ""
        : "Code postal invalide (5 chiffres)";
    }

    if (name === "website" && value) {
      const urlRegex =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w .-]*)*\/?$/;
      errorMessage = urlRegex.test(value) ? "" : "URL invalide";
    }

    if (name === "iban" && value) {
      const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
      errorMessage = ibanRegex.test(value.replace(/\s/g, ""))
        ? ""
        : "IBAN invalide";
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: errorMessage }));
  };

  const handleAvatarUpload = async (file: File): Promise<string | null> => {
    if (!editProfile) return null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", editProfile.id);

      const response = await fetch("/api/profiles/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      return result.url as string;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur d'upload";
      console.error(
        "[ConciergeProfilePage] Erreur upload avatar:",
        errorMessage,
      );
      throw error;
    }
  };

  const handleSaveSection = async (sectionTitle: string) => {
    if (!editProfile) return;

    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      alert("⚠️ Veuillez corriger les erreurs avant de sauvegarder.");
      return;
    }

    setLoading(true);
    let avatarUrl = editProfile.avatar_url;

    try {
      if (avatarFile && sectionTitle === "Photo de profil") {
        avatarUrl = await handleAvatarUpload(avatarFile);
      }

      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editProfile,
          avatar_url: avatarUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
      }

      const updatedProfile: Profile = result;
      setProfile(updatedProfile);
      setEditProfile(updatedProfile);
      setEditingSection(null);
      setAvatarFile(null);

      setSuccessMsg(`✅ ${sectionTitle} mis à jour avec succès`);

      await update({
        user: {
          avatar_url: avatarUrl,
          firstName: editProfile.first_name,
          lastName: editProfile.last_name,
          name: `${editProfile.first_name} ${editProfile.last_name}`.trim(),
        },
      });

      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("[ConciergeProfilePage] Erreur sauvegarde:", errorMessage);
      setErrorMsg(errorMessage);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const renderField = (
    label: string,
    name: keyof Profile | "service_area" | "service_radius_km",
    sectionId: string,
    isTextarea: boolean = false,
    required: boolean = false,
    placeholder: string = "",
    type: string = "text",
    inputProps?: Record<string, number | string>,
  ) => {
    const isThisSectionEditing = editingSection === sectionId;
    // @ts-expect-error champs étendus pour l'onglet équipe
    const value = editProfile?.[name] ?? "";
    const error = errors[name as string];

    if (type === "checkbox") {
      return (
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            <input
              type="checkbox"
              name={name.toString()}
              checked={!!value}
              onChange={handleChange}
              disabled={!isThisSectionEditing}
              className={styles.checkbox}
            />
            {label}
          </label>
        </div>
      );
    }

    return (
      <div className={styles.fieldRow}>
        <label htmlFor={name.toString()} className={styles.fieldLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
        {isThisSectionEditing ? (
          isTextarea ? (
            <textarea
              id={name.toString()}
              name={name.toString()}
              value={value as string}
              onChange={handleChange}
              className={styles.fieldTextarea}
              placeholder={placeholder || label}
              rows={3}
            />
          ) : (
            <InputWithValidation
              id={name.toString()}
              name={name.toString()}
              type={type}
              value={value as string}
              onChange={handleChange}
              placeholder={placeholder || label}
              error={error || ""}
              isValid={!error && !!value}
              {...inputProps}
            />
          )
        ) : (
          <span className={styles.fieldValue}>
            {value !== null && value !== "" ? value : "—"}
          </span>
        )}
      </div>
    );
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode,
    canEdit: boolean = true,
  ) => {
    const sectionId = normalizeSectionId(title);
    const isOpen = openSections[sectionId] ?? false;
    const isEditingThis = editingSection === sectionId;

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div
            className={styles.sectionTitleWrapper}
            onClick={() => toggleSection(sectionId)}
            role="button"
            tabIndex={0}
          >
            <div className={styles.sectionTitleLeft}>
              <span className={styles.sectionIcon}>{icon}</span>
              <h2 className={styles.sectionTitle}>{title}</h2>
            </div>
            <ChevronDown
              size={16}
              className={`${styles.toggleIcon} ${isOpen ? styles.toggleIconOpen : ""
                }`}
            />
          </div>

          {canEdit && (
            <div className={styles.sectionActions}>
              {isEditingThis ? (
                <>
                  <button
                    onClick={() => handleSaveSection(title)}
                    className={styles.saveBtn}
                    disabled={loading}
                    title="Sauvegarder"
                    aria-label="Sauvegarder"
                  >
                    {loading ? (
                      <div className={styles.spinnerMini} />
                    ) : (
                      <Save size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSection(null);
                      setEditProfile(profile);
                      setErrors({});
                    }}
                    className={styles.cancelBtn}
                    title="Annuler"
                    aria-label="Annuler"
                  >
                    <LucideX size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditingSection(sectionId);
                    if (!isOpen) toggleSection(sectionId);
                  }}
                  className={styles.editBtn}
                  title="Modifier"
                  aria-label="Modifier"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        <div
          className={`${styles.sectionContent} ${isOpen ? styles.sectionContentOpen : ""
            }`}
        >
          {children}
        </div>
      </div>
    );
  };

  const handleSocialChange = (field: string, value: string) => {
    setEditProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleCancelEditing = () => {
    setEditingSection(null);
    setEditProfile(profile);
    setErrors({});
    setAvatarFile(null);
  };

  const renderTabContent = () => {
    if (!profile || !editProfile) return null;

    switch (activeTab) {
      case "fiche":
        return (
          <div className={styles.grid}>
            <aside className={styles.leftColumn}>
              <div className={styles.profileCard}>
                <div className={styles.avatarWrapper}>
                  <AvatarUpload
                    value={avatarFile}
                    existingUrl={editProfile.avatar_url || DEFAULT_AVATAR}
                    existingScale={editProfile.avatar_scale ?? 1}
                    existingOffsetX={editProfile.avatar_offset_x ?? 0}
                    existingOffsetY={editProfile.avatar_offset_y ?? 0}
                    existingRotation={editProfile.avatar_rotation ?? 0}
                    isEditing={editingSection === "Photo_de_profil"}
                    onChange={setAvatarFile}
                    onScaleChange={(scale) =>
                      setEditProfile((prev) =>
                        prev ? { ...prev, avatar_scale: scale } : prev,
                      )
                    }
                    onOffsetChange={(offsetX, offsetY) =>
                      setEditProfile((prev) =>
                        prev
                          ? {
                            ...prev,
                            avatar_offset_x: offsetX,
                            avatar_offset_y: offsetY,
                          }
                          : prev,
                      )
                    }
                    onRotationChange={(rotation) =>
                      setEditProfile((prev) =>
                        prev ? { ...prev, avatar_rotation: rotation } : prev,
                      )
                    }
                    onSave={() => handleSaveSection("Photo de profil")}
                    onRemove={() => {
                      setAvatarFile(null);
                      setEditProfile((prev) =>
                        prev
                          ? {
                            ...prev,
                            avatar_url: null,
                            avatar_scale: 1,
                            avatar_offset_x: 0,
                            avatar_offset_y: 0,
                            avatar_rotation: 0,
                          }
                          : prev,
                      );
                    }}
                  />
                </div>

                <div className={styles.profileIdentity}>
                  <h2 className={styles.profileName}>
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <p className={styles.profileLocation}>
                    <MapPin size={14} />
                    <span>{profile.city || "Ville non renseignée"}, FR</span>
                  </p>
                </div>

                <div className={styles.avatarActions}>
                  {editingSection !== "Photo_de_profil" ? (
                    <button
                      onClick={() => setEditingSection("Photo_de_profil")}
                      className={styles.editLink}
                    >
                      Changer la photo
                    </button>
                  ) : (
                    <button
                      onClick={handleCancelEditing}
                      className={styles.cancelLink}
                    >
                      Annuler
                    </button>
                  )}
                </div>

                <div className={styles.profileStats}>
                  <div className={styles.profileStatItem}>
                    <p className={styles.profileStatLabel}>Note</p>
                    <p className={styles.profileStatValue}>
                      4.9
                      <Star size={14} className={styles.profileStatIconStar} />
                    </p>
                  </div>
                  <div className={styles.profileStatItem}>
                    <p className={styles.profileStatLabel}>Expérience</p>
                    <p className={styles.profileStatValue}>
                      {profile.years_experience ?? "—"} ans
                    </p>
                  </div>
                </div>

                <div className={styles.profileContacts}>
                  <div className={styles.profileContactItem}>
                    <LucideMail size={14} />
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className={styles.profileContactItem}>
                      <LucidePhone size={14} />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.badgeCard}>
                <h4 className={styles.badgeTitle}>
                  <Shield size={16} />
                  <span>Badge Vérifié</span>
                </h4>
                <p className={styles.badgeText}>
                  Votre profil a été certifié par nos équipes. Vous profitez
                  d&apos;une visibilité prioritaire sur les recherches de
                  clients Premium.
                </p>
              </div>

              <div className={styles.section}>
                <h2
                  className={`${styles.sectionTitleToggle} ${styles.sectionTitleToggleActive}`}
                >
                  <div className={styles.sectionTitleLeft}>
                    <span className={styles.sectionIcon}>
                      <FiBarChart />
                    </span>
                    <h2>Résumé du profil</h2>
                  </div>
                </h2>
                <div
                  className={`${styles.sectionContent} ${styles.sectionContentOpen}`}
                >
                  <ProfileSummary profile={profile} />
                </div>
              </div>
            </aside>

            <section className={styles.rightColumn}>
              {renderSection(
                "Informations personnelles",
                <LucideUser />,
                <>
                  <div className={styles.fieldsGrid}>
                    {renderField("Nom d'utilisateur", "username", "Informations_personnelles", true)}
                    {renderField("Prénom", "first_name", "Informations_personnelles", true)}
                    {renderField("Nom", "last_name", "Informations_personnelles", true)}
                    {renderField(
                      "Email",
                      "email",
                      "Informations_personnelles",
                      false,
                      true,
                      "email@exemple.com",
                      "email",
                    )}
                    {renderField(
                      "Téléphone",
                      "phone",
                      "Informations_personnelles",
                      false,
                      true,
                      "+33 6 12 34 56 78",
                      "tel",
                    )}
                  </div>

                  <div className={styles.fieldRow}>
                    <label
                      htmlFor="experience_level"
                      className={styles.fieldLabel}
                    >
                      Niveau d&apos;expérience
                    </label>
                    {editingSection === "Informations_personnelles" ? (
                      <select
                        id="experience_level"
                        name="experience_level"
                        value={editProfile.experience_level ?? ""}
                        onChange={(e) => {
                          const value = e.target.value as
                            | ""
                            | "debutant"
                            | "intermediaire"
                            | "experimente";
                          setEditProfile((prev) =>
                            prev
                              ? {
                                ...prev,
                                experience_level: value === "" ? null : value,
                              }
                              : prev,
                          );
                        }}
                        className={styles.fieldSelect}
                      >
                        <option value="">Sélectionner un niveau</option>
                        <option value="debutant">
                          Débutant (moins de 6 mois)
                        </option>
                        <option value="intermediaire">
                          Intermédiaire (6 mois à 3 ans)
                        </option>
                        <option value="experimente">
                          Expérimenté (plus de 3 ans)
                        </option>
                      </select>
                    ) : (
                      <span className={styles.fieldValue}>
                        {formatExperienceLabel(editProfile.experience_level)}
                      </span>
                    )}
                  </div>

                  {renderField(
                    "Années d'expérience",
                    "years_experience",
                    "Informations_personnelles",
                    false,
                    false,
                    "Nombre d'années",
                    "number",
                    { min: "0", max: "50" },
                  )}
                </>,
              )}

              {renderSection(
                "Informations entreprise",
                <FiBriefcase />,
                <>
                  {renderField(
                    "Nom commercial",
                    "company_name",
                    "Informations_entreprise",
                    false,
                    true,
                    "Ma Conciergerie",
                  )}
                  {renderField(
                    "Forme juridique",
                    "legal_form",
                    "Informations_entreprise",
                    false,
                    false,
                    "Auto-entrepreneur, SAS, SARL...",
                  )}
                  {renderField(
                    "SIREN",
                    "siren",
                    "Informations_entreprise",
                    false,
                    true,
                    "123 456 789 (9 chiffres)",
                  )}
                  {renderField(
                    "SIRET",
                    "siret",
                    "Informations_entreprise",
                    false,
                    true,
                    "123 456 789 00012 (14 chiffres)",
                  )}
                  {renderField(
                    "N° TVA intracommunautaire",
                    "vat_number",
                    "Informations_entreprise",
                    false,
                    false,
                    "FR 12 123456789",
                  )}
                </>,
              )}

              {renderSection(
                "Adresse professionnelle",
                <FiMapPinOutline />,
                <>
                  {renderField(
                    "Adresse",
                    "street_address",
                    "Adresse_professionnelle",
                    false,
                    true,
                    "12 Rue de la République",
                  )}
                  {renderField(
                    "Code postal",
                    "postal_code",
                    "Adresse_professionnelle",
                    false,
                    true,
                    "75001",
                  )}
                  {renderField("Ville", "city", "Adresse_professionnelle", false, true, "Paris")}
                  {renderField("Pays", "country", "Adresse_professionnelle", false, false, "France")}
                </>,
              )}

              {renderSection(
                "Assurance & Certifications",
                <FiShieldOutline />,
                <>
                  {renderField(
                    "Compagnie d'assurance",
                    "insurance_company",
                    "Assurance___Certifications",
                    false,
                    false,
                    "AXA, Allianz...",
                  )}
                  {renderField(
                    "N° contrat RC Pro",
                    "insurance_number",
                    "Assurance___Certifications",
                    false,
                    false,
                    "RC123456789",
                  )}
                  {renderField(
                    "Certifications",
                    "certifications",
                    "Assurance___Certifications",
                    true,
                    false,
                    "Qualité, Labels...",
                  )}
                </>,
              )}

              {renderSection(
                "Web & Réseaux sociaux",
                <FiGlobe />,
                <SocialLinksManager
                  website={editProfile.website}
                  linkedin={editProfile.linkedin}
                  instagram={editProfile.instagram}
                  facebook={editProfile.facebook}
                  isEditing={editingSection === "Web___R_seaux_sociaux"}
                  onEdit={() => setEditingSection("Web___R_seaux_sociaux")}
                  onChange={handleSocialChange}
                  errors={{
                    website: errors.website,
                    linkedin: errors.linkedin,
                    instagram: errors.instagram,
                    facebook: errors.facebook,
                  }}
                />,
              )}
            </section>
          </div>
        );

      case "missions":
        return (
          <>
            {renderSection(
              "Services proposés",
              <FiTarget />,
              <MissionDetails
                profile={editProfile as Profile}
                isEditing={editingSection === "Services_propos_s"}
                onChangeField={(name, value) =>
                  setEditProfile((prev) =>
                    prev ? { ...prev, [name]: value } : prev,
                  )
                }
                onChangeOption={(selected) =>
                  setEditProfile((prev) =>
                    prev
                      ? { ...prev, option: JSON.stringify(selected) }
                      : prev,
                  )
                }
              />,
            )}

            {renderSection(
              "Zone, disponibilités & règles de mission",
              <FiMapPinOutline />,
              <MissionZoneAvailability
                value={
                  editProfile.mission_settings
                    ? (JSON.parse(
                      editProfile.mission_settings,
                    ) as MissionAvailability)
                    : null
                }
                isEditing={editingSection === "Zone__disponibilit_s___r_gles_de_mission"}
                onChange={(data) =>
                  setEditProfile((prev) =>
                    prev
                      ? {
                        ...prev,
                        mission_settings: JSON.stringify(data),
                      }
                      : prev,
                  )
                }
              />,
            )}

            {renderSection(
              "Règles d'acceptation des missions",
              <FiSliders />,
              <div className={styles.placeholderContent}>
                <p>
                  Définissez les conditions d&apos;acceptation automatique ou
                  manuelle des missions.
                </p>
                <ul>
                  <li>• Refuser automatiquement hors zone</li>
                  <li>• Refuser hors horaires définis</li>
                  <li>• Accepter automatiquement les missions urgentes</li>
                  <li>• Prioriser les clients récurrents</li>
                </ul>
              </div>,
              false,
            )}

            {renderSection(
              "Priorité & typologie des missions",
              <FiStarOutline />,
              <div className={styles.placeholderContent}>
                <p>
                  Classez vos missions par niveau de priorité afin d&apos;optimiser
                  votre organisation.
                </p>
                <p>
                  Chaque type de mission pourra être associé à un niveau de
                  priorité et à un mode d&apos;acceptation.
                </p>
              </div>,
              false,
            )}

            {renderSection(
              "Missions en cours",
              <FiClockOutline />,
              <div className={styles.placeholderContent}>
                <p>Aucune mission en cours</p>
                <p>
                  Les missions actives apparaîtront ici avec leur statut, le
                  logement concerné et le client.
                </p>
              </div>,
              false,
            )}

            {renderSection(
              "Historique des missions",
              <FiCheckCircleOutline />,
              <div className={styles.placeholderContent}>
                <p>Aucune mission terminée</p>
                <p>
                  Vous retrouverez ici l&apos;historique de vos interventions,
                  factures et évaluations clients.
                </p>
              </div>,
              false,
            )}

            {renderSection(
              "Indicateurs de performance",
              <FiTrendingUp />,
              <div className={styles.placeholderContent}>
                <p>Ces indicateurs seront calculés automatiquement :</p>
                <ul>
                  <li>• Taux d&apos;acceptation des missions</li>
                  <li>• Délai moyen d&apos;intervention</li>
                  <li>• Nombre de missions ce mois-ci</li>
                  <li>• Note moyenne des clients</li>
                </ul>
              </div>,
              false,
            )}

            {renderSection(
              "Règles d'acceptation des missions",
              <FiSliders />,
              <div className={styles.placeholderContent}>
                <p>
                  Définissez les conditions d&apos;acceptation automatique ou
                  manuelle des missions.
                </p>
                <ul>
                  <li>• Refuser automatiquement hors zone</li>
                  <li>• Refuser hors horaires définis</li>
                  <li>• Accepter automatiquement les missions urgentes</li>
                  <li>• Prioriser les clients récurrents</li>
                </ul>
              </div>,
            )}

            {renderSection(
              "Priorité & typologie des missions",
              <FiStarOutline />,
              <div className={styles.placeholderContent}>
                <p>
                  Classez vos missions par niveau de priorité afin d&apos;optimiser
                  votre organisation.
                </p>
                <p>
                  Chaque type de mission pourra être associé à un niveau de
                  priorité et à un mode d&apos;acceptation.
                </p>
              </div>,
            )}

            {renderSection(
              "Missions en cours",
              <FiClockOutline />,
              <div className={styles.placeholderContent}>
                <p>Aucune mission en cours</p>
                <p>
                  Les missions actives apparaîtront ici avec leur statut, le
                  logement concerné et le client.
                </p>
              </div>,
            )}

            {renderSection(
              "Historique des missions",
              <FiCheckCircleOutline />,
              <div className={styles.placeholderContent}>
                <p>Aucune mission terminée</p>
                <p>
                  Vous retrouverez ici l&apos;historique de vos interventions,
                  factures et évaluations clients.
                </p>
              </div>,
            )}

            {renderSection(
              "Indicateurs de performance",
              <FiTrendingUp />,
              <div className={styles.placeholderContent}>
                <p>Ces indicateurs seront calculés automatiquement :</p>
                <ul>
                  <li>• Taux d&apos;acceptation des missions</li>
                  <li>• Délai moyen d&apos;intervention</li>
                  <li>• Nombre de missions ce mois-ci</li>
                  <li>• Note moyenne des clients</li>
                </ul>
              </div>,
            )}

            {renderSection(
              "Règles d'acceptation des missions",
              <FiSliders />,
              <div className={styles.placeholderContent}>
                <p>
                  Définissez les conditions d&apos;acceptation automatique ou
                  manuelle des missions.
                </p>
                <ul>
                  <li>• Refuser automatiquement hors zone</li>
                  <li>• Refuser hors horaires définis</li>
                  <li>• Accepter automatiquement les missions urgentes</li>
                  <li>• Prioriser les clients récurrents</li>
                </ul>
              </div>,
            )}

            {renderSection(
              "Priorité & typologie des missions",
              <FiStarOutline />,
              <div className={styles.placeholderContent}>
                <p>
                  Classez vos missions par niveau de priorité afin d&apos;optimiser
                  votre organisation.
                </p>
                <p>
                  Chaque type de mission pourra être associé à un niveau de
                  priorité et à un mode d&apos;acceptation.
                </p>
              </div>,
            )}

            {renderSection(
              "Missions en cours",
              <FiClockOutline />,
              <div className={styles.placeholderContent}>
                <p>Aucune mission en cours</p>
                <p>
                  Les missions actives apparaîtront ici avec leur statut, le
                  logement concerné et le client.
                </p>
              </div>,
            )}

            {renderSection(
              "Historique des missions",
              <FiCheckCircleOutline />,
              <div className={styles.placeholderContent}>
                <p>Aucune mission terminée</p>
                <p>
                  Vous retrouverez ici l&apos;historique de vos interventions,
                  factures et évaluations clients.
                </p>
              </div>,
            )}

            {renderSection(
              "Indicateurs de performance",
              <FiTrendingUp />,
              <div className={styles.placeholderContent}>
                <p>Ces indicateurs seront calculés automatiquement :</p>
                <ul>
                  <li>• Taux d&apos;acceptation des missions</li>
                  <li>• Délai moyen d&apos;intervention</li>
                  <li>• Nombre de missions ce mois-ci</li>
                  <li>• Note moyenne des clients</li>
                </ul>
              </div>,
            )}
          </>
        );
      case "tarifs":
        return (
          <div className={styles.financeGrid}>
            <div className={styles.financeCard}>
              {renderSection(
                "Ma grille tarifaire",
                <FiDollarSignOutline />,
                <>
                  <div className={styles.pricingQuickStats}>
                    <h4>📊 Mes tarifs les plus demandés</h4>
                    <ul>
                      <li>💼 Tarif horaire standard : 45 €/h</li>
                      <li>🏠 Forfait ménage 2 pièces : 60 €</li>
                      <li>🚗 Frais déplacement moyen : 15 €</li>
                    </ul>
                  </div>
                </>,
              )}
            </div>

            <div className={styles.financeCard}>
              {renderSection(
                "Tarifs par défaut",
                <DollarSign />,
                <>
                  {renderField(
                    "Tarif horaire (€/h)",
                    "hourly_rate",
                    "Tarifs_par_defaut",
                    false,
                    true,
                    "45",
                    "number",
                  )}
                  {renderField(
                    "Forfait mensuel (€)",
                    "monthly_rate",
                    "Tarifs_par_defaut",
                    false,
                    false,
                    "1500",
                    "number",
                  )}
                  {renderField(
                    "Frais de déplacement (€)",
                    "travel_fee",
                    "Tarifs_par_defaut",
                    false,
                    false,
                    "15",
                    "number",
                  )}
                </>,
              )}
            </div>
          </div>
        );

      case "equipe":
        return (
          <>
            {renderSection(
              "Mon équipe",
              <FiUsers />,
              <div className={styles.placeholderContent}>
                <p>Section en cours de développement</p>
                <p>Gérez votre équipe et vos collaborateurs ici.</p>
              </div>,
            )}

            {renderSection(
              "Zones d'intervention",
              <FiMapPinOutline />,
              <>
                {renderField(
                  "Zone d'intervention",
                  "service_area",
                  "Zones_d_intervention",
                  false,
                  false,
                  "Paris et Île-de-France",
                )}
                {renderField(
                  "Rayon d'intervention (km)",
                  "service_radius_km",
                  "Zones_d_intervention",
                  false,
                  false,
                  "30",
                  "number",
                )}
              </>,
            )}
          </>
        );

      case "documents":
        return (
          <>
            {renderSection(
              "Documents professionnels",
              <FiFile />,
              <div className={styles.placeholderContent}>
                <p>Section en cours de développement</p>
                <p>
                  Gérez vos documents professionnels (kbis, assurances, etc.).
                </p>
              </div>,
            )}

            {renderSection(
              "Avis clients",
              <FiStarOutline />,
              <div className={styles.placeholderContent}>
                <p>Section en cours de développement</p>
                <p>Consultez les avis de vos clients ici.</p>
              </div>,
            )}
          </>
        );

      default:
        return null;
    }
  };

  if (errorMsg && !profile) {
    return <div className={styles.errorMsg}>{errorMsg}</div>;
  }

  if (!profile || !editProfile) {
    return <div className={styles.loading}>Chargement du profil...</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.logo}>
            <Shield size={22} />
          </div>
          <h1 className={styles.pageTitle}>Espace Concierge</h1>
        </div>

        {/* <div className={styles.pageHeaderRight}>
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => handleSaveSection("Profil complet")}
                disabled={loading}
                className={styles.saveButton}
              >
                {loading ? (
                  <span className={styles.saveSpinner} />
                ) : (
                  <Save size={16} />
                )}
                <span>Sauvegarder</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEditing}
                disabled={loading}
                className={styles.cancelButton}
              >
                <LucideX size={16} />
                <span>Annuler</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditingSection("general")}
              className={styles.editButton}
            >
              <Edit2 size={16} />
              <span>Modifier le profil</span>
            </button>
          )}
        </div> */}
      </header>

      <main className={styles.main}>
        {successMsg && (
          <div
            className={`${styles.notification} ${styles.notificationSuccess}`}
          >
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div
            className={`${styles.notification} ${styles.notificationError}`}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className={styles.tabs}>
          {CONCIERGE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""
                  }`}
              >
                <span className={styles.tabIcon}>
                  <Icon />
                </span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.tabContent}>{renderTabContent()}</div>
      </main>
    </div>
  );
}
