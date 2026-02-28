export interface FormState {
  name: string;
  propertyType: string;
  description: string;
  capacity: string;
  bedrooms: string;
  equipments: string;
  address: string;
  city: string;
  platform: string;
  photo?: string;
  status: "pret" | "menage" | "arrivee" | "depart";
}

function isMediaUrl(value: string) {
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

export function validateCreateLogementForm(form: FormState, userId?: string) {
  if (!userId) {
    return "Session introuvable. Reconnecte-toi pour créer un logement.";
  }

  if (!form.name.trim()) {
    return "Le nom du logement est obligatoire.";
  }

  if (form.name.trim().length < 3) {
    return "Le nom du logement doit contenir au moins 3 caractères.";
  }

  if (!form.address.trim()) {
    return "L'adresse est obligatoire.";
  }

  if (!form.city.trim()) {
    return "La ville est obligatoire.";
  }

  if (form.city.trim().length < 2) {
    return "La ville doit contenir au moins 2 caractères.";
  }

  if (form.capacity.trim()) {
    const capacity = Number(form.capacity.trim());
    if (!Number.isFinite(capacity) || capacity <= 0) {
      return "La capacité doit être un nombre positif.";
    }
  }

  if (form.bedrooms.trim()) {
    const bedrooms = Number(form.bedrooms.trim());
    if (!Number.isFinite(bedrooms) || bedrooms < 0) {
      return "Le nombre de chambres doit être un nombre valide.";
    }
  }

  if (form.photo?.trim() && !isMediaUrl(form.photo.trim())) {
    return "La photo doit être une URL valide ou un chemin commençant par '/'.";
  }

  return null;
}

export function buildCreateLogementPayload(form: FormState, userId: string) {
  return {
    infos: {
      nomLogement: form.name.trim(),
      adresse: form.address.trim(),
      photos: form.photo?.trim() ? [form.photo.trim()] : [],
      categorie: form.propertyType.trim() || null,
      description: form.description.trim() || null,
      capacite: form.capacity.trim() ? Number(form.capacity.trim()) : null,
      nb_chambres: form.bedrooms.trim() ? Number(form.bedrooms.trim()) : null,
      equipements: form.equipments
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    },
    statut: form.status,
    photo_principale: form.photo?.trim() || null,
    proprietaire: {
      id: userId,
    },
    location: {
      city: form.city.trim(),
      plateformePrincipale: form.platform.trim() || null,
    },
  };
}

export function buildCreateLogementSummary(form: FormState) {
  return [
    { label: "Nom", value: form.name.trim() || "À renseigner" },
    { label: "Type", value: form.propertyType.trim() || "À renseigner" },
    { label: "Adresse", value: form.address.trim() || "À renseigner" },
    { label: "Ville", value: form.city.trim() || "À renseigner" },
    { label: "Plateforme", value: form.platform.trim() || "À renseigner" },
    { label: "Capacité", value: form.capacity.trim() || "À renseigner" },
    { label: "Chambres", value: form.bedrooms.trim() || "À renseigner" },
    {
      label: "Équipements",
      value: form.equipments.trim() || "À renseigner",
    },
    { label: "Statut", value: form.status },
    { label: "Photo", value: form.photo?.trim() ? "Ajoutée" : "Aucune" },
  ];
}
