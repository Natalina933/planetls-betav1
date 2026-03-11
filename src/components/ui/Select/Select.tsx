import { forwardRef, SelectHTMLAttributes } from "react";
import styles from "./Select.module.scss";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = "", ...props },
  ref,
) {
  return <select ref={ref} className={[styles.select, className].filter(Boolean).join(" ")} {...props} />;
});
