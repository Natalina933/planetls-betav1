import { promises as fs } from "node:fs";
import path from "node:path";
import { requireAdminAccess } from "../adminAccess";
import DecisionCenterPage from "./DecisionCenterPage";
import { buildArchitectureDecisionCenter } from "./architectureDecisions";

export const dynamic = "force-dynamic";

export default async function DecisionsArchitectureRoute() {
  await requireAdminAccess();

  const masterPlanPath = path.join(process.cwd(), "docs", "master-plan-planetls.md");
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const workflowPath = path.join(process.cwd(), ".github", "workflows", "e2e.yml");

  const [markdown, packageRaw, workflowExists] = await Promise.all([
    fs.readFile(masterPlanPath, "utf8"),
    fs.readFile(packageJsonPath, "utf8"),
    fs.access(workflowPath).then(() => true).catch(() => false),
  ]);

  const packageJson = JSON.parse(packageRaw) as { version?: string };
  const center = buildArchitectureDecisionCenter({
    markdown,
    projectVersion: packageJson.version ?? "0.0.0",
    workflowExists,
  });

  return <DecisionCenterPage center={center} />;
}
