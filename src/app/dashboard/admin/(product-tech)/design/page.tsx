import { redirect } from "next/navigation";
import { requireAdminAccess } from "../../adminAccess";

export default async function AdminDesignPage() {
  await requireAdminAccess();
  redirect("/design-system");
}
