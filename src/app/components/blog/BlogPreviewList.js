const mockPosts = [
    {
        id: 1,
        title: "5 conseils pour louer votre bien en toute sérénité",
        excerpt: "Découvrez nos astuces pour optimiser la gestion de votre location saisonnière et attirer plus de voyageurs.",
        date: "2025-06-20",
        link: "/blog/5-conseils-location"
    },
    {
        id: 2,
        title: "Pourquoi faire appel à un concierge professionnel ?",
        excerpt: "Un concierge facilite la vie des propriétaires et améliore l'expérience des locataires. Voici comment.",
        date: "2025-06-10",
        link: "/blog/concierge-professionnel"
    },
    {
        id: 3,
        title: "Artisans locaux : un atout pour vos locations",
        excerpt: "Entretenir et valoriser votre bien grâce à des artisans de confiance, c'est possible avec PlanetLs.",
        date: "2025-05-30",
        link: "/blog/artisans-locaux"
    }
];

export default function BlogPreviewList() {
    return (
        <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
            {mockPosts.map(post => (
                <a
                    key={post.id}
                    href={post.link}
                    style={{
                        display: 'block',
                        background: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        padding: '1.25rem 1.5rem',
                        textDecoration: 'none',
                        color: '#222',
                        transition: 'box-shadow 0.2s'
                    }}
                >
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0070f3' }}>{post.title}</h3>
                    <p style={{ margin: 0, color: '#444' }}>{post.excerpt}</p>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#888' }}>
                        {new Date(post.date).toLocaleDateString('fr-FR')}
                    </div>
                </a>
            ))}
        </div>
    );
}