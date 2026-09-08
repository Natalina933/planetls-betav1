// Fixtures exclusivement réservées au Design System. Aucun fichier ni lieu réel.
export const ownerDetail = {
  name: "Logement Démo A",
  location: "Quartier Imaginaire · Ville Démo",
  type: "Appartement fictif",
  capacity: 2,
  bedrooms: 1,
  area: null as number | null,
  arrival: "À partir de 16 h",
  reservation: { id: "demo-stay-1", dates: "Du 12 au 15 septembre 2026", status: "Confirmée", description: "Séjour de démonstration · 2 personnes" },
  equipment: ["Un lit double", "Cuisine équipée", "Accès Wi-Fi de démonstration", "Détecteur de fumée"],
  interventions: [
    { id: "demo-work-1", title: "Préparation du logement", date: "11 septembre 2026 · 10 h", status: "Planifiée" },
    { id: "demo-work-2", title: "Vérification de la serrure", date: "5 septembre 2026 · 14 h", status: "Terminée" },
  ],
  documents: [
    { id: "demo-doc-1", title: "Guide d’arrivée fictif", description: "Présentation des consignes · aucun fichier joint" },
    { id: "demo-doc-2", title: "Inventaire de démonstration", description: "Liste indicative des équipements · aucun fichier joint" },
  ],
  activity: [
    { date: "2026-09-07", label: "7 septembre 2026", event: "Consignes d’arrivée relues dans cet exemple." },
    { date: "2026-09-06", label: "6 septembre 2026", event: "Prochain séjour confirmé dans cet exemple." },
    { date: "2026-09-05", label: "5 septembre 2026", event: "Vérification de la serrure terminée dans cet exemple." },
  ],
} as const;
