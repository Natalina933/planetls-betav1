import { Clock3 } from "lucide-react";
import styles from "./ArtDecoTimeline.module.scss";

export type ArtDecoTimelineItem = {
  id: string;
  when: string;
  title: string;
  status: string;
  tone: "owner" | "concierge" | "artisan";
  detail?: string;
};

export function ArtDecoTimeline({ id, title, items, note, headingLevel = "h3" }: {
  id: string; title: string; items: readonly ArtDecoTimelineItem[]; note?: string; headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return <section className={styles.panel} aria-labelledby={id} data-artdeco-timeline>
    <header className={styles.header}><div><span className={styles.eyebrow}>Organisation</span><Heading id={id} className={styles.title}>{title}</Heading></div><Clock3 size={20} aria-hidden="true" /></header>
    <ol className={styles.timeline}>{items.map(item => <li key={item.id}>
      <span className={styles.when}>{item.when}</span>
      <div><strong>{item.title}</strong><span className={styles.status} data-tone={item.tone}>{item.status}</span>{item.detail && <p>{item.detail}</p>}</div>
    </li>)}</ol>
    {note && <p className={styles.note}>{note}</p>}
  </section>;
}
