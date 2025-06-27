import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

export default function TradespeoplePage() {
    return (
        <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1rem' }}>
                Bienvenue sur l’espace <Badge color="#ff9800">Artisans & Commerçants</Badge>
            </h1>
            <Card>
                <p>
                    Cette page est dédiée aux artisans et commerçants. Découvrez ici les services et ressources qui vous sont proposés pour développer votre activité.
                </p>
                <ul style={{ marginTop: '1.5rem', lineHeight: 1.7 }}>
                    <li>• Mise en relation avec des propriétaires et concierges</li>
                    <li>• Accès à un espace personnel pour gérer vos offres</li>
                    <li>• Visibilité accrue auprès de la communauté PlanetLs</li>
                    <li>• Support et accompagnement dédiés</li>
                </ul>
            </Card>
        </main>
    );
}