import { promises as fs } from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/authOptions";
import { MasterPlanViewer } from "./MasterPlanViewer";
import { parseMasterPlan } from "./masterPlan";

export const dynamic = "force-dynamic";

export default async function DevelopmentPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "super_admin") redirect("/login");

  const masterPlanPath = path.join(process.cwd(), "docs", "master-plan-planetls.md");
  const [markdown, stats] = await Promise.all([fs.readFile(masterPlanPath, "utf8"), fs.stat(masterPlanPath)]);
  return <MasterPlanViewer plan={parseMasterPlan(markdown, stats.mtime.toISOString())} />;
}
