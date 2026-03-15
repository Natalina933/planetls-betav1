import { HTMLAttributes } from "react";
import styles from "./Card.module.scss";

type CardVariant = "small" | "large";
type CardTone = "elevated" | "outlined" | "soft" | "dark";

export type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
  tone?: CardTone;
  interactive?: boolean;
};

export function Card({
  variant = "small",
  tone = "elevated",
  interactive = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const classes = [styles.card, styles[variant], styles[tone], interactive ? styles.interactive : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes} {...props}>
      {children}
    </article>
  );
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <header className={[styles.header, className].filter(Boolean).join(" ")} {...props} />;
}

export function CardBody({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={[styles.body, className].filter(Boolean).join(" ")} {...props} />;
}

export function CardFooter({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <footer className={[styles.footer, className].filter(Boolean).join(" ")} {...props} />;
}
