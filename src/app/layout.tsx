import type { Metadata, Viewport } from "next";
import "./styles/main.scss";

import Providers from "./context/Providers";
import AppChrome from "./components/layout/AppChrome/AppChrome";
import { SearchPopupProvider } from "./context/SearchPopupContext";
import { ThemeProvider } from "./providers/ThemeProvider";

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
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <ThemeProvider>
            <SearchPopupProvider>
              <AppChrome />
              {children}
            </SearchPopupProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
