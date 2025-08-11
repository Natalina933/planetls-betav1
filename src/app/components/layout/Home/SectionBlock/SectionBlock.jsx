"use client";
import React from 'react';
import styles from './SectionBlock.module.scss';

/**
 * Composant générique pour une section de contenu avec un titre centré.
 * @param {object} props - Les props du composant.
 * @param {string} props.title - Le titre de la section.
 * @param {string} [props.subtitle] - Le sous-titre de la section.
 * @param {string} [props.description] - La description de la section.
 * @param {React.ReactNode} props.children - Le contenu à afficher à l'intérieur de la section.
 */
export default function SectionBlock({ title, subtitle, description, children }) {
    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{title}</h2>
            {subtitle && <h3 className={styles.sectionSubtitle}>{subtitle}</h3>}
            {description && <p className={styles.sectionDescription}>{description}</p>}
            {children}
        </section>
    );
}
