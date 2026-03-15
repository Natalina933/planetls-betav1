"use client";

import type { ReactNode } from "react";
import styles from "./SectionIntro.module.scss";

type SectionIntroAlign = "left" | "center";

export type SectionIntroProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  align?: SectionIntroAlign;
  titleId?: string;
  className?: string;
};

export function SectionIntro({
  title,
  eyebrow,
  description,
  subtitle,
  align = "center",
  titleId,
  className = "",
}: SectionIntroProps) {
  const classes = [styles.sectionIntro, styles[align], className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
  );
}
