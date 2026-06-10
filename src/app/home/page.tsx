import type { Metadata } from "next";
import HomeContent from "./HomePage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Plateforme de gestion location courte durée",
  description:
    "Reliez propriétaires, conciergeries et artisans sur une seule plateforme pour mieux gérer la location courte durée.",
  keywords: [
    "location courte durée",
    "conciergerie",
    "propriétaires",
    "gestion locative",
    "PlanetLs",
  ],
  openGraph: {
    title: "PlanetLs | Plateforme de gestion location courte durée",
    description:
      "Reliez propriétaires, conciergeries et artisans sur une seule plateforme pour mieux gérer la location courte durée.",
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
