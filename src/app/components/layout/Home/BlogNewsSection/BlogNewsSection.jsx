// src/app/components/layout/Home/BlogNewsSection/BlogNewsSection.jsx
"use client";
import React from 'react';
import ServicesBlock from '../SectionBlock/ServicesBlock'; // Assurez-vous que le chemin est correct
import BlogPreviewList from '../../../blog/BlogPreviewList'; // Assurez-vous que le chemin est correct vers votre BlogPreviewList

/**
 * Composant représentant la section "Derniers conseils & actualités" de la page d'accueil.
 * Il utilise le composant générique ServicesBlock pour sa structure et inclut la liste des aperçus de blog.
 */
export default function BlogNewsSection() {
    return (
        <ServicesBlock title="Derniers conseils & actualités">
            <BlogPreviewList />
        </ServicesBlock>
    );
}