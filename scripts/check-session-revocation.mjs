// Diagnostic of the real API session resolver with simulated token/database, no network.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");
const source = ts.transpileModule(readFileSync("src/server/auth/apiAuth.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const cases = [
  { name: "admin downgraded to owner", tokenRole: "admin", role: "owner", status: "active", allowed: true },
  { name: "existing suspended account", tokenRole: "owner", role: "owner", status: "suspended", allowed: false },
  { name: "existing deleted account", tokenRole: "owner", role: "owner", status: "deleted", allowed: false },
];
const results = [];
for (const scenario of cases) {
  let reads = 0;
  const exports = {};
  const query = { select: () => query, eq: () => query, maybeSingle: async () => {
    reads++;
    return { data: { id: "fixture", email: "fixture@example.test", role: scenario.role, status: scenario.status }, error: null };
  } };
  runInNewContext(source, {
    exports, process: { env: { NEXTAUTH_SECRET: "test-only" } },
    require: (name) => {
      if (name === "next/server") return require(name);
      if (name === "next-auth/jwt") return { getToken: async () => ({ id: "fixture", email: "fixture@example.test", role: scenario.tokenRole }) };
      if (name === "@/server/auth/authOptions") return { auth: async () => null };
      if (name === "@/app/lib/dbServer") return { db: { from: () => query } };
      if (name === "@/app/utils/roles") return { resolveUserRole: (role) => role };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const actual = await exports.getApiAuthContext(new NextRequest("http://127.0.0.1/api/profiles/current"));
  const passed = scenario.allowed ? actual.role === scenario.role && !actual.isAdmin : !actual.userId;
  results.push({ name: scenario.name, expected: scenario.allowed ? scenario.role : "access denied", actual, databaseReads: reads, result: passed ? "PASS" : "FAIL" });
}
const report = { date: new Date().toISOString(), mode: "real resolver, simulated JWT and database; no connected proof", results };
mkdirSync("test-results", { recursive: true });
writeFileSync("test-results/session-revocation.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (results.some((result) => result.result === "FAIL")) process.exitCode = 1;
