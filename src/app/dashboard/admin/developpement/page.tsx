import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/authOptions";
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

export default async function DevelopmentPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "super_admin") redirect("/login");

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
