// src/app/map-list/page.jsx
"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const MapWithList = dynamic(() => import("@/components/MapWithList/MapWithList"), {
  ssr: false, // ⛔ désactive le rendu côté serveur
});

export default function MapListPage() {
  return (
    <Suspense fallback={<div>Chargement de la carte...</div>}>
      <MapWithList />
    </Suspense>
  );
}
