"use client";
import dynamic from 'next/dynamic'; import Head from 'next/head';
import Footer from '../components/layout/Footer/Footer';
import ServiceList from '../services/ServiceList';
import TestimonialList from '../components/testimonials/TestimonialList';
import BlogPreviewList from '../components/blog/BlogPreviewList';
import HeroSection from '../components/layout/Home/Hero/HeroSection';

const MapWithSearch = dynamic(() => import('../components/layout/Home/MapWithSearch/MapWithSearch'), {
    ssr: false,
});
const HomePage = () => {
    return (
        <div>
            <Head>
                <title>PlanetLs - Votre Connexion Locale</title>
                <meta name="description" content="Bienvenue sur PlanetLs !" />
                <link rel="icon" href="/favicon.ico" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
            </Head>

            <main>
                <HeroSection />
                <MapWithSearch />

                <section className="services" style={{ marginTop: '3rem' }}>
                    <h2 style={{ textAlign: 'center' }}>Nos services</h2>
                    <ServiceList />
                </section>

                <section className="testimonials" style={{ marginTop: '3rem' }}>
                    <h2 style={{ textAlign: 'center' }}>Ils nous font confiance</h2>
                    <TestimonialList />
                </section>

                <section className="blog" style={{ marginTop: '3rem' }}>
                    <h2 style={{ textAlign: 'center' }}>Derniers conseils & actualités</h2>
                    <BlogPreviewList />
                </section>

                <Footer />
            </main>
        </div>
    );
};

export default HomePage;
