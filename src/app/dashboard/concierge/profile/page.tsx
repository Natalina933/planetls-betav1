"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./ConciergeProfilePage.module.scss";

import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
import InputWithValidation from "@/app/components/ui/InputWithValidation/InputWithValidation";
// import PricingManagement from "@/app/components/dashboard/concierge/PricingManagement/PricingManagement";
import PricingGridManager from "@/app/components/dashboard/concierge/PricingGridManager/PricingGridManager";

import {
  CONCIERGE_TABS, ConciergeTabId,
} from "@/app/components/dashboard/concierge/conciergeTabsConfig";
import ProfileSummary from "@/app/components/dashboard/concierge/ProfileSummary/ProfileSummary";
import {
  FiBarChart, FiUser, FiBriefcase, FiMapPin, FiShield, FiGlobe, FiCreditCard, FiTarget, FiClock, FiDollarSign, FiUsers, FiFile, FiStar, FiCheckCircle, FiSliders, FiTrendingUp,
} from "react-icons/fi";
// import ProfileRegistrationDate from "@/app/components/ui/ProfileRegistrationDate/ProfileRegistrationDate";
import MissionDetails from "@/app/components/dashboard/concierge/MissionDetails/MissionDetails";

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
  insurance_number: string | null;
  insurance_company: string | null;
  service_area: string | null;
  service_radius_km: number | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  availability_hours: string | null;
  emergency_service: boolean;
  certifications: string | null;
  years_experience: number | null;
  experience_level: "debutant" | "intermediaire" | "experimente" | null;
  iban: string | null;
  bic: string | null;
}

const normalizeSectionId = (title: string) =>
  title.replace(/[^a-zA-Z0-9]/g, "_");

