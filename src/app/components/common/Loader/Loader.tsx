import styles from './Loader.module.scss';

interface LoaderProps {
  size?: number;
  color?: string;
  showText?: boolean;
  text?: string;
}

export default function Loader({
  size = 48,
  color = '#222',
  showText = false,
  text = 'Chargement...',
}: LoaderProps) {
  return (
    <div className={styles.loaderWrapper} role="status" aria-label="Chargement en cours">
      <div
        data-testid="loader-spinner"
        className={`${styles.spinner} ${styles[`size${size}`]} ${styles[`color${color.replace('#', '')}`]}`}
      />
      {showText && <span className={styles.loadingText}>{text}</span>}
    </div>
  );
}
