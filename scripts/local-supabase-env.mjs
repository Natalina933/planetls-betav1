import { execFileSync } from "node:child_process";

function parseEnv(output) {
  const values = {};

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }

  return values;
}

export function getLocalSupabaseEnv() {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const status = parseEnv(execFileSync(npx, ["supabase", "status", "-o", "env"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  }));

  if (!status.API_URL || !status.ANON_KEY || !status.SERVICE_ROLE_KEY) {
    throw new Error("Supabase local n'est pas démarré. Lancez d'abord `npx supabase start`.");
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  };
}
