import type { Metadata } from "next";
import "./styles/main.scss";
import "./styles/abstracts/variables.css";
import Providers from "./context/Providers";
import Header from "./components/layout/Header/Header";

export const metadata: Metadata = {
  title: "PlanetLs",
  description: "Plateforme de mise en relation propriétaires, concierges, artisans et commerçants.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning={true}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
