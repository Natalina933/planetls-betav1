// pages/index.jsx
import Head from 'next/head';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// Vous pouvez importer d'autres composants de section ici plus tard
// import HeroSection from '../components/HeroSection';
// import ServicesSection from '../components/ServicesSection';
// ...

const HomePage = () => {
    return (
        <div>
            <Head>
                <title>PlanetLs - Votre Connexion Locale</title>
                <meta name="description" content="Bienvenue sur PlanetLs !" />
                <link rel="icon" href="/favicon.ico" />
                {/* Assurez-vous que votre CSS est bien lié */}
                {/* <link rel="stylesheet" href="/styles.css" /> */}
                {/* N'oubliez pas Font Awesome pour les icônes */}
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
            </Head>

            <Header />
            <main>
                {/* Ici viendront les autres sections de votre page d'accueil */}
                <section style={{ padding: '100px 20px', textAlign: 'center' }}>
                    <h2>Bienvenue sur PlanetLs !</h2>
                    <p>Ceci est le contenu principal de votre page.</p>
                    <p>Vous pouvez ajouter ici vos sections Hero, Services, etc.</p>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default HomePage;