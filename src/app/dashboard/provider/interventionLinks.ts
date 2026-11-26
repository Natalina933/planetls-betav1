const interventionsPath = "/dashboard/provider/interventions";

export function getProviderInterventionHref(id: string) {
  return `${interventionsPath}?intervention=${encodeURIComponent(id)}#liste-interventions`;
}
