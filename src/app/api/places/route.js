import { NextResponse } from 'next/server';

const places = [
    { id: 1, city: 'Paris', region: 'Île-de-France' },
    { id: 2, city: 'Pariwana', region: 'Bolivie' },
    { id: 3, city: 'Parigi', region: 'Italie' },
    // ajoute tes lieux ici
];

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.toLowerCase().trim() || '';

    if (q.length < 2) {
        return NextResponse.json([]);
    }

    const filtered = places.filter((place) =>
        place.city.toLowerCase().startsWith(q)
    );

    return NextResponse.json(filtered);
}
