import { forwardRef, SelectHTMLAttributes } from "react";
import styles from "./Select.module.scss";

type SelectTone = "default" | "soft" | "dark";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  bare?: boolean;
  density?: "default" | "compact";
  tone?: SelectTone;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, error, bare = false, density = "default", tone = "default", className = "", ...props },
  ref,
) {
  const classes = [styles.select, styles[tone], density === "compact" ? styles.compact : "", error ? styles.error : "", className].filter(Boolean).join(" ");
  const accessibleNameProps =
    label || props["aria-label"] || props["aria-labelledby"] || props.title
      ? {}
      : { "aria-label": "Selection" };

  if (bare) {
    return (
      <select
        ref={ref}
        id={id}
        className={classes}
        aria-invalid={Boolean(error)}
        {...accessibleNameProps}
        {...props}
      />
    );
  }

  return (
    <label className={styles.wrapper} htmlFor={id}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <select
        ref={ref}
        id={id}
        className={classes}
        aria-invalid={Boolean(error)}
        {...accessibleNameProps}
        {...props}
      />
      {error ? <span className={styles.errorText}>{error}</span> : null}
    </label>
  );
});
