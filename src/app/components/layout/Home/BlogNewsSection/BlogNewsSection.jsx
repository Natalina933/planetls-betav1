"use client";

import React from "react";
import ServicesBlock from "../SectionBlock/ServicesBlock";
import BlogPreviewList from "../../../blog/BlogPreviewList";

export default function BlogNewsSection() {
  return (
    <ServicesBlock
      title="Guides et conseils utiles"
      subtitle="Contenus pour mieux piloter votre activité"
      description="Retrouvez des contenus utiles pour professionnaliser la location courte durée, mieux organiser votre activité et améliorer l'expérience voyageur."
    >
      <BlogPreviewList />
    </ServicesBlock>
  );
}
