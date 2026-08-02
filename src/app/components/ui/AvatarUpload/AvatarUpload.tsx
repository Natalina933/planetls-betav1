"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import {
  FaArrowsAltH,
  FaArrowsAltV,
  FaCamera,
  FaExpandArrowsAlt,
  FaRedoAlt,
  FaUpload,
} from "react-icons/fa";
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
  isEditing?: boolean;
  alt?: string;
  size?: "default" | "large";
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
  alt = "Avatar",
  size = "default",
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
  const inputId = useId();
  const scaleId = useId();
  const offsetXId = useId();
  const offsetYId = useId();
  const rotationId = useId();
  const modalTitleId = useId();

  useEffect(() => {
    return () => {
      if (previewUrlRef.current && previewUrlRef.current !== existingUrl) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [existingUrl]);

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

  useEffect(() => {
    setScale(existingScale);
  }, [existingScale]);

  useEffect(() => {
    setOffsetX(existingOffsetX);
  }, [existingOffsetX]);

  useEffect(() => {
    setOffsetY(existingOffsetY);
  }, [existingOffsetY]);

  useEffect(() => {
    setRotation(existingRotation);
  }, [existingRotation]);

  const resetTransformations = useCallback(() => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
    setHasChanged(false);
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    setTimeout(() => fileInputRef.current?.click(), 100);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image valide.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    onChange(file);
    setHasChanged(true);
    event.target.value = "";
  }, [onChange]);

  const handleValidate = useCallback(() => {
    onSave?.();
    closeModal();
    setHasChanged(false);
  }, [closeModal, onSave]);

  const handleRemove = useCallback(() => {
    onChange(null);
    onRemove?.();
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
    <div className={`${styles.container} ${size === "large" ? styles.large : ""}`}>
      <div className={styles.imageWrapper}>
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={alt}
            fill
            sizes="(max-width: 640px) 96px, 130px"
            className={styles.image}
            style={{ objectFit: "cover", transform: imageTransform }}
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
          id={inputId}
          type="file"
          accept="image/*"
          className={styles.hiddenFileInput}
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>

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
            aria-labelledby={modalTitleId}
          >
            <div className={styles.modalHeader}>
              <h3 id={modalTitleId} className={styles.modalTitle}>
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
              <div className={styles.previewLarge}>
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Prévisualisation de l'avatar"
                    fill
                    sizes="640px"
                    className={styles.image}
                    style={{ objectFit: "cover", transform: imageTransform }}
                    draggable={false}
                  />
                ) : (
                  <div className={styles.placeholderLarge}>
                    <span>Aucun avatar</span>
                  </div>
                )}
              </div>

              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.uploadButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaUpload aria-hidden="true" />
                  <span>Changer l&apos;image</span>
                </button>

                <div className={styles.controlGroup}>
                  <label htmlFor={scaleId} className={styles.controlLabel}>
                    <span className={styles.controlLabelIcon}><FaExpandArrowsAlt /></span>
                    <span>Zoom</span>
                  </label>
                  <input
                    id={scaleId}
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.01"
                    value={scale}
                    className={styles.rangeSlider}
                    onChange={(event) => updateScale(Number(event.target.value))}
                    aria-label="Zoom de l'image"
                  />
                </div>

                <div className={styles.offsetControls}>
                  <div className={styles.controlGroup}>
                    <label htmlFor={offsetXId} className={styles.controlLabel}>
                      <span className={styles.controlLabelIcon}><FaArrowsAltH /></span>
                      <span>Horizontal</span>
                    </label>
                    <input
                      id={offsetXId}
                      type="range"
                      min="-50"
                      max="50"
                      value={offsetX}
                      className={styles.rangeSlider}
                      onChange={(event) => updateOffset(Number(event.target.value), offsetY)}
                      aria-label="Déplacement horizontal"
                    />
                  </div>

                  <div className={styles.controlGroup}>
                    <label htmlFor={offsetYId} className={styles.controlLabel}>
                      <span className={styles.controlLabelIcon}><FaArrowsAltV /></span>
                      <span>Vertical</span>
                    </label>
                    <input
                      id={offsetYId}
                      type="range"
                      min="-50"
                      max="50"
                      value={offsetY}
                      className={styles.rangeSlider}
                      onChange={(event) => updateOffset(offsetX, Number(event.target.value))}
                      aria-label="Déplacement vertical"
                    />
                  </div>
                </div>

                <div className={styles.controlGroup}>
                  <label htmlFor={rotationId} className={styles.controlLabel}>
                    <span className={styles.controlLabelIcon}><FaRedoAlt /></span>
                    <span>Rotation</span>
                  </label>
                  <input
                    id={rotationId}
                    type="range"
                    min="-45"
                    max="45"
                    value={rotation}
                    className={styles.rangeSlider}
                    onChange={(event) => updateRotation(Number(event.target.value))}
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
                className={`${styles.validate} ${!hasChanged ? styles.validateDisabled : ""}`}
                onClick={handleValidate}
                disabled={!hasChanged}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
