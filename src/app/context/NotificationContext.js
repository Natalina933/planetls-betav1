import { createContext, useState, useContext } from 'react';

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        // Masquer la notification après 3 secondes
        setTimeout(() => setNotification(null), 3000);
    };

    const hideNotification = () => setNotification(null);

    return (
        <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

// Hook personnalisé pour utiliser le contexte facilement
export function useNotification() {
    return useContext(NotificationContext);
}