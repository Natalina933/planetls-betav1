import type { Metadata } from "next";
import "../app/styles/globals.css"; // Assure-toi que le chemin est correct selon ta structure
import Providers from "../app/context/Providers"; // Assure-toi que le chemin est correct selon ta structure
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
          {children}
        </Providers>
      </body>
    </html>
  );
}
