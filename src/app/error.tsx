'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white/95 p-8 text-center shadow-xl">
        <h2 className="text-2xl font-semibold text-[var(--color-text-on-light)]">
          Quelque chose s&apos;est mal pass&eacute; !
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          Une erreur inattendue est survenue. Vous pouvez r&eacute;essayer.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-[var(--color-text-on-light)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          R&eacute;essayer
        </button>
      </div>
    </div>
  );
}
