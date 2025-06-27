"use client";

import Head from 'next/head';
import Footer from '../components/layout/Footer';
import CTAButton from '../components/common/Bouton';
import ServiceList from '../services/ServiceList';
import TestimonialList from '../components/testimonials/TestimonialList';
import BlogPreviewList from '../components/blog/BlogPreviewList';

const HomePage = () => {
    return (
        <div>
            <Head>
                <title>PlanetLs - Votre Connexion Locale</title>
                <meta name="description" content="Bienvenue sur PlanetLs !" />
                <link rel="icon" href="/favicon.ico" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
            </Head>

            <main style={{ minHeight: '70vh' }}>
                <section className="hero" style={{ textAlign: 'center', padding: '3rem 1rem 2rem 1rem' }}>
                    <h1>Plateforme de gestion et mise en relation pour la location saisonnière</h1>
                    <p>Propriétaires, Concierges & Artisans : simplifiez et optimisez vos échanges avec PlanetLs.</p>
                    <CTAButton style={{ marginTop: '1.5rem' }} onClick={() => { /* TODO: handle click */ }}>
                        Découvrir la plateforme
                    </CTAButton>
                </section>

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
