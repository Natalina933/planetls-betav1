// Formate une date en chaîne lisible (ex : 2025-06-27 → 27/06/2025)
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

// Capitalise la première lettre d'une chaîne
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Vérifie si une valeur est vide (null, undefined, chaîne vide ou tableau vide)
export function isEmpty(value) {
    return (
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
    );
}