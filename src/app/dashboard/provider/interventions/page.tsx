"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../ProviderCrudPage.module.scss";

type ProviderClient = {
  id: string;
  client_name: string;
  city: string | null;
};

type ProviderIntervention = {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  service_label: string | null;
  status: string | null;
  priority: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  budget_amount: number | null;
  currency: string | null;
  location_label: string | null;
  created_at: string;
};

type ProviderInterventionsPayload = {
  items: ProviderIntervention[];
  summary: {
    total: number;
    in_progress: number;
    pending: number;
    completed: number;
  };
  note: string | null;
};

type ProviderClientsPayload = {
  items: ProviderClient[];
};

type InterventionFormState = {
  client_id: string;
  title: string;
  description: string;
  service_label: string;
  status: string;
  priority: string;
  scheduled_start: string;
  scheduled_end: string;
  budget_amount: string;
  currency: string;
  location_label: string;
};

const defaultForm: InterventionFormState = {
  client_id: "",
  title: "",
  description: "",
  service_label: "",
  status: "pending",
  priority: "normal",
  scheduled_start: "",
  scheduled_end: "",
  budget_amount: "",
  currency: "EUR",
  location_label: "",
};

function formatDateTime(value: string | null) {
  if (!value) return "Non planifie";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toFormState(item: ProviderIntervention): InterventionFormState {
  return {
    client_id: item.client_id ?? "",
    title: item.title ?? "",
    description: item.description ?? "",
    service_label: item.service_label ?? "",
    status: item.status ?? "pending",
    priority: item.priority ?? "normal",
    scheduled_start: toDatetimeLocal(item.scheduled_start),
    scheduled_end: toDatetimeLocal(item.scheduled_end),
    budget_amount: item.budget_amount != null ? String(item.budget_amount) : "",
    currency: item.currency ?? "EUR",
    location_label: item.location_label ?? "",
  };
}

export default function ProviderInterventionsPage() {
  const [data, setData] = useState<ProviderInterventionsPayload | null>(null);
  const [clients, setClients] = useState<ProviderClient[]>([]);
  const [form, setForm] = useState<InterventionFormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  async function loadInterventions() {
    try {
      setLoading(true);
      setError(null);

      const [interventionsResponse, clientsResponse] = await Promise.all([
        fetch("/api/provider/interventions", { cache: "no-store" }),
        fetch("/api/provider/clients", { cache: "no-store" }),
      ]);

      const interventionsPayload = (await interventionsResponse.json()) as ProviderInterventionsPayload & {
        error?: string;
      };
      const clientsPayload = (await clientsResponse.json()) as ProviderClientsPayload & {
        error?: string;
      };

      if (!interventionsResponse.ok) {
        throw new Error(interventionsPayload?.error || "Impossible de charger les interventions.");
      }
      if (!clientsResponse.ok) {
        throw new Error(clientsPayload?.error || "Impossible de charger les clients.");
      }

      const clientItems = Array.isArray(clientsPayload.items) ? clientsPayload.items : [];
      setData(interventionsPayload);
      setClients(clientItems);
      setForm((current) => ({ ...current, client_id: current.client_id || clientItems[0]?.id || "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les interventions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInterventions();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const items = data?.items ?? [];
  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const canSubmit = useMemo(() => form.title.trim().length > 0, [form.title]);
  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const next = items.filter((item) => {
      const matchesStatus = statusFilter === "all" || (item.status ?? "pending") === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;
      const client = item.client_id ? clientsById.get(item.client_id) : null;
      const haystack = [
        item.title,
        item.description,
        item.service_label,
        item.location_label,
        client?.client_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    next.sort((a, b) => {
      if (sortBy === "priority") {
        const order = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
        return (order[a.priority as keyof typeof order] ?? 9) - (order[b.priority as keyof typeof order] ?? 9);
      }
      if (sortBy === "schedule") {
        return new Date(a.scheduled_start ?? a.created_at).getTime() - new Date(b.scheduled_start ?? b.created_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return next;
  }, [items, searchTerm, statusFilter, sortBy, clientsById]);

  function resetForm() {
    setEditingId(null);
    setForm({ ...defaultForm, client_id: clients[0]?.id || "" });
  }

  function updateField<Key extends keyof InterventionFormState>(key: Key, value: InterventionFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        client_id: form.client_id || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        service_label: form.service_label.trim() || null,
        status: form.status,
        priority: form.priority,
        scheduled_start: form.scheduled_start ? new Date(form.scheduled_start).toISOString() : null,
        scheduled_end: form.scheduled_end ? new Date(form.scheduled_end).toISOString() : null,
        budget_amount: form.budget_amount.trim() ? Number(form.budget_amount) : null,
        currency: form.currency.trim() || "EUR",
        location_label: form.location_label.trim() || null,
      };

      const response = await fetch(
        editingId ? `/api/provider/interventions/${editingId}` : "/api/provider/interventions",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Impossible d'enregistrer l'intervention.");
      }

      resetForm();
      await loadInterventions();
      setSuccess(editingId ? "Intervention mise a jour." : "Intervention ajoutee.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'intervention.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/provider/interventions/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Impossible de supprimer l'intervention.");
      }

      if (editingId === id) resetForm();
      await loadInterventions();
      setSuccess("Intervention supprimee.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer l'intervention.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Operations terrain</p>
            <h1>Interventions</h1>
            <p>Pilotez vos missions client, leur statut, leur priorite et leur budget previsionnel.</p>
          </div>
          <div className={styles.metrics}>
            <span>{data?.summary.total ?? 0} interventions</span>
            <span>{data?.summary.in_progress ?? 0} en cours</span>
            <span>{data?.summary.pending ?? 0} en attente</span>
          </div>
        </header>

        {success ? <p className={styles.successBox}>{success}</p> : null}
        {error ? <p className={styles.errorBox}>{error}</p> : null}
        {!error && data?.note ? <p className={styles.infoBox}>{data.note}</p> : null}

        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>{editingId ? "Modifier une intervention" : "Ajouter une intervention"}</h2>
              {editingId ? (
                <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                  Annuler
                </button>
              ) : null}
            </div>

            <form className={styles.formGrid} onSubmit={handleSubmit}>
              <label>
                <span>Client</span>
                <select value={form.client_id} onChange={(event) => updateField("client_id", event.target.value)}>
                  <option value="">Sans client</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.client_name}</option>)}
                </select>
              </label>
              <label>
                <span>Titre</span>
                <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Ex: Reparation serrure" />
              </label>
              <label>
                <span>Service</span>
                <input value={form.service_label} onChange={(event) => updateField("service_label", event.target.value)} placeholder="Plomberie, electricite..." />
              </label>
              <label>
                <span>Statut</span>
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option value="pending">En attente</option>
                  <option value="accepted">Acceptee</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminee</option>
                  <option value="cancelled">Annulee</option>
                </select>
              </label>
              <label>
                <span>Priorite</span>
                <select value={form.priority} onChange={(event) => updateField("priority", event.target.value)}>
                  <option value="low">Basse</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </label>
              <label>
                <span>Budget</span>
                <input value={form.budget_amount} onChange={(event) => updateField("budget_amount", event.target.value)} placeholder="0.00" />
              </label>
              <label>
                <span>Devise</span>
                <input value={form.currency} onChange={(event) => updateField("currency", event.target.value)} placeholder="EUR" />
              </label>
              <label>
                <span>Lieu</span>
                <input value={form.location_label} onChange={(event) => updateField("location_label", event.target.value)} placeholder="Adresse ou zone" />
              </label>
              <label>
                <span>Debut prevu</span>
                <input type="datetime-local" value={form.scheduled_start} onChange={(event) => updateField("scheduled_start", event.target.value)} />
              </label>
              <label>
                <span>Fin prevue</span>
                <input type="datetime-local" value={form.scheduled_end} onChange={(event) => updateField("scheduled_end", event.target.value)} />
              </label>
              <label className={styles.fullWidth}>
                <span>Description</span>
                <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Travaux a effectuer, contexte client, consignes..." />
              </label>
              <div className={styles.formActions}>
                <button type="submit" disabled={!canSubmit || saving}>
                  {saving ? "Enregistrement..." : editingId ? "Mettre a jour" : "Ajouter"}
                </button>
                <Link href="/dashboard/provider/alertes" className={styles.linkButton}>
                  Voir les alertes
                </Link>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Planning d&apos;interventions</h2>
              <span>{loading ? "..." : `${filteredItems.length} mission(s)`}</span>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher une intervention"
                />
              </div>
              <div className={styles.toolbarGroup}>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">Tous statuts</option>
                  <option value="pending">En attente</option>
                  <option value="accepted">Acceptees</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminees</option>
                  <option value="cancelled">Annulees</option>
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="recent">Plus recentes</option>
                  <option value="schedule">Planning</option>
                  <option value="priority">Priorite</option>
                </select>
              </div>
            </div>

            {loading ? <p className={styles.emptyState}>Chargement des interventions...</p> : null}
            {!loading && filteredItems.length === 0 ? <p className={styles.emptyState}>Aucune intervention ne correspond au filtre actuel.</p> : null}

            {!loading && filteredItems.length > 0 ? (
              <div className={styles.cardList}>
                {filteredItems.map((item) => {
                  const client = item.client_id ? clientsById.get(item.client_id) : null;
                  return (
                    <article key={item.id} className={styles.itemCard}>
                      <div className={styles.itemHead}>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{client?.client_name || item.location_label || "Sans client"}</p>
                        </div>
                        <span className={styles.badge}>{item.status || "pending"}</span>
                      </div>
                      <div className={styles.itemMeta}>
                        <span>{item.service_label || "Service non renseigne"}</span>
                        <span>Priorite: {item.priority || "normal"}</span>
                        <span>Debut: {formatDateTime(item.scheduled_start)}</span>
                        <span>Budget: {item.budget_amount != null ? `${item.budget_amount} ${item.currency || "EUR"}` : "Non renseigne"}</span>
                      </div>
                      {item.description ? <p className={styles.itemBody}>{item.description}</p> : null}
                      <div className={styles.cardActions}>
                        <button type="button" className={styles.secondaryButton} onClick={() => {
                          setEditingId(item.id);
                          setForm(toFormState(item));
                        }}>
                          Modifier
                        </button>
                        <Link href="/dashboard/provider/messages" className={styles.linkButton}>
                          Messages
                        </Link>
                        <button type="button" className={styles.dangerButton} disabled={deletingId === item.id} onClick={() => void handleDelete(item.id)}>
                          {deletingId === item.id ? "Suppression..." : "Supprimer"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}
