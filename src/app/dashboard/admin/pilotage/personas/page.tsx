import { redirect } from "next/navigation";
import { requireAdminAccess } from "../../adminAccess";

export const dynamic = "force-dynamic";

export default async function AdminBusinessPersonasPage() {
  await requireAdminAccess();
  redirect("/dashboard/admin/personas");
}
