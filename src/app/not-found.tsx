// src/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2>Page non trouvée</h2>
            <p>La page que vous cherchez n&apos;existe pas.</p>
            <Link href="/" className="mt-4 text-blue-500 hover:underline">
                Retour à l&apos;accueil
            </Link>
        </div>
    );
}