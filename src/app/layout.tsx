// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Montserrat, Cormorant_Garamond, Open_Sans } from 'next/font/google';
import "./styles/main.scss";
import Providers from "./context/Providers";
import Header from "./components/layout/Header/Header";

// Configuration des fonts
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

export const metadata: Metadata = {
    title: {
        default: 'PlanetLs',
        template: '%s | PlanetLs'
    },
    description: "Plateforme de mise en relation propriétaires, concierges, artisans et commerçants.",
    keywords: ['propriétaires', 'concierges', 'artisans', 'commerçants', 'mise en relation'],
    authors: [{ name: 'PlanetLs Team' }],
    creator: 'PlanetLs',
    openGraph: {
        type: 'website',
        locale: 'fr_FR',
        url: 'https://votre-domaine.com',
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
        >
            <body suppressHydrationWarning={true}>
                <Providers>
                    <Header />
                    <main>
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}