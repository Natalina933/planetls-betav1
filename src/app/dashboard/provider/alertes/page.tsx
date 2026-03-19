"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ActionPanel from "@/components/dashboard/shared/ActionPanel";
import SectionHeader from "@/components/dashboard/shared/SectionHeader";
import WorkflowStatusBadge from "@/components/ui/WorkflowStatusBadge/WorkflowStatusBadge";
import { Button, ButtonLink, Input, Select, Textarea } from "@/components/ui";
import styles from "../ProviderCrudPage.module.scss";

type ProviderIntervention = {
  id: string;
  title: string;
  status: string | null;
};

type ProviderAlert = {
  id: string;
  intervention_id: string | null;
  alert_type: string | null;
  severity: string | null;
  title: string;
  body: string | null;
  status: string | null;
  created_at: string;
};

type ProviderAlertsPayload = {
  items: ProviderAlert[];
  summary: {
    total: number;
    urgent: number;
  };
  note: string | null;
};

type ProviderInterventionsPayload = {
  items: ProviderIntervention[];
};

type AlertFormState = {
  intervention_id: string;
  alert_type: string;
  severity: string;
  title: string;
  body: string;
  status: string;
};

const defaultForm: AlertFormState = {
  intervention_id: "",
  alert_type: "general",
  severity: "normal",
  title: "",
  body: "",
  status: "open",
};

