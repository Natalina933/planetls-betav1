import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DashboardLayout } from "@/components/dashboard";
import { requireAdminAccess } from "../../adminAccess";
import { buildAdminNavItems } from "../../adminNavigation";
import { PersonasView } from "./PersonasView";
import { readPersonaLots, type PersonaLot } from "./personaCoverage";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Personas | PlanetLS", description: "Cibles, besoins critiques, ruptures et couverture produit reliés au Master Plan PlanetLS." };

export default async function AdminPersonasPage() {
  await requireAdminAccess();
  let lots: PersonaLot[] = [];
  let sourceAvailable = false;
  try {
    lots = readPersonaLots(await readFile(path.join(process.cwd(), "docs/master-plan-planetls.md"), "utf8"));
    sourceAvailable = lots.length > 0;
  } catch {
    // Une panne documentaire n’invente aucun statut et ne masque pas les personas.
  }
  return (
    <div className={styles.layoutScope}>
    <DashboardLayout persona="admin" title="Personas" subtitle="Cibles, première valeur et ruptures du parcours produit."
      navTitle="Admin / Pilotage business" navItems={buildAdminNavItems("business", "productTech")}
      stats={[]} notifications={[]} shortcuts={[]} actions={[]} activity={[]} hideTodaySection hideProfileSummary hideActivityFeed hideQuickActions hideSidebarNav hideNotifications hideShortcuts
      profile={{ name: "Direction PlanetLS", subtitle: "Pilotage produit", badge: "Interne" }}>
      <PersonasView lots={lots} sourceAvailable={sourceAvailable} />
    </DashboardLayout>
    </div>
  );
}
