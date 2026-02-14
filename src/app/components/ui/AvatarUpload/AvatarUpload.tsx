"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const previewUrlRef = useRef<string | null>(null);

  // Cleanup URL au démontage
  useEffect(() => {
    return () => {
      if (previewUrlRef.current && previewUrlRef.current !== existingUrl) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [existingUrl]);

  // Gestion URL de prévisualisation
  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl(existingUrl || null);
      previewUrlRef.current = existingUrl || null;
    }
  }, [value, existingUrl]);

  // Reset des transformations si nouvelle image
  const resetTransformations = useCallback(() => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
    setHasChanged(false);
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    // Délai pour laisser le modal s'afficher
    setTimeout(() => fileInputRef.current?.click(), 100);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Validation fichier image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide.');
      return;
    }

    // Validation taille (5Mo max)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5 Mo.');
      return;
    }

    onChange(file);
    setHasChanged(true);
    e.target.value = ''; // Reset input pour permettre re-sélection du même fichier
  }, [onChange]);

  const handleValidate = useCallback(() => {
    if (onSave) onSave();
    closeModal();
    resetTransformations();
  }, [onSave, closeModal, resetTransformations]);

  const handleRemove = useCallback(() => {
    onChange(null);
    if (onRemove) onRemove();
    resetTransformations();
  }, [onChange, onRemove, resetTransformations]);

  const updateScale = useCallback((newScale: number) => {
    setScale(newScale);
    setHasChanged(true);
    onScaleChange?.(newScale);
  }, [onScaleChange]);

  const updateOffset = useCallback((newX: number, newY: number) => {
    setOffsetX(newX);
    setOffsetY(newY);
    setHasChanged(true);
    onOffsetChange?.(newX, newY);
  }, [onOffsetChange]);

  const updateRotation = useCallback((newRotation: number) => {
    setRotation(newRotation);
    setHasChanged(true);
    onRotationChange?.(newRotation);
  }, [onRotationChange]);

  const imageTransform = `
    translate(${offsetX}%, ${offsetY}%)
    scale(${scale})
    rotate(${rotation}deg)
  `;

  return (
    <div className={styles.container}>
      {/* AVATAR PRINCIPAL */}
      <div className={styles.imageWrapper}>
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Avatar"
            fill
            sizes="(max-width: 640px) 96px, 130px"
            className={styles.image}
            style={{
              objectFit: "cover",
              transform: imageTransform,
            }}
            priority={false}
            draggable={false}
          />
        ) : (
          <div className={styles.placeholder}>
            <span>Avatar</span>
          </div>
        )}

        <button
          type="button"
          className={styles.cameraButton}
          onClick={openModal}
          aria-label="Modifier l'avatar"
          title="Modifier l'avatar"
        >
          <FaCamera />
        </button>

        <input
          ref={fileInputRef}
          id="avatar-file-input"
          type="file"
          accept="image/*"
          className={styles.hiddenFileInput}
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>

      {/* MODALE D'ÉDITION */}
      {isModalOpen && (
        <>
          <div
            className={styles.modalOverlay}
            onClick={closeModal}
            role="button"
            tabIndex={0}
            aria-label="Fermer la modale"
          />
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-modal-title"
          >
            <div className={styles.modalHeader}>
              <h3 id="avatar-modal-title" className={styles.modalTitle}>
                Personnaliser l&apos;avatar
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeModal}
                aria-label="Fermer la fenêtre de personnalisation"
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              {/* Prévisualisation grande */}
              <div className={styles.previewLarge}>
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Prévisualisation de l'avatar"
                    fill
                    sizes="500px"
                    className={styles.image}
                    style={{
                      objectFit: "cover",
                      transform: imageTransform,
                    }}
                    draggable={false}
                  />
                ) : (
                  <div className={styles.placeholderLarge}>
                    <span>Aucun avatar</span>
                  </div>
                )}
              </div>

              {/* CONTRÔLES */}
              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.uploadButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Télécharger une image
                </button>

                <div className={styles.controlGroup}>
                  <label htmlFor="avatar-scale" className={styles.controlLabel}>
                    Zoom
                  </label>
                  <input
                    id="avatar-scale"
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.01"
                    value={scale}
                    className={styles.rangeSlider}
                    onChange={(e) => updateScale(Number(e.target.value))}
                    aria-label="Zoom de l'image"
                  />
                </div>

                <div className={styles.offsetControls}>
                  <div className={styles.controlGroup}>
                    <label htmlFor="avatar-offset-x" className={styles.controlLabel}>
                      ↔️ Horizontal
                    </label>
                    <input
                      id="avatar-offset-x"
                      type="range"
                      min="-50"
                      max="50"
                      value={offsetX}
                      className={styles.rangeSlider}
                      onChange={(e) => updateOffset(
                        Number(e.target.value), 
                        offsetY
                      )}
                      aria-label="Déplacement horizontal"
                    />
                  </div>

                  <div className={styles.controlGroup}>
                    <label htmlFor="avatar-offset-y" className={styles.controlLabel}>
                      ↕️ Vertical
                    </label>
                    <input
                      id="avatar-offset-y"
                      type="range"
                      min="-50"
                      max="50"
                      value={offsetY}
                      className={styles.rangeSlider}
                      onChange={(e) => updateOffset(
                        offsetX, 
                        Number(e.target.value)
                      )}
                      aria-label="Déplacement vertical"
                    />
                  </div>
                </div>

                <div className={styles.controlGroup}>
                  <label htmlFor="avatar-rotation" className={styles.controlLabel}>
                    🔄 Rotation
                  </label>
                  <input
                    id="avatar-rotation"
                    type="range"
                    min="-45"
                    max="45"
                    value={rotation}
                    className={styles.rangeSlider}
                    onChange={(e) => updateRotation(Number(e.target.value))}
                    aria-label="Rotation de l'image"
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                type="button" 
                className={styles.cancel} 
                onClick={closeModal}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.remove}
                onClick={handleRemove}
              >
                Supprimer
              </button>
              <button
                type="button"
                className={`${styles.validate} ${
                  !hasChanged ? styles.validateDisabled : ""
                }`}
                onClick={handleValidate}
                disabled={!hasChanged}
              >
                Valider les modifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