function formatDateTime(value: string) {
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

function toFormState(item: ProviderAlert): AlertFormState {
  return {
    intervention_id: item.intervention_id ?? "",
    alert_type: item.alert_type ?? "general",
    severity: item.severity ?? "normal",
    title: item.title ?? "",
    body: item.body ?? "",
    status: item.status ?? "open",
  };
}

function ProviderAlertesContent() {
  const searchParams = useSearchParams();
  const targetAlertId = searchParams.get("alert");
  const [data, setData] = useState<ProviderAlertsPayload | null>(null);
  const [interventions, setInterventions] = useState<ProviderIntervention[]>([]);
  const [form, setForm] = useState<AlertFormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quickUpdatingId, setQuickUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  async function loadAlerts() {
    try {
      setLoading(true);
      setError(null);

      const [alertsResponse, interventionsResponse] = await Promise.all([
        fetch("/api/provider/alerts", { cache: "no-store" }),
        fetch("/api/provider/interventions", { cache: "no-store" }),
      ]);

      const alertsPayload = (await alertsResponse.json()) as ProviderAlertsPayload & { error?: string };
      const interventionsPayload = (await interventionsResponse.json()) as ProviderInterventionsPayload & {
        error?: string;
      };

      if (!alertsResponse.ok) {
        throw new Error(alertsPayload?.error || "Impossible de charger les alertes.");
      }
      if (!interventionsResponse.ok) {
        throw new Error(interventionsPayload?.error || "Impossible de charger les interventions.");
      }

      const nextInterventions = Array.isArray(interventionsPayload.items) ? interventionsPayload.items : [];
      setData(alertsPayload);
      setInterventions(nextInterventions);
      setForm((current) => ({ ...current, intervention_id: current.intervention_id || nextInterventions[0]?.id || "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les alertes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAlerts();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const interventionsById = useMemo(() => new Map(interventions.map((item) => [item.id, item])), [interventions]);
  const canSubmit = useMemo(() => form.title.trim().length > 0, [form.title]);
  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const next = items.filter((item) => {
      if (targetAlertId && item.id !== targetAlertId) return false;

      const matchesSeverity = severityFilter === "all" || (item.severity ?? "normal") === severityFilter;
      if (!matchesSeverity) return false;
      const createdAt = new Date(item.created_at);
      if (dateFrom) {
        const minDate = new Date(`${dateFrom}T00:00:00`);
        if (createdAt < minDate) return false;
      }
      if (dateTo) {
        const maxDate = new Date(`${dateTo}T23:59:59`);
        if (createdAt > maxDate) return false;
      }
      if (!normalizedSearch) return true;
      const intervention = item.intervention_id ? interventionsById.get(item.intervention_id) : null;
      const haystack = [item.title, item.body, item.alert_type, item.status, intervention?.title]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });

    next.sort((a, b) => {
      if (sortBy === "severity") {
        const order = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
        return (order[a.severity as keyof typeof order] ?? 9) - (order[b.severity as keyof typeof order] ?? 9);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return next;
  }, [data?.items, searchTerm, severityFilter, sortBy, interventionsById, dateFrom, dateTo, targetAlertId]);
  const targetedAlert = useMemo(
    () => (data?.items ?? []).find((item) => item.id === targetAlertId) ?? null,
    [data?.items, targetAlertId],
  );
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * pageSize, page * pageSize),
    [filteredItems, page],
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, severityFilter, sortBy, dateFrom, dateTo, targetAlertId]);

  function handleExportCsv() {
    const rows = [
      ["Titre", "Intervention", "Type", "Severite", "Statut", "Creation"],
      ...filteredItems.map((item) => [
        item.title ?? "",
        (item.intervention_id ? interventionsById.get(item.intervention_id)?.title : "") ?? "",
        item.alert_type ?? "",
        item.severity ?? "",
        item.status ?? "",
        item.created_at ?? "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "provider-alerts.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function resetForm() {
    setEditingId(null);
    setForm({ ...defaultForm, intervention_id: interventions[0]?.id || "" });
  }

  function updateField<Key extends keyof AlertFormState>(key: Key, value: AlertFormState[Key]) {
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
        intervention_id: form.intervention_id || null,
        alert_type: form.alert_type,
        severity: form.severity,
        title: form.title.trim(),
        body: form.body.trim() || null,
        status: form.status,
      };

      const response = await fetch(
        editingId ? `/api/provider/alerts/${editingId}` : "/api/provider/alerts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Impossible d'enregistrer l'alerte.");
      }

      resetForm();
      await loadAlerts();
      setSuccess(editingId ? "Alerte mise à jour." : "Alerte ajoutée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'alerte.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/provider/alerts/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Impossible de supprimer l'alerte.");
      }

      if (editingId === id) resetForm();
      await loadAlerts();
      setSuccess("Alerte supprimée.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer l'alerte.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleQuickStatusUpdate(id: string, status: string) {
    try {
      setQuickUpdatingId(id);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/provider/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Impossible de mettre à jour le statut.");
      }

      await loadAlerts();
      setSuccess("Statut alerte mis à jour.");
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
            <p className={styles.eyebrow}>Alertes</p>
            <h1>Alertes</h1>
            <p>Centralisez vos urgences terrain, vos blocages client et les priorités à résoudre.</p>
          </div>
          <div className={styles.metrics}>
            <span>{data?.summary.total ?? 0} alertes</span>
            <span>{data?.summary.urgent ?? 0} urgentes</span>
          </div>
        </header>

        {success ? <p className={styles.successBox}>{success}</p> : null}
        {error ? <p className={styles.errorBox}>{error}</p> : null}
        {!error && data?.note ? <p className={styles.infoBox}>{data.note}</p> : null}
        {targetedAlert ? <p className={styles.infoBox}>Focus sur {targetedAlert.title}.</p> : null}
        <ActionPanel
          eyebrow="Actions à mener"
          title="Gardez les alertes sous contrôle"
          description="Créez une alerte terrain, ouvrez les interventions liées et fermez rapidement les points qui bloquent l'exécution."
          actions={[
            { label: "Ajouter une alerte", href: "/dashboard/provider/alertes", primary: true },
            { label: "Voir les interventions", href: "/dashboard/provider/interventions" },
            { label: "Ouvrir les messages", href: "/dashboard/provider/messages" },
          ]}
        />

        <div className={styles.layout}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <SectionHeader
                eyebrow="1. Mise à jour"
                title={editingId ? "Modifier une alerte" : "Ajouter une alerte"}
              />
              {editingId ? (
                <Button type="button" variant="secondary" size="sm" className={styles.actionButton} onClick={resetForm}>
                  Annuler
                </Button>
              ) : null}
            </div>

            <form className={styles.formGrid} onSubmit={handleSubmit}>
              <label>
                <span>Intervention</span>
                <Select className={styles.fieldSelect} value={form.intervention_id} onChange={(event) => updateField("intervention_id", event.target.value)}>
                  <option value="">Sans intervention</option>
                  {interventions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </Select>
              </label>
              <label>
                <span>Type</span>
                <Select className={styles.fieldSelect} value={form.alert_type} onChange={(event) => updateField("alert_type", event.target.value)}>
                  <option value="general">Générale</option>
                  <option value="deadline">Échéance</option>
                  <option value="client">Client</option>
                  <option value="payment">Paiement</option>
                  <option value="quality">Qualité</option>
                </Select>
              </label>
              <label>
                <span>Sévérité</span>
                <Select className={styles.fieldSelect} value={form.severity} onChange={(event) => updateField("severity", event.target.value)}>
                  <option value="low">Basse</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </Select>
              </label>
              <label>
                <span>Statut</span>
                <Select className={styles.fieldSelect} value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option value="open">Ouverte</option>
                  <option value="read">Lue</option>
                  <option value="resolved">Résolue</option>
                </Select>
              </label>
              <label className={styles.fullWidth}>
                <span>Titre</span>
                <Input
                  bare
                  className={styles.fieldInput}
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="Ex: Intervention retardée"
                />
              </label>
              <label className={styles.fullWidth}>
                <span>Détail</span>
                <Textarea
                  className={styles.fieldTextarea}
                  value={form.body}
                  onChange={(event) => updateField("body", event.target.value)}
                  placeholder="Expliquez le blocage ou l'action attendue..."
                />
              </label>
              <div className={styles.formActions}>
                <Button type="submit" disabled={!canSubmit || saving}>
                  {saving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Ajouter"}
                </Button>
                <ButtonLink href="/dashboard/provider/interventions" variant="outline" className={styles.actionButton}>
                  Voir les interventions
                </ButtonLink>
              </div>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <SectionHeader
                eyebrow="2. Informations clés"
                title="Flux d'alertes"
                actionLabel="Voir les interventions"
                actionHref="/dashboard/provider/interventions"
              />
              <span>{loading ? "..." : `${filteredItems.length} alerte(s)`}</span>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.toolbarGroup}>
                <Input
                  bare
                  className={styles.toolbarInput}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher une alerte"
                />
              </div>
              <div className={styles.toolbarGroup}>
                <Select className={styles.toolbarSelect} value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
                  <option value="all">Toutes sévérités</option>
                  <option value="urgent">Urgentes</option>
                  <option value="high">Hautes</option>
                  <option value="normal">Normales</option>
                  <option value="low">Basses</option>
                </Select>
                <Select className={styles.toolbarSelect} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="recent">Plus récentes</option>
                  <option value="severity">Sévérité</option>
                </Select>
                <Input bare type="date" className={styles.toolbarInput} value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                <Input bare type="date" className={styles.toolbarInput} value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                <Button type="button" variant="secondary" size="sm" className={styles.actionButton} onClick={handleExportCsv}>
                  Export CSV
                </Button>
              </div>
            </div>

            <div className={styles.counterRow}>
              <span className={styles.counter}>{filteredItems.length} résultats</span>
              <span className={styles.counter}>
                {filteredItems.filter((item) => item.severity === "urgent").length} urgentes
              </span>
              <span className={styles.counter}>
                {filteredItems.filter((item) => (item.status ?? "open") === "open").length} ouvertes
              </span>
            </div>

            {loading ? <p className={styles.emptyState}>Chargement des alertes...</p> : null}
            {!loading && filteredItems.length === 0 ? <p className={styles.emptyState}>Aucune alerte ne correspond au filtre actuel.</p> : null}

            {!loading && filteredItems.length > 0 ? (
              <div className={styles.cardList}>
                {paginatedItems.map((item) => {
                  const linkedIntervention = item.intervention_id ? interventionsById.get(item.intervention_id) : null;
                  return (
                    <article
                      key={item.id}
                      className={[styles.itemCard, item.id === targetAlertId ? styles.itemCardTargeted : ""].filter(Boolean).join(" ")}
                    >
                      <div className={styles.itemHead}>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{linkedIntervention?.title || "Sans intervention"}</p>
                        </div>
                        <WorkflowStatusBadge value={item.severity || "normal"} />
                      </div>
                      <div className={styles.itemMeta}>
                        <span>Type: {item.alert_type || "general"}</span>
                        <span className={styles.inlineBadge}>
                          <span>Statut:</span>
                          <WorkflowStatusBadge value={item.status || "open"} />
                        </span>
                        <span>Créée le {formatDateTime(item.created_at)}</span>
                      </div>
                      {item.body ? <p className={styles.itemBody}>{item.body}</p> : null}
                      <div className={styles.cardActions}>
                        <Select
                          className={styles.statusSelect}
                          value={item.status ?? "open"}
                          disabled={quickUpdatingId === item.id}
                          onChange={(event) => void handleQuickStatusUpdate(item.id, event.target.value)}
                        >
                          <option value="open">Ouverte</option>
                          <option value="read">Lue</option>
                          <option value="resolved">Résolue</option>
                        </Select>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className={styles.actionButton}
                          onClick={() => {
                            setEditingId(item.id);
                            setForm(toFormState(item));
                          }}
                        >
                          Modifier
                        </Button>
                        <ButtonLink
                          href={item.intervention_id ? `/dashboard/provider/interventions?intervention=${item.intervention_id}` : "/dashboard/provider/messages"}
                          variant="outline"
                          size="sm"
                          className={styles.actionButton}
                        >
                          Ouvrir
                        </ButtonLink>
                        <Button type="button" variant="outline" size="sm" className={styles.dangerButton} disabled={deletingId === item.id} onClick={() => void handleDelete(item.id)}>
                          {deletingId === item.id ? "Suppression..." : "Supprimer"}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}

            {!loading && filteredItems.length > pageSize ? (
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

export default function ProviderAlertesPage() {
  return (
    <Suspense fallback={<section className="dashboard-grid"><p>Chargement des alertes...</p></section>}>
      <ProviderAlertesContent />
    </Suspense>
  );
}
