"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

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

  const clients = data?.items ?? [];
  const canSubmit = useMemo(() => form.client_name.trim().length > 0, [form.client_name]);
  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const next = clients.filter((client) => {
      const matchesStatus = statusFilter === "all" || (client.status ?? "active") === statusFilter;
      if (!matchesStatus) return false;
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
  }, [clients, searchTerm, statusFilter, sortBy]);

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

        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>{editingId ? "Modifier un client" : "Ajouter un client"}</h2>
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
                <span>Telephone</span>
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
              <h2>Portefeuille client</h2>
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
              </div>
            </div>

            {loading ? <p className={styles.emptyState}>Chargement des clients...</p> : null}
            {!loading && filteredClients.length === 0 ? <p className={styles.emptyState}>Aucun client ne correspond au filtre actuel.</p> : null}

            {!loading && filteredClients.length > 0 ? (
              <div className={styles.cardList}>
                {filteredClients.map((client) => (
                  <article key={client.id} className={styles.itemCard}>
                    <div className={styles.itemHead}>
                      <div>
                        <h3>{client.client_name}</h3>
                        <p>{client.company_name || client.city || "Client artisanal"}</p>
                      </div>
                      <span className={styles.badge}>{client.status || "active"}</span>
                    </div>
                    <div className={styles.itemMeta}>
                      <span>{client.email || "Email non renseigne"}</span>
                      <span>{client.phone || "Telephone non renseigne"}</span>
                      <span>Ajoute le {formatDate(client.created_at)}</span>
                    </div>
                    {client.notes ? <p className={styles.itemBody}>{client.notes}</p> : null}
                    <div className={styles.cardActions}>
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
          </section>
        </div>
      </div>
    </section>
  );
}
