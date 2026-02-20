'use client';

import { createContext, useState, useContext, useEffect } from 'react';

export const ThemeContext = createContext();

// Thèmes disponibles
export const THEMES = {
    LIGHT: 'light',
    SEPIA: 'sepia',
    MUCHA_DARK: 'mucha-dark',
};

// Labels affichables pour l'UI
export const THEME_LABELS = {
    light: '🌞 Mode clair',
    sepia: '📜 Sepia 1900',
    'mucha-dark': '🌙 Mucha Nocturne',
};

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    const [isMounted, setIsMounted] = useState(false);

    // Initialiser au premier rendu côté client
    useEffect(() => {
        setIsMounted(true);

        // Récupérer le thème du localStorage
        const savedTheme = localStorage.getItem('app-theme');

        // Récupérer les préférences système
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Déterminer le thème initial
        let initialTheme = 'light';

        if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
            initialTheme = savedTheme;
        } else if (prefersDark) {
            // Si pas de préférence sauvegardée mais système en dark, utiliser mucha-dark
            initialTheme = THEMES.MUCHA_DARK;
        }

        setTheme(initialTheme);
        applyTheme(initialTheme);
    }, []);

    // Appliquer le thème au DOM
    const applyTheme = (selectedTheme) => {
        const html = document.documentElement;
        html.setAttribute('data-theme', selectedTheme);
        document.body.setAttribute('data-theme', selectedTheme);
    };

    // Changer le thème
    const changeTheme = (newTheme) => {
        if (Object.values(THEMES).includes(newTheme)) {
            setTheme(newTheme);
            localStorage.setItem('app-theme', newTheme);
            applyTheme(newTheme);
        }
    };

    // Cycle entre les trois thèmes
    const cycleTheme = () => {
        const themeList = Object.values(THEMES);
        const currentIndex = themeList.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themeList.length;
        changeTheme(themeList[nextIndex]);
    };

    // Obtenir le label du thème actuel
    const getCurrentLabel = () => THEME_LABELS[theme] || theme;

    // Ne pas rendre avant le montage client
    if (!isMounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{
            theme,
            changeTheme,
            cycleTheme,
            themes: THEMES,
            labels: THEME_LABELS,
            isMounted,
            getCurrentLabel,
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

// Hook personnalisé pour utiliser le contexte facilement
export function useTheme() {
    const context = useContext(ThemeContext);

    // Valeur par défaut si contexte non disponible (SSR, avant ThemeProvider)
    if (!context) {
        return {
            theme: 'light',
            changeTheme: () => { },
            cycleTheme: () => { },
            themes: THEMES,
            labels: THEME_LABELS,
            isMounted: false,
            getCurrentLabel: () => '🌞 Mode clair',
        };
    }

    return context;
}