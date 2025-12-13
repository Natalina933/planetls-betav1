// types/housing.ts

export interface InfosLogement {
  nomLogement: string;
  adresse: string;
  complementAdresse?: string;
  digicodeEntree?: string;
  digicodeImmeuble?: string;
  infosWifi?: {
    nom: string;
    mdp: string;
  };
  localTechnique?: string;
  compteurElectrique?: string;
  photos?: string[];
}

export interface Proprietaire {
  id: string;
  nom: string;
  prenom: string;
  adresse?: string;
  contactPrincipal: string;
  email1: string;
  email2?: string;
  tel1: string;
  tel2?: string;
}

export interface LocationDetails {
  nbCouchages?: number;
  nbChambres?: number;
  nbCles?: number;
  terrasse?: boolean;
  ascenseur?: boolean;
  animauxAcceptes?: boolean;
  fumeur?: boolean;
  caution?: number;
  plateformePrincipale?: string;
  checkin?: string;
  checkout?: string;
  barrecode?: string;
}

export interface MenageDetails {
  tempsEstime?: string;
  checklist?: string[];
  reassort?: {
    minimum?: Record<string, number>;
  };
  instructionsParticulieres?: string;
  historique?: Array<{
    date: string;
    agent: string;
    action: string;
  }>;
}

export interface PlanningDetails {
  arrivees?: Array<{
    date: string;
    heure: string;
    client: string;
  }>;
  departs?: Array<{
    date: string;
    heure: string;
    client: string;
  }>;
  menagesProgrammes?: Array<{
    date: string;
    agent: string;
  }>;
  conflits?: Array<{
    type: string;
    message: string;
  }>;
  missionAssignee?: {
    equipe: string;
    agent: string;
  };
}

export interface DocumentsDetails {
  pdf?: Array<{
    nom: string;
    fichier: string;
  }>;
  photosTechniques?: string[];
  fichesProtocoles?: string[];
  plans?: string[];
}

export interface ContratDetails {
  dateDebut?: string;
  dateFin?: string;
  type?: string;
  montant?: number;
}

export interface TarifsDetails {
  tarifNuit?: number;
  tarifWeekend?: number;
  tarifSemaine?: number;
  fraisMenage?: number;
}

export interface NoteInterne {
  date: string;
  auteur: string;
  texte: string;
  aTraiter: boolean;
}

// Type pour la table housing avec types précis
export interface HousingRow {
  id: number;
  external_id: number | null;
  nom_logement: string | null;
  ville: string | null;
  adresse: string | null;
  plateforme: string | null;
  statut: string | null;
  photo_principale: string | null;
  infos: InfosLogement | null;
  proprietaire: Proprietaire | null;
  location: LocationDetails | null;
  menage: MenageDetails | null;
  planning: PlanningDetails | null;
  documents: DocumentsDetails | null;
  contrat: ContratDetails | null;
  tarifs: TarifsDetails | null;
  notes: NoteInterne[] | null;
  created_at: string | null;
  updated_at: string | null;
}

// Type pour l'insertion
export interface HousingInsert {
  external_id?: number | null;
  nom_logement?: string | null;
  ville?: string | null;
  adresse?: string | null;
  plateforme?: string | null;
  statut?: string | null;
  photo_principale?: string | null;
  infos?: InfosLogement | null;
  proprietaire?: Proprietaire | null;
  location?: LocationDetails | null;
  menage?: MenageDetails | null;
  planning?: PlanningDetails | null;
  documents?: DocumentsDetails | null;
  contrat?: ContratDetails | null;
  tarifs?: TarifsDetails | null;
  notes?: NoteInterne[] | null;
}

// Type pour la mise à jour
export interface HousingUpdate extends Partial<HousingInsert> {
  id?: number;
}