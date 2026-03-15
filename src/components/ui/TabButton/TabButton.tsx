import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import styles from "./TabButton.module.scss";

export type TabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon?: ReactNode;
};

export const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(function TabButton(
  { active = false, icon, className = "", children, type = "button", ...props },
  ref,
) {
  const classes = [styles.tabButton, active ? styles.active : "", className].filter(Boolean).join(" ");

  return (
    <button ref={ref} type={type} className={classes} data-active={active ? "true" : "false"} {...props}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
});
