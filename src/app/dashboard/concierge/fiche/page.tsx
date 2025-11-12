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
}

// ===================================
// Validation centralisée
// ===================================
const validateField = (name: string, value: string): string => {
  switch (name) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Adresse email invalide.";
    case "phone":
      return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(value)
        ? ""
        : "Numéro de téléphone invalide.";
    case "username":
      if (value.length < 3) return "Nom d'utilisateur trop court.";
      if (!/^[a-zA-Z0-9\-_]+$/.test(value)) return "Caractères non autorisés.";
      return "";
    default:
      return "";
  }
};

// ===================================
// Composant champ réutilisable
// ===================================
interface EditableFieldProps {
  label: string;
  name: keyof Profile;
  value: string;
  isEditing: boolean;
  isTextarea?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  name,
  value,
  isEditing,
  isTextarea = false,
  required = false,
  placeholder,
  error,
  onChange,
}) => (
  <div className={styles.fieldRow}>
    <label htmlFor={name.toString()} className={styles.fieldLabel}>
      {label} {required && "*"}
    </label>
    {isEditing ? (
      isTextarea ? (
        <textarea
          id={name.toString()}
          name={name.toString()}
          value={value}
          onChange={onChange}
          className={styles.fieldTextarea}
          placeholder={placeholder || label}
          rows={3}
        />
      ) : (
        <InputWithValidation
          id={name.toString()}
          name={name.toString()}
          value={value}
          onChange={onChange}
          placeholder={placeholder || label}
          error={error}
          isValid={!error && !!value}
          autoComplete="off"
        />
      )
    ) : (
      <span className={styles.fieldValue}>{value || "—"}</span>
    )}
  </div>
);

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
        const res = await fetch("/api/profiles/current");
        const data: Profile | { error: string } = await res.json();
        if ("error" in data) throw new Error(data.error);
        setProfile(data);
        setEditProfile(data);
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : "Erreur lors du chargement du profil."
        );
      }
    })();
  }, []);

  // ==========================
  // Gestion des changements
  // ==========================
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editProfile) return;
    const { name, value } = e.target;
    setEditProfile({ ...editProfile, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleAvatarChange = async (file: File | null) => {
    setAvatarFile(file);
  };

  // ==========================
  // Sauvegarde du profil
  // ==========================
  const handleSave = async () => {
    if (!editProfile) return;

    if (Object.values(errors).some((err) => err !== "")) {
      alert("⚠️ Corrigez les erreurs avant de sauvegarder.");
      return;
    }

    setLoading(true);
    let avatar_url = editProfile.avatar_url;

    if (avatarFile) {
      const filePath = `avatars/user_${editProfile.id}_${Date.now()}`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { cacheControl: "3600", upsert: true });
      if (error) {
        setErrorMsg("Erreur lors de l'envoi de l'avatar.");
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);
      avatar_url = publicUrlData.publicUrl;
    }

    try {
      const payload = {
        id: editProfile.id,
        username: editProfile.username,
        first_name: editProfile.first_name,
        last_name: editProfile.last_name,
        email: editProfile.email,
        phone: editProfile.phone,
        avatar_url,
        category: editProfile.category,
        location: editProfile.location,
        option: editProfile.option,
        search_target: editProfile.search_target,
        additional_info: editProfile.additional_info,
      };

      const res = await fetch("/api/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.error) {
        setErrors((prev) => ({ ...prev, email: result.error }));
        throw new Error(result.error);
      }

      setProfile({ ...editProfile, avatar_url });
      setEditProfile({ ...editProfile, avatar_url });
      setIsEditing(false);
      setSuccessMsg("✅ Profil mis à jour avec succès !");
      setErrorMsg("");
      setAvatarFile(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur de sauvegarde du profil.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Configuration des champs
  // ==========================
  const fieldsConfig: {
    label: string;
    name: keyof Profile;
    required?: boolean;
    isTextarea?: boolean;
  }[] = [
      { label: "Nom d'utilisateur", name: "username", required: true },
      { label: "Prénom", name: "first_name", required: true },
      { label: "Nom", name: "last_name", required: true },
      { label: "Email", name: "email", required: true },
      { label: "Téléphone", name: "phone" },
      { label: "Catégorie", name: "category" },
      { label: "Emplacement", name: "location" },
      { label: "Recherche cible", name: "search_target" },
      { label: "À propos", name: "additional_info", isTextarea: true },
    ];

  // ==========================
  // Rendu principal
  // ==========================
  if (errorMsg) return <div className={styles.errorMsg}>{errorMsg}</div>;
  if (!profile || !editProfile) return <div>Chargement du profil...</div>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Fiche utilisateur & informations</h1>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

      <div className={styles.avatarBlock}>
        <AvatarUpload
          value={avatarFile}
          existingUrl={editProfile.avatar_url || null}
          onChange={handleAvatarChange}
        />
      </div>

      {/* Champs générés dynamiquement */}
      {fieldsConfig.map(({ label, name, required, isTextarea }) => (
        <EditableField
          key={name}
          label={label}
          name={name}
          value={editProfile[name] ? String(editProfile[name]) : ""}
          isEditing={isEditing}
          required={required}
          isTextarea={isTextarea}
          error={errors[name]}
          onChange={handleChange}
        />
      ))}

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
              ? profile.option
                .split(",")
                .map((s) => s.trim())
                .join(", ")
              : "—"}
          </span>
        )}
      </div>

      <EditableField
        label="Recherche cible"
        name="search_target"
        value={editProfile.search_target || ""}
        isEditing={isEditing}
        onChange={handleChange}
      />

      <EditableField
        label="À propos"
        name="additional_info"
        value={editProfile.additional_info || ""}
        isEditing={isEditing}
        isTextarea
        onChange={handleChange}
      />

      {/* Date de création */}
      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel}>Date de création :</label>
        <span className={styles.fieldValue}>
          {new Date(profile.created_at).toLocaleDateString("fr-FR")}
        </span>
      </div>

      {/* Actions */}
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
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
          >
            Modifier le profil
          </button>
        )}
      </div>
    </div>
  );
}