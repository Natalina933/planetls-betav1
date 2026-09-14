import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ButtonLink } from "../../Button/ButtonLink";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import styles from "./QuickActions.module.scss";
import type { DashboardQuickAction } from "../types";

interface QuickActionsProps {
  actions: DashboardQuickAction[];
  title?: string;
  eyebrow?: string;
  showHeader?: boolean;
  variant?: "steps" | "shortcuts";
  className?: string;
  actionClassName?: string;
}

export function QuickActions({
  actions,
  title = "Faire maintenant",
  eyebrow = "Actions rapides",
  showHeader = true,
  variant = "steps",
  className = "",
  actionClassName = "",
}: QuickActionsProps) {
  if (variant === "shortcuts") {
    return (
      <Card className={[styles.shortcuts, className].filter(Boolean).join(" ")}>
        {showHeader && (
          <div><p className={styles.shortcutEyebrow}>{eyebrow}</p><h2>{title}</h2></div>
        )}
        {actions.map(action => (
          <ButtonLink
            key={`${action.href}-${action.label}`}
            href={action.href}
            variant="secondary"
            className={[styles.shortcut, actionClassName].filter(Boolean).join(" ")}
          >
            {action.icon}
            <span>{action.description && <small>{action.description}</small>}{action.label}</span>
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
        ))}
      </Card>
    );
  }
  return (
    <Card className={[styles.card, className].filter(Boolean).join(" ")}>
      {showHeader ? (
        <CardHeader className={styles.header}>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </CardHeader>
      ) : null}
      <CardBody className={styles.body}>
        {actions.map((action, index) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className={`${styles.action} ${index === 0 ? styles.actionPrimary : ""} ${action.completed ? styles.actionCompleted : ""}`}
          >
            <div className={styles.actionMeta}>
              <span className={styles.actionTopline}>
                {action.completed ? action.completedLabel ?? "Fait" : action.badge ?? `Etape ${index + 1}`}
              </span>
              {action.completed ? (
                <span className={styles.actionCheck} aria-label="Action terminée">
                  <CheckCircle2 size={18} />
                </span>
              ) : null}
            </div>
            <strong>{action.label}</strong>
            {action.description ? <span className={styles.actionDescription}>{action.description}</span> : null}
          </Link>
        ))}
      </CardBody>
    </Card>
  );
}
