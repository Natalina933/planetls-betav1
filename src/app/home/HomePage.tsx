"use client";

import CategoryCarousel from "../components/layout/Home/Hero/CategoryCarousel";
import Footer from "../components/layout/Footer/Footer";
import FirstVisit from "../components/layout/Home/FirstVisit/FirstVisit";
import ForWhomSection from "../components/layout/Home/ForWhomSection/ForWhomSection";
import HeroSection from "../components/layout/Home/Hero/HeroSection";
import { HowItWorksSection } from "../components/layout/Home/HowItWorksSection/HowItWorksSection";
import BlogNewsSection from "../components/layout/Home/BlogNewsSection/BlogNewsSection";
import { HumanitarianImpactSection } from "../components/layout/Home/HumanitarianImpactSection/HumanitarianImpactSection";
import PromotePlatformSection from "../components/layout/Home/PromotePlatformSection/PromotePlatformSection";
import RecommendedConciergesSection from "../components/layout/Home/RecommendedConciergesSection/RecommendedConciergesSection";
import ServiceList from "../components/layout/Home/SectionBlock/services/ServiceList";
import { ShopSection } from "../components/layout/Home/ShopSection/ShopSection";
import { TrustSection } from "../components/layout/Home/TrustSection/TrustSection";
import VideoIntro from "../components/layout/Home/VideoIntro/VideoIntro";
import styles from "./HomePage.module.scss";

export default function HomePage() {
  return (
    <div>
      <main>
        <FirstVisit />
        <HeroSection />
        <HowItWorksSection />
        <ServiceList />
        <VideoIntro />
        <ForWhomSection />
        <section className={`${styles.carouselSection} theme-texture-section theme-texture-section--soft`}>
          <div className={styles.carouselSectionHeader}>
            <span className={styles.carouselEyebrow}>Vue d&apos;ensemble</span>
            <h2>Découvrez les profils et usages qui gravitent autour de PlanetLS</h2>
            <p>
              Le carousel descend plus bas dans la page pour laisser le hero respirer, tout en gardant
              un aperçu vivant de l&apos;écosystème.
            </p>
          </div>
          <div className={styles.carouselPanel}>
            <CategoryCarousel />
          </div>
        </section>
        <PromotePlatformSection />
        <HumanitarianImpactSection />
        <RecommendedConciergesSection />
        <TrustSection />
        <BlogNewsSection />
        <ShopSection />
        <Footer />
      </main>
    </div>
  );
}
