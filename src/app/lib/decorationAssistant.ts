export type DecorationHousingType = "studio" | "apartment" | "house" | "villa" | "room";
export type DecorationStyle = "scandinavian" | "mediterranean" | "bohemian" | "minimalist" | "premium" | "family";
export type DecorationGoal = "more_bookings" | "higher_price" | "better_photos" | "refresh" | "family_friendly";

export type DecorationAssistantInput = {
  roomName: string;
  housingType: DecorationHousingType;
  budget: number;
  style: DecorationStyle;
  goal: DecorationGoal;
  ownerName?: string | null;
  ownerEmail?: string | null;
  propertyName?: string | null;
  constraints?: string | null;
  photoName?: string | null;
};

export type DecorationSuggestion = {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  impact: string;
  estimatedCost: number;
};

export type DecorationObjectRecommendation = {
  label: string;
  category: string;
  reason: string;
  estimatedCost: number;
};

export type DecorationPaletteColor = {
  name: string;
  hex: string;
  usage: string;
};

export type DecorationBenefit = {
  label: string;
  level: "modéré" | "visible" | "fort";
  detail: string;
};

export type DecorationReport = {
  id: string;
  createdAt: string;
  input: DecorationAssistantInput;
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: DecorationSuggestion[];
  objects: DecorationObjectRecommendation[];
  palette: DecorationPaletteColor[];
  photoTips: string[];
  benefits: DecorationBenefit[];
  imagePrompt: string;
  budget: {
    requested: number;
    estimatedTotal: number;
    remaining: number;
    fit: "sous budget" | "budget équilibré" | "à arbitrer";
  };
};

export type DecorationDashboardSummary = {
  analysesCount: number;
  averageBudget: number;
  popularStyles: Array<{ style: DecorationStyle; label: string; count: number }>;
};

const STYLE_LABELS: Record<DecorationStyle, string> = {
  scandinavian: "Scandinave clair",
  mediterranean: "Méditerranéen chaleureux",
  bohemian: "Bohème naturel",
  minimalist: "Minimaliste premium",
  premium: "Hôtel boutique",
  family: "Familial pratique",
};

const HOUSING_LABELS: Record<DecorationHousingType, string> = {
  studio: "studio",
  apartment: "appartement",
  house: "maison",
  villa: "villa",
  room: "chambre privée",
};

const GOAL_LABELS: Record<DecorationGoal, string> = {
  more_bookings: "augmenter le taux de réservation",
  higher_price: "justifier un prix moyen plus élevé",
  better_photos: "améliorer les visuels de l'annonce",
  refresh: "moderniser rapidement la pièce",
  family_friendly: "rendre le logement plus rassurant pour les familles",
};

const STYLE_PALETTES: Record<DecorationStyle, DecorationPaletteColor[]> = {
  scandinavian: [
    { name: "Blanc cassé", hex: "#F7F3EA", usage: "murs, linge et base lumineuse" },
    { name: "Chêne clair", hex: "#C9A978", usage: "bois, table basse, cadres" },
    { name: "Vert sauge", hex: "#8DA08D", usage: "coussins, plaid, plante" },
  ],
  mediterranean: [
    { name: "Pierre claire", hex: "#EFE5D4", usage: "fond mural et textile" },
    { name: "Terracotta", hex: "#C66B49", usage: "objets décoratifs et coussins" },
    { name: "Bleu calanque", hex: "#3E6F8F", usage: "accent visuel sur cadres ou vase" },
  ],
  bohemian: [
    { name: "Lin naturel", hex: "#E8DDCB", usage: "rideaux et housses" },
    { name: "Ocre doux", hex: "#C9994F", usage: "tapis, coussins, panier" },
    { name: "Vert olive", hex: "#707B52", usage: "plantes et accessoires" },
  ],
  minimalist: [
    { name: "Blanc chaud", hex: "#FAF8F3", usage: "surface principale" },
    { name: "Graphite", hex: "#2F3437", usage: "luminaires et contraste" },
    { name: "Greige", hex: "#B9AEA0", usage: "textiles et tapis" },
  ],
  premium: [
    { name: "Ivoire hôtelier", hex: "#F6F0E6", usage: "linge et murs" },
    { name: "Noir doux", hex: "#222426", usage: "poignées, lampes, cadres" },
    { name: "Laiton discret", hex: "#B68A43", usage: "détails premium" },
  ],
  family: [
    { name: "Craie", hex: "#F4F0E8", usage: "base neutre facile à photographier" },
    { name: "Bleu doux", hex: "#7BA3B8", usage: "coin nuit ou déco enfant" },
    { name: "Bois miel", hex: "#B9874B", usage: "rangements et mobilier solide" },
  ],
};

