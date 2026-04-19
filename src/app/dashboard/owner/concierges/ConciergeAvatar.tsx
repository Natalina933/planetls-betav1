"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { DEFAULT_CONCIERGE_AVATAR } from "./conciergeSearchUtils";

type ConciergeAvatarProps = {
  src?: string | null;
  alt: string;
  className: string;
  width: number;
  height: number;
};

export function ConciergeAvatar({ src, alt, className, width, height }: ConciergeAvatarProps) {
  const [currentSrc, setCurrentSrc] = useState(src || DEFAULT_CONCIERGE_AVATAR);

  useEffect(() => {
    setCurrentSrc(src || DEFAULT_CONCIERGE_AVATAR);
  }, [src]);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      unoptimized
      onError={() => {
        if (currentSrc !== DEFAULT_CONCIERGE_AVATAR) {
          setCurrentSrc(DEFAULT_CONCIERGE_AVATAR);
        }
      }}
    />
  );
}
