"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Copy, FileText, Heart, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/ui/SearchBar";
import { DashboardPanel } from "@/components/dashboard";
import type {
  PromptDocument,
  PromptLibraryPayload,
  PromptRiskLevel,
  PromptStatus,
} from "@/features/prompt-library/types";
import styles from "./PromptLibraryCenter.module.scss";

const FAVORITES_STORAGE_KEY = "planetls-prompt-library-favorites";
const PREPARATIONS_STORAGE_KEY = "planetls-prompt-library-preparations";

type PromptLibraryCenterProps = {
  payload: PromptLibraryPayload | null;
  loading: boolean;
};

type PreparationStore = Record<string, Record<string, string>>;

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatus(status: PromptStatus) {
  if (status === "active") return "Actif";
  if (status === "draft") return "Brouillon";
  if (status === "needs-review") return "A revoir";
  if (status === "deprecated") return "A deprecier";
  return "Archive";
}

function statusVariant(status: PromptStatus) {
  if (status === "active") return "success";
  if (status === "needs-review") return "warning";
  if (status === "deprecated") return "danger";
  return "neutral";
}

function riskVariant(risk?: PromptRiskLevel) {
  if (risk === "critical") return "danger";
  if (risk === "high") return "warning";
  if (risk === "medium") return "info";
  return "neutral";
}

function buildPromptPreview(prompt: PromptDocument, values: Record<string, string>) {
  const variableLines = prompt.variables.map((variable) => {
    const currentValue = values[variable.key] || variable.defaultValue || "";
    return `- ${variable.label}: ${currentValue || "[a renseigner]"}`;
  });

  const missingVariables = prompt.variables
    .filter((variable) => variable.required && !(values[variable.key] || variable.defaultValue || "").trim())
    .map((variable) => variable.label);

  const promptText = prompt.variables.reduce((current, variable) => {
    const nextValue = values[variable.key] || variable.defaultValue || "";
    return current.replaceAll(variable.key, nextValue || variable.key);
  }, prompt.promptContent);

  return {
    missingVariables,
    finalPrompt: [
      "Avant d'executer cette mission, lis obligatoirement :",
      ...prompt.metadata.contexts.map((contextPath) => `- ${contextPath}`),
      "",
      `Mission : ${prompt.metadata.title}`,
      "",
      "Variables renseignees :",
      ...variableLines,
      "",
      "Prompt :",
      promptText,
      "",
      "Livrables attendus :",
      ...prompt.expectedDeliverables.map((item) => `- ${item}`),
      "",
      "Criteres de reussite :",
      ...prompt.successCriteria.map((item) => `- ${item}`),
    ].join("\n"),
  };
}

