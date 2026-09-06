import type { ArtDecoQuote, ArtDecoSearchItem } from "@/components/ui/ArtDecoWorkspace/ArtDecoWorkspace";

export const roleWorkspaceData: Record<"owner" | "concierge" | "provider" | "admin", { scope: string; results: ArtDecoSearchItem[]; quoteTitle: string; quotes: ArtDecoQuote[] }> = {
  owner: {
    scope: "Vos logements, partenaires et devis", quoteTitle: "Comparer vos devis",
    results: [
      { id: "owner-home", title: "Appartement des Halles", category: "Logement", place: "Biarritz", meta: "Prochain séjour confirmé", detail: "Retrouvez les informations du logement et la préparation du prochain séjour." },
      { id: "owner-partner", title: "Maison Riviera", category: "Conciergerie", place: "Nice", meta: "Gestion et accueil · exemple", detail: "Périmètre de gestion, modalités d’accueil et preuves à demander au partenaire." },
      { id: "owner-quote", title: "Entretien du jardin", category: "Devis", place: "Bayonne", meta: "180 € · à consulter", detail: "Devis fictif lié à la Maison des Pins. Consulter le périmètre avant de répondre." },
    ], quotes: [
      { name: "Préparation", price: "90 €", items: ["Ménage", "Contrôle des équipements", "Photos du passage"], detail: "Une préparation ponctuelle, linge non inclus. Vérifier la date et le périmètre avec le partenaire.", action: "Examiner le devis préparation" },
      { name: "Accueil", price: "140 €", items: ["Ménage et linge", "Accueil voyageur", "Compte rendu"], detail: "Comparer les inclusions avec la préparation simple. Aucune acceptation effectuée depuis cette maquette.", action: "Examiner le devis accueil" },
      { name: "Sur mesure", price: "À chiffrer", items: ["Plusieurs logements", "Besoins particuliers", "Périmètre à convenir"], detail: "Préciser les logements, les dates et les services attendus avant de demander une proposition.", action: "Prévisualiser la demande de devis" },
    ],
  },
  concierge: {
    scope: "Logements, missions et prestataires de votre secteur", quoteTitle: "Composer une offre propriétaire",
    results: [
      { id: "concierge-mission", title: "Dépannage serrure", category: "Mission", place: "Biarritz", meta: "Maison Larralde · urgente", detail: "Confirmation terrain attendue avant l’arrivée à 16 h. Photos et test de fermeture à demander." },
      { id: "concierge-home", title: "Villa Azur", category: "Logement", place: "Biarritz", meta: "Accès à confirmer", detail: "Retrouver les consignes d’accès et le passage de contrôle du logement." },
      { id: "concierge-provider", title: "Alex · maintenance", category: "Prestataire", place: "Bayonne", meta: "Serrurerie et petits travaux", detail: "Profil de démonstration : disponibilité à confirmer avant toute affectation." },
    ], quotes: [
      { name: "Essentiel", price: "12 %", items: ["Check-in / check-out", "Messagerie voyageurs", "Reporting mensuel"], detail: "Modèle fictif de gestion : préciser l’assiette de commission et les prestations exclues dans le devis.", action: "Prévisualiser l’offre essentielle" },
      { name: "Signature", price: "18 %", items: ["Suivi des revenus", "Coordination des équipes", "Contrôle qualité"], detail: "Modèle fictif à adapter au logement. Les prestations et conditions doivent être convenues avec le propriétaire.", action: "Prévisualiser l’offre signature" },
      { name: "À la carte", price: "À chiffrer", items: ["Linge et ménage", "Maintenance", "Passages ponctuels"], detail: "Séparer la coordination et les interventions des prestataires dans la proposition.", action: "Prévisualiser l’offre à la carte" },
    ],
  },
  provider: {
    scope: "Demandes, interventions et clients", quoteTitle: "Préparer vos devis d’intervention",
    results: [
      { id: "provider-task", title: "Réparation de la serrure", category: "Intervention", place: "Biarritz", meta: "Maison Larralde · 14 h", detail: "Vérifier les modalités d’accès et le matériel avant de partir." },
      { id: "provider-request", title: "Diagnostic plomberie", category: "Demande", place: "Bayonne", meta: "Maison des Pins · à confirmer", detail: "Qualifier la panne, le déplacement et les éventuelles fournitures avant chiffrage." },
      { id: "provider-client", title: "Conciergerie Villa Azur", category: "Client", place: "Anglet", meta: "Entretien climatisation", detail: "Retrouver le contact et les échanges liés à l’intervention de 16 h." },
    ], quotes: [
      { name: "Diagnostic", price: "À chiffrer", items: ["Déplacement", "Recherche de panne", "Diagnostic écrit"], detail: "Renseigner le forfait et ses limites. Pièces et travaux complémentaires non inclus.", action: "Prévisualiser le devis diagnostic" },
      { name: "Intervention", price: "À chiffrer", items: ["Main-d’œuvre détaillée", "Fournitures séparées", "Photos avant / après"], detail: "Préciser quantités, prix et réserves avant envoi au client. Aucun prix calculé automatiquement.", action: "Prévisualiser le devis intervention" },
      { name: "Entretien", price: "Sur devis", items: ["Équipements concernés", "Fréquence des visites", "Compte rendu"], detail: "Définir les visites incluses et les conditions des interventions supplémentaires.", action: "Prévisualiser le devis entretien" },
    ],
  },
  admin: {
    scope: "Profils, missions et dossiers à contrôler", quoteTitle: "Contrôler les dossiers de devis",
    results: [
      { id: "admin-profile", title: "Maison d’Hôtes & Co", category: "Profil", place: "Lyon", meta: "Dossier professionnel", detail: "Examiner les justificatifs et identifier les pièces manquantes." },
      { id: "admin-mission", title: "Maintenance climatiseur", category: "Mission", place: "Montpellier", meta: "PL-2047 · à suivre", detail: "Rapprocher la mission, son devis et les preuves de réalisation." },
      { id: "admin-quote", title: "Devis linge saison", category: "Devis", place: "Annecy", meta: "PL-2044 · devis reçu", detail: "Consulter le périmètre et la chronologie du dossier. Aucune approbation dans cet aperçu." },
    ], quotes: [
      { name: "Devis reçu", price: "À examiner", items: ["Émetteur identifié", "Périmètre détaillé", "Pièces jointes"], detail: "Dossier PL-2044 : contrôler la présence des éléments, sans accepter le devis à la place du client.", action: "Prévisualiser le contrôle du devis" },
      { name: "Complément", price: "À préciser", items: ["Écart documenté", "Pièce attendue", "Interlocuteur responsable"], detail: "Préparer une demande de complément rattachée au dossier, sans envoyer de message réel.", action: "Prévisualiser la demande de complément" },
      { name: "Traçabilité", price: "Historique", items: ["Versions du devis", "Échanges contextualisés", "Décisions datées"], detail: "Comparer les éléments du dossier et conserver le motif du contrôle. Aucun nouveau statut validé.", action: "Prévisualiser l’historique du devis" },
    ],
  },
};
