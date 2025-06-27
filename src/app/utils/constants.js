// Types d'utilisateurs
export const USER_TYPES = {
    OWNER: 'owner',
    CONCIERGE: 'concierge',
    TRADESPEOPLE: 'tradespeople',
};

// Autres constantes globales
export const API_BASE_URL = 'https://api.planetls.com'; // À adapter selon votre environnement

export const APP_NAME = 'PlanetLS'; // Nom de votre application

export const DEFAULT_LANGUAGE = 'fr'; // Langue par défaut

export const SUPPORTED_LANGUAGES = ['fr', 'en']; // Langues supportées

export const CURRENCY = '€'; // Devise par défaut

export const DATE_FORMAT = 'DD/MM/YYYY'; // Format de date par défaut

export const TIME_FORMAT = 'HH:mm'; // Format d'heure par défaut

export const DATETIME_FORMAT = `${DATE_FORMAT} ${TIME_FORMAT}`; // Format date-heure par défaut

export const API_TIMEOUT = 10000; // Délai d'attente de l'API en millisecondes

export const MAX_RETRIES = 3; // Nombre maximum de tentatives en cas d'échec d'une requête API

export const RETRY_DELAY = 1000; // Délai entre les tentatives en cas d'échec d'une requête API (en millisecondes)

export const LOG_LEVEL = 'debug'; // Niveau de log par défaut (debug, info, warn, error)

export const ENABLE_CACHE = true; // Activer le cache par défaut

export const CACHE_EXPIRATION = 3600; // Durée d'expiration du cache en secondes

export const THEME = {
    PRIMARY_COLOR: '#007bff',
    SECONDARY_COLOR: '#6c757d',
    SUCCESS_COLOR: '#28a745',
    ERROR_COLOR: '#dc3545',
    WARNING_COLOR: '#ffc107',
    INFO_COLOR: '#17a2b8',
    LIGHT_COLOR: '#f8f9fa',
    DARK_COLOR: '#343a40',
};