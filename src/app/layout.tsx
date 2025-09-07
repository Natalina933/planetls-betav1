import type { Metadata, Viewport } from "next";
import { Inter, Montserrat, Cormorant_Garamond, Open_Sans } from 'next/font/google';
import "./styles/main.scss";
import Providers from "./context/Providers";
import Header from "./components/layout/Header/Header";
import { SearchPopupProvider } from "./context/SearchPopupContext";
import MapPopup from "./components/layout/MapPopup/MapPopup";
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});
const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-title',
    display: 'swap',
});
const cormorant = Cormorant_Garamond({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-primary',
    display: 'swap',
});
const openSans = Open_Sans({
    subsets: ['latin'],
    variable: '--font-text',
    display: 'swap',
});

// PATCH PWA METADATA
export const metadata: Metadata = {
    title: {
        default: 'PlanetLs',
        template: '%s | PlanetLs'
    },
    description: "Plateforme de mise en relation propriétaires, concierges, artisans et commerçants.",
    keywords: ['propriétaires', 'concierges', 'artisans', 'commerçants', 'mise en relation'],
    authors: [{ name: 'PlanetLs Team' }],
    creator: 'PlanetLs',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/icons/icon-192x192.png'
    },
    manifest: '/manifest.json',//app web installable, hors-ligne, mobile-friendly (PWA)
    applicationName: 'PlanetLs',
    appleWebApp: {
        capable: true,
        title: "PlanetLs",
        statusBarStyle: "default"
    },
    openGraph: {
        type: 'website',
        locale: 'fr_FR',
        // url: 'https://votre-domaine.com',
        title: 'PlanetLs',
        description: 'Plateforme de mise en relation propriétaires, concierges, artisans et commerçants.',
        siteName: 'PlanetLs',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    twitter: {
        card: "summary",
        title: "PlanetLs"
    }
};

export const viewport: Viewport = {
    themeColor: "#f2c200ff"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="fr"
            className={`${inter.variable} ${montserrat.variable} ${cormorant.variable} ${openSans.variable}`}
        >
            <body suppressHydrationWarning={true}>
                <Providers>
                    <SearchPopupProvider>
                        <Header />
                        <main>{children}</main>
                        <MapPopup /> {/* Popup global */}
                    </SearchPopupProvider>
                </Providers>
            </body>
        </html>
    );
}