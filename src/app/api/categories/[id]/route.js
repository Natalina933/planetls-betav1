import { NextResponse } from 'next/server';
import {
    getCategoryById,
    updateCategoryById,
    deleteCategoryById,
} from '../../../lib/db';

export async function GET(request, { params }) {
    const { id } = params;

    try {
        const category = await getCategoryById(id);

        if (!category) {
            return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
        }

        return NextResponse.json(category, { status: 200 });
    } catch (error) {
        console.error('Erreur GET :', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const { id } = params;
    const body = await request.json();

    try {
        const updated = await updateCategoryById(id, body);

        if (!updated) {
            return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error('Erreur POST :', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = params;

    try {
        const deleted = await deleteCategoryById(id);

        if (!deleted) {
            return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Catégorie supprimée' }, { status: 200 });
    } catch (error) {
        console.error('Erreur DELETE :', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
