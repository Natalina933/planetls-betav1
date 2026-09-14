import { HTMLAttributes } from "react";
import styles from "./Section.module.scss";

type SectionSpacing = "compact" | "default" | "spacious";
type SectionTone = "default" | "soft" | "outlined" | "elevated";

export type SectionProps = HTMLAttributes<HTMLElement> & {
  spacing?: SectionSpacing;
  tone?: SectionTone;
};

export function Section({ spacing = "default", tone = "default", className = "", ...props }: SectionProps) {
  const toneClass = { default: styles.toneDefault, soft: styles.toneSoft, outlined: styles.outlined, elevated: styles.elevated }[tone];
  const classes = [styles.section, styles[spacing], toneClass, className].filter(Boolean).join(" ");
  return <section className={classes} {...props} />;
}
