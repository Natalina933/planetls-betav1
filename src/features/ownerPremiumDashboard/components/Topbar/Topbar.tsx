import styles from "./Topbar.module.scss";

type TopbarProps = {
  onQuickAction: () => void;
};

export function Topbar({ onQuickAction }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.searchWrap}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search property, reservation, guest..."
          aria-label="Search"
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.quickAction} onClick={onQuickAction}>
          + Quick action
        </button>
        <button type="button" className={styles.iconButton} aria-label="Notifications">?</button>
        <button type="button" className={styles.avatarButton} aria-label="Owner profile">
          <span className={styles.avatar}>NA</span>
          <span className={styles.ownerInfo}>
            <strong>Nathalie</strong>
            <small>Property owner</small>
          </span>
        </button>
      </div>
    </header>
  );
}
