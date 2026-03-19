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
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCompanyName: string;
}

type ValidateOptions = {
  isConciergeFlow?: boolean;
};

function isMediaUrl(value: string) {
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

export function validateCreateLogementForm(
  form: FormState,
  userId?: string,
  options?: ValidateOptions,
) {
  if (!userId) {
    return "Session introuvable. Reconnecte-toi pour creer un logement.";
  }

  if (!form.name.trim()) {
    return "Le nom du logement est obligatoire.";
  }

  if (form.name.trim().length < 3) {
    return "Le nom du logement doit contenir au moins 3 caracteres.";
  }

  if (!form.address.trim()) {
    return "L'adresse est obligatoire.";
  }

  if (!form.city.trim()) {
    return "La ville est obligatoire.";
  }

  if (form.city.trim().length < 2) {
    return "La ville doit contenir au moins 2 caracteres.";
  }

  if (form.capacity.trim()) {
    const capacity = Number(form.capacity.trim());
    if (!Number.isFinite(capacity) || capacity <= 0) {
      return "La capacite doit etre un nombre positif.";
    }
  }

  if (form.bedrooms.trim()) {
    const bedrooms = Number(form.bedrooms.trim());
    if (!Number.isFinite(bedrooms) || bedrooms < 0) {
      return "Le nombre de chambres doit etre un nombre valide.";
    }
  }

  if (form.photo?.trim() && !isMediaUrl(form.photo.trim())) {
    return "La photo doit etre une URL valide ou un chemin commencant par '/'.";
  }

  if (options?.isConciergeFlow) {
    const hasOwnerIdentity =
      form.ownerFirstName.trim() ||
      form.ownerLastName.trim() ||
      form.ownerCompanyName.trim();

    if (!hasOwnerIdentity) {
      return "Renseigne au moins un nom, un prenom ou une societe pour le proprietaire.";
    }

    if (!form.ownerEmail.trim()) {
      return "L'email du proprietaire est obligatoire.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail.trim())) {
      return "L'email du proprietaire est invalide.";
    }
  }

  return null;
}

export function buildCreateLogementPayload(form: FormState, ownerProfileId: string) {
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
      id: ownerProfileId,
    },
    location: {
      city: form.city.trim(),
      plateformePrincipale: form.platform.trim() || null,
    },
  };
}

export function buildManualOwnerPayload(form: FormState) {
  return {
    first_name: form.ownerFirstName.trim() || null,
    last_name: form.ownerLastName.trim() || null,
    email: form.ownerEmail.trim(),
    phone: form.ownerPhone.trim() || null,
    company_name: form.ownerCompanyName.trim() || null,
  };
}

export function buildCreateLogementSummary(form: FormState) {
  return [
    { label: "Nom", value: form.name.trim() || "A renseigner" },
    { label: "Type", value: form.propertyType.trim() || "A renseigner" },
    { label: "Adresse", value: form.address.trim() || "A renseigner" },
    { label: "Ville", value: form.city.trim() || "A renseigner" },
    { label: "Plateforme", value: form.platform.trim() || "A renseigner" },
    { label: "Capacite", value: form.capacity.trim() || "A renseigner" },
    { label: "Chambres", value: form.bedrooms.trim() || "A renseigner" },
    { label: "Equipements", value: form.equipments.trim() || "A renseigner" },
    { label: "Statut", value: form.status },
    { label: "Photo", value: form.photo?.trim() ? "Ajoutee" : "Aucune" },
    {
      label: "Proprietaire",
      value:
        `${form.ownerFirstName} ${form.ownerLastName}`.trim() ||
        form.ownerCompanyName.trim() ||
        form.ownerEmail.trim() ||
        "A renseigner",
    },
  ];
}
