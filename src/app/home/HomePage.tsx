"use client";

import Footer from "../components/layout/Footer/Footer";
import FirstVisit from "../components/layout/Home/FirstVisit/FirstVisit";
import ForWhomSection from "../components/layout/Home/ForWhomSection/ForWhomSection";
import HeroSection from "../components/layout/Home/Hero/HeroSection";
import { HowItWorksSection } from "../components/layout/Home/HowItWorksSection/HowItWorksSection";
import BlogNewsSection from "../components/layout/Home/BlogNewsSection/BlogNewsSection";
import PromotePlatformSection from "../components/layout/Home/PromotePlatformSection/PromotePlatformSection";
import RecommendedConciergesSection from "../components/layout/Home/RecommendedConciergesSection/RecommendedConciergesSection";
import ServiceList from "../components/layout/Home/SectionBlock/services/ServiceList";
import { ShopSection } from "../components/layout/Home/ShopSection/ShopSection";
import { TrustSection } from "../components/layout/Home/TrustSection/TrustSection";
import VideoIntro from "../components/layout/Home/VideoIntro/VideoIntro";

export default function HomePage() {
  return (
    <main>
      <FirstVisit />
      <HeroSection />
      <HowItWorksSection />
      <ServiceList />
      <VideoIntro />
      <ForWhomSection />
      <PromotePlatformSection />
      <RecommendedConciergesSection />
      <TrustSection />
      <BlogNewsSection />
      <ShopSection />
      <Footer />
    </main>
  );
}
