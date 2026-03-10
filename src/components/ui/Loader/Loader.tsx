import styles from "./Loader.module.scss";

type LoaderSize = "sm" | "md" | "lg";

export type LoaderProps = {
  size?: LoaderSize;
  showText?: boolean;
  text?: string;
  className?: string;
};

export function Loader({
  size = "lg",
  showText = false,
  text = "Chargement...",
  className = "",
}: LoaderProps) {
  const classes = [styles.loaderWrapper, className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="status" aria-live="polite" aria-label="Chargement en cours">
      <span className={`${styles.spinner} ${styles[size]}`} aria-hidden="true" />
      {showText ? <span className={styles.loadingText}>{text}</span> : null}
    </div>
  );
}
