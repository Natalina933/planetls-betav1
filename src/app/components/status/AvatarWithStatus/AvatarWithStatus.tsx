// src/app/components/status/AvatarWithStatus.tsx
"use client";

import Image from "next/image";
// import StatusBadge from "../StatusBadge/StatusBadge";
import type { UserStatus } from "../userStatusTypes";
import styles from "./AvatarWithStatus.module.scss";

interface AvatarWithStatusProps {
  avatarUrl?: string;
  status: UserStatus;
  size?: number; // taille de l’avatar
}

export default function AvatarWithStatus({
  avatarUrl = "/icons/account-svgrepo-com.svg",
  status,
  size = 64,
}: AvatarWithStatusProps) {
  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className={styles.avatar}
      />

      <span className={`${styles.statusDot} ${styles[status]}`} />
    </div>
  );
}
