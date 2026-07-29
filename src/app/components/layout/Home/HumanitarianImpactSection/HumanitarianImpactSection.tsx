"use client";

import { HandHeart, HeartHandshake, Landmark, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import styles from "./HumanitarianImpactSection.module.scss";

const commitments = [
  {
    icon: HandHeart,
    title: "Soutenir des causes locales",
    description:
      "Transformer une partie de l'activité de la plateforme en aide concrète pour des associations, des familles ou des territoires qui ont besoin d'un relais rapide.",
  },
  {
    icon: Landmark,
    title: "Aider le logement à rester digne",
    description:
      "Faire exister demain des contributions utiles autour de l'hébergement d'urgence, du confort de base ou d'équipements essentiels liés à l'accueil.",
  },
  {
    icon: HeartHandshake,
    title: "Montrer l'impact avec transparence",
    description:
      "Rendre visible ce qui est financé, par qui et pourquoi, pour que la solidarité soit lisible et crédible plutôt qu'un simple argument marketing.",
  },
];

const roadmap = [
  "Choisir des causes compatibles avec l'ADN logement, accueil et terrain de PlanetLS.",
  "Définir une mécanique simple : abonnement, mission ou action locale pouvant contribuer.",
  "Afficher ensuite les preuves d'impact directement dans l'expérience publique et les dashboards.",
];

export function HumanitarianImpactSection() {
  return (
    <section className={styles.section} aria-labelledby="humanitarian-impact-title">
      <div className={styles.layout}>
        <div className={styles.introCard}>
          <span className={styles.eyebrow}>Dimension solidaire</span>
          <h2 id="humanitarian-impact-title">
            PlanetLS peut aussi devenir un réseau qui aide au-delà des missions.
          </h2>
          <p className={styles.lead}>
            Inspirée par des modèles où l'activité du réseau finance aussi une cause utile, cette
            direction ouvrirait une dimension plus humaine : chaque croissance locale pourrait
            contribuer à quelque chose de concret sur le terrain.
          </p>
          <p className={styles.note}>
            Cette brique est une vision produit en préparation. Elle n'active pas encore de
            mécanique de don ou de financement automatique dans la plateforme.
          </p>
          <div className={styles.actions}>
            <ButtonLink href="/contact" variant="primary" className={styles.primaryAction}>
              Construire ce programme
            </ButtonLink>
            <ButtonLink href="/dashboard/owner/concierges" variant="secondary">
              Voir les acteurs du réseau
            </ButtonLink>
          </div>
        </div>

        <div className={styles.asideCard}>
          <div className={styles.asideHeader}>
            <Sparkles size={20} />
            <span>Premier cap</span>
          </div>
          <ol className={styles.roadmap}>
            {roadmap.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className={styles.commitmentsGrid}>
        {commitments.map(({ icon: Icon, title, description }) => (
          <article key={title} className={styles.commitmentCard}>
            <div className={styles.iconWrap}>
              <Icon size={22} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
