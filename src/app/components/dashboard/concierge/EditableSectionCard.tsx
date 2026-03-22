"use client";

import type { ReactNode } from "react";
import { FiEdit2, FiRotateCcw, FiSave } from "react-icons/fi";
import styles from "./LogementWorkspace.module.scss";

interface EditableSectionCardProps {
  eyebrow: string;
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  successMessage?: string;
  errorMessage?: string;
  children: ReactNode;
}

export default function EditableSectionCard({
  eyebrow,
  title,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  saving = false,
  successMessage = "",
  errorMessage = "",
  children,
}: EditableSectionCardProps) {
  return (
    <div className={styles.invitationCard}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h3 className={styles.cardTitle}>{title}</h3>
        </div>
        <div className={styles.toolbar}>
          {!isEditing ? (
            <button className={styles.actionPrimary} type="button" onClick={onEdit}>
              <FiEdit2 /> Modifier
            </button>
          ) : (
            <>
              <button className={styles.actionSecondary} type="button" onClick={onCancel} disabled={saving}>
                <FiRotateCcw /> Annuler
              </button>
              <button className={styles.actionPrimary} type="button" onClick={onSave} disabled={saving}>
                <FiSave /> {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </>
          )}
        </div>
      </div>

      {successMessage ? <p className={styles.messageSuccess}>{successMessage}</p> : null}
      {errorMessage ? <p className={styles.messageError}>{errorMessage}</p> : null}

      {children}
    </div>
  );
}
