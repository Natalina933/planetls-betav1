"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { FaCamera } from "react-icons/fa";
import styles from "./AvatarUpload.module.scss";

interface AvatarUploadProps {
  value: File | null;
  existingUrl?: string | null;
  existingScale?: number;
  existingOffsetX?: number;
  existingOffsetY?: number;
  existingRotation?: number;
  onChange: (file: File | null) => void;
  onScaleChange?: (scale: number) => void;
  onOffsetChange?: (x: number, y: number) => void;
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
  onChange,
  onScaleChange,
  onOffsetChange,
  onRotationChange,
  onSave,
  onRemove,
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null);
  const [scale, setScale] = useState(existingScale);
  const [offsetX, setOffsetX] = useState(existingOffsetX);
  const [offsetY, setOffsetY] = useState(existingOffsetY);
  const [rotation, setRotation] = useState(existingRotation);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(existingUrl || null);
  }, [value, existingUrl]);

  const openModal = () => {
    setIsModalOpen(true);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    onChange(file);
    setHasChanged(true);
  };

  const handleValidate = () => {
    onSave?.();
    setIsModalOpen(false);
    setHasChanged(false);
  };

  const handleRemove = () => {
    onChange(null);
    onRemove?.();
    setPreviewUrl(null);
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* AVATAR */}
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
            }}
          />
        ) : (
          <div className={styles.placeholder}>Avatar</div>
        )}

        <button
          type="button"
          className={styles.cameraButton}
          onClick={openModal}
          aria-label="Modifier l’avatar"
        >
          <FaCamera />
        </button>
      </div>

      {/* MODALE */}
      {isModalOpen && (
        <>
          <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)} />
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Personnaliser l’avatar</h3>

            <div className={styles.previewLarge}>
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Avatar preview"
                  fill
                  style={{
                    objectFit: "cover",
                    transform: `
                      translate(${offsetX}%, ${offsetY}%)
                      scale(${scale})
                      rotate(${rotation}deg)
                    `,
                  }}
                />
              ) : (
                <div className={styles.placeholderLarge}>Avatar</div>
              )}
            </div>

            {/* CONTROLES */}
            <div className={styles.controls}>
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.01}
                value={scale}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setScale(v);
                  setHasChanged(true);
                  onScaleChange?.(v);
                }}
              />

              <input
                type="range"
                min={-50}
                max={50}
                value={offsetX}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setOffsetX(v);
                  setHasChanged(true);
                  onOffsetChange?.(v, offsetY);
                }}
              />

              <input
                type="range"
                min={-50}
                max={50}
                value={offsetY}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setOffsetY(v);
                  setHasChanged(true);
                  onOffsetChange?.(offsetX, v);
                }}
              />

              <input
                type="range"
                min={-45}
                max={45}
                value={rotation}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setRotation(v);
                  setHasChanged(true);
                  onRotationChange?.(v);
                }}
              />
            </div>

            {/* ACTIONS */}
            <div className={styles.modalFooter}>
              <button onClick={() => setIsModalOpen(false)}>Annuler</button>
              <button onClick={handleRemove} className={styles.remove}>
                Supprimer
              </button>
              <button onClick={handleValidate} disabled={!hasChanged}>
                Valider
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
