type Entry = { path: string; children?: Entry[] };

export function getOwnerActivePath(items: Entry[], pathname: string, query: string) {
  const params = new URLSearchParams(query);
  const aliases: Record<string, string> = {
    "/dashboard/owner/mission-urgente": "/dashboard/owner/alertes",
    "/dashboard/owner/contacts": "/dashboard/owner/messages",
  };
  const path = aliases[pathname] ?? pathname;
  if (["arrival", "departure"].includes(params.get("type") ?? "")) params.set("type", "movements");
  const entries = items.flatMap(item => [item, ...(item.children ?? [])]);
  return entries.map(entry => {
    const [base, search = ""] = entry.path.split("?");
    const required = new URLSearchParams(search);
    if (path !== base && !(base !== "/dashboard/owner" && path.startsWith(`${base}/`))) return { path: entry.path, score: -1 };
    if (base.endsWith("/settings")) return { path: entry.path, score: base.length };
    if ([...required].some(([key, value]) => params.get(key) !== value)) return { path: entry.path, score: -1 };
    return { path: entry.path, score: base.length + required.size * 1000 };
  }).filter(entry => entry.score >= 0).sort((a, b) => b.score - a.score)[0]?.path;
}
