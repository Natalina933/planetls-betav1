import { forwardRef, SelectHTMLAttributes } from "react";
import styles from "./Select.module.scss";

type SelectTone = "default" | "soft" | "dark";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  bare?: boolean;
  tone?: SelectTone;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, error, bare = false, tone = "default", className = "", ...props },
  ref,
) {
  const classes = [styles.select, styles[tone], error ? styles.error : "", className].filter(Boolean).join(" ");

  if (bare) {
    return <select ref={ref} id={id} className={classes} aria-invalid={Boolean(error)} {...props} />;
  }

  return (
    <label className={styles.wrapper} htmlFor={id}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <select ref={ref} id={id} className={classes} aria-invalid={Boolean(error)} {...props} />
      {error ? <span className={styles.errorText}>{error}</span> : null}
    </label>
  );
});
