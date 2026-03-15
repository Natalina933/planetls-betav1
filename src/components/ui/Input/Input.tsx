import { forwardRef, InputHTMLAttributes } from "react";
import styles from "./Input.module.scss";

type InputTone = "default" | "soft" | "dark";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  bare?: boolean;
  tone?: InputTone;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, bare = false, tone = "default", className = "", ...props },
  ref,
) {
  const classes = [styles.input, styles[tone], error ? styles.error : "", className].filter(Boolean).join(" ");

  if (bare) {
    return <input ref={ref} id={id} className={classes} aria-invalid={Boolean(error)} {...props} />;
  }

  return (
    <label className={styles.wrapper} htmlFor={id}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <input ref={ref} id={id} className={classes} aria-invalid={Boolean(error)} {...props} />
      {error ? <span className={styles.errorText}>{error}</span> : null}
    </label>
  );
});
