
import Image from "next/image";
import miniLogo from "../../../../../../public/icons/Mini_logo.svg"; 
import styles from "./ForWhomSection.module.scss";
// import CTAButton from "../../../Buttons/CTAButton/CTAButton";

const ForWhomSection = () => (
  <section id="pour-qui" className={styles.forWhomSection}>
    <div className={styles.content}>
      <h2 className={styles.title}>
        Pour qui&nbsp;?
        <span className={styles.sWithLogo}>
          <Image
            src={miniLogo}
            alt="Mini logo PlanetLs"
            width={32}
            height={32}
            className={styles.miniLogo}
          />
        </span>
      </h2>
      <p className={styles.subtitle}>
        PlanetLs s’adresse à&nbsp;:
      </p>
      <ul className={styles.benefits}>
        <li>
          <strong>Propriétaires</strong> : trouvez des profils vérifiés pour gérer, entretenir ou valoriser votre bien, en toute confiance.
        </li>
        <li>
          <strong>Concierges</strong> : développez votre activité, gérez vos missions et gagnez en autonomie.
        </li>
        <li>
          <strong>Artisans/Commerçants</strong> : proposez vos services à une communauté locale et boostez votre visibilité.
        </li>
      </ul>
      <div className={styles.heroActions}>
        <div className={styles.buttonsRow}>
          {/* <CTAButton variant="primary" onClick={() => { }}>
            Proposer un service
          </CTAButton>
          <CTAButton variant="secondary" onClick={() => { }}>
            Rechercher un prestataire
          </CTAButton> */}
        </div>
        <a href="#fonctionnement" className={styles.ctaTertiary}>
          Découvrir comment ça marche
        </a>
      </div>
      <div className={styles.securityNote}>
        <span>✔️ Profils vérifiés &nbsp;|&nbsp; Paiement sécurisé &nbsp;|&nbsp; Inscription gratuite</span>
      </div>
    </div>
  </section>
);

export default ForWhomSection;
