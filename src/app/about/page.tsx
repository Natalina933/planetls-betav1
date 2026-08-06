import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos",
  description: "Présentation de PlanetLS et de sa mission produit.",
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>À propos de PlanetLS</h1>
      <p>
        PlanetLS est une plateforme de mise en relation entre propriétaires, conciergeries et
        partenaires terrain de la location courte durée.
      </p>
      <p>
        Notre objectif est de simplifier le parcours : trouver un partenaire fiable, lancer une
        mission rapidement et suivre la relation dans la durée.
      </p>
      <p>
        <Link href="/parcours">Choisir mon parcours</Link>
      </p>
    </main>
  );
}
