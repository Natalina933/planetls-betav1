import { Button, ButtonLink, Checkbox, Input, Loader, RequestStatusBadge, Select, Textarea } from "@/components/ui";
import type { RequestWorkflowStatus } from "@/app/lib/requestStatus";
import { ConciergeAvatar } from "@/features/owner-concierges/components/ConciergeAvatar";
import { OwnerLocationAutocomplete } from "@/features/owner-concierges/components/OwnerLocationAutocomplete";
import type { ConciergeSearchRow } from "@/features/owner-concierges/lib/search";
import type { RequestFormState, RequestType } from "../types";

const currencyOptions = [
  { value: "EUR", label: "\u20AC" },
  { value: "USD", label: "$" },
  { value: "GBP", label: "\u00A3" },
  { value: "CHF", label: "CHF" },
] as const;

const fallbackOneOffIdeas = [
  "Check-in voyageur",
  "Check-out",
  "Ménage de transition",
  "Remise de clés",
  "Visite de contrôle",
  "Imprévu sur place",
] as const;

type RequestPanelProps = {
  styles: Record<string, string>;
  selectedConcierges: ConciergeSearchRow[];
  selectedServices: string[];
  activeSearchSummary: string[];
  requestForm: RequestFormState;
  submittingRequest: boolean;
  requestFeedback: string | null;
  requestError: string | null;
  lastSubmittedStatus: RequestWorkflowStatus | null;
  lastSentSummary: {
    title: string;
    city: string;
    recipients: string[];
  } | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onRequestFormChange: <Key extends keyof RequestFormState>(
    key: Key,
    value: RequestFormState[Key],
  ) => void;
  getCitySuggestions: (query: string) => string[];
};

type RequestCopy = {
  title: string;
  intro: string;
  stepOneLabel: string;
  stepOneHint: string;
  stepTwoLabel: string;
  stepTwoHint: string;
  stepThreeLabel: string;
  stepThreeHint: string;
  titleLabel: string;
  titlePlaceholder: string;
  timingLabel: string;
  timingHint: string;
  detailsLabel: string;
  detailsPlaceholder: string;
  detailsHint?: string;
  budgetHint: string;
};

const requestTypeCopy: Record<RequestType, RequestCopy> = {
  ponctuel: {
    title: "Mission ponctuelle",
    intro:
      "Décrivez un besoin unique, rapide à cadrer et à envoyer à des concierges disponibles.",
    stepOneLabel: "Étape 1",
    stepOneHint: "Commencez par qualifier le besoin en quelques secondes.",
    stepTwoLabel: "Étape 2",
    stepTwoHint: "Précisez l'intervention attendue avec un service cohérent avec votre recherche.",
    stepThreeLabel: "Étape 3",
    stepThreeHint: "Finalisez la mission avec le bon timing et quelques détails utiles.",
    titleLabel: "Type d'intervention",
    titlePlaceholder: "Ex : check-in voyageur, remise de clés, ménage express",
    timingLabel: "Quand faut-il intervenir ?",
    timingHint: "Date et heure estimées. Vous pourrez affiner ensuite dans l'échange.",
    detailsLabel: "Détails utiles",
    detailsPlaceholder:
      "Ex : arrivée voyageur à 18h30, récupération des clés, vérifier l'état du logement.",
    detailsHint: "Quelques lignes suffisent. Vous pourrez préciser ensuite dans l'échange.",
    budgetHint: "Indicatif, pour aider les concierges à se positionner. Laissez vide si non défini.",
  },
  renfort: {
    title: "Renfort ou remplacement",
    intro:
      "Cadrez un besoin de relais temporaire, de surcharge d'activité ou de remplacement sur une période donnée.",
    stepOneLabel: "Cadre de mission",
    stepOneHint: "Les informations visibles en tête de brief.",
    stepTwoLabel: "Périmètre et budget",
    stepTwoHint: "Précisez le renfort attendu, le contexte et le niveau d'autonomie recherché.",
    stepThreeLabel: "Contexte opérationnel",
    stepThreeHint: "Donnez assez d'éléments pour que les concierges se projettent rapidement.",
    titleLabel: "Intitulé du renfort",
    titlePlaceholder: "Ex : renfort check-in/check-out pendant les vacances scolaires",
    timingLabel: "À partir de quand ?",
    timingHint: "Cette date aide les concierges à confirmer leur disponibilité.",
    detailsLabel: "Description",
    detailsPlaceholder:
      "Expliquez le volume attendu, les missions à reprendre, les horaires et le niveau d'urgence.",
    budgetHint:
      "Sert à cadrer la demande, sans engager le tarif final. Laissez vide si non défini.",
  },
  durable: {
    title: "Besoin durable",
    intro:
      "Présentez un besoin récurrent ou structurant pour trouver un concierge capable de s'inscrire dans la durée.",
    stepOneLabel: "Cadre de mission",
    stepOneHint: "Les informations visibles en tête de brief.",
    stepTwoLabel: "Zone et budget",
    stepTwoHint: "Précisez le périmètre, les services récurrents et le budget indicatif.",
    stepThreeLabel: "Vision de collaboration",
    stepThreeHint: "Décrivez ce que vous attendez sur la durée et la manière de travailler.",
    titleLabel: "Intitulé du besoin durable",
    titlePlaceholder: "Ex : gestion récurrente des séjours courte durée sur Lyon 6e",
    timingLabel: "À partir de quand ?",
    timingHint: "Indiquez le démarrage souhaité pour organiser la prise en charge.",
    detailsLabel: "Description",
    detailsPlaceholder:
      "Expliquez le rythme, les services attendus, le type de biens et les objectifs de collaboration.",
    budgetHint:
      "Sert à cadrer la demande, sans engager le tarif final. Laissez vide si non défini.",
  },
};

