// src/app/(dashboard)/layout.tsx

'use client'; // Gardez cette directive pour le test

import { SessionProvider } from 'next-auth/react';
import React from 'react';

// Retirez tous les autres imports (Sidebar, styles SCSS, etc.)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // Retirez tous les hooks (useState, useEffect) pour ce test
    
    return (
        <SessionProvider>
            {/* Laissez le conteneur principal */}
            <div style={{ padding: '20px', border: '2px solid red' }}>
                <p>✅ Layout Test OK (Si ce texte s&apos;affiche)</p>
                {/* L'enfant (votre page.tsx) est rendu ici */}
                {children}
            </div>
        </SessionProvider>
    );
}