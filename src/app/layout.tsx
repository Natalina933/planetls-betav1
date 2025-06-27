import type { Metadata } from "next";
import "./styles/globals.css";
import Providers from "./context/Providers";
import Header from "./components/layout/Header"; // <-- Ajout de l'import

export const metadata: Metadata = {
  title: "PlanetLs",
  description: "Plateforme de mise en relation propriétaires, concierges, artisans et commerçants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Header /> {/* Le header sera affiché sur toutes les pages */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
