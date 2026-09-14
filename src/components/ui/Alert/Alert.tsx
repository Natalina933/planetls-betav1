import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import styles from "./Alert.module.scss";

export type AlertProps = {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  appearance?: "panel" | "inline" | "message";
  children?: ReactNode;
  action?: ReactNode;
  announcement?: "off" | "polite" | "assertive";
  className?: string;
};

const icons = { info: Info, success: CheckCircle2, warning: TriangleAlert, danger: AlertCircle };

export function Alert({ tone = "info", appearance = "panel", title, children, action, announcement = "off", className = "" }: AlertProps) {
  const Icon = icons[tone];
  if (appearance !== "panel") {
    return <div className={[styles.inline, appearance === "message" ? styles.bordered : "", className].filter(Boolean).join(" ")} data-tone={tone}
      role={announcement === "assertive" ? "alert" : announcement === "polite" ? "status" : undefined}>
      {title && <strong>{title}</strong>}{children != null && <p>{children}</p>}{action}
    </div>;
  }
  return (
    <div className={[styles.alert, className].filter(Boolean).join(" ")} data-tone={tone}
      role={announcement === "assertive" ? "alert" : announcement === "polite" ? "status" : undefined}>
      <Icon className={styles.icon} size={22} aria-hidden="true" />
      <div className={styles.content}>
        {title && <strong className={styles.title}>{title}</strong>}
        {children != null && <div className={styles.message}>{children}</div>}
        {action != null && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  );
}
