import { Mail, Phone, MapPin } from "lucide-react";
import AvatarUpload from "@/components/ui/AvatarUpload/AvatarUpload";
import styles from "./ProfileIdentity.module.scss";


type ProfileIdentityProps = {
    fullName: string;
    roleLabel?: string;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    title?: string;
    subtitle?: string;

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
        location,
        title,
        subtitle,
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
    } = props;

    return (
        <div className={styles.profileIdentity}>
            <div className={styles.avatarWrapper}>
                <AvatarUpload
                    value={avatarFile}
                    existingUrl={existingAvatarUrl}
                    existingScale={existingScale}
                    existingOffsetX={existingOffsetX}
                    existingOffsetY={existingOffsetY}
                    existingRotation={existingRotation}
                    onChange={onAvatarChange}
                    onScaleChange={onAvatarScaleChange}
                    onOffsetChange={onAvatarOffsetChange}
                    onRotationChange={onAvatarRotationChange}
                    onSave={onAvatarSave}
                    onRemove={onAvatarRemove}
                />

      
            </div>

            <div className={styles.info}>
                {(title || subtitle) && (
                    <div className={styles.intro}>
                        {title && <h2 className={styles.introTitle}>{title}</h2>}
                        {subtitle && <p className={styles.introSubtitle}>{subtitle}</p>}
                    </div>
                )}
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
                    {location && (
                        <span className={styles.metaItem}>
                            <MapPin />
                            <span>{location}</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
