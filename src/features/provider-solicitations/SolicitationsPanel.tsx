"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./SolicitationsPanel.module.scss";

type Item = { id: string; provider_profile_id: string; service_label_snapshot: string; description: string; location_label: string; city: string; desired_at: string | null; status: "sent" | "interested" | "declined"; response_message: string | null; version: number; created_at: string };
type Detail = { solicitation: Item; allowed_actions: { can_respond: boolean } };
type Command = { id: string; key: string; status: "interested" | "declined"; message: string | null; expected_version: number };
const storageKey = "planetls-provider-solicitation-pending";
const labels = { sent: "En attente de réponse", interested: "Intéressé", declined: "Refusé" };
function errorMessage(status: number, code?: string) {
  if (status === 401) return "Votre session a expiré. Reconnectez-vous puis réessayez.";
  if (status === 403) return "Vous n’avez pas accès à ces sollicitations.";
  if (status === 503) return "Le service de sollicitations est actuellement indisponible ou désactivé.";
  if (status === 409) return code === "ALREADY_RESPONDED" ? "Une réponse a déjà été enregistrée. Vérifiez l’état actualisé." : "La sollicitation a changé ou la commande est en conflit. Vérifiez l’état actualisé avant de continuer.";
  return "Une erreur est survenue. Réessayez.";
}
async function read(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(response.status, data?.error?.code));
  return data;
}
export default function SolicitationsPanel({ role }: { role: "owner" | "provider" }) {
  const [items, setItems] = useState<Item[]>([]); const [cursor, setCursor] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null); const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); const lock = useRef(false); const [error, setError] = useState("");
  const [notice, setNotice] = useState(""); const [text, setText] = useState("");
  const [choice, setChoice] = useState<Command["status"] | null>(null); const [pending, setPending] = useState<Command | null>(null);
  const load = useCallback(async (next?: string) => {
    setLoading(true); setError("");
    try { const data = await read(`/api/provider-solicitations${next ? `?cursor=${encodeURIComponent(next)}` : ""}`); setItems((old) => next ? [...old, ...data.items] : data.items); setCursor(data.next_cursor); }
    catch (e) { setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Erreur réseau. Vérifiez votre connexion et réessayez."); }
    finally { setLoading(false); }
  }, []);
  const open = useCallback(async (id: string) => {
    setBusy(true); setError(""); setDetail(null); setChoice(null); setText("");
    try { setDetail(await read(`/api/provider-solicitations/${encodeURIComponent(id)}`)); }
    catch (e) { setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "Erreur réseau. Vérifiez votre connexion et réessayez."); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); if (role === "provider") { try { const saved = sessionStorage.getItem(storageKey); if (saved) setPending(JSON.parse(saved)); } catch { setError("Impossible de récupérer la réponse en attente."); } } }, 0); return () => window.clearTimeout(timer); }, [load, role]);
  async function send(command: Command) {
    if (lock.current) return; lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/provider-solicitations/${encodeURIComponent(command.id)}/respond`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": command.key }, body: JSON.stringify({ status: command.status, message: command.message, expected_version: command.expected_version }) });
      const data = await response.json().catch(() => null);
      if (response.status === 409) { sessionStorage.removeItem(storageKey); setPending(null); await load(); await open(command.id); setError(errorMessage(409, data?.error?.code)); return; }
      if (!response.ok) { if (response.status >= 500) { setError(`${errorMessage(response.status, data?.error?.code)} Le résultat est incertain : reprenez la même réponse.`); return; } sessionStorage.removeItem(storageKey); setPending(null); setError(errorMessage(response.status, data?.error?.code)); return; }
      sessionStorage.removeItem(storageKey); setPending(null); await load(); await open(command.id); setNotice("Réponse enregistrée. Une marque d’intérêt ne crée ni contrat, ni mission, ni intervention, ni obligation automatique.");
    } catch { setError("Erreur réseau : le résultat est incertain. Reprenez la même réponse pour vérifier son enregistrement."); }
    finally { lock.current = false; setBusy(false); }
  }
  function confirm() {
    if (!detail || !choice || lock.current || pending) return;
    const command: Command = { id: detail.solicitation.id, key: crypto.randomUUID(), status: choice, message: text.trim() || null, expected_version: detail.solicitation.version };
    try { sessionStorage.setItem(storageKey, JSON.stringify(command)); } catch { setError("Impossible de conserver la clé de reprise. Réponse non envoyée."); return; }
    setPending(command); void send(command);
  }
  return <section className={styles.panel} aria-labelledby={`solicitations-${role}`}>
    <h2 id={`solicitations-${role}`}>{role === "owner" ? "Sollicitations des artisans" : "Sollicitations reçues"}</h2>
    <p>Une marque d’intérêt ne crée ni contrat, ni mission, ni intervention, ni obligation automatique.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status">{notice}</p>}
    {pending && <div className={styles.pending}><p>Une réponse attend confirmation. Reprenez cette même commande avant toute autre réponse.</p><button type="button" disabled={busy} onClick={() => void send(pending)}>Reprendre la réponse</button></div>}
    {loading ? <p role="status">Chargement des sollicitations…</p> : <><button type="button" disabled={busy} onClick={() => void load()}>Actualiser</button>{items.length === 0 && !error ? <p>Aucune sollicitation.</p> : null}
      <ul className={styles.list}>{items.map((item) => <li key={item.id}><button type="button" disabled={busy} onClick={() => void open(item.id)}><strong>{item.service_label_snapshot}</strong> — {labels[item.status]} <span>({new Date(item.created_at).toLocaleDateString("fr-FR")})</span></button></li>)}</ul>
      {cursor && <button type="button" disabled={busy} onClick={() => void load(cursor)}>Afficher les suivantes</button>}</>}
    {busy && <p role="status">Traitement en cours…</p>}
    {detail && <article className={styles.detail}><h3>{detail.solicitation.service_label_snapshot}</h3><p><strong>État : {labels[detail.solicitation.status]}</strong></p>{role === "owner" && <p>Référence artisan : {detail.solicitation.provider_profile_id}</p>}<p>{detail.solicitation.description}</p><p>{detail.solicitation.location_label}, {detail.solicitation.city}</p>{detail.solicitation.desired_at && <p>Date souhaitée : {new Date(detail.solicitation.desired_at).toLocaleString("fr-FR")}</p>}
      {detail.solicitation.response_message && <p>Message de réponse : {detail.solicitation.response_message}</p>}
      {role === "owner" && <p>Aucune autre action n’est proposée pour cette sollicitation.</p>}
      {role === "provider" && !detail.allowed_actions.can_respond && <p>Aucune réponse n’est actuellement disponible.</p>}
      {role === "provider" && detail.allowed_actions.can_respond && !pending && <div><label htmlFor="solicitation-message">Message facultatif (2 000 caractères maximum)</label><textarea id="solicitation-message" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} /><p>{text.length}/2 000</p><div className={styles.actions}><button type="button" disabled={busy} onClick={() => setChoice("interested")}>Intéressé</button><button type="button" disabled={busy} onClick={() => setChoice("declined")}>Refuser</button></div>
      {choice && <div className={styles.pending}><p>Confirmer « {choice === "interested" ? "Intéressé" : "Refuser"} » ? Cette réponse ne pourra pas être modifiée ici.</p><div className={styles.actions}><button type="button" disabled={busy} onClick={confirm}>Confirmer la réponse</button><button type="button" disabled={busy} onClick={() => setChoice(null)}>Revenir</button></div></div>}</div>}
    </article>}
  </section>;
}
