const testimonials = [
    {
        id: 1,
        name: "Sophie M.",
        role: "Propriétaire à Bordeaux",
        text: "Grâce à PlanetLs, j'ai trouvé un concierge de confiance pour gérer mon appartement. Service rapide et efficace !"
    },
    {
        id: 2,
        name: "Julien R.",
        role: "Concierge à Lyon",
        text: "La plateforme m'a permis de développer mon activité et de rencontrer de nouveaux clients sérieux."
    },
    {
        id: 3,
        name: "Claire D.",
        role: "Artisan à Nantes",
        text: "J'interviens régulièrement chez des propriétaires grâce à PlanetLs. Les échanges sont simples et professionnels."
    }
];

export default function TestimonialList() {
    return (
        <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
            {testimonials.map(({ id, name, role, text }) => (
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
                    <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>&quot;{text}&quot;</p>
                    <div style={{ fontWeight: 'bold', color: '#0070f3' }}>{name}</div>
                    <div style={{ fontSize: '0.95rem', color: '#888' }}>{role}</div>
                </div>
            ))}
        </div>
    );
}