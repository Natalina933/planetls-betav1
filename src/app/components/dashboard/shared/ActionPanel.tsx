import Link from "next/link";
import styles from "./shared.module.scss";

interface ActionPanelProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions: Array<{ label: string; href: string; primary?: boolean }>;
}

export default function ActionPanel({
  eyebrow,
  title,
  description,
  actions,
}: ActionPanelProps) {
  return (
    <section className={styles.actionPanel}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.actions}>
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className={action.primary ? styles.primaryAction : styles.secondaryAction}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
