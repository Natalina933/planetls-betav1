"use client";

import { FiCamera, FiStar, FiTrash2 } from "react-icons/fi";
import styles from "./HousingPhotoManager.module.scss";

type Props = {
  editing: boolean;
  photos: string[];
  primaryPhoto: string | null;
  uploading?: boolean;
  title?: string;
  helperText?: string;
  onUpload: (files: FileList | null) => void | Promise<void>;
  onSetPrimary: (photo: string) => void;
  onRemove: (photo: string) => void;
};

export default function HousingPhotoManager({
  editing,
  photos,
  primaryPhoto,
  uploading = false,
  title = "Photos du logement",
  helperText = "Ajoutez plusieurs photos du logement et choisissez celle qui sera mise en avant.",
  onUpload,
  onSetPrimary,
  onRemove,
}: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.helper}>{helperText}</p>
        </div>

        {editing ? (
          <label className={styles.uploadButton}>
            <FiCamera />
            {uploading ? "Upload..." : "Ajouter des photos"}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => void onUpload(event.target.files)}
            />
          </label>
        ) : null}
      </div>

      {photos.length === 0 ? (
        <p className={styles.empty}>Aucune photo ajoutée pour le moment.</p>
      ) : (
        <div className={styles.grid}>
          {photos.map((photo, index) => {
            const isPrimary = primaryPhoto === photo;

            return (
              <div className={styles.card} key={`${photo}-${index}`}>
                <img src={photo} alt={`Photo ${index + 1} du logement`} className={styles.image} />
                {isPrimary ? <span className={styles.badge}>Principale</span> : <span className={styles.badge}>Photo</span>}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => onSetPrimary(photo)}
                    disabled={!editing || isPrimary}
                  >
                    <FiStar /> Principale
                  </button>
                  {editing ? (
                    <button type="button" className={styles.danger} onClick={() => onRemove(photo)}>
                      <FiTrash2 /> Retirer
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
