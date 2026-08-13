import { redirect } from "next/navigation";
import { auth } from "@/server/auth/authOptions";

export const dynamic = "force-dynamic";

export default async function AdminBusinessPersonasPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "admin" && role !== "super_admin") {
    redirect("/login");
  }

  redirect("/dashboard/admin/personas");
}
