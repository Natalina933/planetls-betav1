export const CONCIERGE_SERVICE_MODES = ["a_la_carte", "full_management", "both"] as const;

export type ConciergeServiceMode = (typeof CONCIERGE_SERVICE_MODES)[number];
