import { HTMLAttributes } from "react";
import styles from "./Tag.module.scss";

type TagTone = "default" | "category" | "status";

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: TagTone;
};

export function Tag({ tone = "default", className = "", ...props }: TagProps) {
  const classes = [styles.tag, styles[tone], className].filter(Boolean).join(" ");
  return <span className={classes} {...props} />;
}
