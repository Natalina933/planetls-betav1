"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./ContractTemplateManager.module.scss";

interface ContractTemplate {
  id: string;
  package_id: string;
  title: string;
  content: string;
  variables?: Record<string, unknown>;
  created_at?: string;
}

interface Props {
  packageId?: string;
  packageName?: string;
}

export default function ContractTemplateManager({ packageId, packageName }: Props) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    package_id: packageId ?? "",
    title: packageName ? `Modele ${packageName}` : "",
    content: "",
    variables: "client_name,start_date,amount,services",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      package_id: packageId ?? prev.package_id,
      title: prev.title || (packageName ? `Modele ${packageName}` : prev.title),
    }));
  }, [packageId, packageName]);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = packageId ? `?packageId=${encodeURIComponent(packageId)}` : "";
        const res = await fetch(`/api/services/contract-templates${query}`);
        if (!res.ok) throw new Error("Impossible de charger les modeles");
        const data = (await res.json()) as ContractTemplate[];
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [packageId]);

  const variablesPreview = useMemo(
    () =>
      form.variables
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [form.variables],
  );

  const handleCreateTemplate = async () => {
    if (!form.package_id || !form.title.trim() || !form.content.trim()) {
      setError("Package, titre et contenu sont obligatoires.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const variables = variablesPreview.reduce<Record<string, string>>((acc, key) => {
        acc[key] = "";
        return acc;
      }, {});

      const res = await fetch("/api/services/contract-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: form.package_id,
          title: form.title.trim(),
          content: form.content.trim(),
          variables,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Erreur lors de la creation");
      }

      const created = (await res.json()) as ContractTemplate;
      setTemplates((prev) => [created, ...prev]);
      setForm((prev) => ({
        ...prev,
        title: packageName ? `Modele ${packageName}` : "",
        content: "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de creation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Modeles de contrats</h2>
        <p>Associez des clauses contractuelles a chaque pack.</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formCard}>
        <label>
          Package ID
          <input
            value={form.package_id}
            onChange={(e) => setForm((prev) => ({ ...prev, package_id: e.target.value }))}
            placeholder="pkg_xxx"
          />
        </label>
        <label>
          Titre
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Modele Pack Budget"
          />
        </label>
        <label>
          Variables (separees par des virgules)
          <input
            value={form.variables}
            onChange={(e) => setForm((prev) => ({ ...prev, variables: e.target.value }))}
          />
        </label>
        <label>
          Contenu du contrat
          <textarea
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="Incluant les services: Menage, Check-in, Linge..."
          />
        </label>
        <button onClick={handleCreateTemplate} disabled={saving}>
          {saving ? "Creation..." : "Creer le modele"}
        </button>
      </div>

      <div className={styles.listCard}>
        <h3>Modeles existants ({templates.length})</h3>
        {loading ? <p>Chargement...</p> : null}
        {!loading && templates.length === 0 ? <p>Aucun modele pour le moment.</p> : null}
        <ul>
          {templates.map((tpl) => (
            <li key={tpl.id} className={styles.item}>
              <div>
                <strong>{tpl.title}</strong>
                <p>Package: {tpl.package_id}</p>
              </div>
              <span>{tpl.created_at ? new Date(tpl.created_at).toLocaleDateString("fr-FR") : ""}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
