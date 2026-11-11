import { cache } from "react";
import { redirect } from "next/navigation";
import { resolveAdminSessionAccess } from "@/server/auth/adminAccess";

// React's request-scoped memoization shares the check between layout and page.
// It does not cache administrative rights between HTTP requests.
export const requireAdminAccess = cache(async function requireAdminAccess() {
  const checked = await resolveAdminSessionAccess();
  if (!checked.ok) {
    if (checked.status === 401) redirect("/login");
    if (checked.status === 403) redirect("/unauthorized");
    throw new Error("Vérification des droits administratifs indisponible.");
  }
  return checked.session;
});
