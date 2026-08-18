import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAccess } from "../adminAccess";
import { buildDeveloperLogView, type DeveloperLogCommit } from "./developerLog";
import { MasterPlanViewer } from "./MasterPlanViewer";
import { parseMasterPlan } from "./masterPlan";
import { buildMissionControlView, type MissionControlHealthCard } from "./missionControl";
import { buildRoadmapView } from "./roadmap";
import { buildTechnicalMemoryView } from "./technicalMemory";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

async function readRecentCommits() {
  try {
    const [
      { stdout: commitsOutput },
      { stdout: remoteOutput },
      { stdout: branchOutput },
      { stdout: statusOutput },
      { stdout: changedOutput },
      { stdout: untrackedOutput },
    ] = await Promise.all([
      execFileAsync("git", ["log", "-5", '--pretty=format:%H|%h|%an|%ad|%s', "--date=iso-strict"], {
        cwd: process.cwd(),
      }),
      execFileAsync("git", ["config", "--get", "remote.origin.url"], {
        cwd: process.cwd(),
      }),
      execFileAsync("git", ["branch", "--show-current"], {
        cwd: process.cwd(),
      }),
      execFileAsync("git", ["status", "--short"], {
        cwd: process.cwd(),
      }),
      execFileAsync("git", ["diff", "--name-only", "--diff-filter=ACMRTUXB", "HEAD"], {
        cwd: process.cwd(),
      }),
      execFileAsync("git", ["ls-files", "--others", "--exclude-standard"], {
        cwd: process.cwd(),
      }),
    ]);

    const commits = commitsOutput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sha, shortSha, author, date, ...subjectParts] = line.split("|");
        return {
          sha,
          shortSha,
          author,
          date,
          subject: subjectParts.join("|"),
        } satisfies DeveloperLogCommit;
      });

    const changedFiles = Array.from(new Set([
      ...changedOutput.split("\n"),
      ...untrackedOutput.split("\n"),
    ].map((line) => line.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right, "fr"));

    return {
      commits,
      repositoryUrl: remoteOutput.trim() || null,
      branch: branchOutput.trim() || null,
      dirtyFileCount: changedFiles.length || statusOutput.split("\n").map((line) => line.trim()).filter(Boolean).length,
      changedFiles,
    };
  } catch {
    return {
      commits: [] as DeveloperLogCommit[],
      repositoryUrl: null,
      branch: null,
      dirtyFileCount: 0,
      changedFiles: [] as string[],
    };
  }
}

async function getSupabaseHealth(): Promise<MissionControlHealthCard> {
  const checkedAt = new Date().toISOString();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      label: "Santé Supabase",
      status: "unverifiable",
      detail: "Variables serveur Supabase absentes.",
      checkedAt,
    };
  }

  try {
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [profilesRes, missionsRes] = await Promise.all([
      adminClient.from("profiles").select("id", { count: "exact", head: true }),
      adminClient.from("missions").select("id", { count: "exact", head: true }),
    ]);
    if (profilesRes.error || missionsRes.error) {
      return {
        label: "Santé Supabase",
        status: "danger",
        detail: profilesRes.error?.message || missionsRes.error?.message || "Requête de contrôle Supabase en erreur.",
        checkedAt,
      };
    }

    return {
      label: "Santé Supabase",
      status: "healthy",
      detail: `${profilesRes.count ?? 0} profils et ${missionsRes.count ?? 0} missions accessibles au contrôle.`,
      checkedAt,
    };
  } catch (error) {
    return {
      label: "Santé Supabase",
      status: "danger",
      detail: error instanceof Error ? error.message : "Connexion Supabase impossible.",
      checkedAt,
    };
  }
}

async function collectFiles(root: string, extensions: Set<string>): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const resolved = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") return [];
      return collectFiles(resolved, extensions);
    }
    if (!extensions.has(path.extname(entry.name))) return [];
    return [resolved];
  }));

  return files.flat();
}

function toPosix(value: string) {
  return value.replaceAll("\\", "/");
}

function relativeFromRepo(filePath: string) {
  return toPosix(path.relative(process.cwd(), filePath));
}

function lineCount(content: string) {
  return content.split(/\r?\n/).length;
}

function routeFromPageFile(relativePath: string) {
  const normalized = toPosix(relativePath)
    .replace(/^src\/app/, "")
    .replace(/\/page\.(tsx|jsx|ts|js)$/, "");
  return normalized || "/";
}

function slugTokens(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
}

