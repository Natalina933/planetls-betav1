import { forwardRef, TextareaHTMLAttributes } from "react";
import styles from "./Textarea.module.scss";

type TextareaTone = "default" | "soft" | "dark";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  bare?: boolean;
  tone?: TextareaTone;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, error, bare = false, tone = "default", className = "", ...props },
  ref,
) {
  const classes = [styles.textarea, styles[tone], error ? styles.error : "", className].filter(Boolean).join(" ");

  if (bare) {
    return <textarea ref={ref} id={id} className={classes} aria-invalid={Boolean(error)} {...props} />;
  }

  return (
    <label className={styles.wrapper} htmlFor={id}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <textarea ref={ref} id={id} className={classes} aria-invalid={Boolean(error)} {...props} />
      {error ? <span className={styles.errorText}>{error}</span> : null}
    </label>
  );
});
