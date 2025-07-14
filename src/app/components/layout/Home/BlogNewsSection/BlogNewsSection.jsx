// src/app/components/layout/Home/BlogNewsSection/BlogNewsSection.jsx
"use client";
import React from 'react';
import SectionBlock from '../../../shared/SectionBlock/SectionBlock'; // Assurez-vous que le chemin est correct
import BlogPreviewList from '../../../blog/BlogPreviewList'; // Assurez-vous que le chemin est correct vers votre BlogPreviewList

/**
 * Composant représentant la section "Derniers conseils & actualités" de la page d'accueil.
 * Il utilise le composant générique SectionBlock pour sa structure et inclut la liste des aperçus de blog.
 */
export default function BlogNewsSection() {
    return (
        <SectionBlock title="Derniers conseils & actualités">
            <BlogPreviewList />
        </SectionBlock>
    );
}