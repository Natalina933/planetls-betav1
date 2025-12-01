'use client';
import React, { useState, useEffect, ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import styles from "./FicheConciergerie.module.scss";
import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
import InputWithValidation from "@/app/components/ui/InputWithValidation/InputWithValidation";
import ServiceCheckboxGroup from "@/app/components/ui/ServiceCheckboxGroup/ServiceCheckboxGroup";

const DEFAULT_AVATAR = "/icons/account-svgrepo-com.svg";

interface Profile {
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
  avatar_scale: number | null;
  
  // ✨ NOUVEAUX CHAMPS PROFESSIONNELS
  company_name: string | null;           // Nom commercial
  legal_form: string | null;             // Forme juridique (Auto-entrepreneur, SAS, SARL, etc.)
  siret: string | null;                  // Numéro SIRET (14 chiffres)
  siren: string | null;                  // Numéro SIREN (9 chiffres)
  vat_number: string | null;             // Numéro TVA intracommunautaire
  
  // Adresse professionnelle complète
  street_address: string | null;         // Numéro et rue
  postal_code: string | null;            // Code postal
  city: string | null;                   // Ville
  country: string | null;                // Pays (défaut: France)
  
  // Informations complémentaires
  website: string | null;                // Site web
  linkedin: string | null;               // Profil LinkedIn
  insurance_number: string | null;       // Numéro assurance RC Pro
  insurance_company: string | null;      // Compagnie d'assurance
  
  // Zone d'intervention
  service_area: string | null;           // Zone géographique (ex: "Paris et Île-de-France")
  service_radius_km: number | null;      // Rayon d'intervention en km
  
  // Tarification
  hourly_rate: number | null;            // Tarif horaire
  monthly_rate: number | null;           // Forfait mensuel
  
  // Disponibilité
  availability_hours: string | null;     // Horaires (ex: "Lun-Ven 8h-20h")
  emergency_service: boolean;            // Service d'urgence 24/7
  
  // Certifications & Labels
  certifications: string | null;         // Certifications (séparées par virgules)
  years_experience: number | null;       // Années d'expérience
  
  // Banking (optionnel)
  iban: string | null;                   // IBAN pour paiements
  bic: string | null;                    // BIC/SWIFT
}

export default function FicheConciergerie() {
  const { update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profiles/current");
        const data: Profile | { error: string } = await response.json();
        if ("error" in data) {
          throw new Error(data.error);
        }
        if (data.avatar_url && data.avatar_url.includes('/avatars/avatars/')) {
          data.avatar_url = data.avatar_url.replace('/avatars/avatars/', '/avatars/');
        }
        setProfile(data);
        setEditProfile(data);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("[FicheConciergerie] Erreur lors du chargement du profil:", errorMessage);
        setErrorMsg(errorMessage);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editProfile) return;
    const { name, value, type } = e.target;
    
    // Gestion des checkboxes
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditProfile({ ...editProfile, [name]: checked });
      return;
    }
    
    setEditProfile({ ...editProfile, [name]: value });
    
    // Validation
    let errorMessage = "";
    
    // Email
    if (name === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      errorMessage = emailRegex.test(value) ? "" : "Email invalide";
    }
    
    // Téléphone
    if (name === "phone" && value) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      errorMessage = phoneRegex.test(value) ? "" : "Téléphone invalide";
    }
    
    // SIRET (14 chiffres)
    if (name === "siret" && value) {
      const siretRegex = /^[0-9]{14}$/;
      errorMessage = siretRegex.test(value.replace(/\s/g, '')) ? "" : "SIRET invalide (14 chiffres)";
    }
    
    // SIREN (9 chiffres)
    if (name === "siren" && value) {
      const sirenRegex = /^[0-9]{9}$/;
      errorMessage = sirenRegex.test(value.replace(/\s/g, '')) ? "" : "SIREN invalide (9 chiffres)";
    }
    
    // Code postal
    if (name === "postal_code" && value) {
      const postalRegex = /^[0-9]{5}$/;
      errorMessage = postalRegex.test(value) ? "" : "Code postal invalide (5 chiffres)";
    }
    
    // Site web
    if (name === "website" && value) {
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      errorMessage = urlRegex.test(value) ? "" : "URL invalide";
    }
    
    // IBAN
    if (name === "iban" && value) {
      const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
      errorMessage = ibanRegex.test(value.replace(/\s/g, '')) ? "" : "IBAN invalide";
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
      return result.url;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur d'upload";
      console.error("[FicheConciergerie] Erreur upload avatar:", errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("[FicheConciergerie] Erreur lors de la sauvegarde:", errorMessage);
      setErrorMsg(errorMessage);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setLoading(false);
    }
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
    const error = errors[name];
    
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

  const renderSection = (title: string, icon: string, children: React.ReactNode) => {
    return (
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>{icon}</span>
          {title}
        </h2>
        {children}
      </div>
    );
  };

  if (errorMsg && !profile) {
    return <div className={styles.errorMsg}>{errorMsg}</div>;
  }

  if (!profile || !editProfile) {
    return <div className={styles.loading}>Chargement du profil...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Fiche Conciergerie Professionnelle</h1>
      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}
      {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}
      
      <div className={styles.avatarBlock}>
        <AvatarUpload
          value={avatarFile}
          existingUrl={editProfile.avatar_url || DEFAULT_AVATAR}
          existingScale={editProfile.avatar_scale ?? 1}
          onChange={setAvatarFile}
          onScaleChange={(scale) =>
            setEditProfile((prev) => (prev ? { ...prev, avatar_scale: scale } : prev))
          }
          onSave={handleSave}
          onRemove={() => {
            setAvatarFile(null);
            setEditProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev));
          }}
        />
      </div>
      
      <div className={styles.formBlock}>
        {/* 👤 INFORMATIONS PERSONNELLES */}
        {renderSection("Informations personnelles", "👤", <>
          {renderField("Nom d'utilisateur", "username", false, true)}
          {renderField("Prénom", "first_name", false, true)}
          {renderField("Nom", "last_name", false, true)}
          {renderField("Email", "email", false, true, "email@exemple.com", "email")}
          {renderField("Téléphone", "phone", false, true, "+33 6 12 34 56 78", "tel")}
        </>)}

        {/* 🏢 INFORMATIONS ENTREPRISE */}
        {renderSection("Informations entreprise", "🏢", <>
          {renderField("Nom commercial", "company_name", false, true, "Ma Conciergerie")}
          {renderField("Forme juridique", "legal_form", false, false, "Auto-entrepreneur, SAS, SARL...")}
          {renderField("SIREN", "siren", false, true, "123 456 789 (9 chiffres)")}
          {renderField("SIRET", "siret", false, true, "123 456 789 00012 (14 chiffres)")}
          {renderField("N° TVA intracommunautaire", "vat_number", false, false, "FR 12 123456789")}
          {renderField("Années d'expérience", "years_experience", false, false, "5", "number")}
        </>)}

        {/* 📍 ADRESSE PROFESSIONNELLE */}
        {renderSection("Adresse professionnelle", "📍", <>
          {renderField("Adresse", "street_address", false, true, "12 Rue de la République")}
          {renderField("Code postal", "postal_code", false, true, "75001")}
          {renderField("Ville", "city", false, true, "Paris")}
          {renderField("Pays", "country", false, false, "France")}
        </>)}

        {/* 🎯 SERVICES & ZONE D'INTERVENTION */}
        {renderSection("Services & Zone d'intervention", "🎯", <>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Services principaux :</label>
            {isEditing ? (
              <ServiceCheckboxGroup
                selected={editProfile.option ? editProfile.option.split(",") : []}
                onChange={(selected) =>
                  setEditProfile({ ...editProfile, option: selected.join(",") })
                }
              />
            ) : (
              <span className={styles.fieldValue}>
                {profile.option
                  ? profile.option.split(",").map((s) => s.trim()).join(", ")
                  : "—"}
              </span>
            )}
          </div>
          {renderField("Zone d'intervention", "service_area", false, false, "Paris et Île-de-France")}
          {renderField("Rayon d'intervention (km)", "service_radius_km", false, false, "30", "number")}
          {renderField("Horaires de disponibilité", "availability_hours", false, false, "Lun-Ven 8h-20h")}
          {renderField("Service d'urgence 24/7", "emergency_service", false, false, "", "checkbox")}
        </>)}

        {/* 💰 TARIFICATION */}
        {renderSection("Tarification", "💰", <>
          {renderField("Tarif horaire (€)", "hourly_rate", false, false, "45", "number")}
          {renderField("Forfait mensuel (€)", "monthly_rate", false, false, "500", "number")}
        </>)}

        {/* 🛡️ ASSURANCE & CERTIFICATIONS */}
        {renderSection("Assurance & Certifications", "🛡️", <>
          {renderField("Compagnie d'assurance", "insurance_company", false, false, "AXA, Allianz...")}
          {renderField("N° contrat RC Pro", "insurance_number", false, false, "RC123456789")}
          {renderField("Certifications", "certifications", true, false, "Qualité, Labels...")}
        </>)}

        {/* 🌐 WEB & RÉSEAUX */}
        {renderSection("Web & Réseaux sociaux", "🌐", <>
          {renderField("Site web", "website", false, false, "https://mon-site.fr", "url")}
          {renderField("LinkedIn", "linkedin", false, false, "https://linkedin.com/in/...")}
        </>)}

        {/* 🏦 INFORMATIONS BANCAIRES (Optionnel) */}
        {renderSection("Informations bancaires", "🏦", <>
          {renderField("IBAN", "iban", false, false, "FR76 1234 5678 9012 3456 7890 123")}
          {renderField("BIC/SWIFT", "bic", false, false, "BNPAFRPPXXX")}
        </>)}

        {/* ℹ️ AUTRES INFORMATIONS */}
        {renderSection("Autres informations", "ℹ️", <>
          {renderField("Catégorie", "category")}
          {renderField("Emplacement", "location")}
          {renderField("Recherche cible", "search_target")}
          {renderField("À propos", "additional_info", true, false, "Présentez votre activité...")}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Date de création :</label>
            <span className={styles.fieldValue}>
              {new Date(profile.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </>)}

        {/* ACTIONS */}
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
              ✏️ Modifier le profil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}