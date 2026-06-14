import { readFile } from "fs/promises";
import path from "path";

export interface ServiceCatalogItem {
  id: number;
  category: string;
  service: string;
  description: string;
}

export interface ServiceCatalogGroup {
  category: string;
  services: ServiceCatalogItem[];
}

export interface CategoryReferenceItem {
  id: number;
  key: string;
  label: string;
  icon: string;
  image: string | null;
  description: string;
  groupKey: string;
  newId: string;
}

export interface CategoryReferenceGroup {
  groupKey: string;
  categories: CategoryReferenceItem[];
}

const SERVICES_SQL_PATH = path.join(
  process.cwd(),
  "src",
  "app",
  "data",
  "services",
  "services_catalog_rows.sql",
);

const CATEGORY_SQL_PATHS = [
  path.join(process.cwd(), "src", "app", "design-system", "visuels", "categories_rows.sql"),
  path.join(process.cwd(), "src", "app", "data", "categories", "categories_rows.sql"),
];

function cleanSqlValue(value: string) {
  const trimmed = value.trim();
  if (/^null$/i.test(trimmed)) return null;
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

function splitTupleValues(tuple: string) {
  const values: string[] = [];
  let current = "";
  let inQuote = false;

  for (let index = 0; index < tuple.length; index += 1) {
    const char = tuple[index];
    const next = tuple[index + 1];

    if (char === "'" && next === "'") {
      current += "''";
      index += 1;
      continue;
    }

    if (char === "'") {
      inQuote = !inQuote;
      current += char;
      continue;
    }

    if (char === "," && !inQuote) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) values.push(current);
  return values.map((value) => cleanSqlValue(value));
}

function extractSqlTuples(sql: string) {
  const valuesIndex = sql.indexOf("VALUES");
  const source = valuesIndex >= 0 ? sql.slice(valuesIndex + "VALUES".length) : sql;
  const tuples: Array<Array<string | null>> = [];
  let current = "";
  let depth = 0;
  let inQuote = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (char === "'" && next === "'") {
      if (depth > 0) current += "''";
      index += 1;
      continue;
    }

    if (char === "'") {
      inQuote = !inQuote;
      if (depth > 0) current += char;
      continue;
    }

    if (char === "(" && !inQuote) {
      if (depth === 0) {
        current = "";
      } else {
        current += char;
      }
      depth += 1;
      continue;
    }

    if (char === ")" && !inQuote) {
      depth -= 1;
      if (depth === 0) {
        tuples.push(splitTupleValues(current));
        current = "";
      } else if (depth > 0) {
        current += char;
      }
      continue;
    }

    if (depth > 0) current += char;
  }

  return tuples;
}

async function readFirstExistingFile(paths: string[]) {
  for (const filePath of paths) {
    try {
      return await readFile(filePath, "utf8");
    } catch {
      // Keep looking for the next local snapshot.
    }
  }

  return "";
}

export async function getServiceCatalogGroups(): Promise<ServiceCatalogGroup[]> {
  const sql = await readFirstExistingFile([SERVICES_SQL_PATH]);
  const rows = extractSqlTuples(sql);
  const groupMap = new Map<string, ServiceCatalogItem[]>();

  for (const row of rows) {
    const id = Number(row[0]);
    const category = String(row[1] ?? "Autre");
    const service = String(row[2] ?? "");
    const description = String(row[3] ?? "");

    if (!service) continue;

    const item: ServiceCatalogItem = {
      id,
      category,
      service,
      description,
    };

    if (!groupMap.has(category)) {
      groupMap.set(category, []);
    }
    groupMap.get(category)!.push(item);
  }

  return Array.from(groupMap.entries())
    .sort(([left], [right]) => left.localeCompare(right, "fr"))
    .map(([category, services]) => ({
      category,
      services: services.sort((left, right) => left.service.localeCompare(right.service, "fr")),
    }));
}

export async function getCategoryReferenceGroups(): Promise<CategoryReferenceGroup[]> {
  const sql = await readFirstExistingFile(CATEGORY_SQL_PATHS);
  const rows = extractSqlTuples(sql);
  const groupMap = new Map<string, CategoryReferenceItem[]>();

  for (const row of rows) {
    const item: CategoryReferenceItem = {
      id: Number(row[0]),
      key: String(row[1] ?? ""),
      label: String(row[2] ?? ""),
      icon: String(row[3] ?? ""),
      image: row[4] ? String(row[4]) : null,
      description: String(row[5] ?? ""),
      groupKey: String(row[6] ?? "autre"),
      newId: String(row[7] ?? ""),
    };

    if (!item.key || !item.label) continue;

    if (!groupMap.has(item.groupKey)) {
      groupMap.set(item.groupKey, []);
    }
    groupMap.get(item.groupKey)!.push(item);
  }

  return Array.from(groupMap.entries())
    .sort(([left], [right]) => left.localeCompare(right, "fr"))
    .map(([groupKey, categories]) => ({
      groupKey,
      categories: categories.sort((left, right) => left.label.localeCompare(right.label, "fr")),
    }));
}
