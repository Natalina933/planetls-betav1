import Link from "next/link";
import styles from "./shared.module.scss";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  actionHref,
}: SectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h2 className={styles.title}>{title}</h2>
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={styles.actionLink}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
