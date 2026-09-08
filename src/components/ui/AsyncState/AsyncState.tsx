import type { ReactNode } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import styles from "./AsyncState.module.scss";
import { Alert, type AlertProps } from "../Alert";

export type AsyncStateValue =
  | { status: "ready" }
  | { status: "loading"; message?: string }
  | { status: "error" | "empty" | "calm" | "urgent" | "unavailable"; message: string; title?: string; action?: ReactNode };

const presentations = {
  error: { tone: "danger", title: "Impossible de charger les données" },
  empty: { tone: "info", title: "Aucun résultat" },
  calm: { tone: "success", title: "Aucune urgence signalée" },
  urgent: { tone: "warning", title: "Une action est nécessaire" },
  unavailable: { tone: "info", title: "Données indisponibles" },
} satisfies Record<string, { tone: AlertProps["tone"]; title: string }>;

export type AsyncStateProps = {
  /** Opt-in : prioritaire sur les anciens booléens. Le métier fournit l'état. */
  state?: AsyncStateValue;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  className?: string;
  children: ReactNode;
};

export function AsyncState({
  state,
  loading = false,
  error = null,
  isEmpty = false,
  loadingLabel = "Chargement...",
  emptyLabel = "Aucune donnée disponible.",
  className = "",
  children,
}: AsyncStateProps) {
  const classes = [styles.state, className].filter(Boolean).join(" ");

  if (state?.status === "ready") return <div className={classes}>{children}</div>;

  if (state && state.status !== "loading") {
    const presentation = presentations[state.status];
    return <div className={classes}>
      <Alert tone={presentation.tone} title={state.title ?? presentation.title}
        announcement={state.status === "error" ? "assertive" : "polite"} action={state.action}>
        {state.message}
      </Alert>
      {(state.status === "calm" || state.status === "urgent") && children}
    </div>;
  }

  if (state?.status === "loading" || loading) {
    return (
      <div className={classes} role="status" aria-live="polite">
        <div className={styles.skeletonPanel}>
          <div className={styles.skeletonHeader}>
            <span />
            <span />
          </div>
          <div className={styles.skeletonGrid}>
            <span />
            <span />
            <span />
          </div>
          <p className={styles.message}>{state?.status === "loading" ? state.message ?? loadingLabel : loadingLabel}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes}>
        <div className={`${styles.emptyPanel} ${styles.errorPanel}`} role="alert">
          <AlertCircle size={22} aria-hidden="true" />
          <strong>Une action est necessaire</strong>
          <p className={styles.message}>{error}</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={classes}>
        <div className={styles.emptyPanel}>
          <Sparkles size={22} aria-hidden="true" />
          <strong>Rien a afficher pour le moment</strong>
          <p className={styles.message}>{emptyLabel}</p>
        </div>
      </div>
    );
  }

  return <div className={classes}>{children}</div>;
}
