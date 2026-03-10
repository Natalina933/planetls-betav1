import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "A propos",
  description: "Presentation de PlanetLS et de sa mission produit.",
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>A propos de PlanetLS</h1>
      <p>
        PlanetLS est une plateforme de mise en relation entre proprietaires, conciergeries et
        partenaires terrain de la location courte duree.
      </p>
      <p>
        Notre objectif est de simplifier le parcours: trouver un partenaire fiable, lancer une
        mission rapidement et suivre la relation dans la duree.
      </p>
      <p>
        <Link href="/parcours">Choisir mon parcours</Link>
      </p>
    </main>
  );
}
