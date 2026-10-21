type Entry = { label: string; path: string };

/** Une seule entrée courante, même lorsque deux liens partagent une destination. */
export function getConciergeActiveLabel(items: Entry[], pathname: string, query: string) {
  const params = new URLSearchParams(query);
  return items
    .map((item, index) => {
      const [base, search = ""] = item.path.split("?");
      const required = new URLSearchParams(search);
      const matches = pathname === base || (base !== "/dashboard/concierge" && pathname.startsWith(`${base}/`));
      const matchesQuery = [...required].every(([key, value]) => params.get(key) === value);
      return { ...item, index, score: matches && matchesQuery ? base.length + required.size * 1000 : -1 };
    })
    .filter(item => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.label;
}
