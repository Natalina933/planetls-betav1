import { useEffect, useState } from "react";
// À quoi sert le composant Settings ?
// Le composant Settings que tu viens de créer sert à gérer, afficher et sauvegarder les préférences utilisateur dans ton application React/Next.js. Voici ses usages principaux :
// 1. Centraliser les préférences utilisateur
// Thème (clair/sombre)
// Notifications activées/désactivées
// Langue de l’interface
// Préférences de confidentialité (tracking, partage de données)
// 2. Persistance des paramètres
// Les choix de l’utilisateur sont sauvegardés dans le localStorage du navigateur.
// À chaque visite, le composant lit ces paramètres et les applique automatiquement.
// Si aucun paramètre n’existe, il initialise avec des valeurs par défaut.
// 3. Affichage et contrôle
// Permet d’afficher les préférences actuelles de l’utilisateur.
// Peut servir de base pour créer une page ou une modale de configuration dans ton application.
// Tu peux facilement ajouter des boutons ou des formulaires pour permettre à l’utilisateur de modifier ses paramètres.
// 4. Cas d’usage typiques
// Page “Mon compte” ou “Préférences” : l’utilisateur peut voir et modifier ses réglages.
// Personnalisation de l’expérience : le site adapte son apparence (thème, langue) et ses notifications selon les choix sauvegardés.
// Respect de la vie privée : l’utilisateur contrôle s’il accepte le tracking ou le partage de données.
// 5. Évolutif et réutilisable
// Tu peux enrichir ce composant pour gérer d’autres préférences (accessibilité, sécurité, etc.).
// Il peut être utilisé dans n’importe quelle application React/Next.js nécessitant la gestion de paramètres utilisateur persistants.
// En résumé :
// Ce composant est la base d’un système de gestion des préférences utilisateur moderne, essentiel pour offrir une expérience personnalisée, professionnelle et conforme aux attentes actuelles en matière d’UX et de confidentialité.
interface Settings {
    theme: string;
    notificationsEnabled: boolean;
    language: string;
    privacy: {
        tracking: boolean;
        dataSharing: boolean;
    };
}

const Settings = () => {
    const [settings, setSettings] = useState<Settings | null>(null);

    useEffect(() => {
        const savedSettings = localStorage.getItem("settings");
        // Vérifie si les paramètres sont déjà enregistrés dans le localStorage
        // Si oui, les charge, sinon initialise avec des paramètres par défaut
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        } else {
            const defaultSettings = {
                theme: "light",
                notificationsEnabled: true,
                language: "fr",
                privacy: {  
                    tracking: false,
                    dataSharing: false,
                },
            };
            setSettings(defaultSettings);
            localStorage.setItem("settings", JSON.stringify(defaultSettings));
        }
    }, []);

    return (
        <div>
            {settings ? (
            <div>
                <h1>Paramètres</h1>
                <p><strong>Thème:</strong> {settings.theme}</p>
                <p><strong>Notifications:</strong> {settings.notificationsEnabled ? "Activées" : "Désactivées"}</p>
                <p><strong>Langue:</strong> {settings.language}</p>
                <pre>{JSON.stringify(settings, null, 2)}</pre>
            </div>
            ) : (
                <p>Aucun paramètre enregistré trouvé.</p>
            )}
        </div>
    );
};


export default Settings;
