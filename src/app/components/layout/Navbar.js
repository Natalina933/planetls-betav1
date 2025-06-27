import Link from 'next/link';

export default function Navbar() {
    return (
        <nav style={{
            background: '#333',
            padding: '0.5rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Link href="/home" style={{ color: '#fff', marginRight: '1.5rem', textDecoration: 'none' }}>Accueil</Link>
            <Link href="/owners" style={{ color: '#fff', marginRight: '1.5rem', textDecoration: 'none' }}>Propriétaires</Link>
            <Link href="/concierges" style={{ color: '#fff', marginRight: '1.5rem', textDecoration: 'none' }}>Concierges</Link>
            <Link href="/tradespeople" style={{ color: '#fff', marginRight: '1.5rem', textDecoration: 'none' }}>Artisans & Commerçants</Link>
        </nav>
    );
}