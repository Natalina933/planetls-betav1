import Link from "next/link";
import styles from "../_dashboards/prototypes.module.scss";

const profiles = [
  ["admin", "Administrateur", "Une vue précise des opérations", "Priorités, demandes et activité. La composition admin existante est conservée et complétée."],
  ["owner", "Propriétaire", "Une lecture calme, centrée sur le logement", "Prochaine décision, séjours et logements. Moins de densité, des mots du quotidien."],
  ["concierge", "Concierge / conciergerie", "La journée avant les chiffres", "Urgence simulée, missions et planning. Une même structure pour les petits et grands volumes."],
  ["provider", "Artisan / prestataire", "L’essentiel à portée de main", "Demande à lire, interventions et devis. Des lignes complètes transformées en cartes sur téléphone."],
] as const;
export default function DashboardComparisonPage() {
  return <main className={styles.comparison}><Link href="/design-system">← Design System</Link><p className={styles.eyebrow}>Atelier PlanetLS</p><h1>Quatre espaces, une même maison.</h1><p>Comparez les propositions avant leur intégration. Toutes les données sont fictives ; aucune action n’est enregistrée.</p><div className={styles.comparisonGrid}>{profiles.map(([id,label,title,detail]) => <Link key={id} href={`/design-system/${id}-dashboard`}><p className={styles.eyebrow}>{label}</p><h2>{title}</h2><p>{detail}</p><span>Explorer le prototype →</span></Link>)}</div><h2>Ce que nous comparons</h2><p>Une urgence ou un état calme, quatre indicateurs au maximum et une action principale dans la zone d’entrée. Les listes détaillées viennent ensuite. Les mêmes boutons, cartes et couleurs de statut sont utilisés partout.</p><p>Dans chaque espace, essayez les boutons Chargement, Vide et Erreur. Ces propositions attendent votre validation avant de rejoindre les vrais tableaux de bord.</p></main>;
}
