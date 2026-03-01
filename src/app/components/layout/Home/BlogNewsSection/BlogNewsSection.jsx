"use client";

import React from "react";
import ServicesBlock from "../SectionBlock/ServicesBlock";
import BlogPreviewList from "../../../blog/BlogPreviewList";

export default function BlogNewsSection() {
  return (
    <ServicesBlock
      title="Derniers conseils & actualités"
      subtitle="Inspiration et méthode"
      description="Retrouvez des contenus utiles pour professionnaliser la location saisonnière, mieux piloter votre activité et améliorer l'expérience voyageur."
    >
      <BlogPreviewList />
    </ServicesBlock>
  );
}
