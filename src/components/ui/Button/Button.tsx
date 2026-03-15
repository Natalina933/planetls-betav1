import { ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./Button.module.scss";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "paper" | "dark";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth = false, className = "", type = "button", ...props },
  ref,
) {
  const classes = [styles.button, styles[variant], styles[size], fullWidth ? styles.fullWidth : "", className]
    .filter(Boolean)
    .join(" ");

  return <button ref={ref} type={type} className={classes} {...props} />;
});
