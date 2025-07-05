"use client";
import dynamic from 'next/dynamic';
import Footer from '../components/layout/Footer/Footer';
import ServiceList from '../services/ServiceList';
import TestimonialList from '../components/testimonials/TestimonialList';
import BlogPreviewList from '../components/blog/BlogPreviewList';
import HeroSection from '../components/layout/Home/Hero/HeroSection';
import styles from './page.module.scss';

// Chargement dynamique côté client uniquement
const MapWithSearch = dynamic(
    () => import('../components/layout/Home/MapWithSearch/MapWithSearch'),
    { ssr: false }
);

export default function HomePage() {
    return (
        <div>
                      

            <main>
                <HeroSection />
                <MapWithSearch />

                <section className={styles.section}>
                    <h2 className={styles.centeredTitle}>Nos services</h2>
                    <ServiceList />
                </section>

                <section className={styles.section}>
                    <h2 className={styles.centeredTitle}>Ils nous font confiance</h2>
                    <TestimonialList />
                </section>

                <section className={styles.section}>
                    <h2 className={styles.centeredTitle}>Derniers conseils & actualités</h2>
                    <BlogPreviewList />
                </section>

                <Footer />
            </main>
        </div>
    );
}
