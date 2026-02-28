import styles from "./GestionPlatformSection.module.scss";
import React from "react";

// Extraction d'un composant OfferCard pour la reutilisabilite, la performance et la clarte
function OfferCard({
    id,
    name,
    desc,
    price,
    priceLabel,
    details,
    highlights,
    ctaHref,
    ctaLabel,
    ariaNoteId,
}) {
    return (
        <article
            className={styles.offerCard}
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-details ${ariaNoteId ? ariaNoteId : ""}`}
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
                <span className={price === "Sur demande" ? styles.onDemand : styles.percent}>
                    {price}
                </span>
                <br />
                <span className={styles.suffix}>{priceLabel}</span>
            </div>
            {highlights && (
                <div className={styles.includedBox} id={`${id}-details`}>
                    {highlights.map((highlight, idx) => (
                        <div key={idx}>{highlight}</div>
                    ))}
                </div>
            )}
            <ul className={styles.offerList}>
                {details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                ))}
            </ul>
            <a
                href={ctaHref}
                className={styles.offerBtn}
                aria-label={`${ctaLabel} pour l'offre ${name}`}
            >
                {ctaLabel}
            </a>
        </article>
    );
}

const OFFERS = [
    {
        id: "standard",
        name: "Standard",
        desc: (
            <>
                Trouvez des professionnels qualifies, rapidement et en autonomie.
                <br />
                <b>Recommande pour particuliers ou petites structures</b>
            </>
        ),
        price: "5%",
        priceLabel: (
            <>
                Frais de service<sup>*</sup>
            </>
        ),
        details: [
            "Acces direct a la communaute PlanetLs",
            "Contractualisation et paiement en ligne",
            "Missions et profils proteges",
        ],
        ctaHref: "/complete-registration",
        ctaLabel: "Commencer",
    },
    {
        id: "advanced",
        name: "Advanced",
        desc: (
            <>
                Optimisez votre experience avec un accompagnement personnalise.
                <br />
                <b>Recommande pour structures en croissance</b>
            </>
        ),
        price: "9%",
        priceLabel: (
            <>
                Frais de service<sup>*</sup>
            </>
        ),
        highlights: [
            "Solution de sourcing avance",
            "Account manager dedie",
            "Assurance remplacement en 48h",
        ],
        details: [
            "Acces direct a la communaute PlanetLs",
            "Contractualisation et paiement en ligne",
            "Missions et profils proteges",
        ],
        ctaHref: "/contact",
        ctaLabel: "Nous contacter",
    },
    {
        id: "corporate",
        name: "Corporate",
        desc: (
            <>
                Beneficiez de facilites de gestion et de securisation adaptees a votre
                entreprise.
            </>
        ),
        price: "Sur demande",
        priceLabel: <abbr title="Contactez notre equipe pour un devis personnalise">Offre sur mesure</abbr>,
        highlights: [
            "Paiement sur facture",
            "Solutions personnalisees (contractualisation, accompagnement)",
            "Outil de reporting et de pilotage entreprise",
        ],
        details: [],
        ctaHref: "/contact",
        ctaLabel: "Nous contacter",
    },
];

export default function GestionPlatformSection() {
    return (
        <section className={styles.gestionSection} aria-labelledby="gestion-title">
            <div className={styles.container}>
                <header>
                    <h2 id="gestion-title" className={styles.mainTitle}>
                        Nos offres plateforme de mise en relation
                    </h2>
                    <p className={styles.subtitle}>
                        Une solution adaptee a tous vos projets&nbsp;
                        <span aria-label="Type d'utilisateurs" className={styles.gestionTypes}>
                            <span className={styles.proprietaire}>Proprietaire</span>{" "}
                            <span className={styles.conciergerie}>Conciergerie</span>{" "}
                            <span className={styles.artisan}>Artisan</span>
                        </span>
                    </p>
                    <aside className={styles.inscriptionBlock} aria-labelledby="free-inscription-title">
                        <h3 id="free-inscription-title" className={styles.freeTitle}>
                            Inscription Gratuite
                        </h3>
                        <p className={styles.freeDesc}>
                            <span className={styles.freeHighlight}>
                                Grace a la carte, mise en relation facile avec tous les
                                intervenants acteurs de la location courte duree.
                            </span>
                            <br />
                            Vous pouvez utiliser le site gratuitement mais avec certaines
                            fonctionnalites reduites.
                        </p>
                    </aside>
                </header>
                <div className={styles.offersGrid} role="list">
                    {OFFERS.map((offer) => (
                        <OfferCard key={offer.id} ariaNoteId="gestion-note" {...offer} />
                    ))}
                </div>
                <div className={styles.mention} id="gestion-note">
                    <span>
                        <abbr title="Tarifs hors frais eventuels de transaction.">*Tarifs</abbr>{" "}
                        selon conditions.
                    </span>
                </div>
            </div>
        </section>
    );
}
