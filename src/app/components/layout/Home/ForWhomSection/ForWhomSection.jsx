import Image from "next/image";
import styles from "./ForWhomSection.module.scss";
import CTAButton from "@/app/components/common/buttons/CTAbutton/CTAButton";

const ForWhomSection = () => (
  <section id="pour-qui" className={styles.forWhomSection} aria-label="À qui s’adresse PlanetLS">
    <div className={styles.content}>
      <h2 className={styles.title}>Pour qui&nbsp;?</h2>
      <p className={styles.subtitle}>PlanetLS s’adresse à&nbsp;:</p>

      <div className={styles.blocks}>
        {/* 🔷 Bloc Homeowners */}
        <div className={styles.blockHomeowner}>
          <Image src="/icons/proprio_belle_epoque.png" alt="Icône Homeowners" width={64} height={64} className={styles.icon} />
          <h3>Homeowners</h3>
          <p>Propriétaire : Connectez-vous à des professionnels qualifiés pour gérer, entretenir ou valoriser votre propriété.</p>
          <CTAButton variant="primary">Trouver une conciergerie</CTAButton>
        </div>

        {/* 🟢 Bloc Property Managers */}
        <div className={styles.blockManager}>
          <Image src="/icons/concierges_belle_epoque.png" alt="Icône Property Managers" width={64} height={64} className={styles.icon} />
          <h3>Property Managers</h3>
          <p>Concierges : Développez votre activité, gérez vos missions en toute autonomie et accédez à plus de clients.</p>
          <CTAButton variant="primary">Développer mon réseau</CTAButton>
        </div>

        {/* 🟠 Bloc Partners */}
        <div className={styles.blockPartner}>
          <Image src="/icons/artisans_belle_epoque.png" alt="Icône Partners" width={64} height={64} className={styles.icon} />
          <h3>Partners</h3>
          <p>Proposez vos services aux acteurs de la location saisonnière et augmentez votre visibilité locale.</p>
          <CTAButton variant="primary">Proposer mon savoir-faire</CTAButton>
        </div>
      </div>

      <div className={styles.heroActions}>
        <div className={styles.buttonsRow}>
          <CTAButton variant="primary">Proposer un service</CTAButton>
          <CTAButton variant="secondary">Rechercher un prestataire</CTAButton>
        </div>
        <a href="#fonctionnement" className={styles.ctaTertiary}>Découvrir comment ça marche</a>
      </div>

      <div className={styles.securityNote}>
        ✔️ Profils vérifiés &nbsp;|&nbsp; Paiement sécurisé &nbsp;|&nbsp; Inscription gratuite
      </div>
    </div>
  </section>
);

export default ForWhomSection;
