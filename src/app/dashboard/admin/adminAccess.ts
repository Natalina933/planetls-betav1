import { redirect } from "next/navigation";
import { auth } from "@/server/auth/authOptions";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export async function requireAdminAccess() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!ADMIN_ROLES.has(session.user?.role ?? "")) {
    redirect("/unauthorized");
  }

  return session;
}
