"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Select } from "@/components/ui";
import { contractConditionsSchema, type ContractConditions, type ContractDraft, type ContractVersion, type ContractConditionsResponse } from "./contractConditions";

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

function ConditionsSummary({ conditions }: { conditions: ContractConditions }) {
  return <div>
    <p>Mode indicatif : {conditions.mode === "FULL_MANAGEMENT" ? "Gestion complète" : "À la carte"}</p>
    <p>Début : {conditions.duration.startsOn} · {conditions.duration.kind === "DETERMINEE" ? `Fin : ${conditions.duration.endsOn}` : "Durée indéterminée"} · Préavis : {conditions.duration.noticeDays} jours</p>
    <ul>{conditions.services.map(service => {
      const price = service.pricing;
      const pricing = !price ? "" : price.type === "POURCENTAGE" ? `${price.rate} % — ${price.basis}`
        : "amount" in price ? `${price.amount} ${price.currency} ${price.type === "HORAIRE" ? "/ heure" : "/ mission"}`
        : price.type === "INCLUS" ? "Inclus" : "Sur devis";
      return <li key={service.code}>{labels[service.code] ?? service.code} : {service.state === "AUTOMATIQUE" ? "Automatique" : service.state === "SUR_DEMANDE" ? "Sur demande" : "Non incluse"}{pricing && ` · ${pricing}`}</li>;
    })}</ul>
  </div>;
}
const displayDate = (value: string | null) => value ? new Date(value).toLocaleString("fr-FR") : "";

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
  const [currentVersion, setCurrentVersion] = useState<ContractVersion | null>(null);
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [actorId, setActorId] = useState<string | null>(null);
  const [changeReason, setChangeReason] = useState("");
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
        const payload = await response.json() as ContractConditionsResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Impossible de charger le brouillon.");
        if (controller.signal.aborted) return;
        const version = payload.currentVersion ?? payload.draft;
        setCurrentVersion(version);
        setVersions(payload.versions);
        setActorId(payload.actorId);
        setConditions(version?.conditions ?? initialConditions());
        setRevision(version?.revision ?? 0);
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
        body: JSON.stringify({ versionId: currentVersion?.id ?? null, expectedRevision: revision, conditions: parsed.data }),
      });
      const payload = await response.json() as { draft?: ContractDraft; error?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.error || "Enregistrement impossible.");
      setRevision(payload.draft.revision);
      setConditions(payload.draft.conditions);
      setCurrentVersion(payload.draft);
      setMessage("Brouillon enregistré. La collaboration reste en attente de contractualisation.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    } finally { setSaving(false); }
  }

  const frozen = Boolean(currentVersion && currentVersion.status !== "draft");
  const dirty = !currentVersion || JSON.stringify(conditions) !== JSON.stringify(currentVersion.conditions);
  const accepted = actorId === currentVersion?.proposed_owner_id ? currentVersion?.owner_accepted_at : currentVersion?.concierge_accepted_at;
  async function transition(action: "propose" | "accept" | "request_changes") {
    if (!currentVersion || (action === "propose" && dirty)) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        action, versionId: currentVersion.id, expectedRevision: currentVersion.revision,
        ...(action === "request_changes" ? { reason: changeReason } : {}),
      }) });
      const payload = await response.json() as { version?: ContractVersion; error?: string };
      if (!response.ok || !payload.version) throw new Error(payload.error || "Action impossible.");
      setCurrentVersion(payload.version);
      setConditions(payload.version.conditions);
      setRevision(payload.version.revision);
      setChangeReason("");
      setReload(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action impossible.");
    } finally { setSaving(false); }
  }

  return <div>
    <Button type="button" aria-expanded={open} disabled={saving} onClick={() => setOpen(value => !value)}>
      {open ? "Fermer les conditions" : "Consulter / préparer les conditions"}
    </Button>
    {open && <div>
      <h4>{frozen ? "Conditions proposées" : "Brouillon de conditions contractuelles"}</h4>
      {!frozen && <p>Le propriétaire et la concierge peuvent modifier ce brouillon. Le mode est indicatif : choisissez chaque prestation explicitement.</p>}
      {loading && <p role="status">Chargement du brouillon…</p>}
      {error && <div role="alert"><p>{error}</p><Button type="button" disabled={saving} onClick={() => setReload(value => value + 1)}>Recharger le brouillon enregistré</Button><p>Le rechargement remplace vos modifications non enregistrées.</p></div>}
      {message && <p role="status">{message}</p>}
      {loaded && !loading && frozen && currentVersion && <div>
        <p>Version {currentVersion.version_number} · Révision {currentVersion.revision}</p>
        <p>Proposée par {currentVersion.proposed_by === currentVersion.proposed_owner_id ? "le propriétaire" : "la concierge"} le {displayDate(currentVersion.proposed_at)}.</p>
        <ConditionsSummary conditions={currentVersion.conditions} />
        <p>Accord propriétaire : {currentVersion.owner_accepted_at ? displayDate(currentVersion.owner_accepted_at) : "En attente"}</p>
        <p>Accord concierge : {currentVersion.concierge_accepted_at ? displayDate(currentVersion.concierge_accepted_at) : "En attente"}</p>
        {currentVersion.status === "ready_to_sign" ? <p role="status">Les conditions ont été acceptées par les deux parties. Le contrat est prêt pour l&apos;étape de signature.</p> : currentVersion.status === "proposed" && <>
          <p>Proposer ne vaut pas accord. Chaque partie doit accepter explicitement cette version.</p>
          <Button type="button" disabled={saving || Boolean(accepted)} onClick={() => void transition("accept")}>{accepted ? "Votre accord est enregistré" : "Accepter les conditions"}</Button>
          {actorId !== currentVersion.proposed_by && <div>
            <Input label="Modification souhaitée" maxLength={2000} value={changeReason} disabled={saving} onChange={event => setChangeReason(event.target.value)} />
            <Button type="button" disabled={saving || !changeReason.trim()} onClick={() => void transition("request_changes")}>Demander une modification</Button>
          </div>}
        </>}
      </div>}
      {loaded && !loading && !frozen && <form onSubmit={save}>
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
        <Button type="button" disabled={saving || dirty} onClick={() => void transition("propose")}>Proposer ces conditions</Button>
        {dirty && <p>Enregistrez vos modifications avant de proposer les conditions.</p>}
      </form>}
      {loaded && !loading && versions.filter(version => version.status === "superseded").map(version => <details key={version.id}>
        <summary>Historique : proposition {version.version_number} remplacée</summary>
        <p>Proposée par {version.proposed_by === version.proposed_owner_id ? "le propriétaire" : "la concierge"} le {displayDate(version.proposed_at)}.</p>
        <ConditionsSummary conditions={version.conditions} />
        <p>Accord propriétaire : {version.owner_accepted_at ? displayDate(version.owner_accepted_at) : "Non donné"} · Accord concierge : {version.concierge_accepted_at ? displayDate(version.concierge_accepted_at) : "Non donné"}</p>
        <p>Modification demandée par {version.change_requested_by === version.proposed_owner_id ? "le propriétaire" : "la concierge"} le {displayDate(version.change_requested_at)} : {version.change_request_reason}</p>
      </details>)}
    </div>}
  </div>;
}
