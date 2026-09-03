export type CompletionRequirement = {
  label: string;
  complete: boolean;
};

export type CompletionState = {
  percentage: number;
  completedCount: number;
  totalCount: number;
  missingItems: string[];
};

type BasicProfileCompletionInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  requireCompany?: boolean;
  streetAddress: string;
  postalCode: string;
  city: string;
  presentation: string;
};

export function buildCompletionState(
  requirements: CompletionRequirement[],
): CompletionState {
  const totalCount = requirements.length;
  const completedCount = requirements.filter((requirement) => requirement.complete).length;
  const missingItems = requirements
    .filter((requirement) => !requirement.complete)
    .map((requirement) => requirement.label);

  return {
    percentage: totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100),
    completedCount,
    totalCount,
    missingItems,
  };
}

export function buildBasicProfileCompletion(
  input: BasicProfileCompletionInput,
): CompletionState {
  return buildCompletionState([
    { label: "Prénom", complete: Boolean(input.firstName.trim()) },
    { label: "Nom", complete: Boolean(input.lastName.trim()) },
    { label: "Email", complete: Boolean(input.email.trim()) },
    { label: "Téléphone", complete: Boolean(input.phone.trim()) },
    {
      label: input.requireCompany ? "Entreprise" : "Nom commercial",
      complete: input.requireCompany ? Boolean((input.companyName ?? "").trim()) : true,
    },
    { label: "Adresse", complete: Boolean(input.streetAddress.trim()) },
    { label: "Code postal", complete: Boolean(input.postalCode.trim()) },
    { label: "Ville", complete: Boolean(input.city.trim()) },
    { label: "Présentation", complete: Boolean(input.presentation.trim()) },
  ]);
}

