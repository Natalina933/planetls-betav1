"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import styles from "./FicheConciergerie.module.scss";
import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
import InputWithValidation from "@/app/components/ui/InputWithValidation/InputWithValidation";
import { createClient } from "@supabase/supabase-js";
import ServiceCheckboxGroup from "@/app/components/ui/ServiceCheckboxGroup/ServiceCheckboxGroup";

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
}

// ===================================
// Composant principal
// ===================================
export default function FicheConciergerie() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ==========================
  // Chargement du profil
  // ==========================
  useEffect(() => {
    (async () => {
      try {
        console.log("[Load] Démarrage du chargement profil...");
        const res = await fetch("/api/profiles/current");
        
        const data: Profile | { error: string } = await res.json();
        console.log("[Load] Données profil reçues :", data);

        if ("error" in data) throw new Error(data.error);
        setProfile(data);
        setEditProfile(data);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : "Erreur lors du chargement du profil."
        );
        console.error("[Load] ERREUR :", err);
      }
    })();
  }, []);

  // ==========================
  // Gestion des changements
  // ==========================
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editProfile) return;
    const { name, value } = e.target;

    console.log(`[Change] ${name} ->`, value);
    setEditProfile({ ...editProfile, [name]: value });

    // Validation simple
    let error = "";
    if (name === "email" && value)
      error = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Adresse email invalide.";
    if (name === "phone" && value)
      error = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(value)
        ? ""
        : "Numéro de téléphone invalide.";
    setErrors((prev) => ({ ...prev, [name]: error }));
    if (error) console.warn(`[Validation] ${name} :`, error);
  };

  const handleAvatarChange = async (file: File | null) => {
    console.log("[Avatar] Nouveau fichier :", file);
    setAvatarFile(file);
  };

  // ==========================
  // Sauvegarde du profil
  // ==========================
  const handleSave = async () => {
    if (!editProfile) return;
    if (Object.values(errors).some((err) => err !== "")) {
      alert("⚠️ Corrigez les erreurs avant de sauvegarder.");
      console.warn("[Save] Erreurs à corriger :", errors);
      return;
    }

    setLoading(true);
    let avatar_url = editProfile.avatar_url;

    // Upload de l'avatar si changé
    if (avatarFile) {
      console.log("[Avatar] Début de l'upload...");
      const filePath = `avatars/user_${editProfile.id}_${Date.now()}`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });
      if (error) {
        setErrorMsg("Erreur lors de l'envoi de l'avatar.");
        setLoading(false);
        console.error("[Avatar] Upload FAIL :", error);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);
      avatar_url = publicUrlData.publicUrl;
      console.log("[Avatar] Nouvelle URL publique :", avatar_url);
    }

    // === Log avant envoi ===
    console.log("[Save] Payload envoyé à l'API :",
      { ...editProfile, avatar_url });

    try {
      const res = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editProfile, avatar_url }),
      });
      const result = await res.json();

      console.log("[Save] Réponse API PATCH :", result);
      if (result.error) throw new Error(result.error);

      setProfile({ ...editProfile, avatar_url });
      setEditProfile({ ...editProfile, avatar_url });
      setIsEditing(false);
      setSuccessMsg("✅ Profil mis à jour avec succès !");
      setErrorMsg("");
      setAvatarFile(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur de sauvegarde du profil.");
      console.error("[Save] ERREUR lors de l'envoi PATCH :", err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Rendu du champ
  // ==========================
  const renderField = (
    label: string,
    name: keyof Profile,
    isTextarea = false,
    required = false,
    placeholder = ""
  ) => {
    const value = editProfile?.[name] ?? "";
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
              error={errors[name]}
              isValid={!errors[name] && !!value}
              autoComplete={
                name === "email"
                  ? "email"
                  : name === "first_name"
                    ? "given-name"
                    : name === "last_name"
                      ? "family-name"
                      : name === "phone"
                        ? "tel"
                        : name === "username"
                          ? "username"
                          : "off"
              }
            />
          )
        ) : (
          <span className={styles.fieldValue}>{value || "—"}</span>
        )}
      </div>
    );
  };

  // ==========================
  // Rendu principal
  // ==========================
  if (errorMsg) return <div className={styles.errorMsg}>{errorMsg}</div>;
  if (!profile || !editProfile) return <div>Chargement du profil...</div>;

  console.log("[Render] Profil affiché :", profile);

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Fiche utilisateur & informations</h1>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

      <div className={styles.avatarBlock}>
        <AvatarUpload
      userId={editProfile.id}
          value={avatarFile}
          existingUrl={editProfile.avatar_url || null}
          onChange={handleAvatarChange}
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
              ? profile.option
                .split(",")
                .map((s) => s.trim())
                .join(", ")
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
            {loading ? "⏳ Sauvegarde..." : "Sauvegarder"}
          </button>
        ) : (
          <button
            onClick={() => {
              setIsEditing(true);
              console.log("[Edit] Passe en mode édition...");
            }}
            className={styles.editButton}
          >
            Modifier le profil
          </button>
        )}
      </div>
    </div>
  );
}