const STYLE_OBJECTS: Record<DecorationStyle, Array<Omit<DecorationObjectRecommendation, "estimatedCost"> & { share: number }>> = {
  scandinavian: [
    { label: "Suspension en fibres naturelles", category: "Lumière", reason: "Réchauffe la pièce sans l'alourdir.", share: 0.16 },
    { label: "Tapis clair texturé", category: "Textile", reason: "Structure l'espace et améliore les photos grand-angle.", share: 0.28 },
    { label: "Lot de coussins vert sauge", category: "Textile", reason: "Ajoute un accent mémorisable à faible coût.", share: 0.1 },
  ],
  mediterranean: [
    { label: "Rideaux en lin lavé", category: "Textile", reason: "Donne une impression de vacances et filtre la lumière.", share: 0.24 },
    { label: "Vase terracotta grand format", category: "Décoration", reason: "Crée un point focal immédiatement visible.", share: 0.12 },
    { label: "Affiches bord de mer encadrées", category: "Mur", reason: "Renforce l'identité locale de l'annonce.", share: 0.18 },
  ],
  bohemian: [
    { label: "Tête de lit en rotin", category: "Mobilier", reason: "Ajoute une signature chaleureuse en photo.", share: 0.32 },
    { label: "Panier et plante graphique", category: "Décoration", reason: "Humanise l'espace et adoucit les angles.", share: 0.12 },
    { label: "Plaid gaufré et coussins", category: "Textile", reason: "Rend le logement plus accueillant.", share: 0.16 },
  ],
  minimalist: [
    { label: "Lampadaire noir mat", category: "Lumière", reason: "Crée un contraste premium sans surcharge.", share: 0.2 },
    { label: "Table d'appoint compacte", category: "Mobilier", reason: "Améliore l'usage et la composition photo.", share: 0.16 },
    { label: "Cadre abstrait grand format", category: "Mur", reason: "Apporte une intention décorative claire.", share: 0.22 },
  ],
  premium: [
    { label: "Parure de lit hôtelière", category: "Linge", reason: "Renforce la perception de qualité dès la première photo.", share: 0.26 },
    { label: "Deux lampes de chevet coordonnées", category: "Lumière", reason: "Symétrie rassurante et ambiance haut de gamme.", share: 0.18 },
    { label: "Plateau d'accueil en bois et laiton", category: "Accueil", reason: "Crée un détail mémorable pour les voyageurs.", share: 0.08 },
  ],
  family: [
    { label: "Rangements fermés robustes", category: "Mobilier", reason: "Rend la pièce plus simple à maintenir entre deux séjours.", share: 0.26 },
    { label: "Protège-matelas et linge facile d'entretien", category: "Linge", reason: "Sécurise l'exploitation et rassure les familles.", share: 0.14 },
    { label: "Jeu de cadres doux et non fragiles", category: "Mur", reason: "Décore sans risque opérationnel.", share: 0.1 },
  ],
};

function clampBudget(value: number) {
  if (!Number.isFinite(value)) return 500;
  return Math.min(Math.max(Math.round(value), 150), 10000);
}

function moneyShare(budget: number, share: number, minimum: number) {
  return Math.max(minimum, Math.round((budget * share) / 5) * 5);
}

function getBudgetFit(requested: number, estimatedTotal: number): DecorationReport["budget"]["fit"] {
  if (estimatedTotal <= requested * 0.9) return "sous budget";
  if (estimatedTotal <= requested) return "budget équilibré";
  return "à arbitrer";
}

