// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import {
  Inter,
  Montserrat,
  Cormorant_Garamond,
  Open_Sans,
} from "next/font/google";
import "./styles/main.scss";

import Providers from "./context/Providers";
import Header from "./components/layout/Header/Header";
import { SearchPopupProvider } from "./context/SearchPopupContext";
import MapPopup from "./components/layout/MapPopup/MapPopup";
import { ThemeProvider } from "./providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-title",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-primary",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

// =======================================================
// 🧾 METADATA
// =======================================================
export const metadata: Metadata = {
  title: {
    default: "PlanetLs",
    template: "%s | PlanetLs",
  },
  description:
    "Plateforme de mise en relation propriétaires, concierges, artisans et commerçants.",
  applicationName: "PlanetLs",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
};

// =======================================================
// 📱 VIEWPORT
// =======================================================
export const viewport: Viewport = {
  themeColor: "#f2c200ff",
};

// =======================================================
// 🌍 ROOT LAYOUT
// =======================================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${montserrat.variable} ${cormorant.variable} ${openSans.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <Providers>
            <SearchPopupProvider>
              <Header />
              <MapPopup />
              <main>{children}</main>
            </SearchPopupProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
