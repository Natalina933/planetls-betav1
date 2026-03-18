import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter l'equipe PlanetLS.",
};

export default function ContactPage() {
  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Contact</h1>
      <p>Vous pouvez nous ecrire pour une question produit ou un accompagnement.</p>
      <p>
        Email: <a href="mailto:contact@planetls.fr">contact@planetls.fr</a>
      </p>
      <p>
        <Link href="/home">Retour a l&apos;accueil</Link>
      </p>
    </section>
  );
}
