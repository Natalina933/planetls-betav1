// pages/index.js
"use client";
import dynamic from 'next/dynamic';
import { useSearchParams } from "next/navigation";
// Leaflet ne fonctionne pas bien en SSR, on charge dynamiquement
const MapWithList = dynamic(() => import('../components/MapWithList/MapWithList'), {
  ssr: false,
});

export default function Home() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "proprietaire";

  const categoryTitleMap = {
    proprietaire: "Trouvez le propriétaire idéal pour vos besoins",
    concierge: "Trouvez la conciergerie adaptée pour vos besoins",
    artisan: "Trouvez l'artisan qu'il vous faut pour vos besoins",
    conciergerie_pro: "Trouvez la conciergerie pro pour vos besoins",
    // Ajoute d'autres catégories si besoin
  };

  const currentTitle = categoryTitleMap[filter] || "Trouvez votre partenaire local pour vos besoins";

  return (
    <div>
      <h1>{currentTitle}</h1>
      <MapWithList />
    </div>
  );
}