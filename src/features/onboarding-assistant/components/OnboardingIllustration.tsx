"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { OnboardingVisual } from "../visuals";
import { FALLBACK_ONBOARDING_VISUAL } from "../visuals";
import styles from "./OnboardingIllustration.module.scss";

type OnboardingIllustrationVariant = "hero" | "card" | "thumbnail";

type OnboardingIllustrationProps = {
  visual?: OnboardingVisual | null;
  variant?: OnboardingIllustrationVariant;
  decorative?: boolean;
  priority?: boolean;
  className?: string;
};

const sizesByVariant: Record<OnboardingIllustrationVariant, string> = {
  hero: "(max-width: 720px) 100vw, 520px",
  card: "(max-width: 720px) 100vw, 280px",
  thumbnail: "84px",
};

export function OnboardingIllustration({
  visual,
  variant = "card",
  decorative = true,
  priority = false,
  className = "",
}: OnboardingIllustrationProps) {
  const resolvedVisual = visual ?? FALLBACK_ONBOARDING_VISUAL;
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [resolvedVisual.src]);

  const rootClassName = [
    styles.root,
    styles[variant],
    styles[resolvedVisual.tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName} aria-hidden={decorative || undefined}>
      {!hasError ? (
        <Image
          src={resolvedVisual.src}
          alt={decorative ? "" : resolvedVisual.alt}
          fill
          sizes={sizesByVariant[variant]}
          priority={priority}
          className={styles.image}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className={styles.fallback}>
          <span>{resolvedVisual.label}</span>
        </div>
      )}
    </div>
  );
}
