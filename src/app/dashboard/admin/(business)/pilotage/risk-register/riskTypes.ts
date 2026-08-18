export type RiskPriority = "critique" | "prioritaire" | "surveiller" | "acceptable";

export type RiskProbability = "faible" | "moyenne" | "elevee";

export type RiskImpact = "faible" | "moyen" | "eleve";

export type RiskStatus =
  | "identifie"
  | "a_analyser"
  | "planifie"
  | "en_traitement"
  | "maitrise"
  | "accepte";

export type RiskHorizon = "immediat" | "trois_mois" | "six_mois" | "douze_mois" | "long_terme";

export type RiskCategory =
  | "marche"
  | "commercial"
  | "marketplace"
  | "operationnel"
  | "financier"
  | "juridique"
  | "technologique"
  | "ia";

export type RiskProfile =
  | "proprietaires"
  | "concierges"
  | "conciergeries"
  | "artisans"
  | "prestataires"
  | "administrateurs"
  | "equipe";

export type BusinessRisk = {
  id: string;
  priority: RiskPriority;
  category: RiskCategory;
  title: string;
  description: string;
  cause: string;
  affectedProfiles: RiskProfile[];
  probability: RiskProbability;
  impact: RiskImpact;
  horizon: RiskHorizon;
  mitigation: string;
  warningSignals: string[];
  owner: string;
  deadline: string;
  status: RiskStatus;
};
