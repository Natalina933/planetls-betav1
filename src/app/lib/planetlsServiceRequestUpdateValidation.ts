
import { normalizePlanetLSSelection } from "./planetlsServiceSelection.ts";
import { validatePlanetLSServiceRequest } from "./planetlsServiceRequestValidation.ts";

type RequestFields = {
  requested_services?: readonly string[] | null;
  description?: string | null;
};

function normalizeServices(values: readonly string[] | null | undefined) {
  return normalizePlanetLSSelection(values ?? []);
}

function normalizeDescription(value: string | null | undefined) {
  return value?.trim() || null;
}

export function validatePlanetLSServiceRequestUpdate(
  existing: RequestFields,
  changes: RequestFields,
) {
  const existingServices = normalizeServices(existing.requested_services);

  const finalServices =
    changes.requested_services !== undefined &&
    changes.requested_services !== null
      ? normalizeServices(changes.requested_services)
      : existingServices;

  const finalDescription =
    changes.description !== undefined
      ? normalizeDescription(changes.description)
      : normalizeDescription(existing.description);

  // La validation porte sur l'état final de la demande, même lorsque
  // seul le titre ou la description change. Une ancienne demande avec
  // des prestations non reconnues, ou un groupe sans description, doit
  // être requalifiée explicitement avant son prochain enregistrement,
  // sans suppression automatique de ses données persistées.
  return validatePlanetLSServiceRequest(
    finalServices,
    finalDescription,
  );
}