function toDisplayText(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\p{L}/u, (match) => match.toUpperCase());
}

function buildOneOffIdeas(selectedServices: string[], selectedConcierges: ConciergeSearchRow[]) {
  const serviceIdeas = selectedServices.map(toDisplayText);
  const conciergeIdeas = selectedConcierges.flatMap((item) => item.services ?? []).map(toDisplayText);
  const merged = Array.from(new Set([...serviceIdeas, ...conciergeIdeas].filter(Boolean)));
  return (merged.length > 0 ? merged : Array.from(fallbackOneOffIdeas)).slice(0, 6);
}

export function RequestPanel({
  styles,
  selectedConcierges,
  selectedServices,
  activeSearchSummary,
  requestForm,
  submittingRequest,
  requestFeedback,
  requestError,
  lastSubmittedStatus,
  lastSentSummary,
  onSubmit,
  onRequestFormChange,
  getCitySuggestions,
}: RequestPanelProps) {
  const copy = requestTypeCopy[requestForm.requestType];
  const oneOffIdeas = buildOneOffIdeas(selectedServices, selectedConcierges);

  return (
    <form className={styles.requestPanel} onSubmit={onSubmit} id="owner-request-panel">
      <div className={styles.requestHeader}>
        <div className={styles.requestHeaderCopy}>
          <p className={styles.eyebrow}>Demande</p>
          <h2 className={styles.requestTitle}>{copy.title}</h2>
          <p className={styles.requestIntro}>{copy.intro}</p>
        </div>
        <span className={styles.requestCount}>{selectedConcierges.length} cible(s)</span>
      </div>

      <div className={styles.selectionSummary}>
        <div className={styles.panelSummary}>
          <span className={styles.requestSectionLabel}>Recherche active</span>
          <strong>Recherche active</strong>
          <div className={styles.summaryChips}>
            {activeSearchSummary.length > 0 ? (
              activeSearchSummary.map((item) => (
                <span key={item} className={styles.summaryChip}>
                  {item}
                </span>
              ))
            ) : (
              <span className={styles.tagMuted}>Aucun filtre actif pour le moment.</span>
            )}
          </div>
        </div>

        <div className={styles.selectionDivider} />

        <div className={styles.panelSummary}>
          <span className={styles.requestSectionLabel}>Destinataires</span>
          <strong>Concierges sélectionnés</strong>
        </div>

        {lastSubmittedStatus ? (
          <div className={styles.panelSummary}>
            <span className={styles.requestSectionLabel}>Statut actuel</span>
            <RequestStatusBadge status={lastSubmittedStatus} />
          </div>
        ) : null}

        <div className={styles.selectedList}>
          {selectedConcierges.length > 0 ? (
            selectedConcierges.map((item) => (
              <span key={item.id} className={styles.selectedChip}>
                <span className={styles.selectedChipAvatar}>
                  <ConciergeAvatar
                    src={item.avatar_url}
                    alt={
                      item.avatar_url
                        ? `Avatar de ${item.display_name}`
                        : `Avatar par défaut de ${item.display_name}`
                    }
                    className={styles.selectedChipAvatarImage}
                    width={28}
                    height={28}
                  />
                </span>
                <span className={styles.selectedChipLabel}>{item.display_name}</span>
              </span>
            ))
          ) : (
            <span className={styles.tagMuted}>Sélectionnez un ou plusieurs concierges dans la liste.</span>
          )}
        </div>
      </div>

      <div className={styles.sidebarFields}>
        <div className={styles.requestBlock}>
          <div className={styles.requestBlockHeader}>
            <span className={styles.requestSectionLabel}>{copy.stepOneLabel}</span>
            <p className={styles.requestBlockHint}>{copy.stepOneHint}</p>
          </div>
          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span>Type de demande</span>
              <Select
                value={requestForm.requestType}
                onChange={(event) =>
                  onRequestFormChange("requestType", event.target.value as RequestType)
                }
              >
                <option value="ponctuel">Besoin ponctuel</option>
                <option value="renfort">Remplacement / renfort</option>
                <option value="durable">Besoin durable</option>
              </Select>
            </label>

            <div className={styles.field}>
              <span>Code postal</span>
              <Input
                value={requestForm.postalCode}
                onChange={(event) => onRequestFormChange("postalCode", event.target.value)}
                placeholder="75015"
                inputMode="numeric"
              />
            </div>
          </div>
        </div>

        <div className={styles.requestBlock}>
          <div className={styles.requestBlockHeader}>
            <span className={styles.requestSectionLabel}>{copy.stepTwoLabel}</span>
            <p className={styles.requestBlockHint}>{copy.stepTwoHint}</p>
          </div>

          {requestForm.requestType === "ponctuel" ? (
            <div className={styles.quickIdeas}>
              {oneOffIdeas.map((idea) => {
                const isActive = requestForm.title.trim().toLowerCase() === idea.toLowerCase();
                return (
                  <button
                    key={idea}
                    type="button"
                    className={isActive ? styles.quickIdeaActive : styles.quickIdea}
                    onClick={() => onRequestFormChange("title", idea)}
                  >
                    {idea}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <span>{copy.titleLabel}</span>
              <Input
                value={requestForm.title}
                onChange={(event) => onRequestFormChange("title", event.target.value)}
                placeholder={copy.titlePlaceholder}
              />
            </div>

            <label className={styles.field}>
              <span>Ville</span>
              <OwnerLocationAutocomplete
                ariaLabel="Ville"
                value={requestForm.city}
                onChange={(value) => onRequestFormChange("city", value)}
                placeholder="Ville d'intervention"
                getSuggestions={getCitySuggestions}
              />
            </label>

            <div className={styles.field}>
              <span>Budget indicatif du propriétaire</span>
              <div className={styles.budgetRow}>
                <Input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={requestForm.budgetMax}
                  onChange={(event) => onRequestFormChange("budgetMax", event.target.value)}
                  placeholder=".."
                />
                <Select
                  className={styles.budgetCurrency}
                  value={requestForm.currency}
                  onChange={(event) => onRequestFormChange("currency", event.target.value)}
                  aria-label="Devise du budget"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <small className={styles.fieldHint}>{copy.budgetHint}</small>
            </div>
          </div>
        </div>

        <div className={styles.requestBlock}>
          <div className={styles.requestBlockHeader}>
            <span className={styles.requestSectionLabel}>{copy.stepThreeLabel}</span>
            <p className={styles.requestBlockHint}>{copy.stepThreeHint}</p>
          </div>

          <div className={styles.field}>
            <span>{copy.timingLabel}</span>
            <Input
              type="datetime-local"
              value={requestForm.desiredDate}
              onChange={(event) => onRequestFormChange("desiredDate", event.target.value)}
            />
            <small className={styles.fieldHint}>{copy.timingHint}</small>
          </div>

          <label className={styles.field}>
            <span>{copy.detailsLabel}</span>
            <Textarea
              className={styles.requestTextarea}
              value={requestForm.description}
              onChange={(event) => onRequestFormChange("description", event.target.value)}
              placeholder={copy.detailsPlaceholder}
              rows={5}
            />
            {copy.detailsHint ? <small className={styles.fieldHint}>{copy.detailsHint}</small> : null}
          </label>
        </div>

        <Checkbox
          checked={requestForm.urgency}
          onChange={(event) => onRequestFormChange("urgency", event.target.checked)}
          label="Cette demande est urgente"
          className={styles.checkboxInput}
          labelClassName={styles.checkboxLabel}
        />
      </div>

      {submittingRequest ? (
        <div className={styles.requestProgress} role="status" aria-live="polite">
          <Loader size="sm" showText text="Envoi en cours..." />
          <p className={styles.requestProgressText}>
            Nous envoyons votre demande aux concierges sélectionnés.
          </p>
        </div>
      ) : null}

      {requestError ? (
        <p className={styles.errorBox} role="alert">
          {requestError}
        </p>
      ) : null}

      {requestFeedback ? (
        <div className={styles.successBox} role="status" aria-live="polite">
          <strong className={styles.feedbackTitle}>Demande envoyée</strong>
          <span>{requestFeedback}</span>
          {lastSentSummary ? (
            <div className={styles.sentSummary}>
              <span>
                <strong>Mission :</strong> {lastSentSummary.title}
              </span>
              <span>
                <strong>Ville :</strong> {lastSentSummary.city || "À confirmer"}
              </span>
              <span>
                <strong>Destinataires :</strong> {lastSentSummary.recipients.join(", ")}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          className={styles.primaryBtn}
          disabled={submittingRequest || selectedConcierges.length === 0}
        >
          {submittingRequest ? "Envoi en cours..." : "Envoyer ma demande"}
        </Button>
        <ButtonLink href="/dashboard/owner/demandes" variant="secondary" className={styles.secondaryBtn}>
          Suivre mes demandes envoyées
        </ButtonLink>
      </div>
    </form>
  );
}
