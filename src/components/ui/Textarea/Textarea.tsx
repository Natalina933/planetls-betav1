import { forwardRef, TextareaHTMLAttributes } from "react";
import styles from "./Textarea.module.scss";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = "", ...props },
  ref,
) {
  return <textarea ref={ref} className={[styles.textarea, className].filter(Boolean).join(" ")} {...props} />;
});
