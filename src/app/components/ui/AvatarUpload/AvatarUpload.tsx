"use client";

import React, { useRef, useEffect, useState } from "react";
import styles from "./AvatarUpload.module.scss";
import Image from "next/image";

interface Props {
  value: File | null;
  onChange: (file: File | null) => void;
}

export default function AvatarUpload({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Met à jour l'URL de preview quand un fichier est sélectionné
  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);

      // Cleanup
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={styles.uploadZone}
      onClick={() => fileRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt="Aperçu avatar"
          width={100}
          height={100}
          className={styles.preview}
        />
      ) : (
        <span>Glissez une image ou cliquez pour choisir</span>
      )}
      <label htmlFor="avatar-upload" className={styles.visuallyHidden}>Télécharger un avatar</label>
      <input
        id="avatar-upload"
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        className={styles.hiddenInput}
        onChange={e => onChange(e.target.files?.[0] || null)}
      />


    </div>
  );
}
