import Head from 'next/head';
import Footer from '../components/layout/Footer';
import styles from './page.module.css';

const HomePage = () => {
    return (
        <div>
            <Head>
                <title>PlanetLs - Votre Connexion Locale</title>
                <meta name="description" content="Bienvenue sur PlanetLs !" />
                <link rel="icon" href="/favicon.ico" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
            </Head>

            <main className={styles.main}>
                <section className={styles.section}>
                    <h1 className={styles.title}>
                        Plateforme de gestion et mise en relation entre les acteurs de la location de saisonnière
                    </h1>
                    <h2 className={styles.subtitle}>
                        Propriétaires, Concierges & Artisans
                    </h2>
                    <p className={styles.intro}>
                        Bienvenue sur <strong>PlanetLs</strong>, la plateforme dédiée à simplifier et optimiser la relation entre propriétaires exigeants, concierges professionnels et artisans commerçants locaux.
                    </p>
                    <aside className={styles.mission}>
                        <strong>💡 Notre mission :</strong> créer un pont fiable et efficace, permettant aux propriétaires de trouver la conciergerie idéale pour leurs biens, et aux concierges de développer leur portefeuille client avec des opportunités qualifiées.
                    </aside>
                    <h3 className={styles.sectionTitle}>🗓️ Calendrier Prévisionnel (Haut Niveau)</h3>
                    <p style={{ color: '#444' }}>
                        🚀 Bienvenue sur la page de construction de PlanetLs ! Ici, nous allons transformer notre vision en réalité. C'est l'espace dédié à toutes les étapes techniques, aux défis et aux succès de notre développement en <strong>React</strong> pour le front-end et <strong>PHP</strong> pour le back-end.
                    </p>
                    <p style={{ color: '#444' }}>
                        Notre objectif : créer une plateforme fluide et robuste qui connecte efficacement propriétaires et concierges. Accrochons-nous !
                    </p>
                    <h3 className={styles.sectionTitle}>🎯 Nos Objectifs pour cette Phase</h3>
                    <ul className={styles.objectives}>
                        <li>Mettre en place une <strong>base technique solide</strong> et évolutive.</li>
                        <li>Développer une <strong>interface utilisateur intuitive et réactive</strong> avec React.</li>
                        <li>Construire un <strong>back-end PHP performant</strong> pour gérer les données et les interactions.</li>
                        <li>Assurer la <strong>sécurité et la fiabilité</strong> de la plateforme.</li>
                    </ul>
                </section>
                <Footer />
            </main>
        </div>
    );
};

export default HomePage;
