"use client";

import { useSearchParams } from "next/navigation";
import MapWithList from "./MapWithList";

const categoryTitleMap: Record<string, string> = {
  proprietaire: "Trouvez le propriétaire idéal pour vos besoins",
  concierge: "Trouvez la conciergerie adaptée pour vos besoins",
  artisan: "Trouvez l'artisan qu'il vous faut pour vos besoins",
  conciergerie_pro: "Trouvez la conciergerie pro pour vos besoins",
};

export default function MapListContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "proprietaire";

  const currentTitle = categoryTitleMap[filter] || "Trouvez votre partenaire local pour vos besoins";

  return (
    <div>
      <h1>{currentTitle}</h1>
      <MapWithList />
    </div>
  );
}
