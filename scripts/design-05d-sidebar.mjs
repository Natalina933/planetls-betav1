import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "test-results/design-05c-sidebar");
const fixture = path.join(root, "e2e/fixtures/design-05d-sidebar");
const command = process.argv[2];
const require = createRequire(import.meta.url);

if (command === "prepare") {
  for (const name of ["typescript", "sass", "@playwright/test", "next/dist/compiled/webpack/webpack.js"]) require.resolve(name);
  console.log("Dépendances présentes. Aucun navigateur ni serveur lancé.");
  console.log("BLOCKED : aucune preuve de confinement réseau système fournie ; capture et preview refusées.");
} else if (command === "build" && process.env.PLS_SIDEBAR_COMPILER !== "1") {
  // Liste minimale : aucun chargement de .env et aucune variable applicative héritée.
  const env = {};
  for (const key of ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "WINDIR", "TEMP", "TMP"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  env.PLS_SIDEBAR_COMPILER = "1";
  const result = spawnSync(process.execPath, ["--import", pathToFileURL(path.join(root, "scripts/design-05d-sidebar-network.mjs")).href, fileURLToPath(import.meta.url), "build"], { cwd: root, env, stdio: "inherit", windowsHide: true });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} else if (command === "build") {
  if (existsSync(output)) throw new Error("Répertoire de résultats existant : aucun écrasement autorisé.");
  const compiled = require("next/dist/compiled/webpack/webpack.js");
  compiled.init();
  const webpack = compiled.webpack;
  const aliases = { "@": path.join(root, "src"), "next/link$": path.join(fixture, "link.tsx"), "next/image$": path.join(fixture, "image.tsx"), "next/navigation$": path.join(fixture, "adapters.tsx"), "@/app/context/UserTypeContext$": path.join(fixture, "adapters.tsx"), "@/app/providers/ThemeProvider$": path.join(fixture, "adapters.tsx") };
  // Les alias exacts doivent précéder l'alias général @.
  const ordered = Object.fromEntries(Object.entries(aliases).reverse());
  const compiler = webpack({ mode: "development", devtool: false, context: root, entry: path.join(fixture, "entry.tsx"), output: { path: output, filename: "sidebar.js" }, resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"], alias: ordered }, module: { rules: [
    { test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.join(root, "scripts/design-05d-sidebar-loader.cjs") },
    { test: /\.s?css$/, use: [require.resolve("next/dist/build/webpack/loaders/next-style-loader"), { loader: require.resolve("next/dist/build/webpack/loaders/css-loader/src"), options: { url: false, modules: { auto: /\.module\.scss$/, namedExport: false, localIdentName: "[name]__[local]__[hash:base64:5]", exportLocalsConvention: "asIs" } } }, { loader: path.join(root, "scripts/design-05d-sidebar-loader.cjs") }] },
  ] } });
  await new Promise((resolve, reject) => compiler.run((error, stats) => compiler.close(closeError => {
    if (error || closeError || stats?.hasErrors()) reject(error || closeError || new Error(stats.toString({ all: false, errors: true })));
    else resolve();
  })));
  mkdirSync(output, { recursive: true });
  writeFileSync(path.join(output, "index.html"), '<!doctype html><html lang="fr" data-theme="mucha-dark"><meta charset="utf-8"><title>Recette sidebar isolée</title><body><div id="root"></div><script src="/sidebar.js"></script></body></html>', "utf8");
  console.log("Compilation locale terminée. Aucune validation visuelle effectuée.");
} else if (["capture", "preview"].includes(command)) {
  throw new Error("BLOCKED : confinement réseau système non démontré. Aucun navigateur lancé. Aucun simple indicateur d’environnement ne peut lever ce verrou.");
} else {
  throw new Error("Commande attendue : prepare, build, preview ou capture.");
}
