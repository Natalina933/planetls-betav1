import type { Metadata } from "next";
import HomeContent from "./HomePage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Location saisonnière intelligente",
  description:
    "Connectez propriétaires et conciergeries indépendantes pour une gestion locative optimisée.",
  keywords: [
    "location saisonnière",
    "conciergerie",
    "propriétaires",
    "gestion locative",
    "PlanetLs",
  ],
  openGraph: {
    title: "PlanetLs | Location saisonnière intelligente",
    description:
      "Connectez propriétaires et conciergeries indépendantes pour une gestion locative optimisée.",
    images: ["/images/hero-warmv2.jpg"],
  },
};

export default function HomePage() {
  return (
    <main>
      <HomeContent />
    </main>
  );
}
