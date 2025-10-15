// lib/roleGuard.ts
import { redirect } from "next/navigation";
import { getUserRole } from "../utils/getRole";

export async function roleGuard(allowedRoles: string[]) {
  const role = await getUserRole();
  if (!role || !allowedRoles.includes(role)) {
    redirect("/unauthorized");
  }
}
