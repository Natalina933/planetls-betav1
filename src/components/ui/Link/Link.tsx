import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes } from "react";
import styles from "./Link.module.scss";

type LinkTone = "accent" | "subtle" | "neutral" | "inverse";
type LinkVariant = "inline" | "nav" | "buttonLike";

export type UILinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    tone?: LinkTone;
    variant?: LinkVariant;
  };

export function UILink({
  tone = "accent",
  variant = "inline",
  className = "",
  ...props
}: UILinkProps) {
  const classes = [styles.link, styles[tone], styles[variant], className].filter(Boolean).join(" ");

  return <Link className={classes} {...props} />;
}
