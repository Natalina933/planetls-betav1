const services = [
    {
        id: 1,
        title: "Gestion locative simplifiée",
        description: "Centralisez la gestion de vos biens, suivez les réservations et automatisez les tâches administratives."
    },
    {
        id: 2,
        title: "Mise en relation avec des concierges",
        description: "Trouvez rapidement un concierge de confiance pour l’accueil, le ménage ou la maintenance de votre logement."
    },
    {
        id: 3,
        title: "Accès à un réseau d’artisans locaux",
        description: "Bénéficiez de l’expertise d’artisans et commerçants sélectionnés pour l’entretien et l’amélioration de vos biens."
    },
    {
        id: 4,
        title: "Tableau de bord personnalisé",
        description: "Visualisez en un coup d’œil vos indicateurs clés, notifications et demandes en cours."
    }
];

export default function ServiceList() {
    return (
        <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
            {services.map(({ id, title, description }) => (
                <div
                    key={id}
                    style={{
                        background: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        padding: '1.25rem 1.5rem',
                        color: '#222'
                    }}
                >
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0070f3' }}>{title}</h3>
                    <p style={{ margin: 0, color: '#444' }}>{description}</p>
                </div>
            ))}
        </div>

    );
}