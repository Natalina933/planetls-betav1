export const homeContent = {
  // Navigation
  navItems: [
    { label: "Propriétaires", href: "/owner" },
    { label: "Conciergeries", href: "/concierge" },
    { label: "Artisans", href: "/provider" },
    { label: "Comment ça marche", href: "#fonctionnement" },
    { label: "Ressources", href: "#conseils" },
  ],
  navActions: [
    { label: "Se connecter", href: "/login", variant: "secondary" },
    { label: "Créer un compte", href: "/complete-registration", variant: "primary" },
  ],

  // Hero
  hero: {
    eyebrow: "LOCATION SAISONNIERE · CONCIERGERIE · SERVICES",
    title: "Prenez soin de votre logement.",
    subtitle: "Nous vous aidons a prendre soin du reste.",
    description: "PlanetLS reunit proprietaires, conciergeries et professionnels pour organiser plus simplement la gestion des locations saisonnieres.",
    reassurance: ["Professionnels de confiance", "Echanges directs", "Vous gardez le controle"],
    ctaPrimary: { label: "Decouvrir PlanetLS", href: "/parcours" },
    ctaSecondary: { label: "Comment ca fonctionne ?", href: "#fonctionnement" },
  },

  // Comment PlanetLS fonctionne
  howItWorks: {
    eyebrow: "UN FONCTIONNEMENT SIMPLE",
    title: "Une gestion plus simple,",
    subtitle: "sans perdre le controle.",
    steps: [
      {
        number: "01",
        title: "Ajoutez votre logement",
        description: "Decrivez votre logement et les services dont vous avez besoin.",
      },
      {
        number: "02",
        title: "Choisissez vos professionnels",
        description: "Trouvez et echangez avec les professionnels adaptes a votre organisation.",
      },
      {
        number: "03",
        title: "Gardez le suivi",
        description: "Sejours, prestations, documents et echanges restent reunis au meme endroit.",
      },
    ],
  },

  // Votre logement a une histoire
  yourStory: {
    eyebrow: "PLUS QU'UN LOGEMENT",
    title: "Votre logement a une histoire.",
    subtitle: "PlanetLS vous aide a la suivre.",
    description: "Un logement, ce n'est pas seulement un calendrier. Ce sont des personnes a coordonner, des documents a retrouver et des imprévus a gérer.",
    services: [
      "Check-in / Check-out",
      "Menage",
      "Linge",
      "Maintenance",
      "Petits travaux",
      "Services complementaires",
    ],
    cta: { label: "Decouvrir tous les services", href: "/parcours" },
  },

  // PlanetLS en 1 minute
  videoIntro: {
    eyebrow: "PLANETLS EN 1 MINUTE",
    title: "Decouvrez PlanetLS",
    subtitle: "en une minute.",
    description: "Une presentation rapide pour comprendre comment la plateforme simplifie votre quotidien.",
    cta: { label: "Voir la presentation", href: "#" },
  },

  // Tout centraliser
  allInOne: {
    eyebrow: "MOINS DE DISPERSION",
    title: "Tout ce qui compte,",
    subtitle: "au meme endroit.",
    description: "Logements, sejours, partenaires et documents restent reunis dans un meme environnement.",
    categories: ["Logements & sejours", "Partenaires & prestations", "Devis & contrats", "Factures & documents"],
    cta: { label: "Explorer les espaces PlanetLS", href: "/parcours" },
  },

  // Une plateforme, trois experiences
  threeExperiences: {
    eyebrow: "UNE PLATEFORME · TROIS EXPERIENCES",
    title: "Une plateforme,",
    subtitle: "trois experiences.",
    intro: "Chacun dispose de son propre espace tout en collaborant autour des memes logements, sejours et prestations.",
    profiles: [
      {
        title: "PROPRIETAIRES",
        description: "Organisez vos logements et vos sejours, choisissez vos partenaires et gardez le suivi.",
        image: "proprietaires",
        cta: { label: "Decouvrir l'espace propietaire", href: "/owner" },
      },
      {
        title: "CONCIERGERIES",
        description: "Developpez vos collaborations et organisez les sejours que vous prenez en charge.",
        image: "conciergeries",
        cta: { label: "Decouvrir l'espace conciergerie", href: "/concierge" },
      },
      {
        title: "ARTISANS & PRESTATAIRES",
        description: "Presentez vos services, recevez des demandes et suivez vos interventions.",
        image: "artisans",
        cta: { label: "Decouvrir l'espace professionnel", href: "/provider" },
      },
    ],
  },

  // Ecosysteme de confiance
  trustEcosystem: {
    eyebrow: "NOTRE ENGAGEMENT",
    title: "Autour de chaque logement,",
    subtitle: "un ecosysteme de confiance.",
    intro: "Chacun dispose de son propre espace tout en collaborant autour des memes logements, sejours et prestations.",
    engagements: [
      {
        title: "Echanges directs",
        description: "Vous choisissez avec qui vous travaillez.",
      },
      {
        title: "Professionnels identifies",
        description: "Des informations utiles avant de decidé.",
      },
      {
        title: "Suivi partagé",
        description: "Chacun accede aux informations qui le concernent.",
      },
    ],
  },

  // Conciergeries a decouvrir
  recommendedConcierges: {
    eyebrow: "CONCIERGERIES A DECOUVRIR",
    title: "Des partenaires pres",
    subtitle: "de votre logement.",
    intro: "Explorez les professionnels presents sur PlanetLS selon votre localisation et vos besoins.",
    cta: { label: "Voir toutes les conciergeries", href: "/dashboard/owner/concierges" },
  },

  // Guides & conseils
  guidesAndAdvice: {
    eyebrow: "RESSOURCES",
    title: "Guides & conseils",
    description: "Des repères pour ameliorer votre quotidien et offrir une meilleure experience a vos voyageurs.",
    guides: [
      { title: "Gerer son logement a distance", href: "#" },
      { title: "Bien choisir sa conciergerie", href: "#" },
      { title: "Preparer l'arrivee des voyageurs", href: "#" },
    ],
    cta: { label: "Voir tous les conseils", href: "#" },
  },

  // CTA Final
  finalCta: {
    eyebrow: "PRET A COMMENCER ?",
    title: "Votre logement merite",
    subtitle: "une gestion plus sereine.",
    description: "Rejoignez PlanetLS pour organiser vos locations, trouver les bons professionnels et garder une vision claire de ce qui se passe.",
    ctaPrimary: { label: "Creer mon compte", href: "/login" },
    ctaSecondary: { label: "Decouvrir PlanetLS", href: "/parcours" },
  },

  // Footer
  footer: {
    brand: "PlanetLS",
    tagline: "Simplifiez la location",
    description: "Des lieux vivants. Des liens durables.",
    copyright: "© 2026 PlanetLS",
    navGroups: [
      {
        title: "PlanetLS",
        links: [
          { label: "A propos", href: "/about" },
          { label: "Fonctionnement", href: "/parcours" },
        ],
      },
      {
        title: "Espaces",
        links: [
          { label: "Proprietaires", href: "/owner" },
          { label: "Conciergeries", href: "/concierge" },
          { label: "Artisans", href: "/provider" },
        ],
      },
      {
        title: "Ressources",
        links: [
          { label: "Guides", href: "#conseils" },
          { label: "Aide", href: "/contact" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "CGU", href: "/cgu" },
          { label: "Confidentialite", href: "/privacy" },
          { label: "Mentions legales", href: "/legal" },
        ],
      },
    ],
  },
};
