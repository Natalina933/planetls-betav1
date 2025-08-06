// src/app/error.tsx
'use client';

export default function Error({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2>Quelque chose s&apos;est mal passé !</h2>
            <button
                onClick={() => reset()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
                Réessayer
            </button>
        </div>
    );
}