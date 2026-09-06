// Propositions visuelles uniquement : aucune offre, preuve ou tournée réelle.
export const roleFollowUp = {
  owner: {
    title: "Choisir en confiance, suivre simplement", lead: "Des offres comparables et des preuves liées à votre logement.",
    focus: "De la demande au logement prêt", steps: [["Demande", "Préparation de l’appartement des Halles", "Votre besoin est partagé avec la conciergerie."], ["À décider", "Choisir la prestation", "Comparer le contenu avant de donner votre accord."], ["Après passage", "Recevoir le compte rendu", "Photos et remarques réunies dans le même dossier."]],
    messageTitle: "Un échange relié au logement", context: "Appartement des Halles · prochain séjour", message: "La conciergerie vous demande de confirmer le nombre de couchages avant de préparer le linge.", messageAction: "Voir l’échange du séjour",
  },
  concierge: {
    title: "Relier le planning au terrain", lead: "Une tournée lisible, un contrôle par passage et les échanges au bon endroit.",
    focus: "Tournée à préparer", steps: [["09 h 30", "Check-in Villa Azur · Biarritz", "Confirmation de l’accès à obtenir."], ["11 h", "Contrôle linge · Le Petit Prince", "Vérifier le linge avant l’arrivée."], ["15 h 30", "Dépannage serrure · Maison Larralde", "Attendre la confirmation du prestataire avant l’arrivée à 16 h."]],
    messageTitle: "Coordonner sans perdre le contexte", context: "Maison Larralde · mission serrure", message: "Le prestataire demande les modalités d’accès. La réponse reste attachée à cette mission.", messageAction: "Voir l’échange de la mission",
  },
  provider: {
    title: "Préparer, intervenir, transmettre", lead: "Un devis explicite, les informations d’accès et les preuves de votre travail.",
    focus: "Vos déplacements du jour", steps: [["14 h", "Réparation de la serrure", "Maison Larralde · confirmer l’accès avant de partir."], ["16 h", "Entretien de la climatisation", "Villa Azur · retrouver le matériel et le périmètre dans la mission."], ["Après passage", "Transmettre le compte rendu", "Joindre les photos et signaler les réserves éventuelles."]],
    messageTitle: "Retrouver les consignes d’accès", context: "Maison Larralde · intervention de 14 h", message: "La conciergerie confirme le contact sur place. Les instructions restent réunies avec votre intervention.", messageAction: "Voir les consignes de la mission",
  },
  admin: {
    title: "Des décisions appuyées sur des preuves", lead: "Retrouver les pièces, le contexte et la trace de chaque contrôle.",
    focus: "Parcours de contrôle d’un dossier", steps: [["Réception", "Rassembler les pièces", "Identifier le profil et les éléments transmis."], ["Contrôle", "Examiner les écarts", "Associer une personne responsable et une prochaine action."], ["Décision", "Garder une trace", "Motif, date et pièces consultées restent liés au dossier."]],
    messageTitle: "Un échange attaché au contrôle", context: "Dossier professionnel · pièce à compléter", message: "Une demande de complément doit préciser la pièce attendue et conserver le contexte du contrôle.", messageAction: "Prévisualiser la demande de complément",
  },
} as const;
