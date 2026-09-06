import styles from "./PlatformHeadline.module.scss";

/** Texte unique à réutiliser, sans le recopier dans les pages. */
export const PLATFORM_HEADLINE_TEXT = "Une plateforme premium pour orchestrer la location saisonnière";

export function PlatformHeadline({ as: Heading = "h2", id }: { as?: "h1" | "h2" | "h3"; id?: string }) {
  return <Heading id={id} className={styles.title}>{PLATFORM_HEADLINE_TEXT}</Heading>;
}
