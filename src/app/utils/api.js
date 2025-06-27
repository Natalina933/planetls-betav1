// Fonction utilitaire pour effectuer des requêtes API
export async function apiFetch(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors de la requête API');
        }

        return await response.json();
    } catch (error) {
        throw new Error('Erreur lors de la requête API : ' + error.message);
    }
}