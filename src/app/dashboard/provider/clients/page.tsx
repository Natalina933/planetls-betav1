"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ActionPanel from "@/app/components/dashboard/shared/ActionPanel";
import SectionHeader from "@/app/components/dashboard/shared/SectionHeader";
import WorkflowStatusBadge from "@/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import styles from "../ProviderCrudPage.module.scss";

type ProviderClient = {
  id: string;
  client_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  client_type: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
};

type ProviderClientsPayload = {
  items: ProviderClient[];
  summary: {
    total: number;
    active: number;
  };
  note: string | null;
};

type ClientFormState = {
  client_name: string;
  company_name: string;
  email: string;
  phone: string;
  city: string;
  client_type: string;
  status: string;
  notes: string;
};

const defaultForm: ClientFormState = {
  client_name: "",
  company_name: "",
  email: "",
  phone: "",
  city: "",
  client_type: "manual",
  status: "active",
  notes: "",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toFormState(client: ProviderClient): ClientFormState {
  return {
    client_name: client.client_name ?? "",
    company_name: client.company_name ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    city: client.city ?? "",
    client_type: client.client_type ?? "manual",
    status: client.status ?? "active",
    notes: client.notes ?? "",
  };
}

export default function ProviderClientsPage() {
  const [data, setData] = useState<ProviderClientsPayload | null>(null);
  const [form, setForm] = useState<ClientFormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quickUpdatingId, setQuickUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  async function loadClients() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/provider/clients", { cache: "no-store" });
      const payload = (await response.json()) as ProviderClientsPayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les clients.");
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les clients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClients();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const canSubmit = useMemo(() => form.client_name.trim().length > 0, [form.client_name]);
  const filteredClients = useMemo(() => {
    const clients = data?.items ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const next = clients.filter((client) => {
      const matchesStatus = statusFilter === "all" || (client.status ?? "active") === statusFilter;
      if (!matchesStatus) return false;
      const createdAt = new Date(client.created_at);
      if (dateFrom) {
        const minDate = new Date(`${dateFrom}T00:00:00`);
        if (createdAt < minDate) return false;
      }
      if (dateTo) {
        const maxDate = new Date(`${dateTo}T23:59:59`);
        if (createdAt > maxDate) return false;
      }
      if (!normalizedSearch) return true;
      const haystack = [
        client.client_name,
        client.company_name,
        client.email,
        client.phone,
        client.city,
        client.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    next.sort((a, b) => {
      if (sortBy === "name") return a.client_name.localeCompare(b.client_name, "fr");
      if (sortBy === "city") return (a.city ?? "").localeCompare(b.city ?? "", "fr");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return next;
  }, [data?.items, searchTerm, statusFilter, sortBy, dateFrom, dateTo]);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const paginatedClients = useMemo(
    () => filteredClients.slice((page - 1) * pageSize, page * pageSize),
    [filteredClients, page],
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortBy, dateFrom, dateTo]);

  function handleExportCsv() {
    const rows = [
      ["Nom", "Société", "Email", "Téléphone", "Ville", "Type", "Statut", "Création"],
      ...filteredClients.map((client) => [
        client.client_name ?? "",
        client.company_name ?? "",
        client.email ?? "",
        client.phone ?? "",
        client.city ?? "",
        client.client_type ?? "",
        client.status ?? "",
        client.created_at ?? "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "provider-clients.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function resetForm() {
    setForm(defaultForm);
    setEditingId(null);
  }

  function updateField<Key extends keyof ClientFormState>(key: Key, value: ClientFormState[Key]) {
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
        client_name: form.client_name.trim(),
        company_name: form.company_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        client_type: form.client_type,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      const response = await fetch(
        editingId ? `/api/provider/clients/${editingId}` : "/api/provider/clients",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Impossible d'enregistrer le client.");
      }

      resetForm();
      await loadClients();
      setSuccess(editingId ? "Client mis a jour." : "Client ajoute.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer le client.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/provider/clients/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Impossible de supprimer le client.");
      }

      if (editingId === id) resetForm();
      await loadClients();
      setSuccess("Client supprime.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le client.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleQuickStatusUpdate(id: string, status: string) {
    try {
      setQuickUpdatingId(id);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/provider/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Impossible de mettre a jour le statut.");
      }

      await loadClients();
      setSuccess("Statut client mis a jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre a jour le statut.");
    } finally {
      setQuickUpdatingId(null);
    }
  }

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Relation client</p>
            <h1>Clients</h1>
            <p>Gerez votre portefeuille client, puis ouvrez un fil de message depuis chaque fiche.</p>
          </div>
          <div className={styles.metrics}>
            <span>{data?.summary.total ?? 0} clients</span>
            <span>{data?.summary.active ?? 0} actifs</span>
          </div>
        </header>

        {success ? <p className={styles.successBox}>{success}</p> : null}
        {error ? <p className={styles.errorBox}>{error}</p> : null}
        {!error && data?.note ? <p className={styles.infoBox}>{data.note}</p> : null}
        <ActionPanel
          eyebrow="Actions a mener"
          title="Accelerez le suivi relation client"
          description="Ajoutez une fiche, ouvrez les conversations actives ou nettoyez le portefeuille pour garder une base exploitable."
          actions={[
            { label: "Ajouter un client", href: "/dashboard/provider/clients", primary: true },
            { label: "Ouvrir les messages", href: "/dashboard/provider/messages" },
            { label: "Voir la vue prioritaire", href: "/dashboard/provider" },
          ]}
        />

        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <SectionHeader
                eyebrow="1. Mise a jour"
                title={editingId ? "Modifier un client" : "Ajouter un client"}
              />
              {editingId ? (
                <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                  Annuler
                </button>
              ) : null}
            </div>

            <form className={styles.formGrid} onSubmit={handleSubmit}>
              <label>
                <span>Nom du client</span>
                <input value={form.client_name} onChange={(event) => updateField("client_name", event.target.value)} placeholder="Nom complet" />
              </label>
              <label>
                <span>Societe</span>
                <input value={form.company_name} onChange={(event) => updateField("company_name", event.target.value)} placeholder="Optionnel" />
              </label>
              <label>
                <span>Email</span>
                <input value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="client@exemple.fr" />
              </label>
              <label>
                <span>Téléphone</span>
                <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="06..." />
              </label>
              <label>
                <span>Ville</span>
                <input value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Paris" />
              </label>
              <label>
                <span>Type</span>
                <select value={form.client_type} onChange={(event) => updateField("client_type", event.target.value)}>
                  <option value="manual">Manuel</option>
                  <option value="owner">Proprietaire</option>
                  <option value="business">Societe</option>
                </select>
              </label>
              <label>
                <span>Statut</span>
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="archived">Archive</option>
                </select>
              </label>
              <label className={styles.fullWidth}>
                <span>Notes</span>
                <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Contexte, attentes, details utiles..." />
              </label>
              <div className={styles.formActions}>
                <button type="submit" disabled={!canSubmit || saving}>
                  {saving ? "Enregistrement..." : editingId ? "Mettre a jour" : "Ajouter"}
                </button>
                <Link href="/dashboard/provider/messages" className={styles.linkButton}>
                  Voir les messages
                </Link>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <SectionHeader
                eyebrow="2. Informations prioritaires"
                title="Portefeuille client"
                actionLabel="Voir les messages"
                actionHref="/dashboard/provider/messages"
              />
              <span>{loading ? "..." : `${filteredClients.length} fiche(s)`}</span>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher un client"
                />
              </div>
              <div className={styles.toolbarGroup}>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">Tous statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="archived">Archives</option>
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="recent">Plus recents</option>
                  <option value="name">Nom</option>
                  <option value="city">Ville</option>
                </select>
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                <button type="button" className={styles.secondaryButton} onClick={handleExportCsv}>
                  Export CSV
                </button>
              </div>
            </div>

            <div className={styles.counterRow}>
              <span className={styles.counter}>{filteredClients.length} resultats</span>
              <span className={styles.counter}>
                {filteredClients.filter((client) => (client.status ?? "active") === "active").length} actifs
              </span>
              <span className={styles.counter}>
                {filteredClients.filter((client) => client.city).length} avec ville
              </span>
            </div>

            {loading ? <p className={styles.emptyState}>Chargement des clients...</p> : null}
            {!loading && filteredClients.length === 0 ? <p className={styles.emptyState}>Aucun client ne correspond au filtre actuel.</p> : null}

            {!loading && filteredClients.length > 0 ? (
              <div className={styles.cardList}>
                {paginatedClients.map((client) => (
                  <article key={client.id} className={styles.itemCard}>
                    <div className={styles.itemHead}>
                      <div>
                        <h3>{client.client_name}</h3>
                        <p>{client.company_name || client.city || "Client artisanal"}</p>
                      </div>
                      <WorkflowStatusBadge value={client.status || "active"} />
                    </div>
                    <div className={styles.itemMeta}>
                      <span>{client.email || "Email non renseigne"}</span>
                      <span>{client.phone || "Téléphone non renseigné"}</span>
                      <span>Ajoute le {formatDate(client.created_at)}</span>
                    </div>
                    {client.notes ? <p className={styles.itemBody}>{client.notes}</p> : null}
                    <div className={styles.cardActions}>
                      <select
                        value={client.status ?? "active"}
                        disabled={quickUpdatingId === client.id}
                        onChange={(event) => void handleQuickStatusUpdate(client.id, event.target.value)}
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="archived">Archive</option>
                      </select>
                      <button type="button" className={styles.secondaryButton} onClick={() => {
                        setEditingId(client.id);
                        setForm(toFormState(client));
                      }}>
                        Modifier
                      </button>
                      <Link href="/dashboard/provider/messages" className={styles.linkButton}>
                        Message
                      </Link>
                      <button type="button" className={styles.dangerButton} disabled={deletingId === client.id} onClick={() => void handleDelete(client.id)}>
                        {deletingId === client.id ? "Suppression..." : "Supprimer"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {!loading && filteredClients.length > pageSize ? (
              <div className={styles.pagination}>
                <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
                  Precedent
                </button>
                <span className={styles.counter}>
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Suivant
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}
