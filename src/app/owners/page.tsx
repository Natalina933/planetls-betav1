import Card from '../components/common/Cards/Card';
import Badge from '../components/common/Badge';

export default function OwnersPage() {
    return (
        <main style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1rem' }}>
                Bienvenue sur l’espace <Badge color="#0070f3">Propriétaires</Badge>
            </h1>
            <Card>
                <p>
                    Cette page est dédiée aux propriétaires. Retrouvez ici toutes les informations et services qui vous sont réservés.
                </p>
                <ul style={{ marginTop: '1.5rem', lineHeight: 1.7 }}>
                    <li>Gestion de vos biens immobiliers</li>
                    <li>Accès à votre tableau de bord personnalisé</li>
                    <li>Mise en relation avec des concierges et artisans de confiance</li>
                    <li>Suivi des demandes et notifications en temps réel</li>
                </ul>
            </Card>
        </main>
    );
}