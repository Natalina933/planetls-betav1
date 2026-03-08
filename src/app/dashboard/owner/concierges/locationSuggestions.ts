const REGION_SUGGESTIONS = [
  "Auvergne-Rhone-Alpes",
  "Bourgogne-Franche-Comte",
  "Bretagne",
  "Centre-Val de Loire",
  "Corse",
  "Grand Est",
  "Hauts-de-France",
  "Ile-de-France",
  "Normandie",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Cote d'Azur",
  "PACA",
  "Alsace",
  "Aquitaine",
  "Savoie",
  "Haute-Savoie",
  "Cote d'Azur",
  "Luberon",
  "Bassin d'Arcachon",
  "Pays Basque",
  "Cote Basque",
];

const CITY_SUGGESTIONS = [
  "Paris",
  "Lyon",
  "Marseille",
  "Nice",
  "Bordeaux",
  "Annecy",
  "Cannes",
  "Menton",
  "Saint-Tropez",
  "Montpellier",
  "Toulouse",
  "Lille",
  "Nantes",
  "Strasbourg",
  "Chamonix",
  "Aix-en-Provence",
  "Biarritz",
  "Deauville",
  "La Rochelle",
  "Avignon",
];

function normalizeLocationValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getFilteredSuggestions(items: string[], input: string) {
  const normalizedInput = normalizeLocationValue(input);
  if (!normalizedInput) return items.slice(0, 10);

  return items
    .filter((item) => normalizeLocationValue(item).includes(normalizedInput))
    .slice(0, 10);
}

export function getOwnerRegionSuggestions(input: string) {
  return getFilteredSuggestions(REGION_SUGGESTIONS, input);
}

export function getOwnerCitySuggestions(input: string) {
  return getFilteredSuggestions(CITY_SUGGESTIONS, input);
}
