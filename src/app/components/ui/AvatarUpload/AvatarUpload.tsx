"use client";

import React, { useState } from "react";
import Image from "next/image";
import styles from "./AvatarUpload.module.scss";

interface AvatarUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
}

export default function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const [scale, setScale] = useState(1);

  const handleRemove = () => {
    onChange(null);
    setScale(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
      setScale(1);
    }
  };

  return (
    <div className={styles.container}>
      {!value && (
        <label className={styles.uploadLabel}>
          Choisir un avatar
          <input type="file" accept="image/*" onChange={handleFileChange} hidden />
        </label>
      )}

      {value && (
        <>
          <div className={styles.imageWrapper}>
            <Image
              src={URL.createObjectURL(value)}
              alt="Avatar utilisateur"
              width={200}
              height={200}
              style={{
                objectFit: "cover",
                borderRadius: "50%",
                transform: `scale(${scale})`,
              }}
            />
          </div>

          {/* Barre de zoom verticale avec bulle centrée */}
          <div className={styles.zoomControl}>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className={styles.zoomSlider}
            />
            <div className={styles.bubble} />
          </div>

          <button type="button" className={styles.removeButton} onClick={handleRemove}>
            Supprimer
          </button>
        </>
      )}
    </div>
  );
}
