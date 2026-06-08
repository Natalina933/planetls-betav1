export type HousingEquipmentSubcategory = {
  title: string;
  items: string[];
};

export type HousingEquipmentCategory = {
  title: string;
  subcategories: HousingEquipmentSubcategory[];
};

export const HOUSING_EQUIPMENT_CATALOG: HousingEquipmentCategory[] = [
  {
    title: "Accès et sécurité",
    subcategories: [
      {
        title: "Accès",
        items: ["Boîte à clés", "Serrure connectée", "Digicode", "Interphone", "Badge immeuble"],
      },
      {
        title: "Sécurité",
        items: ["Détecteur de fumée", "Détecteur CO", "Extincteur", "Trousse de secours", "Coffre-fort"],
      },
    ],
  },
  {
    title: "Confort du logement",
    subcategories: [
      {
        title: "Température",
        items: ["Climatisation", "Chauffage", "Ventilateur", "Radiateur d'appoint"],
      },
      {
        title: "Multimédia",
        items: ["Wi-Fi", "Télévision", "Box TV", "Enceinte Bluetooth", "Chargeurs USB"],
      },
      {
        title: "Mobilier utile",
        items: ["Canapé convertible", "Bureau", "Chaise de bureau", "Table à manger", "Rangements voyageurs"],
      },
    ],
  },
  {
    title: "Cuisine",
    subcategories: [
      {
        title: "Cuisson",
        items: ["Four", "Micro-ondes", "Plaques de cuisson", "Hotte", "Grille-pain"],
      },
      {
        title: "Froid et lavage",
        items: ["Réfrigérateur", "Congélateur", "Lave-vaisselle", "Lave-linge", "Sèche-linge"],
      },
      {
        title: "Petit électroménager",
        items: ["Machine à café", "Bouilloire", "Mixeur", "Robot cuisine", "Appareil à raclette"],
      },
      {
        title: "Vaisselle",
        items: ["Assiettes", "Verres", "Couverts", "Poêles", "Casseroles", "Ustensiles cuisine"],
      },
    ],
  },
  {
    title: "Couchages et linge",
    subcategories: [
      {
        title: "Couchages",
        items: ["Lit double", "Lit simple", "Lit queen size", "Lit king size", "Lit superposé", "Canapé-lit"],
      },
      {
        title: "Linge",
        items: ["Draps", "Housses de couette", "Taies d'oreiller", "Serviettes", "Tapis de bain", "Plaids"],
      },
      {
        title: "Bébé",
        items: ["Lit parapluie", "Chaise haute", "Baignoire bébé", "Barrière de sécurité"],
      },
    ],
  },
  {
    title: "Salle de bain et ménage",
    subcategories: [
      {
        title: "Salle de bain",
        items: ["Sèche-cheveux", "Fer à lisser", "Pèse-personne", "Distributeur savon", "Panier à linge"],
      },
      {
        title: "Ménage",
        items: ["Aspirateur", "Balai", "Serpillière", "Seau", "Table à repasser", "Fer à repasser"],
      },
      {
        title: "Consommables",
        items: ["Papier toilette", "Essuie-tout", "Savon mains", "Gel douche", "Shampoing", "Lessive"],
      },
    ],
  },
  {
    title: "Extérieur et loisirs",
    subcategories: [
      {
        title: "Extérieur",
        items: ["Balcon", "Terrasse", "Jardin", "Salon de jardin", "Barbecue", "Plancha"],
      },
      {
        title: "Eau et détente",
        items: ["Piscine", "Spa", "Jacuzzi", "Transats", "Parasols", "Serviettes piscine"],
      },
      {
        title: "Stationnement",
        items: ["Parking privé", "Garage", "Borne de recharge", "Local vélo"],
      },
    ],
  },
];

export const HOUSING_EQUIPMENT_LABELS = HOUSING_EQUIPMENT_CATALOG.flatMap((category) =>
  category.subcategories.flatMap((subcategory) => subcategory.items),
);
