import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer id="contact" className={styles.footer}>
      <p>&copy; {new Date().getFullYear()} PlanetLs. All rights reserved.</p>
      <p className={styles.links}>
        <a href="/about">A propos</a>
        <a href="/contact">Contact</a>
      </p>
    </footer>
  );
}
