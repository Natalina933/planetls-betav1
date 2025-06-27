export default function Footer() {
    return (
        <footer style={{
            background: '#222',
            color: '#fff',
            padding: '1rem 2rem',
            textAlign: 'center',
            marginTop: '2rem'
        }}>
            <p>&copy; {new Date().getFullYear()} PlanetLs. All rights reserved.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                <a href="/about" style={{ color: '#fff', marginRight: '1rem' }}>About</a>
                <a href="/contact" style={{ color: '#fff' }}>Contact</a>
            </p>
            
        </footer>
    );
}