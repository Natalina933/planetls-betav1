"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  ArrowRight,
  Camera,
  Download,
  FileText,
  History,
  Home,
  Loader2,
  Mail,
  Palette,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import { DashboardEmptyState, DashboardStatusBadge } from "@/app/components/dashboard/saas";
import { formatCurrencyAmount, formatDateValue } from "@/app/utils/formatters";
import {
  buildDecorationReport,
  getDecorationStyleLabel,
  summarizeDecorationHistory,
  type DecorationAssistantInput,
  type DecorationGoal,
  type DecorationHousingType,
  type DecorationReport,
  type DecorationStyle,
} from "@/app/lib/decorationAssistant";
import styles from "./DecorationAssistant.module.scss";

const HISTORY_KEY = "planetls.concierge.decorationAssistant.reports";

type FormState = DecorationAssistantInput;

type ApiResponse = {
  report?: DecorationReport;
  persisted?: boolean;
  error?: string;
};

type HistoryResponse = {
  items?: DecorationReport[];
  persisted?: boolean;
  error?: string;
};

const HOUSING_OPTIONS: Array<{ value: DecorationHousingType; label: string }> = [
  { value: "studio", label: "Studio" },
  { value: "apartment", label: "Appartement" },
  { value: "house", label: "Maison" },
  { value: "villa", label: "Villa" },
  { value: "room", label: "Chambre privée" },
];

const STYLE_OPTIONS: Array<{ value: DecorationStyle; label: string }> = [
  { value: "premium", label: "Hôtel boutique" },
  { value: "scandinavian", label: "Scandinave clair" },
  { value: "mediterranean", label: "Méditerranéen" },
  { value: "bohemian", label: "Bohème naturel" },
  { value: "minimalist", label: "Minimaliste" },
  { value: "family", label: "Familial" },
];

const GOAL_OPTIONS: Array<{ value: DecorationGoal; label: string }> = [
  { value: "more_bookings", label: "Plus de réservations" },
  { value: "higher_price", label: "Prix moyen plus haut" },
  { value: "better_photos", label: "Meilleures photos" },
  { value: "refresh", label: "Rafraîchir vite" },
  { value: "family_friendly", label: "Familles" },
];

const INITIAL_FORM: FormState = {
  roomName: "Salon",
  housingType: "apartment",
  budget: 800,
  style: "premium",
  goal: "better_photos",
  ownerName: "",
  ownerEmail: "",
  propertyName: "",
  constraints: "",
  photoName: "",
};

