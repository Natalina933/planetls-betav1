"use client";

import Image from "next/image";
import { HTMLAttributes, useMemo, useState } from "react";
import styles from "./Avatar.module.scss";

type AvatarSize = "sm" | "md" | "lg";

export type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
};

const sizeToPixels: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 72,
};

function getInitials(name?: string) {
  if (!name) {
    return "?";
  }

  const chunks = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());

  return chunks.join("") || "?";
}

export function Avatar({ src, alt = "Avatar", name, size = "md", className = "", ...props }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const pixelSize = sizeToPixels[size];
  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <div className={[styles.avatar, styles[size], className].filter(Boolean).join(" ")} {...props}>
      {src && !hasError ? (
        <Image
          src={src}
          alt={alt}
          width={pixelSize}
          height={pixelSize}
          className={styles.image}
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={styles.fallback} aria-label={name ? `Avatar ${name}` : "Avatar fallback"}>
          {initials}
        </span>
      )}
    </div>
  );
}