export function PromptLibraryCenter({ payload, loading }: PromptLibraryCenterProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<PromptStatus | "all">("all");
  const [risk, setRisk] = useState<PromptRiskLevel | "all">("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [preparations, setPreparations] = useState<PreparationStore>({});
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    setFavorites(readStoredJson<string[]>(FAVORITES_STORAGE_KEY, []));
    setPreparations(readStoredJson<PreparationStore>(PREPARATIONS_STORAGE_KEY, {}));
  }, []);

  const prompts = useMemo(() => payload?.prompts ?? [], [payload?.prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const haystack = [
        prompt.metadata.title,
        prompt.metadata.description,
        prompt.metadata.category,
        prompt.objective,
        ...prompt.metadata.tags,
      ].join(" ").toLowerCase();

      if (search && !haystack.includes(search.toLowerCase())) return false;
      if (category !== "all" && prompt.metadata.category !== category) return false;
      if (status !== "all" && prompt.metadata.status !== status) return false;
      if (risk !== "all" && prompt.metadata.riskLevel !== risk) return false;
      if (difficulty !== "all" && prompt.metadata.difficulty !== difficulty) return false;
      if (showFavoritesOnly && !favorites.includes(prompt.metadata.id)) return false;
      return true;
    });
  }, [category, difficulty, favorites, prompts, risk, search, showFavoritesOnly, status]);

  useEffect(() => {
    if (!filteredPrompts.length) {
      setSelectedPromptId(null);
      return;
    }
    if (!selectedPromptId || !filteredPrompts.some((prompt) => prompt.metadata.id === selectedPromptId)) {
      setSelectedPromptId(filteredPrompts[0].metadata.id);
    }
  }, [filteredPrompts, selectedPromptId]);

  const selectedPrompt = filteredPrompts.find((prompt) => prompt.metadata.id === selectedPromptId) ?? filteredPrompts[0] ?? null;
  const selectedValues = selectedPrompt ? preparations[selectedPrompt.metadata.id] ?? {} : {};
  const preview = selectedPrompt ? buildPromptPreview(selectedPrompt, selectedValues) : null;

  function toggleFavorite(promptId: string) {
    const nextFavorites = favorites.includes(promptId)
      ? favorites.filter((id) => id !== promptId)
      : [...favorites, promptId];
    setFavorites(nextFavorites);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));
    }
  }

  function updateVariable(promptId: string, key: string, value: string) {
    const nextPreparations = {
      ...preparations,
      [promptId]: {
        ...(preparations[promptId] ?? {}),
        [key]: value,
      },
    };
    setPreparations(nextPreparations);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREPARATIONS_STORAGE_KEY, JSON.stringify(nextPreparations));
    }
  }

  async function copyPrompt() {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview.finalPrompt);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 2000);
  }

  if (loading) {
    return <div className="center">Chargement du Centre IA...</div>;
  }

  if (!payload) {
    return (
      <section className={styles.fallback}>
        <AlertTriangle size={18} />
        <div>
          <strong>Bibliotheque indisponible</strong>
          <p>La lecture des prompts n'a pas pu etre chargee depuis le depot.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.shell}>
      <div className={styles.overviewGrid}>
        <DashboardPanel title="Vue rapide">
          <div className={styles.statsGrid}>
            <article className={styles.statCard}>
              <span>Total</span>
              <strong>{payload.stats.total}</strong>
              <p>Prompts versionnes lisibles depuis le depot Git.</p>
            </article>
            <article className={styles.statCard}>
              <span>Actifs</span>
              <strong>{payload.stats.active}</strong>
              <p>Prompts utilisables sans reprise majeure immediate.</p>
            </article>
            <article className={styles.statCard}>
              <span>A revoir</span>
              <strong>{payload.stats.needsReview}</strong>
              <p>Prompts a consolider apres premiers usages.</p>
            </article>
            <article className={styles.statCard}>
              <span>Historique</span>
              <strong>{payload.stats.runs}</strong>
              <p>Runs legers archives dans <code>docs/ai/runs</code>.</p>
            </article>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Diagnostic d'implantation">
          <div className={styles.diagnosticList}>
            <article className={styles.diagnosticCard}>
              <strong>Source officielle</strong>
              <p>{payload.diagnostic.storageApproach}</p>
            </article>
            <article className={styles.diagnosticCard}>
              <strong>Doublons detectes</strong>
              <p>{payload.diagnostic.duplicatesDetected[0]}</p>
            </article>
            <article className={styles.diagnosticCard}>
              <strong>Composants reemployes</strong>
              <p>{payload.diagnostic.reusableComponents.join(", ")}</p>
            </article>
          </div>
        </DashboardPanel>
      </div>

      <div className={styles.controls}>
        <SearchBar
          value={search}
          onSearch={setSearch}
          placeholder="Rechercher un prompt, un tag ou un objectif"
          buttonLabel="Filtrer"
          inputProps={{
            onChange: (event) => setSearch(event.currentTarget.value),
          }}
          className={styles.searchBar}
        />

        <div className={styles.filterRow}>
          <label>
            <span>Categorie</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">Toutes</option>
              {payload.filters.categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Statut</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as PromptStatus | "all")}>
              <option value="all">Tous</option>
              {payload.filters.statuses.map((item) => (
                <option key={item} value={item}>{formatStatus(item)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Risque</span>
            <select value={risk} onChange={(event) => setRisk(event.target.value as PromptRiskLevel | "all")}>
              <option value="all">Tous</option>
              {payload.filters.riskLevels.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Difficulte</span>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="all">Toutes</option>
              {payload.filters.difficulties.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <button type="button" className={styles.favoriteToggle} onClick={() => setShowFavoritesOnly((current) => !current)}>
            <Heart size={16} />
            {showFavoritesOnly ? "Favoris uniquement" : "Tous les prompts"}
          </button>
        </div>
      </div>

      <div className={styles.workspace}>
        <section className={styles.listPane}>
          <div className={styles.listHeader}>
            <div>
              <span className={styles.eyebrow}>Bibliotheque</span>
              <h3>{filteredPrompts.length} prompt(s) trouves</h3>
            </div>
            <Badge variant="info">Mise a jour {formatDate(payload.updatedAt)}</Badge>
          </div>

          {filteredPrompts.length === 0 ? (
            <div className={styles.emptyState}>
              <Search size={18} />
              <div>
                <strong>Aucun prompt ne correspond aux filtres</strong>
                <p>Elargis la recherche ou retire un filtre pour retrouver un prompt existant.</p>
              </div>
            </div>
          ) : (
            <div className={styles.promptList}>
              {filteredPrompts.map((prompt) => {
                const isSelected = selectedPrompt?.metadata.id === prompt.metadata.id;
                const isFavorite = favorites.includes(prompt.metadata.id);
                return (
                  <button
                    key={prompt.metadata.id}
                    type="button"
                    className={styles.promptCard}
                    data-selected={isSelected}
                    onClick={() => setSelectedPromptId(prompt.metadata.id)}
                  >
                    <div className={styles.promptCardHeader}>
                      <div>
                        <strong>{prompt.metadata.title}</strong>
                        <p>{prompt.metadata.description}</p>
                      </div>
                      <button
                        type="button"
                        className={styles.favoriteButton}
                        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(prompt.metadata.id);
                        }}
                      >
                        <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className={styles.badgeRow}>
                      <Badge variant="dark">{prompt.metadata.category}</Badge>
                      <Badge variant={statusVariant(prompt.metadata.status)}>{formatStatus(prompt.metadata.status)}</Badge>
                      <Badge variant={riskVariant(prompt.metadata.riskLevel)}>{prompt.metadata.riskLevel ?? "n/a"}</Badge>
                    </div>
                    <div className={styles.promptMeta}>
                      <span>v{prompt.metadata.version}</span>
                      <span>{prompt.metadata.estimatedDuration ?? "Duree libre"}</span>
                      <span>{formatDate(prompt.metadata.updatedAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.detailPane}>
          {!selectedPrompt ? (
            <div className={styles.emptyState}>
              <FileText size={18} />
              <div>
                <strong>Choisir un prompt</strong>
                <p>Selectionne une fiche pour afficher son detail et preparer une version personnalisee.</p>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.detailHeader}>
                <div>
                  <span className={styles.eyebrow}>Centre IA</span>
                  <h3>{selectedPrompt.metadata.title}</h3>
                  <p>{selectedPrompt.metadata.description}</p>
                </div>
                <div className={styles.badgeRow}>
                  <Badge variant="dark">{selectedPrompt.metadata.category}</Badge>
                  <Badge variant={statusVariant(selectedPrompt.metadata.status)}>{formatStatus(selectedPrompt.metadata.status)}</Badge>
                  <Badge variant={riskVariant(selectedPrompt.metadata.riskLevel)}>{selectedPrompt.metadata.riskLevel ?? "n/a"}</Badge>
                </div>
              </div>

              <div className={styles.detailGrid}>
                <DashboardPanel title="Quand l'utiliser">
                  <ul className={styles.bulletList}>
                    {selectedPrompt.useWhen.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </DashboardPanel>
                <DashboardPanel title="Quand l'eviter">
                  <ul className={styles.bulletList}>
                    {selectedPrompt.avoidWhen.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </DashboardPanel>
              </div>

              <DashboardPanel title="Contextes et provenance">
                <div className={styles.contextGrid}>
                  <div>
                    <strong>Contextes obligatoires</strong>
                    <ul className={styles.bulletList}>
                      {selectedPrompt.metadata.contexts.map((item) => <li key={item}><code>{item}</code></li>)}
                    </ul>
                  </div>
                  <div>
                    <strong>Provenance</strong>
                    <ul className={styles.bulletList}>
                      {selectedPrompt.provenance.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </DashboardPanel>

              <DashboardPanel title="Preparateur de prompt">
                <div className={styles.variableGrid}>
                  {selectedPrompt.variables.map((variable) => (
                    <label key={variable.key} className={styles.variableField}>
                      <span>{variable.label}{variable.required ? " *" : ""}</span>
                      <textarea
                        rows={3}
                        placeholder={variable.placeholder || variable.description || variable.key}
                        value={selectedValues[variable.key] ?? variable.defaultValue ?? ""}
                        onChange={(event) => updateVariable(selectedPrompt.metadata.id, variable.key, event.target.value)}
                      />
                      {variable.description ? <small>{variable.description}</small> : null}
                    </label>
                  ))}
                </div>

                <div className={styles.previewHeader}>
                  <div>
                    <strong>Apercu final</strong>
                    <p>{preview?.missingVariables.length ? `Variables manquantes : ${preview.missingVariables.join(", ")}` : "Toutes les variables requises sont renseignees."}</p>
                  </div>
                  <button type="button" className={styles.copyButton} onClick={copyPrompt}>
                    <Copy size={16} />
                    {copyState === "copied" ? "Copie" : copyState === "error" ? "Erreur" : "Copier le prompt"}
                  </button>
                </div>

                <pre className={styles.preview}>{preview?.finalPrompt}</pre>
              </DashboardPanel>

              <div className={styles.detailGrid}>
                <DashboardPanel title="Livrables attendus">
                  <ul className={styles.bulletList}>
                    {selectedPrompt.expectedDeliverables.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </DashboardPanel>
                <DashboardPanel title="Criteres de reussite">
                  <ul className={styles.bulletList}>
                    {selectedPrompt.successCriteria.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </DashboardPanel>
              </div>

              <div className={styles.detailGrid}>
                <DashboardPanel title="Historique des versions">
                  <ul className={styles.bulletList}>
                    {selectedPrompt.versionHistory.map((entry) => (
                      <li key={`${entry.version}-${entry.date}`}>
                        <strong>v{entry.version}</strong> ({entry.date}) {entry.changes.join(" ; ")}
                      </li>
                    ))}
                  </ul>
                </DashboardPanel>
                <DashboardPanel title="Utilisations recentes">
                  {selectedPrompt.recentRuns.length === 0 ? (
                    <div className={styles.emptyInline}>
                      <RefreshCw size={16} />
                      <span>Aucun run archive pour ce prompt pour l'instant.</span>
                    </div>
                  ) : (
                    <ul className={styles.bulletList}>
                      {selectedPrompt.recentRuns.map((run) => (
                        <li key={run.id}>
                          <strong>{formatDate(run.createdAt)}</strong> - {run.objective || run.summary || run.folder}
                        </li>
                      ))}
                    </ul>
                  )}
                </DashboardPanel>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
