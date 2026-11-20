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
    eyebrow: "LOCATION SAISONNIÈRE · CONCIERGERIE · SERVICES",
    title: "Prenez soin de votre logement.",
    subtitle: "Nous vous aidons à prendre soin du reste.",
    description: "PlanetLS réunit propriétaires, conciergeries et professionnels pour organiser plus simplement la gestion des locations saisonnières.",
    reassurance: ["Professionnels de confiance", "Échanges directs", "Vous gardez le contrôle"],
    ctaPrimary: { label: "Découvrir PlanetLS", href: "/parcours" },
    ctaSecondary: { label: "Comment ça fonctionne ?", href: "#fonctionnement" },
  },

  // Comment PlanetLS fonctionne
  howItWorks: {
    eyebrow: "UN FONCTIONNEMENT SIMPLE",
    title: "Une gestion plus simple,",
    subtitle: "sans perdre le contrôle.",
    steps: [
      {
        number: "01",
        title: "Ajoutez votre logement",
        description: "Décrivez votre logement et les services dont vous avez besoin.",
      },
      {
        number: "02",
        title: "Choisissez vos professionnels",
        description: "Trouvez et échangez avec les professionnels adaptés à votre organisation.",
      },
      {
        number: "03",
        title: "Gardez le suivi",
        description: "Séjours, prestations, documents et échanges restent réunis au même endroit.",
      },
    ],
  },

  // Votre logement a une histoire
  yourStory: {
    eyebrow: "PLUS QU'UN LOGEMENT",
    title: "Votre logement a une histoire.",
    subtitle: "PlanetLS vous aide à la suivre.",
    description: "Un logement, ce n'est pas seulement un calendrier. Ce sont des personnes à coordonner, des documents à retrouver et des imprévus à gérer.",
    services: [
      "Arrivée / Départ",
      "Ménage",
      "Linge",
      "Maintenance",
      "Petits travaux",
      "Services complémentaires",
    ],
    cta: { label: "Découvrir tous les services", href: "/parcours" },
  },

  // PlanetLS en 1 minute
  videoIntro: {
    eyebrow: "PLANETLS EN 1 MINUTE",
    title: "Découvrez PlanetLS",
    subtitle: "en une minute.",
    description: "Une présentation rapide pour comprendre comment la plateforme simplifie votre quotidien.",
    cta: { label: "Voir la présentation", href: "#" },
  },

  // Tout centraliser
  allInOne: {
    eyebrow: "MOINS DE DISPERSION",
    title: "Tout ce qui compte,",
    subtitle: "au même endroit.",
    description: "Logements, séjours, partenaires et documents restent réunis dans un même environnement.",
    categories: ["Logements & séjours", "Partenaires & prestations", "Devis & contrats", "Factures & documents"],
    cta: { label: "Explorer les espaces PlanetLS", href: "/parcours" },
  },

  // Une plateforme, trois experiences
  threeExperiences: {
    eyebrow: "UNE PLATEFORME · TROIS EXPÉRIENCES",
    title: "Une plateforme,",
    subtitle: "trois expériences.",
    intro: "Chacun dispose de son propre espace tout en collaborant autour des mêmes logements, séjours et prestations.",
    profiles: [
      {
        title: "PROPRIÉTAIRES",
        description: "Organisez vos logements et vos séjours, choisissez vos partenaires et gardez le suivi.",
        image: "proprietaires",
        cta: { label: "Découvrir l'espace propriétaire", href: "/owner" },
      },
      {
        title: "CONCIERGERIES",
        description: "Développez vos collaborations et organisez les séjours que vous prenez en charge.",
        image: "conciergeries",
        cta: { label: "Découvrir l'espace conciergerie", href: "/concierge" },
      },
      {
        title: "ARTISANS & PRESTATAIRES",
        description: "Présentez vos services, recevez des demandes et suivez vos interventions.",
        image: "artisans",
        cta: { label: "Découvrir l'espace professionnel", href: "/provider" },
      },
    ],
  },

  // Ecosysteme de confiance
  trustEcosystem: {
    eyebrow: "NOTRE ENGAGEMENT",
    title: "Autour de chaque logement,",
    subtitle: "un écosystème de confiance.",
    intro: "Chacun dispose de son propre espace tout en collaborant autour des mêmes logements, séjours et prestations.",
    engagements: [
      {
        title: "Échanges directs",
        description: "Vous choisissez avec qui vous travaillez.",
      },
      {
        title: "Professionnels identifiés",
        description: "Des informations utiles avant de décider.",
      },
      {
        title: "Suivi partagé",
        description: "Chacun accède aux informations qui le concernent.",
      },
    ],
  },

  // Conciergeries a decouvrir
  recommendedConcierges: {
    eyebrow: "CONCIERGERIES À DÉCOUVRIR",
    title: "Des partenaires près",
    subtitle: "de votre logement.",
    intro: "Explorez les professionnels présents sur PlanetLS selon votre localisation et vos besoins.",
    cta: { label: "Voir toutes les conciergeries", href: "/dashboard/owner/concierges" },
  },

  // Guides & conseils
  guidesAndAdvice: {
    eyebrow: "RESSOURCES",
    title: "Guides & conseils",
    description: "Des repères pour améliorer votre quotidien et offrir une meilleure expérience à vos voyageurs.",
    guides: [
      { title: "Gérer son logement à distance", href: "#" },
      { title: "Bien choisir sa conciergerie", href: "#" },
      { title: "Préparer l'arrivée des voyageurs", href: "#" },
    ],
    cta: { label: "Voir tous les conseils", href: "#" },
  },

  // CTA Final
  finalCta: {
    eyebrow: "PRÊT À COMMENCER ?",
    title: "Votre logement mérite",
    subtitle: "une gestion plus sereine.",
    description: "Rejoignez PlanetLS pour organiser vos locations, trouver les bons professionnels et garder une vision claire de ce qui se passe.",
    ctaPrimary: { label: "Créer mon compte", href: "/login" },
    ctaSecondary: { label: "Découvrir PlanetLS", href: "/parcours" },
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
          { label: "À propos", href: "/about" },
          { label: "Fonctionnement", href: "/parcours" },
        ],
      },
      {
        title: "Espaces",
        links: [
          { label: "Propriétaires", href: "/owner" },
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
        title: "Légal",
        links: [
          { label: "CGU", href: "/cgu" },
          { label: "Confidentialité", href: "/privacy" },
          { label: "Mentions légales", href: "/legal" },
        ],
      },
    ],
  },
};
