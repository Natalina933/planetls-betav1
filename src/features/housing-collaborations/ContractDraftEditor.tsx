"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Select } from "@/components/ui";
import { contractConditionsSchema, type ContractConditions, type ContractDraft } from "./contractConditions";

const labels: Record<string, string> = {
  CHECK_IN: "Check-in", CHECK_OUT: "Check-out", LINGE: "Linge", MENAGE: "Ménage",
  ANNONCE: "Annonce", RESERVATIONS: "Réservations", COMPLEMENT: "Prestation complémentaire",
};
const initialConditions = (): ContractConditions => ({
  mode: "A_LA_CARTE",
  duration: { kind: "INDETERMINEE", startsOn: "", endsOn: null, noticeDays: 0 },
  services: Object.keys(labels).map(code => ({ code, state: "NON_INCLUSE", pricing: null })),
});
type Pricing = NonNullable<ContractConditions["services"][number]["pricing"]>;
function newPricing(type: Pricing["type"]): Pricing {
  if (type === "FORFAIT_MISSION" || type === "HORAIRE") return { type, amount: 0, currency: "EUR" };
  if (type === "POURCENTAGE") return { type, rate: 0, basis: "" };
  return { type };
}

export function ContractDraftEditor({ collaborationId }: { collaborationId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [revision, setRevision] = useState(0);
  const [conditions, setConditions] = useState(initialConditions);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const endpoint = `/api/housing-collaborations/${collaborationId}/conditions`;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setLoaded(false);
      setError(null);
      setMessage(null);
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        const payload = await response.json() as { draft?: ContractDraft | null; error?: string };
        if (!response.ok) throw new Error(payload.error || "Impossible de charger le brouillon.");
        if (controller.signal.aborted) return;
        setConditions(payload.draft?.conditions ?? initialConditions());
        setRevision(payload.draft?.revision ?? 0);
        setLoaded(true);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Chargement impossible.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [open, endpoint, reload]);

  function changeService(index: number, patch: Partial<ContractConditions["services"][number]>) {
    setConditions(previous => ({ ...previous, services: previous.services.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const parsed = contractConditionsSchema.safeParse(conditions);
    if (!parsed.success) {
      setError(`Vérifiez les conditions : ${parsed.error.issues[0]?.message ?? "données invalides"}.`);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRevision: revision, conditions: parsed.data }),
      });
      const payload = await response.json() as { draft?: ContractDraft; error?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.error || "Enregistrement impossible.");
      setRevision(payload.draft.revision);
      setConditions(payload.draft.conditions);
      setMessage("Brouillon enregistré. La collaboration reste en attente de contractualisation.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    } finally { setSaving(false); }
  }

  return <div>
    <Button type="button" aria-expanded={open} disabled={saving} onClick={() => setOpen(value => !value)}>
      {open ? "Fermer les conditions" : "Consulter / préparer les conditions"}
    </Button>
    {open && <div>
      <h4>Brouillon de conditions contractuelles</h4>
      <p>Le propriétaire et la concierge peuvent modifier ce brouillon. Le mode est indicatif : choisissez chaque prestation explicitement.</p>
      {loading && <p role="status">Chargement du brouillon…</p>}
      {error && <div role="alert"><p>{error}</p><Button type="button" disabled={saving} onClick={() => setReload(value => value + 1)}>Recharger le brouillon enregistré</Button><p>Le rechargement remplace vos modifications non enregistrées.</p></div>}
      {message && <p role="status">{message}</p>}
      {loaded && !loading && <form onSubmit={save}>
        <fieldset disabled={saving}>
          <legend>Mode et durée</legend>
          <Select label="Mode général" value={conditions.mode} onChange={event => setConditions({ ...conditions, mode: event.target.value as ContractConditions["mode"] })}>
            <option value="A_LA_CARTE">À la carte</option><option value="FULL_MANAGEMENT">Gestion complète</option>
          </Select>
          <Select label="Durée" value={conditions.duration.kind} onChange={event => setConditions({ ...conditions, duration: { ...conditions.duration, kind: event.target.value as ContractConditions["duration"]["kind"], endsOn: null } })}>
            <option value="INDETERMINEE">Indéterminée</option><option value="DETERMINEE">Déterminée</option>
          </Select>
          <Input label="Date de début" type="date" required value={conditions.duration.startsOn} onChange={event => setConditions({ ...conditions, duration: { ...conditions.duration, startsOn: event.target.value } })} />
          {conditions.duration.kind === "DETERMINEE" && <Input label="Date de fin" type="date" required min={conditions.duration.startsOn} value={conditions.duration.endsOn ?? ""} onChange={event => setConditions({ ...conditions, duration: { ...conditions.duration, endsOn: event.target.value } })} />}
          <Input label="Préavis en jours" type="number" min={0} max={3650} required value={conditions.duration.noticeDays} onChange={event => setConditions({ ...conditions, duration: { ...conditions.duration, noticeDays: event.target.valueAsNumber } })} />
        </fieldset>
        {conditions.services.map((service, index) => <fieldset key={service.code} disabled={saving}>
          <legend>{labels[service.code] ?? service.code}</legend>
          <Select label="Prestation" value={service.state} onChange={event => {
            const state = event.target.value as typeof service.state;
            changeService(index, { state, pricing: state === "NON_INCLUSE" ? null : service.pricing ?? { type: "SUR_DEVIS" } });
          }}><option value="NON_INCLUSE">Non incluse</option><option value="SUR_DEMANDE">Sur demande</option><option value="AUTOMATIQUE">Automatique</option></Select>
          {service.pricing && <>
            <Select label="Tarification" value={service.pricing.type} onChange={event => changeService(index, { pricing: newPricing(event.target.value as Pricing["type"]) })}>
              <option value="FORFAIT_MISSION">Forfait par mission</option><option value="HORAIRE">Tarif horaire</option><option value="POURCENTAGE">Pourcentage</option><option value="INCLUS">Inclus</option><option value="SUR_DEVIS">Sur devis</option>
            </Select>
            {"amount" in service.pricing && <>
              <Input label="Montant" type="number" min={0} max={999999999.99} step="0.01" required value={service.pricing.amount} onChange={event => changeService(index, { pricing: { ...service.pricing as Extract<Pricing, { amount: number }>, amount: event.target.valueAsNumber } })} />
              <Input label="Devise" required pattern="[A-Z]{3}" maxLength={3} value={service.pricing.currency} onChange={event => changeService(index, { pricing: { ...service.pricing as Extract<Pricing, { amount: number }>, currency: event.target.value.toUpperCase() } })} />
            </>}
            {service.pricing.type === "POURCENTAGE" && <>
              <Input label="Pourcentage" type="number" min="0.01" max={100} step="any" required value={service.pricing.rate} onChange={event => changeService(index, { pricing: { ...service.pricing as Extract<Pricing, { rate: number }>, rate: event.target.valueAsNumber } })} />
              <Input label="Assiette du pourcentage" required maxLength={500} placeholder="Ex. montant des nuitées hors frais de ménage" value={service.pricing.basis} onChange={event => changeService(index, { pricing: { ...service.pricing as Extract<Pricing, { rate: number }>, basis: event.target.value } })} />
            </>}
          </>}
        </fieldset>)}
        <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer le brouillon"}</Button>
      </form>}
    </div>}
  </div>;
}
