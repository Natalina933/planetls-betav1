"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./AvatarUpload.module.scss";

interface AvatarUploadProps {
  value: File | null;
  existingUrl?: string | null;
  existingScale?: number; // pour le futur zoom / crop
  userId?: string; // optionnel, pour futur upload
  onChange: (file: File | null) => void;
  onUploadSuccess?: (url: string, scale?: number) => void;
}

export default function AvatarUpload({
  value,
  existingUrl,
  existingScale = 1,
  // userId,
  onChange,
  onUploadSuccess,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null);

  // Met à jour la prévisualisation si un nouveau fichier est sélectionné
  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);

      return () => URL.revokeObjectURL(url); // libère la mémoire
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);

    if (file && onUploadSuccess) {
      const fakeUrl = URL.createObjectURL(file); // tu remplaceras par URL finale après upload
      onUploadSuccess(fakeUrl, existingScale);
    }
  };

  return (
    <div className={styles.avatarUpload}>
      <div className={styles.avatarPreviewContainer}>
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Avatar"
            width={150}
            height={150}
            className={styles.avatarPreview}
            priority
          />
        ) : (
          <div className={styles.placeholder}>Aucun avatar</div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className={styles.fileInput}
      />
    </div>
  );
}
