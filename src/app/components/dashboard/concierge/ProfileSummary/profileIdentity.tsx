import { Mail, Phone, MapPin, Camera } from "lucide-react";
import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
import styles from "./ProfileIdentity.module.scss";


type ProfileIdentityProps = {
  fullName: string;
  roleLabel?: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;

  isEditing: boolean;
  avatarFile: File | null;
  existingAvatarUrl?: string | null;
  existingScale?: number;
  existingOffsetX?: number;
  existingOffsetY?: number;
  existingRotation?: number;
  onAvatarChange: (file: File | null) => void;
  onAvatarScaleChange?: (scale: number) => void;
  onAvatarOffsetChange?: (offsetX: number, offsetY: number) => void;
  onAvatarRotationChange?: (rotation: number) => void;
  onAvatarSave?: () => void;
  onAvatarRemove?: () => void;
  onEditAvatarClick: () => void;
};

export function ProfileIdentity(props: ProfileIdentityProps) {
    const {
        fullName,
        roleLabel,
        email,
        phone,
        city,
        isEditing,
        avatarFile,
        existingAvatarUrl,
        existingScale,
        existingOffsetX,
        existingOffsetY,
        existingRotation,
        onAvatarChange,
        onAvatarScaleChange,
        onAvatarOffsetChange,
        onAvatarRotationChange,
        onAvatarSave,
        onAvatarRemove,
        onEditAvatarClick,
    } = props;

    return (
        <div className={styles.profileIdentity}>
            <div className={styles.avatarWrapper}>
                <AvatarUpload
                    value={avatarFile}
                    existingUrl={existingAvatarUrl ?? undefined}
                    existingScale={existingScale}
                    existingOffsetX={existingOffsetX}
                    existingOffsetY={existingOffsetY}
                    existingRotation={existingRotation}
                    isEditing={isEditing}
                    onChange={onAvatarChange}
                    onScaleChange={onAvatarScaleChange}
                    onOffsetChange={onAvatarOffsetChange}
                    onRotationChange={onAvatarRotationChange}
                    onSave={onAvatarSave}
                    onRemove={onAvatarRemove}
                />

                {!isEditing && (
                    <button
                        type="button"
                        className={styles.avatarCameraButton}
                        onClick={onEditAvatarClick}
                        aria-label="Modifier la photo de profil"
                    >
                        <Camera />
                    </button>
                )}
            </div>

            <div className={styles.info}>
                <div className={styles.nameRow}>
                    <h1 className={styles.name}>{fullName}</h1>
                    {roleLabel && <span className={styles.roleBadge}>{roleLabel}</span>}
                </div>

                <div className={styles.meta}>
                    {email && (
                        <span className={styles.metaItem}>
                            <Mail />
                            <span>{email}</span>
                        </span>
                    )}
                    {phone && (
                        <span className={styles.metaItem}>
                            <Phone />
                            <span>{phone}</span>
                        </span>
                    )}
                    {city && (
                        <span className={styles.metaItem}>
                            <MapPin />
                            <span>{city}</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
