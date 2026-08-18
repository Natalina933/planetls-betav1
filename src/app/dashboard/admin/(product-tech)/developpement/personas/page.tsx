import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Personas produit | PlanetLS",
  description: "Référentiel interne des utilisateurs cibles et de leurs parcours PlanetLS.",
};

export default async function PersonasPage() {
  redirect("/dashboard/admin/personas");
}
