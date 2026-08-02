import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/authOptions";
import { PersonasWorkspace } from "./PersonasWorkspace";
import { productPersonas } from "./personas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Personas produit | PlanetLS", description: "Référentiel interne des utilisateurs cibles et de leurs parcours PlanetLS." };

export default async function PersonasPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "super_admin") redirect("/login");
  return <PersonasWorkspace initialPersonas={productPersonas} />;
}