"use client";

import dynamic from 'next/dynamic';
import Footer from '../components/layout/Footer/Footer';
import ServiceList from '../services/ServiceList';
import TestimonialList from '../components/testimonials/TestimonialList';
import BlogPreviewList from '../components/blog/BlogPreviewList';
import HeroSection from '../components/layout/Home/Hero/HeroSection';
import ForWhomSection from '../components/layout/Home/ForWhomSection/ForWhomSection';
import styles from './page.module.scss';
import { HowItWorksSection } from "../components/layout/Home/HowItWorksSection/HowItWorksSection";
import { ShopSection } from '../components/layout/Home/ShopSection/ShopSection';
import {SocialMediaBar} from '../components/layout/Home/SocialMediaBar/SocialMediaBar';
// import TrustSection from '../components/layout/Home/TrustSection/TrustSection';

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
                <ForWhomSection />
                <HowItWorksSection />
                <ShopSection />
                <section className={styles.section}>
                    <h2 className={styles.centeredTitle}>Nos services</h2>
                    <ServiceList />
                </section>
                {/* <TrustSection /> */}
                <section className={styles.section}>
                    <h2 className={styles.centeredTitle}>Ils nous font confiance</h2>
                    <TestimonialList />
                </section>
                <section className={styles.section}>
                    <h2 className={styles.centeredTitle}>Derniers conseils & actualités</h2>
                    <BlogPreviewList />
                </section>
                <SocialMediaBar />
                <Footer />
            </main>
        </div>
    );
}