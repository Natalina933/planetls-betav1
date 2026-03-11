"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ActionPanel from "@/app/components/dashboard/shared/ActionPanel";
import SectionHeader from "@/app/components/dashboard/shared/SectionHeader";
import WorkflowStatusBadge from "@/app/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import { Button, ButtonLink, Input, Select, Textarea } from "@/components/ui";
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

function ProviderClientsContent() {
  const searchParams = useSearchParams();
  const targetClientId = searchParams.get("client");
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
      if (targetClientId && client.id !== targetClientId) return false;

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
  }, [data?.items, searchTerm, statusFilter, sortBy, dateFrom, dateTo, targetClientId]);
  const targetedClient = useMemo(
    () => (data?.items ?? []).find((client) => client.id === targetClientId) ?? null,
    [data?.items, targetClientId],
  );
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const paginatedClients = useMemo(
    () => filteredClients.slice((page - 1) * pageSize, page * pageSize),
    [filteredClients, page],
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortBy, dateFrom, dateTo, targetClientId]);

  function handleExportCsv() {
    const rows = [
      ["Nom", "Societe", "Email", "Telephone", "Ville", "Type", "Statut", "Creation"],
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
      setSuccess(editingId ? "Client mis à jour." : "Client ajouté.");
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
      setSuccess("Client supprimé.");
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
        throw new Error(result?.error || "Impossible de mettre à jour le statut.");
      }

      await loadClients();
      setSuccess("Statut client mis à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le statut.");
    } finally {
      setQuickUpdatingId(null);
    }
  }

  return (
    <section className="dashboard-grid">
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Clients</p>
            <h1>Clients</h1>
            <p>Gérez votre portefeuille client, puis ouvrez un fil de message depuis chaque fiche.</p>
          </div>
          <div className={styles.metrics}>
            <span>{data?.summary.total ?? 0} clients</span>
            <span>{data?.summary.active ?? 0} actifs</span>
          </div>
        </header>

        {success ? <p className={styles.successBox}>{success}</p> : null}
        {error ? <p className={styles.errorBox}>{error}</p> : null}
        {!error && data?.note ? <p className={styles.infoBox}>{data.note}</p> : null}
        {targetedClient ? <p className={styles.infoBox}>Focus sur {targetedClient.client_name}.</p> : null}
        <ActionPanel
          eyebrow="Actions à mener"
          title="Accélérez le suivi relation client"
          description="Ajoutez une fiche, ouvrez les conversations actives ou nettoyez le portefeuille pour garder une base exploitable."
          actions={[
            { label: "Ajouter un client", href: "/dashboard/provider/clients", primary: true },
            { label: "Ouvrir les messages", href: "/dashboard/provider/messages" },
            { label: "Revenir au tableau de bord", href: "/dashboard/provider" },
          ]}
        />

        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <SectionHeader
                eyebrow="1. Mise à jour"
                title={editingId ? "Modifier un client" : "Ajouter un client"}
              />
              {editingId ? (
                <Button type="button" variant="secondary" size="sm" className={styles.actionButton} onClick={resetForm}>
                  Annuler
                </Button>
              ) : null}
            </div>

            <form className={styles.formGrid} onSubmit={handleSubmit}>
              <label>
                <span>Nom du client</span>
                <Input
                  bare
                  className={styles.fieldInput}
                  value={form.client_name}
                  onChange={(event) => updateField("client_name", event.target.value)}
                  placeholder="Nom complet"
                />
              </label>
              <label>
                <span>Société</span>
                <Input
                  bare
                  className={styles.fieldInput}
                  value={form.company_name}
                  onChange={(event) => updateField("company_name", event.target.value)}
                  placeholder="Optionnel"
                />
              </label>
              <label>
                <span>Email</span>
                <Input
                  bare
                  className={styles.fieldInput}
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="client@exemple.fr"
                />
              </label>
              <label>
                <span>Téléphone</span>
                <Input
                  bare
                  className={styles.fieldInput}
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="06..."
                />
              </label>
              <label>
                <span>Ville</span>
                <Input
                  bare
                  className={styles.fieldInput}
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Paris"
                />
              </label>
              <label>
                <span>Type</span>
                <Select className={styles.fieldSelect} value={form.client_type} onChange={(event) => updateField("client_type", event.target.value)}>
                  <option value="manual">Manuel</option>
                  <option value="owner">Propriétaire</option>
                  <option value="business">Société</option>
                </Select>
              </label>
              <label>
                <span>Statut</span>
                <Select className={styles.fieldSelect} value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="archived">Archivé</option>
                </Select>
              </label>
              <label className={styles.fullWidth}>
                <span>Notes</span>
                <Textarea
                  className={styles.fieldTextarea}
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Contexte, attentes, détails utiles..."
                />
              </label>
              <div className={styles.formActions}>
                <Button type="submit" disabled={!canSubmit || saving}>
                  {saving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Ajouter"}
                </Button>
                <ButtonLink
                  href={editingId ? `/dashboard/provider/messages?client=${editingId}` : "/dashboard/provider/messages"}
                  variant="outline"
                  className={styles.actionButton}
                >
                  Voir les messages
                </ButtonLink>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <SectionHeader
                eyebrow="2. Informations clés"
                title="Portefeuille client"
                actionLabel="Voir les messages"
                actionHref="/dashboard/provider/messages"
              />
              <span>{loading ? "..." : `${filteredClients.length} fiche(s)`}</span>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                <Input
                  bare
                  className={styles.toolbarInput}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher un client"
                />
              </div>
              <div className={styles.toolbarGroup}>
                <Select className={styles.toolbarSelect} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">Tous statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="archived">Archivés</option>
                </Select>
                <Select className={styles.toolbarSelect} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="recent">Plus récents</option>
                  <option value="name">Nom</option>
                  <option value="city">Ville</option>
                </Select>
                <Input bare type="date" className={styles.toolbarInput} value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                <Input bare type="date" className={styles.toolbarInput} value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                <Button type="button" variant="secondary" size="sm" className={styles.actionButton} onClick={handleExportCsv}>
                  Export CSV
                </Button>
              </div>
            </div>

            <div className={styles.counterRow}>
              <span className={styles.counter}>{filteredClients.length} résultats</span>
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
                  <article
                    key={client.id}
                    className={[styles.itemCard, client.id === targetClientId ? styles.itemCardTargeted : ""].filter(Boolean).join(" ")}
                  >
                    <div className={styles.itemHead}>
                      <div>
                        <h3>{client.client_name}</h3>
                        <p>{client.company_name || client.city || "Client artisanal"}</p>
                      </div>
                      <WorkflowStatusBadge value={client.status || "active"} />
                    </div>
                    <div className={styles.itemMeta}>
                      <span>{client.email || "Email non renseigné"}</span>
                      <span>{client.phone || "Téléphone non renseigné"}</span>
                      <span>Ajouté le {formatDate(client.created_at)}</span>
                    </div>
                    {client.notes ? <p className={styles.itemBody}>{client.notes}</p> : null}
                    <div className={styles.cardActions}>
                      <Select
                        className={styles.statusSelect}
                        value={client.status ?? "active"}
                        disabled={quickUpdatingId === client.id}
                        onChange={(event) => void handleQuickStatusUpdate(client.id, event.target.value)}
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="archived">Archivé</option>
                      </Select>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className={styles.actionButton}
                        onClick={() => {
                          setEditingId(client.id);
                          setForm(toFormState(client));
                        }}
                      >
                        Modifier
                      </Button>
                      <ButtonLink href={`/dashboard/provider/messages?client=${client.id}`} variant="outline" size="sm" className={styles.actionButton}>
                        Message
                      </ButtonLink>
                      <Button type="button" variant="outline" size="sm" className={styles.dangerButton} disabled={deletingId === client.id} onClick={() => void handleDelete(client.id)}>
                        {deletingId === client.id ? "Suppression..." : "Supprimer"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {!loading && filteredClients.length > pageSize ? (
              <div className={styles.pagination}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={styles.paginationButton}
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Précédent
                </Button>
                <span className={styles.counter}>
                  Page {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={styles.paginationButton}
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Suivant
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}

export default function ProviderClientsPage() {
  return (
    <Suspense fallback={<section className="dashboard-grid"><p>Chargement des clients...</p></section>}>
      <ProviderClientsContent />
    </Suspense>
  );
}
