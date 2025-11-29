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
    const { name, value } = e.target;
    setEditProfile({ ...editProfile, [name]: value });
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
        console.log("[FicheConciergerie] Upload du nouvel avatar...");
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

      // Rafraîchir la session NextAuth
      console.log('[FicheConciergerie] 🔄 Updating session with avatar:', avatarUrl);
      await update({
        user: {
          avatar_url: avatarUrl,
          firstName: editProfile.first_name,
          lastName: editProfile.last_name,
          name: `${editProfile.first_name} ${editProfile.last_name}`.trim(),
        },
      });

      console.log("[FicheConciergerie] ✅ Session updated");
      console.log("[FicheConciergerie] Profil et session mis à jour:", updatedProfile);
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

  if (errorMsg && !profile) {
    return <div className={styles.errorMsg}>{errorMsg}</div>;
  }

  if (!profile || !editProfile) {
    return <div className={styles.loading}>Chargement du profil...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Fiche utilisateur & informations</h1>
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
        {renderField("Nom d'utilisateur", "username", false, true)}
        {renderField("Prénom", "first_name", false, true)}
        {renderField("Nom", "last_name", false, true)}
        {renderField("Email", "email", false, true)}
        {renderField("Téléphone", "phone")}
        {renderField("Catégorie", "category")}
        {renderField("Emplacement", "location")}
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
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>Date de création :</label>
          <span className={styles.fieldValue}>
            {new Date(profile.created_at).toLocaleDateString("fr-FR")}
          </span>
        </div>
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
}
