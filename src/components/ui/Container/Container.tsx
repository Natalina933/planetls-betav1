import { HTMLAttributes } from "react";
import styles from "./Container.module.scss";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: ContainerSize;
};

export function Container({ size = "lg", className = "", ...props }: ContainerProps) {
  const classes = [styles.container, styles[size], className].filter(Boolean).join(" ");
  return <div className={classes} {...props} />;
}