export function buildDecorationReport(input: DecorationAssistantInput): DecorationReport {
  const budget = clampBudget(input.budget);
  const styleLabel = STYLE_LABELS[input.style];
  const room = input.roomName.trim() || "pièce principale";
  const housing = HOUSING_LABELS[input.housingType];
  const goal = GOAL_LABELS[input.goal];
  const constraints = input.constraints?.trim();

  const baseObjects = STYLE_OBJECTS[input.style].map((item) => ({
    label: item.label,
    category: item.category,
    reason: item.reason,
    estimatedCost: moneyShare(budget, item.share, 35),
  }));

  const suggestions: DecorationSuggestion[] = [
    {
      title: "Créer un point focal dès l'entrée visuelle",
      description: `Structurer ${room} avec une pièce forte cohérente avec le style ${styleLabel.toLowerCase()}.`,
      priority: "high",
      impact: "L'annonce devient plus lisible en moins de trois secondes.",
      estimatedCost: moneyShare(budget, 0.22, 80),
    },
    {
      title: "Renforcer la lumière et les textures",
      description: "Ajouter des textiles, une source lumineuse chaude et des matières faciles à entretenir.",
      priority: "high",
      impact: "Les photos paraissent plus professionnelles et plus accueillantes.",
      estimatedCost: moneyShare(budget, 0.2, 70),
    },
    {
      title: "Épurer les éléments non essentiels",
      description: "Garder seulement les objets utiles ou photogéniques pour éviter l'effet encombré.",
      priority: "medium",
      impact: "La pièce semble plus grande, plus propre et plus premium.",
      estimatedCost: moneyShare(budget, 0.06, 25),
    },
  ];

  if (input.goal === "family_friendly") {
    suggestions.push({
      title: "Sécuriser les usages famille",
      description: "Privilégier les objets solides, lavables et faciles à remplacer entre deux séjours.",
      priority: "medium",
      impact: "Réduit les incidents et rassure les propriétaires.",
      estimatedCost: moneyShare(budget, 0.12, 45),
    });
  }

  const estimatedTotal = [...baseObjects, ...suggestions].reduce((sum, item) => sum + item.estimatedCost, 0);

  return {
    id: `decor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    input: { ...input, budget },
    executiveSummary: `Pour ${room} dans un ${housing}, l'axe recommandé est ${styleLabel.toLowerCase()} afin de ${goal}. Le budget de ${budget} EUR permet une amélioration visible, surtout si les achats ciblent la lumière, les textiles et un point focal fort.${constraints ? ` Contrainte intégrée : ${constraints}.` : ""}`,
    strengths: [
      "Base exploitable pour une amélioration rapide sans travaux lourds.",
      `Style ${styleLabel.toLowerCase()} facile à comprendre par un propriétaire et par les voyageurs.`,
      input.photoName ? "Photo fournie : le rapport peut servir de brief avant/après." : "Le formulaire peut déjà produire un brief même sans photo exploitable.",
    ],
    weaknesses: [
      "Risque de rendu trop neutre si la pièce manque de point focal.",
      "La lumière chaude et les textiles doivent être cohérents pour éviter l'effet catalogue.",
      "Sans nouvelle prise de vue, les bénéfices perçus dans l'annonce resteront limités.",
    ],
    suggestions,
    objects: baseObjects,
    palette: STYLE_PALETTES[input.style],
    photoTips: [
      "Photographier en lumière naturelle, stores ouverts, toutes les lampes allumées.",
      "Retirer câbles, poubelles, produits visibles et objets personnels avant la prise de vue.",
      "Faire une photo large à hauteur de poitrine, puis deux détails sur textile, lumière ou accueil.",
      "Garder les verticales droites et éviter les filtres trop froids.",
    ],
    benefits: [
      { label: "Attractivité annonce", level: "fort", detail: "Meilleure première impression sur les plateformes de réservation." },
      { label: "Prix moyen", level: input.goal === "higher_price" || input.style === "premium" ? "fort" : "visible", detail: "Potentiel de montée en gamme si les photos suivent." },
      { label: "Maintenance", level: "modéré", detail: "Objets simples à remplacer et choix de matières plus robustes." },
    ],
    imagePrompt: `Avant/après décoration d'intérieur pour une location saisonnière : ${room}, ${housing}, style ${styleLabel.toLowerCase()}, palette ${STYLE_PALETTES[input.style].map((color) => `${color.name} ${color.hex}`).join(", ")}, ambiance lumineuse naturelle, rendu professionnel Airbnb, mobilier réaliste, budget ${budget} EUR, sans travaux lourds, photo immobilière grand angle, propre et accueillant.`,
    budget: {
      requested: budget,
      estimatedTotal,
      remaining: budget - estimatedTotal,
      fit: getBudgetFit(budget, estimatedTotal),
    },
  };
}

export function summarizeDecorationHistory(reports: DecorationReport[]): DecorationDashboardSummary {
  const analysesCount = reports.length;
  const averageBudget = analysesCount > 0 ? Math.round(reports.reduce((sum, report) => sum + report.input.budget, 0) / analysesCount) : 0;
  const styleCounts = new Map<DecorationStyle, number>();

  reports.forEach((report) => {
    styleCounts.set(report.input.style, (styleCounts.get(report.input.style) ?? 0) + 1);
  });

  return {
    analysesCount,
    averageBudget,
    popularStyles: Array.from(styleCounts.entries())
      .map(([style, count]) => ({ style, label: STYLE_LABELS[style], count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 3),
  };
}

export function getDecorationStyleLabel(style: DecorationStyle) {
  return STYLE_LABELS[style];
}