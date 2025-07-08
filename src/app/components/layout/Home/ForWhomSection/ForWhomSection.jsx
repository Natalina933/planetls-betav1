import Image from "next/image";
import styles from "./ForWhomSection.module.scss";
import CTAButton from "@/app/components/common/buttons/CTAbutton/CTAButton";

const benefits = [
  {
    icon: "/icons/proprio_belle_epoque.png",
    alt: "Icône propriétaire - maison Belle Époque",
    title: "Propriétaires",
    description: "Trouvez des profils vérifiés pour gérer, entretenir ou valoriser votre bien.",
  },
  {
    icon: "/icons/concierges_belle_epoque.png",
    alt: "Icône concierges - trousseau de clés vintage",
    title: "Concierges",
    description: "Développez votre activité, gérez vos missions, gagnez en autonomie.",
  },
  {
    icon: "/icons/artisans_belle_epoque.png",
    alt: "Icône artisans - outils artisanaux Belle Époque",
    title: "Artisans/Commerçants",
    description: "Proposez vos services à la communauté locale et boostez votre visibilité.",
  },
];

const ForWhomSection = () => (
  <section id="pour-qui" className={styles.forWhomSection} aria-label="Pour qui s'adresse PlanetLs">
    <div className={styles.content}>
      <h2 className={styles.title}>Pour qui&nbsp;?</h2>
      <p className={styles.subtitle}>PlanetLs s’adresse à&nbsp;:</p>

      <ul className={styles.benefits}>
        {benefits.map((benefit, index) => (
          <li key={index}>
            <Image src={benefit.icon} alt={benefit.alt} width={48} height={48} />
            <strong>{benefit.title}</strong>
            <p>{benefit.description}</p>
          </li>
        ))}
      </ul>

      <div className={styles.heroActions}>
        <div className={styles.buttonsRow}>
          <CTAButton variant="primary" onClick={() => { }}>
            Proposer un service
          </CTAButton>
          <CTAButton variant="secondary" onClick={() => { }}>
            Rechercher un prestataire
          </CTAButton>
        </div>
        <a href="#fonctionnement" className={styles.ctaTertiary}>
          Découvrir comment ça marche
        </a>
      </div>

      <div className={styles.securityNote}>
        ✔️ Profils vérifiés &nbsp;|&nbsp; Paiement sécurisé &nbsp;|&nbsp; Inscription gratuite
      </div>
    </div>
  </section>
);

export default ForWhomSection;
