"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaCamera } from "react-icons/fa";
import styles from "./AvatarUpload.module.scss";

interface AvatarUploadProps {
  value: File | null;
  existingUrl?: string;
  existingScale?: number;
  existingOffsetX?: number;
  existingOffsetY?: number;
  existingRotation?: number;
  isEditing: boolean;
  onChange: (file: File | null) => void;
  onScaleChange?: (scale: number) => void;
  onOffsetChange?: (offsetX: number, offsetY: number) => void;
  onRotationChange?: (rotation: number) => void;
  onSave?: () => void;
  onRemove?: () => void;
}

export default function AvatarUpload({
  value,
  existingUrl,
  existingScale = 1,
  existingOffsetX = 0,
  existingOffsetY = 0,
  existingRotation = 0,
  isEditing,
  onChange,
  onScaleChange,
  onOffsetChange,
  onRotationChange,
  onSave,
  onRemove,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingUrl || null
  );
  const [scale, setScale] = useState(existingScale);
  const [offsetX, setOffsetX] = useState(existingOffsetX);
  const [offsetY, setOffsetY] = useState(existingOffsetY);
  const [rotation, setRotation] = useState(existingRotation);
  const [error, setError] = useState<string | null>(null);

  // Génère une preview si un nouveau fichier est choisi
  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(existingUrl || null);
  }, [value, existingUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.type.startsWith("image/")) {
      setError("Format non supporté. Veuillez choisir une image.");
      return;
    }
    setError(null);
    onChange(file);
  };

  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = Number(e.target.value);
    setScale(newScale);
    onScaleChange?.(newScale);
  };

  const handleOffsetXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setOffsetX(val);
    onOffsetChange?.(val, offsetY);
  };

  const handleOffsetYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setOffsetY(val);
    onOffsetChange?.(offsetX, val);
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setRotation(val);
    onRotationChange?.(val);
  };

  const handleRemove = () => {
    onChange(null);
    onRemove?.();
    setPreviewUrl(null);
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
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
            style={{
              objectFit: "cover",
              transform: `
                translate(${offsetX}%, ${offsetY}%)
                scale(${scale})
                rotate(${rotation}deg)
              `,
              transformOrigin: "center center",
            }}
          />
        ) : (
          <div className={styles.placeholder}>Avatar</div>
        )}

        {isEditing && (
          <label className={styles.cameraButton}>
            <FaCamera />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
          </label>
        )}
      </div>

      {/* CONTROLES & BOUTONS */}
      {previewUrl && isEditing && (
        <>
          <div className={styles.controlsBlock}>
            <div className={styles.zoomControl}>
              <label htmlFor="zoomSlider" className={styles.zoomLabel}>
                Zoom ({scale.toFixed(2)}x)
              </label>
              <input
                id="zoomSlider"
                type="range"
                min={0.5}
                max={3}
                step={0.01}
                value={scale}
                onChange={handleZoom}
                className={styles.zoomSlider}
              />
            </div>

            <div className={styles.offsetControls}>
              <div className={styles.offsetControl}>
                <label htmlFor="offsetX" className={styles.zoomLabel}>
                  Horizontal
                </label>
                <input
                  id="offsetX"
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={offsetX}
                  onChange={handleOffsetXChange}
                  className={styles.zoomSlider}
                />
              </div>

              <div className={styles.offsetControl}>
                <label htmlFor="offsetY" className={styles.zoomLabel}>
                  Vertical
                </label>
                <input
                  id="offsetY"
                  type="range"
                  min={-50}
                  max={50}
                  step={1}
                  value={offsetY}
                  onChange={handleOffsetYChange}
                  className={styles.zoomSlider}
                />
              </div>
            </div>

            <div className={styles.rotationControl}>
              <label htmlFor="rotation" className={styles.zoomLabel}>
                Rotation ({rotation}°)
              </label>
              <input
                id="rotation"
                type="range"
                min={-45}
                max={45}
                step={1}
                value={rotation}
                onChange={handleRotationChange}
                className={styles.zoomSlider}
              />
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <label className={`${styles.button} ${styles.replace}`}>
              Modifier
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
            </label>

            <button
              type="button"
              className={`${styles.button} ${styles.remove}`}
              onClick={handleRemove}
            >
              Supprimer
            </button>

            {value && (
              <button
                type="button"
                className={`${styles.button} ${styles.validate}`}
                onClick={onSave}
                aria-label="Valider avatar"
              >
                ✓ Valider
              </button>
            )}
          </div>
        </>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
}