function safeReports(value: string | null): DecorationReport[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item?.id === "string") : [];
  } catch {
    return [];
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reportToMailBody(report: DecorationReport) {
  return [
    `Bonjour ${report.input.ownerName || ""},`,
    "",
    `Voici une proposition décoration pour ${report.input.propertyName || report.input.roomName}.`,
    "",
    report.executiveSummary,
    "",
    "Actions prioritaires :",
    ...report.suggestions.slice(0, 3).map((item) => `- ${item.title} (${item.estimatedCost} EUR) : ${item.impact}`),
    "",
    `Budget estimé : ${report.budget.estimatedTotal} EUR (${report.budget.fit}).`,
    "",
    "Je peux vous envoyer le rapport complet en PDF.",
  ].join("\n");
}

function openReportPdf(report: DecorationReport) {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Rapport décoration PlanetLS</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: Arial, sans-serif; color: #111827; line-height: 1.45; }
  header { border-bottom: 3px solid #0b6d4d; padding-bottom: 14px; margin-bottom: 22px; }
  .logo { font-size: 28px; font-weight: 800; color: #0b6d4d; letter-spacing: .02em; }
  .sub { color: #667085; margin-top: 4px; }
  h1 { font-size: 24px; margin: 0 0 10px; }
  h2 { font-size: 15px; margin: 22px 0 8px; color: #0b6d4d; text-transform: uppercase; letter-spacing: .06em; }
  .summary { background: #f5f7f6; border: 1px solid #d9e6df; padding: 14px; border-radius: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  ul { padding-left: 18px; }
  li { margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; }
  th { color: #374151; font-size: 12px; text-transform: uppercase; }
  .palette { display: flex; gap: 8px; margin-top: 8px; }
  .color { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
  .swatch { height: 34px; }
  .color div:last-child { padding: 8px; font-size: 12px; }
  .prompt { white-space: pre-wrap; background: #111827; color: #fff; padding: 12px; border-radius: 8px; }
</style>
</head>
<body>
<header>
  <div class="logo">PlanetLS</div>
  <div class="sub">Assistant Décoration IA · Rapport propriétaire · ${escapeHtml(formatDateValue(report.createdAt) || "")}</div>
</header>
<h1>${escapeHtml(report.input.propertyName || report.input.roomName)} · ${escapeHtml(report.input.roomName)}</h1>
<p class="summary">${escapeHtml(report.executiveSummary)}</p>
<div class="grid">
<section><h2>Points forts</h2><ul>${report.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
<section><h2>Points faibles</h2><ul>${report.weaknesses.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
</div>
<h2>Suggestions d'amélioration</h2>
<table><thead><tr><th>Priorité</th><th>Action</th><th>Impact</th><th>Budget</th></tr></thead><tbody>${report.suggestions.map((item) => `<tr><td>${item.priority}</td><td>${escapeHtml(item.title)}<br/><small>${escapeHtml(item.description)}</small></td><td>${escapeHtml(item.impact)}</td><td>${item.estimatedCost} EUR</td></tr>`).join("")}</tbody></table>
<h2>Objets recommandés</h2>
<table><thead><tr><th>Objet</th><th>Catégorie</th><th>Pourquoi</th><th>Budget</th></tr></thead><tbody>${report.objects.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.category)}</td><td>${escapeHtml(item.reason)}</td><td>${item.estimatedCost} EUR</td></tr>`).join("")}</tbody></table>
<h2>Palette couleurs</h2><div class="palette">${report.palette.map((color) => `<div class="color"><div class="swatch" style="background:${color.hex}"></div><div><strong>${escapeHtml(color.name)}</strong><br/>${color.hex}<br/>${escapeHtml(color.usage)}</div></div>`).join("")}</div>
<h2>Conseils photo</h2><ul>${report.photoTips.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
<h2>Bénéfices estimés</h2><ul>${report.benefits.map((item) => `<li><strong>${escapeHtml(item.label)} (${item.level})</strong> : ${escapeHtml(item.detail)}</li>`).join("")}</ul>
<h2>Prompt IA image</h2><p class="prompt">${escapeHtml(report.imagePrompt)}</p>
<script>window.addEventListener('load', () => window.print());</script>
</body>
</html>`;
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

export default function DecorationAssistantPageClient() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [report, setReport] = useState<DecorationReport | null>(null);
  const [history, setHistory] = useState<DecorationReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historySource, setHistorySource] = useState<"local" | "supabase">("local");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const localReports = safeReports(window.localStorage.getItem(HISTORY_KEY));
    setHistory(localReports);

    const loadServerHistory = async () => {
      try {
        const response = await fetch("/api/concierge/decoration-assistant?limit=20", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as HistoryResponse;
        if (!isMounted || !Array.isArray(payload.items) || payload.items.length === 0) return;
        setHistory(payload.items);
        setHistorySource(payload.persisted ? "supabase" : "local");
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(payload.items));
      } catch {
        if (isMounted) setHistorySource("local");
      }
    };

    void loadServerHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const summary = useMemo(() => summarizeDecorationHistory(history), [history]);
  const mailtoHref = useMemo(() => {
    if (!report || !report.input.ownerEmail) return null;
    const subject = encodeURIComponent(`Rapport décoration PlanetLS - ${report.input.propertyName || report.input.roomName}`);
    const body = encodeURIComponent(reportToMailBody(report));
    return `mailto:${encodeURIComponent(report.input.ownerEmail)}?subject=${subject}&body=${body}`;
  }, [report]);

  const updateForm = <TKey extends keyof FormState>(key: TKey, value: FormState[TKey]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updateForm("photoName", file.name);
    setPhotoPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const saveReport = (nextReport: DecorationReport) => {
    const nextHistory = [nextReport, ...history.filter((item) => item.id !== nextReport.id)].slice(0, 12);
    setHistory(nextHistory);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/concierge/decoration-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, budget: Number(form.budget) }),
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.report) throw new Error(payload.error || "Génération impossible");
      setReport(payload.report);
      saveReport(payload.report);
    } catch (err) {
      const fallback = buildDecorationReport({ ...form, budget: Number(form.budget) });
      setReport(fallback);
      saveReport(fallback);
      setError(err instanceof Error ? `${err.message}. Rapport local généré en secours.` : "Rapport local généré en secours.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ConciergeWorkspacePage
      eyebrow="Assistant Décoration IA"
      title="Créer un rapport déco propriétaire en quelques minutes"
      description="Analyse rapide, recommandations budgétées, palette, conseils photo et prompt image prêt pour un avant/après."
      chips={["Étape par étape", "PDF propriétaire", "Prompt image prêt"]}
      actions={[
        { label: "Voir les propriétaires", href: "/dashboard/concierge/contacts", variant: "secondary" },
        { label: "Retour dashboard", href: "/dashboard/concierge", variant: "ghost" },
      ]}
      metrics={[
        { label: "Analyses", value: String(summary.analysesCount), hint: "Rapports conservés sur cet appareil" },
        { label: "Budget moyen", value: formatCurrencyAmount(summary.averageBudget, { currency: "EUR", emptyLabel: "0 EUR" }), hint: "Moyenne des analyses" },
        { label: "Style favori", value: summary.popularStyles[0]?.label || "Aucun", hint: summary.popularStyles[0] ? `${summary.popularStyles[0].count} rapport(s)` : "Générez une analyse" },
      ]}
      cards={[
        { title: "Brief clair", text: "Photo, objectif, style et budget cadrés avant génération." },
        { title: "Rapport vendable", text: "Objets, budget estimatif, bénéfices et conseils photo dans un format propriétaire." },
        { title: "Prêt pour l'image IA", text: "Le prompt généré pourra alimenter une future API d'avant/après." },
      ]}
      showMetricsIntro={false}
      showCardsIntro={false}
    >
      <div className={styles.workspace}>
        <section className={styles.formPanel}>
          <div className={styles.panelHeader}>
            <span><WandSparkles size={18} /> Brief</span>
            <DashboardStatusBadge label="IA locale" tone="info" />
          </div>

          <div className={styles.formGrid}>
            <label>
              <span>Nom de la pièce</span>
              <input value={form.roomName} onChange={(event) => updateForm("roomName", event.target.value)} />
            </label>
            <label>
              <span>Logement</span>
              <input value={form.propertyName || ""} onChange={(event) => updateForm("propertyName", event.target.value)} placeholder="Ex. Villa des pins" />
            </label>
            <label>
              <span>Propriétaire</span>
              <input value={form.ownerName || ""} onChange={(event) => updateForm("ownerName", event.target.value)} placeholder="Nom propriétaire" />
            </label>
            <label>
              <span>Email propriétaire</span>
              <input type="email" value={form.ownerEmail || ""} onChange={(event) => updateForm("ownerEmail", event.target.value)} placeholder="proprietaire@email.fr" />
            </label>
            <label>
              <span>Type de logement</span>
              <select value={form.housingType} onChange={(event) => updateForm("housingType", event.target.value as DecorationHousingType)}>
                {HOUSING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Budget</span>
              <input type="number" min={150} max={10000} value={form.budget} onChange={(event) => updateForm("budget", Number(event.target.value))} />
            </label>
          </div>

          <div className={styles.choiceGroup}>
            <span>Style souhaité</span>
            <div className={styles.segmented}>
              {STYLE_OPTIONS.map((option) => (
                <button key={option.value} type="button" data-active={form.style === option.value} onClick={() => updateForm("style", option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.choiceGroup}>
            <span>Objectif</span>
            <div className={styles.segmented}>
              {GOAL_OPTIONS.map((option) => (
                <button key={option.value} type="button" data-active={form.goal === option.value} onClick={() => updateForm("goal", option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className={styles.textareaField}>
            <span>Contraintes</span>
            <textarea value={form.constraints || ""} onChange={(event) => updateForm("constraints", event.target.value)} placeholder="Ex. pas de peinture, mobilier solide, délai court..." />
          </label>

          <label className={styles.photoDropzone}>
            <Camera size={22} />
            <span>{form.photoName || "Ajouter une photo de la pièce"}</span>
            <small>Prépare l'architecture pour une future vraie analyse image.</small>
            <input type="file" accept="image/*" onChange={handlePhoto} />
          </label>

          {photoPreview ? (
            <span className={styles.photoPreview}>
              <Image src={photoPreview} alt="Aperçu de la pièce" fill sizes="(max-width: 760px) 100vw, 360px" unoptimized />
            </span>
          ) : null}

          {error ? <p className={styles.errorText}>{error}</p> : null}

          <button type="button" className={styles.generateButton} onClick={generateReport} disabled={isGenerating}>
            {isGenerating ? <Loader2 size={18} className={styles.spinner} /> : <Sparkles size={18} />}
            {isGenerating ? "Génération en cours" : "Générer le rapport"}
          </button>
        </section>

        <section className={styles.reportPanel}>
          {report ? (
            <article className={styles.reportCard}>
              <div className={styles.reportHeader}>
                <div>
                  <span className={styles.eyebrow}>Rapport propriétaire</span>
                  <h2>{report.input.propertyName || report.input.roomName}</h2>
                  <p>{report.executiveSummary}</p>
                </div>
                <DashboardStatusBadge label={report.budget.fit} tone={report.budget.fit === "à arbitrer" ? "warning" : "success"} />
              </div>

              <div className={styles.reportActions}>
                <button type="button" onClick={() => openReportPdf(report)}><Download size={16} /> Télécharger PDF</button>
                {mailtoHref ? <a href={mailtoHref}><Mail size={16} /> Envoyer au propriétaire</a> : <button type="button" disabled><Mail size={16} /> Email manquant</button>}
              </div>

              <div className={styles.reportSectionGrid}>
                <section><h3>Points forts</h3><ul>{report.strengths.map((item) => <li key={item}>{item}</li>)}</ul></section>
                <section><h3>Points faibles</h3><ul>{report.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul></section>
              </div>

              <section className={styles.reportSection}>
                <h3>Suggestions</h3>
                <div className={styles.suggestionList}>{report.suggestions.map((item) => (
                  <article key={item.title}>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <span>{item.impact}</span>
                    <small>{formatCurrencyAmount(item.estimatedCost, { currency: "EUR" })}</small>
                  </article>
                ))}</div>
              </section>

              <section className={styles.reportSection}>
                <h3>Objets recommandés</h3>
                <div className={styles.objectGrid}>{report.objects.map((item) => (
                  <article key={item.label}>
                    <FileText size={16} />
                    <strong>{item.label}</strong>
                    <p>{item.reason}</p>
                    <span>{formatCurrencyAmount(item.estimatedCost, { currency: "EUR" })}</span>
                  </article>
                ))}</div>
              </section>

              <section className={styles.reportSection}>
                <h3>Palette couleurs</h3>
                <div className={styles.paletteGrid}>{report.palette.map((color) => (
                  <article key={color.hex}>
                    <span style={{ backgroundColor: color.hex }} />
                    <strong>{color.name}</strong>
                    <small>{color.hex}</small>
                    <p>{color.usage}</p>
                  </article>
                ))}</div>
              </section>

              <section className={styles.reportSection}>
                <h3>Conseils photo</h3>
                <ul>{report.photoTips.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>

              <section className={styles.promptBox}>
                <div><Palette size={18} /><h3>Prompt IA image</h3></div>
                <p>{report.imagePrompt}</p>
              </section>
            </article>
          ) : (
            <DashboardEmptyState title="Aucun rapport généré" copy="Remplissez le brief pour créer une proposition décoration prête à envoyer." icon={<WandSparkles size={22} />} />
          )}
        </section>
      </div>

      <section className={styles.historyPanel}>
        <div className={styles.panelHeader}>
          <span><History size={18} /> Historique des rapports</span>
          <DashboardStatusBadge label={historySource === "supabase" ? `${history.length} rapport(s) Supabase` : `${history.length} rapport(s) local`} tone="primary" />
        </div>
        {history.length > 0 ? (
          <div className={styles.historyList}>
            {history.map((item) => (
              <button key={item.id} type="button" onClick={() => setReport(item)}>
                <Home size={18} />
                <span><strong>{item.input.propertyName || item.input.roomName}</strong><small>{getDecorationStyleLabel(item.input.style)} · {formatDateValue(item.createdAt)}</small></span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        ) : (
          <DashboardEmptyState title="Historique vide" copy="Les prochains rapports resteront accessibles ici sur cet appareil." />
        )}
      </section>
    </ConciergeWorkspacePage>
  );
}