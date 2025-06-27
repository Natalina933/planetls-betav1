import { createContext, useState, useContext } from 'react';

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('fr');

    const switchLanguage = (lang) => setLanguage(lang);

    return (
        <LanguageContext.Provider value={{ language, switchLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

// Hook personnalisé pour utiliser le contexte facilement
export function useLanguage() {
    return useContext(LanguageContext);
}