"use client";

import dynamic from 'next/dynamic';
import Footer from '../components/layout/Footer/Footer';
import HeroSection from '../components/layout/Home/Hero/HeroSection';
import { HowItWorksSection } from "../components/layout/Home/HowItWorksSection/HowItWorksSection";
import FirstVisit from '../components/layout/Home/FirstVisit/FirstVisit';
import Head from 'next/head';
import VideoIntro from '../components/layout/Home/VideoIntro/VideoIntro';
import ServicesSection from '../components/layout/Home/ServicesSection/ServicesSection';
// import ForWhomSection from '../components/layout/Home/ForWhomSection/ForWhomSection';
// import { ShopSection } from '../components/layout/Home/ShopSection/ShopSection';
// import PromotePlatformSection from '../components/layout/Home/PromotePlatformSection/PromotePlatformSection'; // <-- NOUVEAU
// import {TrustSection} from '../components/layout/Home/TrustSection/TrustSection';
// import BlogNewsSection from '../components/layout/Home/BlogNewsSection/BlogNewsSection';

// Chargement dynamique côté client uniquement
const MapWithSearch = dynamic(
    () => import('../components/layout/Home/MapWithSearch/MapWithSearch'),
    { ssr: false }
);

export default function HomePage() {
    return (
        <>
            <Head>
                <title>PlanetLS | Location saisonnière intelligente</title>
                <meta name="description" content="Connectez propriétaires et conciergeries indépendantes pour une gestion locative optimisée. Inscription gratuite." />
                <meta name="keywords" content="location saisonnière, conciergerie, propriétaires, gestion locative, PlanetLS" />
                <meta property="og:image" content="/images/planetls-banner.png" />
            </Head>

            <div>
                <main>
                    <FirstVisit />
                    <HeroSection />
                    <MapWithSearch />
                    <ServicesSection />
                    <HowItWorksSection />
                    <VideoIntro />
                    {/* <ForWhomSection />
                    <PromotePlatformSection />
                    <TrustSection />
                    <BlogNewsSection />
                    <ShopSection /> */}
                    <Footer />
                </main>
            </div>
        </>
    );
}