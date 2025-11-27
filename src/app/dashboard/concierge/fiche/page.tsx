"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import styles from "./FicheConciergerie.module.scss";
import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
import InputWithValidation from "@/app/components/ui/InputWithValidation/InputWithValidation";
import ServiceCheckboxGroup from "@/app/components/ui/ServiceCheckboxGroup/ServiceCheckboxGroup";

const DEFAULT_AVATAR = "/icons/account-svgrepo-com.svg";

// ===================================
// Interface du profil utilisateur
// ===================================
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
}

// ===================================
// Composant FicheConciergerie
// ===================================
export default function FicheConciergerie() {
  // États du composant
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ===================================
  // Récupération du profil au chargement
  // ===================================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profiles/current");
        const data: Profile | { error: string } = await response.json();

        if ("error" in data) {
          throw new Error(data.error);
        }

        // Correction automatique du doublon dans l'URL de l'avatar
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

  // ===================================
  // Gestion des modifications de champs
  // ===================================
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editProfile) return;

    const { name, value } = e.target;
    setEditProfile({ ...editProfile, [name]: value });

    // Validation en temps réel
    let errorMessage = "";

    if (name === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      errorMessage = emailRegex.test(value) ? "" : "Email invalide";
    }

    if (name === "phone" && value) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      errorMessage = phoneRegex.test(value) ? "" : "Téléphone invalide";
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: errorMessage }));
  };

  // ===================================
  // Upload de l'avatar via API dédiée
  // ===================================
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

      console.log("[FicheConciergerie] Avatar uploadé:", result.url);
      return result.url;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur d'upload";
      console.error("[FicheConciergerie] Erreur upload avatar:", errorMessage);
      throw error;
    }
  };

  // ===================================
  // Sauvegarde du profil
  // ===================================
  const handleSave = async () => {
    if (!editProfile) return;

    // Vérification des erreurs de validation
    const hasErrors = Object.values(errors).some((error) => error !== "");
    if (hasErrors) {
      alert("⚠️ Veuillez corriger les erreurs avant de sauvegarder.");
      return;
    }

    setLoading(true);
    let avatarUrl = editProfile.avatar_url;

    try {
      // Upload de l'avatar si un nouveau fichier a été sélectionné
      if (avatarFile) {
        console.log("[FicheConciergerie] Upload du nouvel avatar...");
        avatarUrl = await handleAvatarUpload(avatarFile);
      }

      // Mise à jour du profil dans la base de données
      const response = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editProfile, avatar_url: avatarUrl }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Mise à jour des états locaux
      const updatedProfile = { ...editProfile, avatar_url: avatarUrl };
      setProfile(updatedProfile);
      setEditProfile(updatedProfile);
      setIsEditing(false);
      setAvatarFile(null);
      setSuccessMsg("✅ Profil mis à jour avec succès !");

      console.log("[FicheConciergerie] Profil mis à jour:", updatedProfile);

      // Effacement du message de succès après 3 secondes
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

  // ===================================
  // Callback succès upload avatar
  // ===================================
  // const handleAvatarSuccess = (url: string, scale?: number) => {
  //   if (!editProfile) return;

  //   setEditProfile({
  //     ...editProfile,
  //     avatar_url: url,
  //     avatar_scale: scale ?? 1
  //   });

  //   if (profile) {
  //     setProfile({
  //       ...profile,
  //       avatar_url: url,
  //       avatar_scale: scale ?? 1
  //     });
  //   }
  // };

  // ===================================
  // Rendu d'un champ de formulaire
  // ===================================
  const renderField = (
    label: string,
    name: keyof Profile,
    isTextarea: boolean = false,
    required: boolean = false,
    placeholder: string = ""
  ) => {
    const value = editProfile?.[name] ?? "";
    const error = errors[name];

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

  // ===================================
  // Rendu du composant
  // ===================================

  // Affichage des erreurs critiques
  if (errorMsg && !profile) {
    return <div className={styles.errorMsg}>{errorMsg}</div>;
  }

  // Affichage du chargement
  if (!profile || !editProfile) {
    return <div className={styles.loading}>Chargement du profil...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Fiche utilisateur & informations</h1>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}
      {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

      {/* Section Avatar */}
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

      {/* Formulaire du profil */}
      <div className={styles.formBlock}>
        {renderField("Nom d'utilisateur", "username", false, true)}
        {renderField("Prénom", "first_name", false, true)}
        {renderField("Nom", "last_name", false, true)}
        {renderField("Email", "email", false, true)}
        {renderField("Téléphone", "phone")}
        {renderField("Catégorie", "category")}
        {renderField("Emplacement", "location")}

        {/* Services principaux */}
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

        {renderField("Recherche cible", "search_target")}
        {renderField("À propos", "additional_info", true)}

        {/* Date de création */}
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>Date de création :</label>
          <span className={styles.fieldValue}>
            {new Date(profile.created_at).toLocaleDateString("fr-FR")}
          </span>
        </div>

        {/* Boutons d'action */}
        <div className={styles.actions}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className={styles.saveButton}
              >
                {loading ? "⏳ Sauvegarde en cours..." : "💾 Sauvegarder"}
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
};