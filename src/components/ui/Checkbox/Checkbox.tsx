import { forwardRef, InputHTMLAttributes } from "react";
import styles from "./Checkbox.module.scss";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  labelClassName?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, className = "", labelClassName = "", ...props },
  ref,
) {
  return (
    <label className={styles.wrapper} htmlFor={id}>
      <input ref={ref} id={id} type="checkbox" className={[styles.input, className].filter(Boolean).join(" ")} {...props} />
      {label ? <span className={[styles.label, labelClassName].filter(Boolean).join(" ")}>{label}</span> : null}
    </label>
  );
});
