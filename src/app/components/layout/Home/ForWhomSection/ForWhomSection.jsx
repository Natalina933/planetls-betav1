import Image from "next/image";
import styles from "./ForWhomSection.module.scss";
import CTAButton from "@/common/Buttons/CTAButton/CTAButton"

const ForWhomSection = () => (
  <section id="pour-qui" className={styles.forWhomSection} aria-label="À qui s’adresse PlanetLS">
    <div className={styles.content}>
      <h2 className={styles.planetLSTitle}>Rejoignez PlanetLS</h2>
      <p className={styles.planetLSIntro}>
        Une plateforme collaborative qui connecte tous les acteurs de la location saisonnière.
      </p>

      <div className={styles.blocks}>
        {/* 🔷 Bloc Homeowners */}
        <div className={styles.blockHomeowner}>
          <Image src="/icons/proprio_belle_epoque.png" alt="Icône Homeowners" width={64} height={64} className={styles.icon} />
          <h3>Homeowners</h3>
          <p>
            Vous êtes propriétaire d’un bien en location saisonnière ? Rejoignez PlanetLS et simplifiez votre gestion locative.
            Accédez à une sélection de conciergeries indépendantes de confiance, prêtes à valoriser votre bien, optimiser vos revenus,
            et offrir une expérience exceptionnelle à vos voyageurs. Notre réseau vous connecte aux bons professionnels, au bon moment.
          </p>
          <CTAButton variant="primary">Trouver une conciergerie</CTAButton>
        </div>

        {/* 🟢 Bloc Property Managers */}
        <div className={styles.blockManager}>
          <Image src="/icons/concierges_belle_epoque.png" alt="Icône Property Managers" width={64} height={64} className={styles.icon} />
          <h3>Property Managers</h3>
          <p>
            Vous gérez des biens en location courte durée ou souhaitez élargir votre clientèle ? PlanetLS vous aide à développer votre réseau local
            et à renforcer votre activité. Grâce à notre plateforme, vous pouvez proposer vos services en toute autonomie,
            gérer vos missions, et échanger avec des propriétaires à la recherche de partenaires fiables et professionnels.
          </p>
          <CTAButton variant="primary">Développer mon réseau</CTAButton>
        </div>

        {/* 🟠 Bloc Partners */}
        <div className={styles.blockPartner}>
          <Image src="/icons/artisans_belle_epoque.png" alt="Icône Partners" width={64} height={64} className={styles.icon} />
          <h3>Partners</h3>
          <p>
            Vous êtes artisan, commerçant ou professionnel de proximité ? PlanetLS vous permet de mettre en avant votre savoir-faire
            auprès d’une communauté active dans la location saisonnière. Développez votre visibilité locale, proposez vos services aux propriétaires et conciergeries,
            et contribuez à une expérience voyageur unique et authentique.
          </p>
          <CTAButton variant="primary">Proposer mon savoir-faire</CTAButton>
        </div>
      </div>
      <span>Notre mission est de créer un pont fiable et efficace, permettant aux propriétaires de trouver la conciergerie idéale pour leurs biens, et aux concierges de développer leur portefeuille client avec des opportunités qualifiées.</span>
      <div className={styles.heroActions}>
        <div className={styles.buttonsRow}>
          <CTAButton variant="primary">Proposer un service</CTAButton>
          <CTAButton variant="secondary">Rechercher un prestataire</CTAButton>
        </div>
        <a href="#fonctionnement" className={styles.ctaTertiary}>Découvrir comment ça marche</a>
      </div>
    </div>
  </section>
);

export default ForWhomSection;
