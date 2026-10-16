import { PLANETLS_SERVICE_TARGET } from "./planetlsServiceCatalogTarget.ts";

export const isProviderProfileRole = (role: unknown) =>
  ["provider", "provider_pro", "artisan", "artisan_pro"].includes(String(role));

// profiles.option is the existing service-selection storage. No skills column exists.
// These declarations do not establish a primary profession or a qualification.
export function readProviderSkills(option: unknown): string[] {
  if (typeof option !== "string" || !option.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(option);
    if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === "string");
  } catch { /* Historical comma-separated storage. */ }
  return option.split(/[,;\n]/).map(v => v.trim()).filter(Boolean);
}

export function normalizeProviderSkills(input: unknown) {
  if (input !== null && typeof input !== "string" && !Array.isArray(input)) {
    return { services: [], invalid: true };
  }
  let values: unknown[] = Array.isArray(input) ? input : readProviderSkills(input);
  if (typeof input === "string" && input.trim().startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(input);
      if (!Array.isArray(parsed)) return { services: [], invalid: true };
      values = parsed;
    } catch { return { services: [], invalid: true }; }
  }
  const services: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") return { services: [], invalid: true };
    const entry = PLANETLS_SERVICE_TARGET.find(item =>
      item.slug === value.trim() || item.label.toLocaleLowerCase("fr-FR") === value.trim().toLocaleLowerCase("fr-FR"));
    if (!entry) return { services: [], invalid: true };
    if (!services.includes(entry.slug)) services.push(entry.slug);
  }
  return { services, invalid: false };
}

export function providerSkillsFormValue(option: unknown): string {
  return readProviderSkills(option).map(value =>
    PLANETLS_SERVICE_TARGET.find(item => item.slug === value)?.label ?? value).join("; ");
}
