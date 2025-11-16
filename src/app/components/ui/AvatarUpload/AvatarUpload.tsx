"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./AvatarUpload.module.scss";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AvatarUploadProps {
  value: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  userId: string; // ⚡️ pour savoir quel utilisateur sauvegarder
}

export default function AvatarUpload({
  value,
  existingUrl = null,
  onChange,
  userId,
}: AvatarUploadProps) {
  const [scale, setScale] = useState(1);
  const [preview, setPreview] = useState<string | null>(existingUrl);
  const [error, setError] = useState<string>("");
  const [isPendingValidation, setIsPendingValidation] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      setIsPendingValidation(true); // ⚡️ nouvelle image en attente
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(existingUrl);
      setIsPendingValidation(false);
    }
  }, [value, existingUrl]);

  const handleRemove = () => {
    onChange(null);
    setScale(1);
    setPreview(null);
    setError("");
    setIsPendingValidation(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("⚠️ Format non autorisé (JPEG, PNG, WEBP uniquement)");
      return;
    }
    if (file.size > maxSize) {
      setError("⚠️ Fichier trop volumineux (max 5 Mo)");
      return;
    }

    setError("");
    onChange(file);
    setScale(1);
  };

const handleValidate = async () => {
  if (!value) return;
  setLoading(true);

  try {
    const filePath = `avatars/user_${userId}_${Date.now()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, value, { upsert: true });

    if (uploadError || !uploadData) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(uploadData.path);

    if (!publicUrlData?.publicUrl) throw new Error("URL publique introuvable");

    // Sauvegarde URL + zoom dans le profil
    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrlData.publicUrl,
        avatar_scale: scale,
      })
      .eq("id", userId)
      .select();

    if (updateError) {
      console.error("[Supabase Update ERROR]", updateError);
      throw updateError;
    }

    console.log("[Supabase] Profil mis à jour :", updateData);

    setIsPendingValidation(false);
    setError("");
  } catch (err) {
    console.error("[AvatarUpload] ERREUR :", err);
    setError(err instanceof Error ? err.message : "Erreur de sauvegarde.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className={styles.container}>
      {!preview && (
        <label className={styles.uploadLabel} htmlFor="avatarInput">
          📷 Choisir un avatar
          <input
            id="avatarInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>
      )}

      {preview && (
        <>
          <div className={styles.imageWrapper}>
            <Image
              src={preview}
              alt="Avatar utilisateur"
              width={200}
              height={200}
              style={{
                objectFit: "cover",
                borderRadius: "50%",
                transform: `scale(${scale})`,
                transition: "transform 0.2s ease",
              }}
            />
          </div>

          <div className={styles.zoomControl}>
            <label htmlFor="scaleRange" className={styles.zoomLabel}>
              Zoom : {scale.toFixed(2)}x
            </label>
            <input
              id="scaleRange"
              type="range"
              min={0.5}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className={styles.zoomSlider}
              aria-label="Zoom de l'image"
            />
          </div>


          <div className={styles.buttonGroup}>
            {isPendingValidation ? (
              <button
                type="button"
                className={styles.validateButton}
                onClick={handleValidate}
                disabled={loading}
              >
                {loading ? "⏳ Sauvegarde..." : "✔ Valider"}
              </button>
            ) : (
              <label htmlFor="avatarInput" className={styles.replaceButton}>
                🔁 Remplacer
                <input
                  id="avatarInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
            )}

            <button
              type="button"
              className={styles.removeButton}
              onClick={handleRemove}
            >
              ❌ Supprimer
            </button>
          </div>
        </>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  );
}