async function _collectProjectAdvisorSignals(): Promise<{
  designSystemDriftPages: Array<{
    route: string;
    file: string;
    lines: number;
    signals: string[];
    testReferences: string[];
  }>;
  productionReadyPages: Array<{
    route: string;
    file: string;
    lines: number;
    signals: string[];
    testReferences: string[];
  }>;
  largeFiles: Array<{
    file: string;
    lines: number;
  }>;
  underusedComponents: Array<{
    component: string;
    count: number;
    evidence: string[];
  }>;
}> {
  const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
  const sourceFiles = await collectFiles(path.join(process.cwd(), "src"), sourceExtensions);
  const pageFiles = sourceFiles.filter((filePath) => /[\\/]page\.(tsx|jsx|ts|js)$/.test(filePath) && !filePath.includes(`${path.sep}api${path.sep}`));
  const testRoots = [path.join(process.cwd(), "src", "tests"), path.join(process.cwd(), "e2e")];
  const testFiles = (await Promise.all(testRoots.map(async (root) => {
    try {
      return await collectFiles(root, sourceExtensions);
    } catch {
      return [];
    }
  }))).flat();

  const [sourceContents, testContents] = await Promise.all([
    Promise.all(sourceFiles.map(async (filePath) => ({ filePath, content: await fs.readFile(filePath, "utf8") }))),
    Promise.all(testFiles.map(async (filePath) => ({ filePath, content: await fs.readFile(filePath, "utf8") }))),
  ]);

  const uiComponentRoots = await fs.readdir(path.join(process.cwd(), "src", "components", "ui"), { withFileTypes: true });
  const uiComponents = uiComponentRoots
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const componentUsage = uiComponents.map((component) => {
    const pattern = new RegExp(`\\b${component}\\b`);
    const evidence = sourceContents
      .filter(({ filePath, content }) => !filePath.includes(`${path.sep}components${path.sep}ui${path.sep}${component}${path.sep}`) && pattern.test(content))
      .map(({ filePath }) => relativeFromRepo(filePath));

    return {
      component,
      count: evidence.length,
      evidence: evidence.slice(0, 4),
    };
  }).filter((item) => item.count <= 1).sort((left, right) => left.count - right.count || left.component.localeCompare(right.component, "fr"));

  const pageInsights = pageFiles.map((filePath) => {
    const relativePath = relativeFromRepo(filePath);
    const content = sourceContents.find((entry) => entry.filePath === filePath)?.content ?? "";
    const route = routeFromPageFile(relativePath);
    const lines = lineCount(content);
    const importsDesignSystem = content.includes("@/components/ui")
      || content.includes("@/components/dashboard")
      || content.includes("@/features/shared/components");
    const usesSectionIntro = content.includes("SectionIntro");
    const usesStatsCard = content.includes("StatsCard");
    const usesCard = content.includes("<Card") || content.includes("CardHeader") || content.includes("CardBody");
    const matchingTests = testContents.filter(({ content }) => {
      if (route !== "/" && content.includes(route)) return true;
      const tokens = slugTokens(route);
      return tokens.length >= 2 && tokens.every((token) => content.toLowerCase().includes(token));
    }).map(({ filePath: testPath }) => relativeFromRepo(testPath));

    const signals = [
      importsDesignSystem ? "Imports UI partagés" : "",
      usesSectionIntro ? "SectionIntro présent" : "",
      usesStatsCard ? "StatsCard présent" : "",
      usesCard ? "Cartes partagées" : "",
      matchingTests.length ? `${matchingTests.length} référence(s) de test` : "",
    ].filter(Boolean);

    return {
      route,
      file: relativePath,
      lines,
      signals,
      testReferences: matchingTests,
      importsDesignSystem,
    };
  });

  const designSystemDriftPages = pageInsights
    .filter((page) => !page.importsDesignSystem && page.lines >= 120)
    .sort((left, right) => right.lines - left.lines)
    .slice(0, 8)
    .map(({ importsDesignSystem: _importsDesignSystem, ...page }) => page);

  const productionReadyPages = pageInsights
    .filter((page) => page.route !== "/" && !page.route.includes("[") && page.testReferences.length > 0)
    .sort((left, right) => right.testReferences.length - left.testReferences.length || right.signals.length - left.signals.length || left.lines - right.lines)
    .slice(0, 8)
    .map(({ importsDesignSystem: _importsDesignSystem, ...page }) => page);

  const largeFiles = sourceContents
    .map(({ filePath, content }) => ({
      file: relativeFromRepo(filePath),
      lines: lineCount(content),
    }))
    .filter((item) => item.lines >= 350)
    .sort((left, right) => right.lines - left.lines)
    .slice(0, 8);

  return {
    designSystemDriftPages,
    productionReadyPages,
    largeFiles,
    underusedComponents: componentUsage.slice(0, 8),
  };
}

export default async function DevelopmentPage() {
  const session = await requireAdminAccess();

  const masterPlanPath = path.join(process.cwd(), "docs", "master-plan-planetls.md");
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const workflowPath = path.join(process.cwd(), ".github", "workflows", "e2e.yml");
  const [markdown, stats, packageRaw, gitData, supabaseHealth] = await Promise.all([
    fs.readFile(masterPlanPath, "utf8"),
    fs.stat(masterPlanPath),
    fs.readFile(packageJsonPath, "utf8"),
    readRecentCommits(),
    getSupabaseHealth(),
  ]);
  const plan = parseMasterPlan(markdown, stats.mtime.toISOString());
  const packageJson = JSON.parse(packageRaw) as { version?: string };
  const projectVersion = packageJson.version ?? "0.0.0";
  const defaultAuthor = session?.user?.name || session?.user?.email || "Équipe PlanetLS";
  const journal = buildDeveloperLogView({
    plan,
    projectVersion,
    repositoryUrl: gitData.repositoryUrl,
    commits: gitData.commits,
    changedFiles: gitData.changedFiles,
    branch: gitData.branch,
    dirtyFileCount: gitData.dirtyFileCount,
  });
  const workflowExists = await fs.access(workflowPath).then(() => true).catch(() => false);
  const missionControl = buildMissionControlView({
    plan,
    markdown,
    projectVersion,
    commits: gitData.commits,
    branch: gitData.branch,
    dirtyFileCount: gitData.dirtyFileCount,
    repositoryUrl: gitData.repositoryUrl,
    workflowExists,
    metadataBaseHost: "planetls-betav1.vercel.app",
    supabaseHealth,
  });
  const roadmap = buildRoadmapView(plan);
  const technicalMemory = buildTechnicalMemoryView({
    markdown,
    projectVersion,
    workflowExists,
  });
  return <MasterPlanViewer plan={plan} journal={journal} missionControl={missionControl} roadmap={roadmap} technicalMemory={technicalMemory} defaultAuthor={defaultAuthor} projectVersion={projectVersion} />;
}
