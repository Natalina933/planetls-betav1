import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("q");

    if (!location) {
        return NextResponse.json({ error: "Paramètre 'q' manquant" }, { status: 400 });
    }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
        const data = await res.json();

        if (data.length === 0) {
            return NextResponse.json({ error: "Localisation introuvable" }, { status: 404 });
        }

        const { lat, lon } = data[0];
        return NextResponse.json({ latitude: parseFloat(lat), longitude: parseFloat(lon) });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Erreur API /geocode :", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.error("Erreur inconnue dans /geocode :", error);
        return NextResponse.json({ error: "Erreur serveur inconnue" }, { status: 500 });
    }
}
