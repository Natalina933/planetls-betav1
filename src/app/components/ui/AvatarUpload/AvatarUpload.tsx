"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./AvatarUpload.module.scss";

interface AvatarUploadProps {
  value: File | null;
  existingUrl?: string;
  existingScale?: number;
  onChange: (file: File | null) => void;
  onScaleChange?: (scale: number) => void;
  onSave?: () => void;
  onRemove?: () => void;
}

export default function AvatarUpload({
  value,
  existingUrl,
  existingScale = 1,
  onChange,
  onScaleChange,
  onSave,
  onRemove,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null);
  const [scale, setScale] = useState(existingScale);
  const [error, setError] = useState<string | null>(null);

  // Génère une preview si un nouveau fichier est choisi
  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);

      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(existingUrl || null);
    }
  }, [value, existingUrl]);

  // Zoom
  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = Number(e.target.value);
    setScale(newScale);
    onScaleChange?.(newScale);
  };

  // Nouveau fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.type.startsWith("image/")) {
      setError("Format non supporté. Veuillez choisir une image.");
      return;
    }
    setError(null);
    onChange(file);
  };

  return (
    <div className={styles.container}>
      {/* APERCU */}
      <div className={styles.imageWrapper}>
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Avatar"
            fill
            style={{ objectFit: "cover", transform: `scale(${scale})` }}
          />
        ) : (
          <div className={styles.placeholder}>Avatar</div>
        )}
      </div>

      {/* ZOOM */}
      {previewUrl && (
        <div className={styles.zoomControl}>
          <label htmlFor="zoomSlider" className={styles.zoomLabel}>
            Zoom
          </label>
          <input
            id="zoomSlider"
            type="range"
            min={1}
            max={2}
            step={0.01}
            value={scale}
            onChange={handleZoom}
            className={styles.zoomSlider}
            aria-label="Zoom avatar"
          />
        </div>
      )}

      {/* MESSAGE ERREUR */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* BOUTONS */}
      <div className={styles.buttonGroup}>
        {/* Remplacer */}
        <label className={`${styles.button} ${styles.replace}`}>
          Modifier
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
        </label>

        {/* Supprimer */}
        {previewUrl && (
          <button
            type="button"
            className={`${styles.button} ${styles.remove}`}
            onClick={() => {
              onChange(null);
              onRemove?.();
              setPreviewUrl(null);
              setScale(1);
            }}
            aria-label="Supprimer avatar"
          >
            Supprimer
          </button>
        )}

        {/* Valider */}
        {value && (
          <button
            type="button"
            className={`${styles.button} ${styles.validate}`}
            onClick={onSave}
            disabled={!previewUrl}
            aria-label="Valider avatar"
          >
            ✓ Valider
          </button>
        )}
      </div>
    </div>
  );
}
