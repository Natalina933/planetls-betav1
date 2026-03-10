import { forwardRef, InputHTMLAttributes } from "react";
import styles from "./Input.module.scss";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, className = "", ...props },
  ref,
) {
  const classes = [styles.input, error ? styles.error : "", className].filter(Boolean).join(" ");

  return (
    <label className={styles.wrapper} htmlFor={id}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <input ref={ref} id={id} className={classes} aria-invalid={Boolean(error)} {...props} />
      {error ? <span className={styles.errorText}>{error}</span> : null}
    </label>
  );
});
