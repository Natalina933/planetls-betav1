import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdminAccess } from "../../adminAccess";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Personas produit | PlanetLS",
  description: "Référentiel interne des utilisateurs cibles et de leurs parcours PlanetLS.",
};

export default async function PersonasPage() {
  await requireAdminAccess();
  redirect("/dashboard/admin/personas");
}
