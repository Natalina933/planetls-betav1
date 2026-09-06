import { redirect } from "next/navigation";

// Le parcours canonique conserve ses layouts, permissions et données.
export default function DashboardAliasPage() {
  redirect("/dashboard/owner");
}
