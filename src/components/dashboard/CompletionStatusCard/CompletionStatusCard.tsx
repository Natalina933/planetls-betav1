import { FiAlertCircle, FiCheckCircle, FiClock, FiEdit3 } from "react-icons/fi";
import { Button, ButtonLink } from "@/components/ui";
import styles from "./CompletionStatusCard.module.scss";

type CompletionTone = "danger" | "warning" | "success";

export type CompletionStatusCardProps = {
  title: string;
  description: string;
  percentage: number;
  completedCount: number;
  totalCount: number;
  missingItems?: string[];
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

type CompletionState = {
  tone: CompletionTone;
  title: string;
  message: string;
  icon: typeof FiAlertCircle;
};

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveCompletionState(percentage: number): CompletionState {
  if (percentage >= 100) {
    return {
      tone: "success",
      title: "Complet",
      message: "Tous les éléments requis sont renseignés.",
      icon: FiCheckCircle,
    };
  }

  if (percentage >= 70) {
    return {
      tone: "warning",
      title: "Presque complet",
      message: "Encore quelques éléments pour finaliser cette section.",
      icon: FiClock,
    };
  }

  return {
    tone: "danger",
    title: "Incomplet",
    message: "Complétez cette section pour débloquer tout son potentiel.",
    icon: FiAlertCircle,
  };
}

export function CompletionStatusCard({
  title,
  description,
  percentage,
  completedCount,
  totalCount,
  missingItems = [],
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: CompletionStatusCardProps) {
  const safePercentage = clampPercentage(percentage);
  const completionState = resolveCompletionState(safePercentage);
  const Icon = completionState.icon;
  const toneClassName = styles[completionState.tone];
  const hasAction = Boolean(actionLabel && (actionHref || onAction));

  return (
    <section
      className={[styles.card, toneClassName, className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <div className={styles.icon}>
            <Icon size={18} />
          </div>
          <div>
            <p className={styles.title}>{title}</p>
            <h3 className={styles.statusTitle}>{completionState.title}</h3>
            <p className={styles.description}>{description}</p>
            <p className={styles.message}>{completionState.message}</p>
          </div>
        </div>
        <div className={styles.percentage}>
          <strong>{safePercentage}%</strong>
        </div>
      </header>

      <div className={styles.progressBlock}>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${safePercentage}%` }} />
        </div>
        <p className={styles.progressLabel}>
          {completedCount} / {totalCount} élément(s) renseigné(s)
        </p>
      </div>

      {missingItems.length > 0 ? (
        <div className={styles.missingBlock}>
          <p className={styles.missingTitle}>À compléter ({missingItems.length})</p>
          <div className={styles.missingList}>
            {missingItems.slice(0, 5).map((item) => (
              <span key={item} className={styles.missingItem}>
                {item}
              </span>
            ))}
            {missingItems.length > 5 ? (
              <span className={styles.missingItem}>+{missingItems.length - 5}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {hasAction ? (
        <div className={styles.actions}>
          {actionHref ? (
            <ButtonLink href={actionHref} variant="outline" className={styles.actionButton}>
              <FiEdit3 size={16} />
              <span>{actionLabel}</span>
            </ButtonLink>
          ) : (
            <Button
              type="button"
              variant="outline"
              className={styles.actionButton}
              onClick={onAction}
            >
              <FiEdit3 size={16} />
              <span>{actionLabel}</span>
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}
