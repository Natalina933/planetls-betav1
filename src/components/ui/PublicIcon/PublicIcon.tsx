import type { CSSProperties, HTMLAttributes } from "react";
import styles from "./PublicIcon.module.scss";

export type PublicIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  src: string;
  label?: string;
  decorative?: boolean;
  size?: number | string;
};

export function PublicIcon({
  src,
  label,
  decorative = true,
  size = 18,
  className,
  style,
  ...props
}: PublicIconProps) {
  const dimension = typeof size === "number" ? `${size}px` : size;
  const iconStyle = {
    "--public-icon-src": `url("${src}")`,
    "--public-icon-size": dimension,
    ...style,
  } as CSSProperties;

  return (
    <span
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      className={[styles.icon, className].filter(Boolean).join(" ")}
      role={decorative ? undefined : "img"}
      style={iconStyle}
      {...props}
    />
  );
}