export default function ConciergeProfilePage() {
  const { update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get("tab") as TabId) || "fiche"
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [normalizeSectionId("Informations personnelles")]: true,
    [normalizeSectionId("Services & Zone d'intervention")]: true,
    [normalizeSectionId("Ma grille tarifaire")]: true,
  });
  const formatExperienceLabel = (
    level: "debutant" | "intermediaire" | "experimente" | null
  ) => {
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

  useEffect(() => {
    const tab = searchParams.get("tab") as TabId;
    if (tab && CONCIERGE_TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profiles/current");
        const data: Profile | { error: string } = await response.json();
        if ("error" in data) {
          throw new Error(data.error);
        }
        if (data.avatar_url && data.avatar_url.includes("/avatars//")) {
          data.avatar_url = data.avatar_url.replace(
            "/avatars/avatars/",
            "/avatars/"
          );
        }
        setProfile(data);
        setEditProfile(data);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        console.error(
          "[ConciergeProfilePage] Erreur lors du chargement du profil:",
          errorMessage
        );
        setErrorMsg(errorMessage);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editProfile) return;
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setEditProfile((prev) =>
        prev ? { ...prev, [name]: checked as unknown as unknown } : prev
      );
      return;
    }

    setEditProfile((prev) =>
      prev ? { ...prev, [name]: value as unknown as unknown } : prev
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
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
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
        errorMessage
      );
      throw error;
    }
  };

  const handleSave = async () => {
    if (!editProfile) return;
    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      alert("⚠️ Veuillez corriger les erreurs avant de sauvegarder.");
      return;
    }
    setLoading(true);
    let avatarUrl = editProfile.avatar_url;
    try {
      if (avatarFile) {
        avatarUrl = await handleAvatarUpload(avatarFile);
      }
      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editProfile, avatar_url: avatarUrl }),
      });
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      const updatedProfile = { ...editProfile, avatar_url: avatarUrl };
      setProfile(updatedProfile);
      setEditProfile(updatedProfile);
      setIsEditing(false);
      setAvatarFile(null);
      setSuccessMsg("✅ Profil mis à jour avec succès !");

      await update({
        user: {
          avatar_url: avatarUrl,
          firstName: editProfile.first_name,
          lastName: editProfile.last_name,
          name: `${editProfile.first_name} ${editProfile.last_name}`.trim(),
        },
      });

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error(
        "[ConciergeProfilePage] Erreur lors de la sauvegarde:",
        errorMessage
      );
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
    name: keyof Profile,
    isTextarea: boolean = false,
    required: boolean = false,
    placeholder: string = "",
    type: string = "text"
  ) => {
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
              disabled={!isEditing}
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
          {label} {required && <span className={styles.required}>*</span>}
        </label>
        {isEditing ? (
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
            />
          )
        ) : (
          <span className={styles.fieldValue}>{value || "—"}</span>
        )}
      </div>
    );
  };

  const renderSection = (
    title: string,
    icon: string | React.ReactNode,
    children: React.ReactNode
  ) => {
    const sectionId = normalizeSectionId(title);
    const isOpen = openSections[sectionId] ?? false;

    return (
      <div className={styles.section}>
        <h2
          className={`${styles.sectionTitleToggle} ${isOpen ? styles.sectionTitleToggleActive : ""
            }`}
          onClick={() => toggleSection(sectionId)}
        >
          <div className={styles.sectionTitleLeft}>
            <span className={styles.sectionIcon}>
              {typeof icon === "string" ? icon : icon}
            </span>
            {title}
          </div>
          <span
            className={`${styles.toggleIcon} ${isOpen ? styles.toggleIconOpen : ""
              }`}
          >
            ▼
          </span>
        </h2>
        <div
          className={`${styles.sectionContent} ${isOpen ? styles.sectionContentOpen : ""
            }`}
        >
          {children}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "fiche":
        return (
          <>
            <div className={styles.columnLeft}>
              <div className={styles.avatarBlock}>
                <AvatarUpload
                  value={avatarFile}
                  existingUrl={editProfile?.avatar_url || DEFAULT_AVATAR}
                  existingScale={editProfile?.avatar_scale ?? 1}
                  onChange={setAvatarFile}
                  onScaleChange={(scale) =>
                    setEditProfile((prev) =>
                      prev ? { ...prev, avatar_scale: scale } : prev
                    )
                  }
                  onSave={handleSave}
                  onRemove={() => {
                    setAvatarFile(null);
                    setEditProfile((prev) =>
                      prev ? { ...prev, avatar_url: null } : prev
                    );
                  }}
                />
              </div>
              {/* Résumé du profil */}
              {renderSection(
                "Résumé du profil",
                <FiBarChart />,
                <>
                  <ProfileSummary profile={profile} />
                  {/* ProfileRegistrationDate est maintenant géré dans ProfileSummary */}
                </>
              )}
            </div>


            <div className={styles.columnRight}>
              {/* Informations personnelles */}
              {renderSection("Informations personnelles",
                <FiUser />,
                <>
                  {renderField("Nom d'utilisateur", "username", false, true)}
                  {renderField("Prénom", "first_name", false, true)}
                  {renderField("Nom", "last_name", false, true)}
                  {renderField("Email", "email", false, true, "email@exemple.com", "email")}
                  {renderField("Téléphone", "phone", false, true, "+33 6 12 34 56 78", "tel")}
                </>
              )}
              {/* Informations entreprise */}
              {renderSection(
                "Informations entreprise",
                <FiBriefcase />,
                <>
                  {renderField(
                    "Nom commercial",
                    "company_name",
                    false,
                    true,
                    "Ma Conciergerie"
                  )}
                  {renderField(
                    "Forme juridique",
                    "legal_form",
                    false,
                    false,
                    "Auto-entrepreneur, SAS, SARL..."
                  )}
                  {renderField(
                    "SIREN",
                    "siren",
                    false,
                    true,
                    "123 456 789 (9 chiffres)"
                  )}
                  {renderField(
                    "SIRET",
                    "siret",
                    false,
                    true,
                    "123 456 789 00012 (14 chiffres)"
                  )}
                  {renderField(
                    "N° TVA intracommunautaire",
                    "vat_number",
                    false,
                    false,
                    "FR 12 123456789"
                  )}

                  {/* 🔹 Nouveau bloc niveau d’expérience */}
                  <div className={styles.fieldRow}>
                    <label className={styles.fieldLabel}>
                      Niveau d&apos;expérience
                    </label>
                    {isEditing ? (
                      <select
                        name="experience_level"
                        value={editProfile?.experience_level ?? ""}
                        onChange={(e) =>
                          setEditProfile((prev) =>
                            prev ? { ...prev, experience_level: e.target.value as "debutant" | "intermediaire" | "experimente" | null } : prev
                          )
                        }
                        className={styles.fieldSelect}
                      >
                        <option value="">Sélectionner un niveau</option>
                        <option value="debutant">Débutant</option>
                        <option value="intermediaire">Petite expérience</option>
                        <option value="experimente">Expérimenté</option>
                      </select>
                    ) : (
                      <span className={styles.fieldValue}>
                        {formatExperienceLabel(editProfile?.experience_level ?? null)}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Adresse professionnelle */}
              {renderSection(
                "Adresse professionnelle",
                <FiMapPin />,
                <>
                  {renderField(
                    "Adresse",
                    "street_address",
                    false,
                    true,
                    "12 Rue de la République"
                  )}
                  {renderField(
                    "Code postal",
                    "postal_code",
                    false,
                    true,
                    "75001"
                  )}
                  {renderField("Ville", "city", false, true, "Paris")}
                  {renderField("Pays", "country", false, false, "France")}
                </>
              )}
              {/* Assurance & Certifications */}
              {renderSection(
                "Assurance & Certifications",
                <FiShield />,
                <>
                  {renderField(
                    "Compagnie d'assurance",
                    "insurance_company",
                    false,
                    false,
                    "AXA, Allianz..."
                  )}
                  {renderField(
                    "N° contrat RC Pro",
                    "insurance_number",
                    false,
                    false,
                    "RC123456789"
                  )}
                  {renderField(
                    "Certifications",
                    "certifications",
                    true,
                    false,
                    "Qualité, Labels..."
                  )}
                </>
              )}
              {/* Web, Réseaux sociaux */}
              {renderSection(
                "Web & Réseaux sociaux",
                <FiGlobe />,
                <>
                  {renderField("Site web", "website", false, false, "https://mon-site.fr", "url")}
                  {renderField("LinkedIn", "linkedin", false, false, "https://linkedin.com/in/...")}
                </>
              )}
              {/* Informations bancaires */}
              {renderSection(
                "Informations bancaires",
                <FiCreditCard />,
                <>
                  {renderField("IBAN", "iban", false, false, "FR76 1234 5678 9012 3456 7890 123")}
                  {renderField("BIC/SWIFT", "bic", false, false, "BNPAFRPPXXX")}
                </>
              )}
            </div>
          </>
        );

      case "missions":
        return (
          <>
            {/* 1. SERVICES PROPOSÉS */}
            {renderSection(
              "Services proposés",
              <FiTarget />,
              <MissionDetails
                profile={editProfile as Profile}
                isEditing={isEditing}
                onChangeField={(name, value) =>
                  setEditProfile((prev) =>
                    prev ? { ...prev, [name]: value } : prev
                  )
                }
                onChangeOption={(selected) =>
                  setEditProfile((prev) =>
                    prev ? { ...prev, option: JSON.stringify(selected) } : prev
                  )
                }
              />
            )}

            {/* 2. ZONE & DISPONIBILITÉ */}
            {renderSection(
              "Zone & disponibilité",
              <FiMapPin />,
              <>
                {renderField(
                  "Zone d’intervention principale",
                  "service_area",
                  false,
                  false,
                  "Paris et Île-de-France"
                )}

                {renderField(
                  "Rayon d’intervention (km)",
                  "service_radius_km",
                  false,
                  false,
                  "30",
                  "number"
                )}

                {renderField(
                  "Heures de disponibilité",
                  "availability_hours",
                  false,
                  false,
                  "Lun–Ven 9h–18h"
                )}

                {renderField(
                  "Service d’urgence 24h/7",
                  "emergency_service",
                  false,
                  false,
                  "",
                  "checkbox"
                )}
              </>
            )}

            {/* 3. RÈGLES D’ACCEPTATION */}
            {renderSection(
              "Règles d’acceptation des missions",
              <FiSliders />,
              <div className={styles.placeholderContent}>
                <p>
                  Définissez les conditions d’acceptation automatique ou manuelle
                  des missions.
                </p>
                <ul>
                  <li>• Refuser automatiquement hors zone</li>
                  <li>• Refuser hors horaires définis</li>
                  <li>• Accepter automatiquement les missions urgentes</li>
                  <li>• Prioriser les clients récurrents</li>
                </ul>
              </div>
            )}

            {/* 4. PRIORITÉ & TYPOLOGIE */}
            {renderSection(
              "Priorité & typologie des missions",
              <FiStar />,
              <div className={styles.placeholderContent}>
                <p>
                  Classez vos missions par niveau de priorité afin d’optimiser
                  votre organisation.
                </p>
                <p>
                  Chaque type de mission pourra être associé à un niveau de priorité
                  et à un mode d’acceptation.
                </p>
              </div>
            )}

            {/* 5. MISSIONS EN COURS */}
            {renderSection(
              "Missions en cours",
              <FiClock />,
              <div className={styles.placeholderContent}>
                <p>Aucune mission en cours</p>
                <p>
                  Les missions actives apparaîtront ici avec leur statut,
                  le logement concerné et le client.
                </p>
              </div>
            )}

            {/* 6. HISTORIQUE DES MISSIONS */}
            {renderSection(
              "Historique des missions",
              <FiCheckCircle />,
              <div className={styles.placeholderContent}>
                <p>Aucune mission terminée</p>
                <p>
                  Vous retrouverez ici l’historique de vos interventions,
                  factures et évaluations clients.
                </p>
              </div>
            )}

            {/* 7. INDICATEURS CLÉS */}
            {renderSection(
              "Indicateurs de performance",
              <FiTrendingUp />,
              <div className={styles.placeholderContent}>
                <p>Ces indicateurs seront calculés automatiquement :</p>
                <ul>
                  <li>• Taux d’acceptation des missions</li>
                  <li>• Délai moyen d’intervention</li>
                  <li>• Nombre de missions ce mois-ci</li>
                  <li>• Note moyenne des clients</li>
                </ul>
              </div>
            )}
          </>
        );


case "tarifs":
  return (
    <>
      <div className={styles.tarifsWrapper} style={{ display: 'flex', gap: '2rem' }}>
        
        {/* --- GRILLE TARIFAIRE (GAUCHE) --- */}
        <div style={{ flex: 1 }}>
          {renderSection(
            "Ma grille tarifaire",
            <FiDollarSign />,
            <>
              <PricingManagement />
              <div className={styles.pricingQuickStats}>
                <h4>📊 Mes tarifs les plus demandés</h4>
                {/* Exemple de statistiques */}
                <ul>
                  <li>💼 Tarif horaire standard : 45€/h</li>
                  <li>🏠 Forfait ménage 2 pièces : 60€</li>
                  <li>🚗 Frais déplacement moyen : 15€</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* --- TARIFS PAR DÉFAUT (DROITE) --- */}
        <div style={{ flex: 1 }}>
          {renderSection(
            "Tarifs par défaut",
            <FiDollarSign />,
            <>
              {renderField(
                "Tarif horaire (€/h)",
                "hourly_rate",
                false,
                true,
                "45",
                "number"
              )}
              {renderField(
                "Forfait mensuel (€)",
                "monthly_rate",
                false,
                false,
                "1500",
                "number"
              )}
              {renderField(
                "Frais de déplacement (€)",
                "travel_fee",
                false,
                false,
                "15",
                "number"
              )}
            </>
          )}
        </div>

      </div>
    </>
  );

      case "equipe":
        return (
          <>
            {renderSection(
              "Mon équipe",
              <FiUsers />,
              <>
                <div className={styles.placeholderContent}>
                  <p>Section en cours de développement</p>
                  <p>Gérez votre équipe et vos collaborateurs ici.</p>
                </div>
              </>
            )}

            {renderSection(
              "Zones d'intervention",
              <FiMapPin />,
              <>
                {renderField(
                  "Zone d'intervention",
                  "service_area",
                  false,
                  false,
                  "Paris et Île-de-France"
                )}
                {renderField(
                  "Rayon d'intervention (km)",
                  "service_radius_km",
                  false,
                  false,
                  "30",
                  "number"
                )}
              </>
            )}
          </>
        );

      case "documents":
        return (
          <>
            {renderSection(
              "Documents professionnels",
              <FiFile />,
              <>
                <div className={styles.placeholderContent}>
                  <p>Section en cours de développement</p>
                  <p>
                    Gérez vos documents professionnels (kbis, assurances, etc.).
                  </p>
                </div>
              </>
            )}

            {renderSection(
              "Avis clients",
              <FiStar />,
              <>
                <div className={styles.placeholderContent}>
                  <p>Section en cours de développement</p>
                  <p>Consultez les avis de vos clients ici.</p>
                </div>
              </>
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
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Ma Conciergerie</h1>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}
      {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

      <div className={styles.tabsContainer}>
        {CONCIERGE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""
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

      <div className={styles.actions}>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={loading}
              className={styles.saveButton}
            >
              {loading ? "Sauvegarde..." : "💾 Sauvegarder"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditProfile(profile);
                setErrors({});
              }}
              disabled={loading}
              className={styles.cancelButton}
            >
              ❌ Annuler
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
          >
            ✏️ Modifier
          </button>
        )}
      </div>
    </div>
  );
}
