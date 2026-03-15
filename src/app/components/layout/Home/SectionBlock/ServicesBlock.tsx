"use client";
import React from "react";
import { SectionIntro } from "@/components/ui";
import styles from "./ServicesBlock.module.scss";

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
      <SectionIntro title={title} subtitle={subtitle} description={description} />
      {children}
    </section>
  );
}
