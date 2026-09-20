export const conditions = {
  mode: "A_LA_CARTE",
  duration: { kind: "INDETERMINEE", startsOn: "2026-10-01", endsOn: null, noticeDays: 30 },
  services: [
    { code: "CHECK_IN", state: "AUTOMATIQUE", pricing: { type: "FORFAIT_MISSION", amount: 25.50, currency: "EUR" } },
    { code: "CHECK_OUT", state: "AUTOMATIQUE", pricing: { type: "HORAIRE", amount: 20, currency: "EUR" } },
    { code: "MENAGE", state: "SUR_DEMANDE", pricing: { type: "SUR_DEVIS" } },
    { code: "LINGE", state: "AUTOMATIQUE", pricing: { type: "INCLUS" } },
    { code: "ANNONCE", state: "NON_INCLUSE", pricing: null },
    { code: "RESERVATIONS", state: "SUR_DEMANDE", pricing: { type: "POURCENTAGE", rate: 15, basis: "Nuitées hors ménage" } },
  ],
};

export function invalidConditions(): Array<[string, unknown]> {
  const change = (path: string[], value: unknown) => {
    const copy: Record<string, unknown> = structuredClone(conditions);
    let target = copy;
    for (const key of path.slice(0, -1)) target = target[key] as Record<string, unknown>;
    target[path.at(-1) as string] = value;
    return copy;
  };
  return [
    ["unknown mode", change(["mode"], "MONTHLY")], ["null mode", change(["mode"], null)],
    ["unknown field", { ...conditions, signature: true }],
    ["invalid date", change(["duration", "startsOn"], "2026-02-30")],
    ["determinate requires end", change(["duration", "kind"], "DETERMINEE")],
    ["indeterminate rejects end", change(["duration", "endsOn"], "2026-10-02")],
    ["end before start", { ...conditions, duration: { ...conditions.duration, kind: "DETERMINEE", endsOn: "2026-09-01" } }],
    ["negative notice", change(["duration", "noticeDays"], -1)],
    ["empty services", change(["services"], [])],
    ["duplicate codes", change(["services"], [conditions.services[0], conditions.services[0]])],
    ["unstable code", change(["services", "0", "code"], "check in")],
    ["unknown state", change(["services", "0", "state"], "ACTIVE")],
    ["null state", change(["services", "0", "state"], null)],
    ["missing pricing", change(["services", "0", "pricing"], null)],
    ["excluded with pricing", change(["services", "0", "state"], "NON_INCLUSE")],
    ["monthly not implemented", change(["services", "0", "pricing", "type"], "MENSUEL")],
    ["negative amount", change(["services", "0", "pricing", "amount"], -1)],
    ["string amount", change(["services", "0", "pricing", "amount"], "25")],
    ["extra decimals", change(["services", "0", "pricing", "amount"], 2.345)],
    ["missing currency", change(["services", "0", "pricing", "currency"], null)],
    ["invalid currency", change(["services", "0", "pricing", "currency"], "eur")],
    ["zero percent", change(["services", "5", "pricing", "rate"], 0)],
    ["percent over 100", change(["services", "5", "pricing", "rate"], 101)],
    ["missing basis", change(["services", "5", "pricing", "basis"], null)],
    ["blank basis", change(["services", "5", "pricing", "basis"], "   ")],
    ["extra pricing field", change(["services", "3", "pricing", "amount"], 5)],
  ];
}
