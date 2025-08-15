"use client";
import React from 'react';
import styles from './ServicesBlock.module.scss';

interface ServicesBlockProps {
    title: React.ReactNode;
    subtitle?: string;
    description?: string;
    children: React.ReactNode;
}

/**
 * Composant générique pour une section de contenu avec un titre centré.
 */
export default function ServicesBlock({ title, subtitle, description, children }: ServicesBlockProps) {
    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            {subtitle && <h3 className={styles.sectionSubtitle}>{subtitle}</h3>}
            {description && <p className={styles.sectionDescription}>{description}</p>}
            {children}
        </section>
    );
}
