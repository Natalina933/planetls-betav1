"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import styles from "./FicheConciergerie.module.scss";
import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export default function FicheConciergerie() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/profiles/current");
        const data: Profile | { error: string } = await response.json();
        if ("error" in data) throw new Error(data.error);
        setProfile(data);
        setEditProfile(data);
        setErrorMsg("");
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Erreur chargement profil.");
      }
    })();
  }, []);

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editProfile) return;
    setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!editProfile) return;
    setLoading(true);

    let avatar_url = editProfile.avatar_url;

    // Upload avatar if changed
    if (avatarFile) {
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(`user_${editProfile.id}_${Date.now()}`, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });
      if (error) {
        setErrorMsg("Erreur lors de l'envoi de l'avatar");
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
      avatar_url = publicUrlData.publicUrl || avatar_url;
    }

    try {
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
      setSuccessMsg("Profil mis à jour avec succès !");
      setAvatarFile(null);
      setErrorMsg("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Impossible de sauvegarder.");
    } finally {
      setLoading(false);
    }
  };

  if (errorMsg) return <div className={styles.errorMsg}>{errorMsg}</div>;
  if (!profile || !editProfile) return <div>Chargement…</div>;

  const data = isEditing ? editProfile : profile;

  const renderField = (
    label: string,
    name: keyof Profile,
    isTextarea = false,
    required = false,
    placeholder = ""
  ) => (
    <div className={styles.fieldRow}>
      <label htmlFor={name.toString()} className={styles.fieldLabel}>
        {label} {required ? "*" : ""}:
      </label>
      {isEditing ? (
        isTextarea ? (
          <textarea
            id={name.toString()}
            name={name.toString()}
            value={(data[name] as string) ?? ""}
            onChange={handleEditChange}
            className={styles.fieldTextarea}
            placeholder={placeholder || label}
            rows={3}
          />
        ) : (
          <input
            id={name.toString()}
            type={name === "email" ? "email" : "text"}
            name={name.toString()}
            value={(data[name] as string) ?? ""}
            onChange={handleEditChange}
            className={styles.fieldInput}
            placeholder={placeholder || label}
            required={required}
          />
        )
      ) : (
        <span className={styles.fieldValue}>{data[name] ?? "—"}</span>
      )}
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Fiche & Infos utilisateur</h1>
      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

      <div className={styles.avatarBlock}>
        <AvatarUpload value={avatarFile} existingUrl={editProfile.avatar_url || null} onChange={setAvatarFile} />
      </div>

      {renderField("ID", "id")}
      {renderField("Username", "username", false, true, "Nom d'utilisateur")}
      {renderField("Nom", "last_name", false, true, "Votre nom")}
      {renderField("Prénom", "first_name", false, true, "Votre prénom")}
      {renderField("Email", "email", false, true, "Adresse email")}
      {renderField("Téléphone", "phone", false, false, "Numéro de téléphone")}
      {renderField("Catégorie", "category")}
      {renderField("Emplacement", "location")}
      {renderField("Services principaux", "option")}
      {renderField("Recherche cible", "search_target")}
      {renderField("À propos", "additional_info", true)}
      
      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel}>Date de création :</label>
        <span className={styles.fieldValue}>
          {data.created_at ? new Date(data.created_at).toLocaleDateString("fr-FR") : "—"}
        </span>
      </div>

      <br />

      {isEditing ? (
        <button onClick={handleSave} disabled={loading} className={styles.saveButton}>
          {loading ? "⏳ Sauvegarde en cours..." : "Sauvegarder"}
        </button>
      ) : (
        <button onClick={() => setIsEditing(true)} className={styles.editButton}>
          Modifier
        </button>
      )}
    </div>
  );
}

