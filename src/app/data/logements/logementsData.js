// logementsData.js

export const logements = [
  {
    id: 1,

    /* -----------------------------------------------------
       📘 INFOS GÉNÉRALES
    ----------------------------------------------------- */
    infos: {
      nomLogement: "Appartement Haussmannien",
      adresse: "12 Rue des Oliviers, 33000 Bordeaux",
      complementAdresse: "Appartement 3B - Code portail : 4592A",
      digicodeEntree: "4592A",
      digicodeImmeuble: "1980#",
      infosWifi: {
        nom: "Livebox-Martin",
        mdp: "Bordeaux2024!",
      },
      localTechnique: "Placard dans l’entrée (clé fournie dans trousseau)",
      compteurElectrique: "Tableau dans le couloir commun",
      photos: [
        "/images/logements/log1-1.jpg",
        "/images/logements/log1-2.jpg",
        "/images/logements/default.jpg",
      ],
    },

    /* -----------------------------------------------------
       👤 PROPRIÉTAIRE
    ----------------------------------------------------- */
    proprietaire: {
      id: "P001",
      nom: "Martin",
      prenom: "Sophie",
      adresse: "12 Rue des Oliviers, 33000 Bordeaux",
      contactPrincipal: "06 24 56 79 34",
      email1: "sophie.martin@mail.com",
      email2: "contact.martin.pro@gmail.com",
      tel1: "06 24 56 79 34",
      tel2: "05 56 98 12 48",
    },

    /* -----------------------------------------------------
       🏡 DETAILS LOCATION
    ----------------------------------------------------- */
    location: {
      nbCouchages: 4,
      nbChambres: 2,
      nbCles: 2,
      terrasse: true,
      ascenseur: false,
      animauxAcceptes: true,
      fumeur: false,
      caution: 300,
      plateformePrincipale: "Airbnb",
      checkin: "16:00",
      checkout: "10:00",
      barrecode: "BCX-4952-33",
    },

    /* -----------------------------------------------------
       🧽 MÉNAGE & PRÉPARATION
    ----------------------------------------------------- */
    menage: {
      tempsEstime: "1h30",
      checklist: [
        "Changer draps + serviettes",
        "Aspirateur + serpillière",
        "Déposer panier de bienvenue",
        "Vérifier la vaisselle",
        "Nettoyer vitres du salon",
        "Vider poubelles",
      ],
      reassort: {
        minimum: {
          papierToilette: 2,
          gelDouche: 1,
          café: 10,
          capsules: 6,
          sacsPoubelle: 3,
        },
      },
      instructionsParticulieres: "Attention au voisin du dessus (pas de bruit après 22h).",
      historique: [
        {
          date: "2025-01-10",
          agent: "Clara",
          action: "Ménage complet",
        },
        {
          date: "2025-01-05",
          agent: "Yanis",
          action: "Préparation avant arrivée",
        },
      ],
    },

    /* -----------------------------------------------------
       📅 PLANNING
    ----------------------------------------------------- */
    planning: {
      arrivees: [
        { date: "2025-01-12", heure: "17:00", client: "Mr Durand" },
      ],
      departs: [
        { date: "2025-01-12", heure: "10:00", client: "Mme Bernard" },
      ],
      menagesProgrammes: [
        { date: "2025-01-12", agent: "Clara" },
      ],
      conflits: [
        {
          type: "Conflit ménage",
          message: "Ménage trop proche de l'arrivée suivante",
        },
      ],
      missionAssignee: {
        equipe: "Équipe Bordeaux 1",
        agent: "Clara",
      },
    },

    /* -----------------------------------------------------
       📄 DOCUMENTS
    ----------------------------------------------------- */
    documents: {
      pdf: [
        { nom: "Mode d’emploi Lave-linge", fichier: "/docs/log1/washing-machine.pdf" },
        { nom: "Guide du logement", fichier: "/docs/log1/house-manual.pdf" },
      ],
      photosTechniques: [
        "/images/logements/log1-tech1.jpg",
        "/images/logements/log1-tech2.jpg",
      ],
      fichesProtocoles: [
        "/docs/log1/protocole-menage.pdf",
      ],
      plans: [
        "/docs/log1/plan-logement.pdf",
      ],
    },

    /* -----------------------------------------------------
       💬 NOTES INTERNES
    ----------------------------------------------------- */
    notes: [
      {
        date: "2025-01-08",
        auteur: "Clara",
        texte: "Porte d'entrée à huiler.",
        aTraiter: true,
      },
      {
        date: "2024-12-20",
        auteur: "Yanis",
        texte: "Ampoule du salon remplacée.",
        aTraiter: false,
      },
    ],
  },

  /* =======================================================================================
     LOGEMENT 2
  ======================================================================================= */

  {
    id: 2,

    infos: {
      nomLogement: "Studio Paris Centre",
      adresse: "5 Avenue Montaigne, 75008 Paris",
      complementAdresse: "Immeuble Haussmannien - 4e étage",
      digicodeEntree: "8801B",
      digicodeImmeuble: "12A52#",
      infosWifi: {
        nom: "FREE-DUPONT",
        mdp: "Paris75008*",
      },
      localTechnique: "Local fermé sur le palier (clé 2)",
      compteurElectrique: "Sous-sol palier C",
      photos: [
        "/images/logements/log2-1.jpg",
        "/images/logements/default.jpg",
      ],
    },

    proprietaire: {
      id: "P002",
      nom: "Dupont",
      prenom: "Alexandre",
      adresse: "5 Avenue Montaigne, 75008 Paris",
      contactPrincipal: "07 81 45 22 19",
      email1: "alex.dupont@gmail.com",
      email2: "",
      tel1: "07 81 45 22 19",
      tel2: "",
    },

    location: {
      nbCouchages: 2,
      nbChambres: 1,
      nbCles: 1,
      terrasse: false,
      ascenseur: true,
      animauxAcceptes: false,
      fumeur: false,
      caution: 500,
      plateformePrincipale: "Booking",
      checkin: "15:00",
      checkout: "11:00",
      barrecode: "PAR-MNTG-1922",
    },

    menage: {
      tempsEstime: "1h00",
      checklist: [
        "Repasser rideaux si besoin",
        "Nettoyer micro-ondes",
        "Désinfecter poignées",
      ],
      reassort: {
        minimum: {
          papierToilette: 2,
          gelDouche: 1,
          café: 8,
        },
      },
      instructionsParticulieres: "Clientèle très exigeante.",
      historique: [
        { date: "2025-01-02", agent: "Sarah", action: "Nettoyage + réassort" },
      ],
    },

    planning: {
      arrivees: [{ date: "2025-01-14", heure: "16:00", client: "Mme Rossi" }],
      departs: [{ date: "2025-01-14", heure: "10:00", client: "Mr Kahn" }],
      menagesProgrammes: [{ date: "2025-01-14", agent: "Sarah" }],
      conflits: [],
      missionAssignee: {
        equipe: "Équipe Paris 2",
        agent: "Sarah",
      },
    },

    documents: {
      pdf: [{ nom: "Mode d’emploi Four", fichier: "/docs/log2/four.pdf" }],
      photosTechniques: ["/images/logements/log2-tech1.jpg"],
      fichesProtocoles: ["/docs/log2/protocole.pdf"],
      plans: [],
    },

    notes: [
      {
        date: "2025-01-03",
        auteur: "Sarah",
        texte: "Traces sur le parquet du salon",
        aTraiter: true,
      },
    ],
  },
];
