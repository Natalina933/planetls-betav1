import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { conciergeSubfeatures } from "../../app/dashboard/admin/(product-tech)/developpement/conciergeSubfeatures.ts";
import * as inventory from "../../app/dashboard/admin/(product-tech)/developpement/spaceInventory.ts";

// Même harnais de rendu isolé que les tests SpaceProgress : vrai composant,
// seuls les modules SCSS sont substitués ; aucune requête réseau.
export function loadSubfeatureDetail() {
  const require = createRequire(import.meta.url);
  const source = readFileSync(new URL("../../app/dashboard/admin/(product-tech)/developpement/SubfeatureDetail.tsx", import.meta.url), "utf8");
  const exports: Record<string, any> = {};
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  new Function("require", "exports", code)((name: string) => {
    if (name.endsWith(".scss")) return { __esModule: true, default: {} };
    return require(name);
  }, exports);
  return exports;
}

export function loadProgressCards() {
  const require = createRequire(import.meta.url);
  const source = readFileSync(new URL("../../app/dashboard/admin/(product-tech)/developpement/SpaceProgress.tsx", import.meta.url), "utf8");
  const exports: Record<string, any> = {};
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  new Function("require", "exports", code)((name: string) => {
    if (name === "./spaceInventory") return inventory;
    if (name === "@/components/ui") return { Card: "article", CardBody: "div", CardHeader: "header" };
    if (name === "lucide-react") return { LayoutList: "svg", AlertTriangle: "svg" };
    if (name.endsWith(".scss")) return { __esModule: true, default: {} };
    return require(name);
  }, exports);
  return exports.SpaceProgress;
}

export function loadConciergeSubfeatures(reactOverride?: Record<string, unknown>) {
  const require = createRequire(import.meta.url);
  const source = readFileSync(new URL("../../app/dashboard/admin/(product-tech)/developpement/ConciergeSubfeatureList.tsx", import.meta.url), "utf8");
  const exports: Record<string, any> = {};
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  new Function("require", "exports", code)((name: string) => {
    if (name === "react" && reactOverride) return reactOverride;
    if (name === "./SubfeatureDetail") return loadSubfeatureDetail();
    if (name === "./conciergeSubfeatures") return { conciergeSubfeatures };
    if (name.endsWith(".scss")) return { __esModule: true, default: {} };
    return require(name);
  }, exports);
  return exports.ConciergeSubfeatures;
}
