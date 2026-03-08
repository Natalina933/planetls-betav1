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

const LOCATION_SEARCH_SUGGESTIONS = [
  "Paris",
  "75015",
  "75016",
  "Lyon",
  "69000",
  "69003",
  "Marseille",
  "13008",
  "Nice",
  "06000",
  "Bordeaux",
  "33000",
  "Annecy",
  "74000",
  "Cannes",
  "06400",
  "Menton",
  "06500",
  "Saint-Tropez",
  "83990",
  "Montpellier",
  "34000",
  "Toulouse",
  "31000",
  "Lille",
  "59000",
  "Nantes",
  "44000",
  "Strasbourg",
  "67000",
  "Chamonix",
  "74400",
  "Aix-en-Provence",
  "13100",
  "Biarritz",
  "64200",
  "Deauville",
  "14800",
  "La Rochelle",
  "17000",
  "Avignon",
  "84000",
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
  return getFilteredSuggestions(LOCATION_SEARCH_SUGGESTIONS, input);
}
