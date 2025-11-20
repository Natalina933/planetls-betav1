"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./AvatarUpload.module.scss";

const AVATAR_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5 Mo
  allowedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  minScale: 0.5,
  maxScale: 3,
  scaleStep: 0.01,
} as const;

interface AvatarUploadProps {
  value: File | null;
  existingUrl?: string | null;
  existingScale?: number | null;
  onChange: (file: File | null) => void;
  onUploadSuccess?: (avatarUrl: string, scale: number) => void;
}

type UploadResponse =
  | { success: true; avatar_url: string; avatar_scale: number }
  | { success?: false; error: string };

export default function AvatarUpload({
  value,
  existingUrl = null,
  existingScale = 1,
  onChange,
  onUploadSuccess,
}: AvatarUploadProps) {
  const [scale, setScale] = useState(existingScale || 1);
  const [preview, setPreview] = useState<string | null>(existingUrl);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(existingUrl);
      setScale(existingScale || 1);
    }
  }, [value, existingUrl, existingScale]);

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    setScale(1);
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!AVATAR_CONFIG.allowedTypes.includes(file.type as never)) {
      setError("⚠️ Format non autorisé (JPEG, PNG, WEBP uniquement)");
      return;
    }

    if (file.size > AVATAR_CONFIG.maxSize) {
      setError(
        `⚠️ Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(
          2
        )} Mo). Max : 5 Mo`
      );
      return;
    }

    setError("");
    onChange(file);
    setScale(1);
  };

  const handleValidate = async () => {
    if (!value) {
      setError("⚠️ Aucun fichier sélectionné");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("avatar", value);
      formData.append("scale", scale.toString());

      const res = await fetch("/api/profiles/avatar", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        credentials: "include",
      });

      const data: UploadResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error((data as { error: string }).error || "Erreur lors de l'upload");
      }

      setPreview(data.avatar_url);
      onChange(null);

      if (onUploadSuccess) onUploadSuccess(data.avatar_url, data.avatar_scale);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {!preview ? (
        <label className={styles.uploadLabel}>
          📷 Choisir un avatar
          <input
            type="file"
            accept={AVATAR_CONFIG.allowedTypes.join(",")}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>
      ) : (
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
              unoptimized={preview.startsWith("blob:")}
            />
          </div>

          <input
            type="range"
            min={AVATAR_CONFIG.minScale}
            max={AVATAR_CONFIG.maxScale}
            step={AVATAR_CONFIG.scaleStep}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            disabled={loading}
          />

          <div className={styles.buttonGroup}>
            <button onClick={handleValidate} disabled={loading}>
              {loading ? "⏳ Sauvegarde..." : "✔ Valider"}
            </button>
            <label>
              🔁 Remplacer
              <input
                type="file"
                accept={AVATAR_CONFIG.allowedTypes.join(",")}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
            <button onClick={handleRemove} disabled={loading}>
              ❌ Supprimer
            </button>
          </div>
        </>
      )}
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  );
}
