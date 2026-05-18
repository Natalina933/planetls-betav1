function normalizeMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function ownerApiError(fallbackMessage: string, apiMessage?: string | null) {
  const primary = normalizeMessage(apiMessage || fallbackMessage);
  return `${primary} Réessayez dans quelques instants.`;
}
