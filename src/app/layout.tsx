import type { Metadata, Viewport } from "next";
import {
  Inter,
  Montserrat,
  Cormorant_Garamond,
  Open_Sans,
} from "next/font/google";
import "./styles/main.scss";

import Providers from "./context/Providers";
import AppChrome from "./components/layout/AppChrome/AppChrome";
import { SearchPopupProvider } from "./context/SearchPopupContext";
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

export const metadata: Metadata = {
  title: {
    default: "PlanetLs",
    template: "%s | PlanetLs",
  },
  description:
    "Plateforme de mise en relation propriétaires, concierges, artisans et commerçants.",
  applicationName: "PlanetLs",
  metadataBase: new URL("https://planetls-betav1.vercel.app"),
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icons/Mini_logo.svg",
    apple: "/icons/Mini_logo.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#f2c200ff",
};

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
        <Providers>
          <ThemeProvider>
            <SearchPopupProvider>
              <AppChrome />
              <main>{children}</main>
            </SearchPopupProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

