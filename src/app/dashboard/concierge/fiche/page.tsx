"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import styles from "./FicheConciergerie.module.scss";
import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
import InputWithValidation from "@/app/components/ui/InputWithValidation/InputWithValidation";
import ServiceCheckboxGroup from "@/app/components/ui/ServiceCheckboxGroup/ServiceCheckboxGroup";
import { createClient } from "@supabase/supabase-js";

// ===================================
// Initialisation Supabase
// ===================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===================================
// Typage du profil utilisateur
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
// Composant principal
// ===================================
export default function FicheConciergerie() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarKey, setAvatarKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ===================================
  // Chargement du profil
  // ===================================
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profiles/current");
        const data: Profile | { error: string } = await res.json();
        if ("error" in data) throw new Error(data.error);
        setProfile(data);
        setEditProfile(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        console.error("[Fiche] GET /profiles/current fail:", message);
        setErrorMsg(message);
      }
    })();
  }, []);

  // ===================================
  // Gestion des changements
  // ===================================
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editProfile) return;
    const { name, value } = e.target;

    setEditProfile({ ...editProfile, [name]: value });

    // Validation simple
    let error = "";
    if (name === "email" && value)
      error = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Email invalide";
    if (name === "phone" && value)
      error = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(value) ? "" : "Téléphone invalide";

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // ===================================
  // Sauvegarde profil avec upload avatar
  // ===================================
  const handleSave = async () => {
    if (!editProfile) return;
    if (Object.values(errors).some((err) => err !== "")) {
      alert("⚠️ Corrigez les erreurs avant de sauvegarder.");
      return;
    }

    setLoading(true);
    let avatar_url = editProfile.avatar_url;

    try {
      // -------------------------------
      // Upload avatar si fichier choisi
      // -------------------------------
      if (avatarFile) {
        const filePath = `user_${editProfile.id}_${Date.now()}`;
        console.log("[Avatar] Upload start:", avatarFile.name, filePath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          console.error("[Avatar] Upload FAIL:", uploadError);
          setErrorMsg("Erreur lors de l'upload de l'avatar.");
          setLoading(false);
          return;
        }

        console.log("[Avatar] Upload SUCCESS:", uploadData);

        // Récupérer l'URL publique
        const { data: publicUrlData, error: urlError } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        if (urlError) {
          console.error("[Avatar] getPublicUrl FAIL:", urlError);
          setErrorMsg("Impossible de récupérer l'URL publique de l'avatar.");
          setLoading(false);
          return;
        }

        console.log("[Avatar] Public URL:", publicUrlData.publicUrl);
        avatar_url = publicUrlData.publicUrl;
      }

      // -------------------------------
      // PATCH du profil dans DB
      // -------------------------------
      const res = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editProfile, avatar_url }),
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      setProfile({ ...editProfile, avatar_url });
      setEditProfile({ ...editProfile, avatar_url });
      setIsEditing(false);
      setAvatarFile(null);
      setSuccessMsg("✅ Profil mis à jour !");
      console.log("[Fiche] Profil mis à jour :", { ...editProfile, avatar_url });

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("[Fiche] Save fail:", message);
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // ===================================
  // Rendu des champs
  // ===================================
  const renderField = (
    label: string,
    name: keyof Profile,
    isTextarea = false,
    required = false,
    placeholder = ""
  ) => {
    const value = editProfile?.[name] ?? "";
    const error = errors[name];

    return (
      <div className={styles.fieldRow}>
        <label htmlFor={name.toString()} className={styles.fieldLabel}>
          {label} {required && "*"}
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
  // Rendu principal
  // ===================================
  if (errorMsg) return <div className={styles.errorMsg}>{errorMsg}</div>;
  if (!profile || !editProfile) return <div>Chargement du profil...</div>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Fiche utilisateur & informations</h1>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

      <div className={styles.avatarBlock}>
        <AvatarUpload
          key={avatarKey}
          value={avatarFile}
          existingUrl={editProfile.avatar_url ?? "/icons/account-svgrepo-com.svg"}
          existingScale={editProfile.avatar_scale ?? 1}
          onChange={setAvatarFile}
          onUploadSuccess={(url, scale) => {
            setEditProfile({ ...editProfile, avatar_url: url, avatar_scale: scale ?? 1 });
            setProfile({ ...profile, avatar_url: url, avatar_scale: scale ?? 1 });
            setSuccessMsg("✅ Avatar mis à jour !");
            setAvatarKey((prev) => prev + 1);
            setTimeout(() => setSuccessMsg(""), 3000);
          }}
        />
      </div>

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
          <button
            onClick={handleSave}
            disabled={loading}
            className={styles.saveButton}
          >
            {loading ? "⏳ Sauvegarde..." : "💾 Sauvegarder"}
          </button>
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
  );
}
