import styles from "./GestionPlatformSection.module.scss";
import React from "react";

// Extraction d’un composant OfferCard pour la réutilisabilité, la performance et la clarté
function OfferCard({ id, name, desc, price, priceLabel, details, highlights, ctaHref, ctaLabel, ariaNoteId }) {
    return (
        <article
            className={styles.offerCard}
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-details ${ariaNoteId ? ariaNoteId : ''}`}
            tabIndex={0}
            role="listitem"
        >
            <header>
                <h3 id={`${id}-title`} className={styles.offerName}>
                    {name}
                </h3>
            </header>
            <p className={styles.offerDesc}>{desc}</p>
            <div className={styles.offerTarif}>
                <span className={price === "Sur demande" ? styles.onDemand : styles.percent}>{price}</span><br />
                <span className={styles.suffix}>{priceLabel}</span>
            </div>
            {highlights &&
                <div className={styles.includedBox} id={`${id}-details`}>
                    {highlights.map((h, idx) => (
                        <div key={idx}>{h}</div>
                    ))}
                </div>
            }
            <ul className={styles.offerList}>
                {details.map((li, i) =>
                    <li key={i}>{li}</li>
                )}
            </ul>
            <a
                href={ctaHref}
                className={styles.offerBtn}
                aria-label={`${ctaLabel} pour l’offre ${name}`}
            >
                {ctaLabel}
            </a>
        </article>
    );
}

// Liste d'offres pour map et performance
const OFFERS = [
    {
        id: "standard",
        name: "Standard",
        desc: <>Trouvez des professionnels qualifiés, rapidement et en autonomie.<br /><b>Recommandé pour particuliers ou petites structures</b></>,
        price: "5%",
        priceLabel: <>Frais de service<sup>*</sup></>,
        details: [
            "Accès direct à la communauté PlanetLs",
            "Contractualisation et paiement en ligne",
            "Missions et profils protégés",
        ],
        ctaHref: "/complete-registration",
        ctaLabel: "Commencer",
    },
    {
        id: "advanced",
        name: "Advanced",
        desc: <>Optimisez votre expérience avec un accompagnement personnalisé.<br /><b>Recommandé pour structures en croissance</b></>,
        price: "9%",
        priceLabel: <>Frais de service<sup>*</sup></>,
        highlights: [
            "✓ Solution de sourcing avancé",
            "✓ Account manager dédié",
            "✓ Assurance remplacement en 48h"
        ],
        details: [
            "Accès direct à la communauté PlanetLs",
            "Contractualisation et paiement en ligne",
            "Missions et profils protégés",
        ],
        ctaHref: "/contact",
        ctaLabel: "Nous contacter",
    },
    {
        id: "corporate",
        name: "Corporate",
        desc: <>Bénéficiez de facilités de gestion et de sécurisation adaptées à votre entreprise.</>,
        price: "Sur demande",
        priceLabel: <abbr title="Contactez notre équipe pour un devis personnalisé">Offre sur mesure</abbr>,
        highlights: [
            "✓ Paiement sur facture",
            "✓ Solutions personnalisées (contractualisation, accompagnement)",
            "✓ Outil de reporting et de pilotage entreprise"
        ],
        details: [],
        ctaHref: "/contact",
        ctaLabel: "Nous contacter",
    }
];

export default function GestionPlatformSection() {
    return (
        <section
            className={styles.gestionSection}
            aria-labelledby="gestion-title"
        >
            <div className={styles.container}>
                <header>
                    <h2 id="gestion-title" className={styles.mainTitle}>
                        Nos offres plateforme de mise en relation
                    </h2>
                    <p className={styles.subtitle}>
                        Une solution adaptée à tous vos projets&nbsp;
                        <span aria-label="Type d'utilisateurs" className={styles.gestionTypes}>
                            <span className={styles.proprietaire}>Propriétaire</span>{" "}
                            <span className={styles.conciergerie}>Conciergerie</span>{" "}
                            <span className={styles.artisan}>Artisan</span>
                        </span>
                    </p>
                    <aside className={styles.inscriptionBlock} aria-labelledby="free-inscription-title">
                        <h3 id="free-inscription-title" className={styles.freeTitle}>Inscription Gratuite</h3>
                        <p className={styles.freeDesc}>
                            <span className={styles.freeHighlight}>
                                Grâce à la carte, mise en relation facile avec tous les intervenants acteurs de la location courte durée.
                            </span>
                            <br />
                            Vous pouvez utiliser le site gratuitement mais avec certaines fonctionnalités réduites.
                        </p>
                    </aside>
                </header>
                <div className={styles.offersGrid} role="list">
                    {OFFERS.map((offer, idx) => (
                        <OfferCard
                            key={offer.id}
                            ariaNoteId="gestion-note"
                            {...offer}
                        />
                    ))}
                </div>
                <div className={styles.mention} id="gestion-note">
                    <span>
                        <abbr title="Tarifs hors frais éventuels de transaction.">*Tarifs</abbr> selon conditions.
                    </span>
                </div>
            </div>
        </section>
    );
}
