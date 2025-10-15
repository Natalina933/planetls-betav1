"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./AvatarUpload.module.scss";

interface AvatarUploadProps {
  /** Fichier sélectionné localement */
  value: File | null;
  /** URL d’un avatar déjà téléversé (ex: depuis Supabase) */
  existingUrl?: string | null;
  /** Callback parent pour notifier un changement */
  onChange: (file: File | null) => void;
}

export default function AvatarUpload({
  value,
  existingUrl = null,
  onChange,
}: AvatarUploadProps) {
  const [scale, setScale] = useState(1);
  const [preview, setPreview] = useState<string | null>(existingUrl);
  const [error, setError] = useState<string>("");

  // Génération de l’aperçu local
  useEffect(() => {
    if (value) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(existingUrl);
    }
  }, [value, existingUrl]);

  const handleRemove = () => {
    onChange(null);
    setScale(1);
    setPreview(null);
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const maxSize = 5 * 1024 * 1024; // 5 MB
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

  return (
    <div className={styles.container}>
      {!preview && (
        <label
          className={styles.uploadLabel}
          htmlFor="avatarInput"
          title="Sélectionner un avatar"
        >
          📷 Choisir un avatar
          <input
            id="avatarInput"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            aria-label="Charger un avatar"
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
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className={styles.zoomSlider}
              title="Zoom avatar"
              aria-label="Zoom avatar"
            />
          </div>

          <div className={styles.buttonGroup}>
            <label
              htmlFor="avatarInput"
              className={styles.replaceButton}
              title="Remplacer l'avatar"
            >
              🔁 Remplacer
              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>

            <button
              type="button"
              className={styles.removeButton}
              onClick={handleRemove}
              title="Supprimer avatar"
              aria-label="Supprimer avatar"
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
