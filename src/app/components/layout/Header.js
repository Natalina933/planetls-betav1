import Link from 'next/link';
import Navbar from './Navbar';

export default function Header() {
    return (
        <header style={{
            background: '#222',
            color: '#fff',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'column'
        }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.5rem', alignSelf: 'flex-start' }}>
                <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>
                    PlanetLs
                </Link>
            </div>
            <Navbar />
        </header>
    );
}