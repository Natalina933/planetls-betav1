import { HTMLAttributes } from "react";
import styles from "./Badge.module.scss";

type BadgeVariant = "neutral" | "gold" | "dark" | "success" | "warning" | "danger" | "info" | "progress";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "neutral", className = "", ...props }: BadgeProps) {
  const classes = [styles.badge, styles[variant], className].filter(Boolean).join(" ");
  return <span className={classes} {...props} />;
}
