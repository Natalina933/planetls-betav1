// src/app/components/layout/Home/ServicesSection/ServicesSection.jsx
"use client";
import React from 'react';
import SectionBlock from '../../../shared/SectionBlock/SectionBlock'; // Assurez-vous que le chemin est correct
import ServiceList from '../../../services/ServiceList'; // Assurez-vous que le chemin est correct vers votre ServiceList

/**
 * Composant représentant la section "Nos services" de la page d'accueil.
 * Il utilise le composant générique SectionBlock pour sa structure et inclut la liste des services.
 */
export default function ServicesSection() {
    return (
        <SectionBlock title="Nos services">
            <ServiceList />
        </SectionBlock>
    );
}