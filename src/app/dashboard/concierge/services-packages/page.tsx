import { redirect } from "next/navigation";

export default function ServicesPackagesPage() {
  redirect("/dashboard/concierge/profile?tab=packs");
}
