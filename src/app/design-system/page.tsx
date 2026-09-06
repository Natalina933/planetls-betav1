import Link from "next/link";
import { designSections } from "./_components/navigation";
import styles from "./atelier.module.scss";

export default function DesignSystemPage() {
  return <main className={styles.page}>
    <header className={styles.header}>
      <span className={styles.eyebrow}>Atelier PlanetLS</span>
      <h1>Design & maquettes</h1>
      <p>Un seul endroit pour examiner les styles, parcourir les composants et comparer vos futurs écrans.</p>
    </header>
    <div className={styles.grid}>
      {designSections.slice(1).map((item, index) => <Link key={item.href} href={item.href} className={styles.card}>
        <span className={styles.eyebrow}>0{index + 1}</span>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <span>Explorer →</span>
      </Link>)}
    </div>
    <p>Les maquettes permettent de juger le rendu et les interactions. Elles utilisent des données fictives et n’enregistrent aucune action.</p>
  </main>;
}
