import { Button, ButtonLink, Checkbox, Input, Loader, RequestStatusBadge, Select, Textarea } from "@/components/ui";
import type { RequestWorkflowStatus } from "@/app/lib/requestStatus";
import {
  buildServiceRequestBrief,
  getServiceRequestBriefFormGuidance,
  OWNER_COLLABORATION_TYPE_OPTIONS,
  OWNER_REQUEST_FREQUENCY_OPTIONS,
  OWNER_REQUEST_GOAL_OPTIONS,
  OWNER_RESPONSIBILITY_LEVEL_OPTIONS,
} from "@/app/lib/serviceRequestBrief";
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
  "Accueil sur place",
  "Check-in / check-out",
  "Ménage de transition",
  "Remise de clés",
  "Visite de contrôle",
  "Imprévu sur place",
] as const;

type RequestPanelProps = {
  styles: Record<string, string>;
  selectedConcierges: ConciergeSearchRow[];
  selectedServices: string[];
  selectedCategories: string[];
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
  detailsLabel: string;
  detailsPlaceholder: string;
  detailsHint?: string;
  budgetHint: string;
};

const requestTypeCopy: Record<RequestType, RequestCopy> = {
  ponctuel: {
    title: "Besoin ponctuel",
    intro: "Envoyez un brief court pour obtenir une réponse ou un devis.",
    stepOneLabel: "Cadre",
    stepOneHint: "Choisissez le type de collaboration.",
    stepTwoLabel: "Besoin",
    stepTwoHint: "Indiquez la ville, le service et le budget indicatif.",
    stepThreeLabel: "Message",
    stepThreeHint: "Ajoutez seulement le contexte utile.",
    titleLabel: "Type d'intervention",
    titlePlaceholder: "Ex : accueil sur place, remise de clés, ménage de transition",
    detailsLabel: "Détails utiles",
    detailsPlaceholder:
      "Ex : volume de séjours, logement concerné, plateformes utilisées, attentes principales.",
    detailsHint: "Gardez ici le contexte commercial : logement, volume attendu, plateformes et attentes principales.",
    budgetHint: "Indicatif, pour aider les concierges à se positionner. Laissez vide si non défini.",
  },
  renfort: {
    title: "Renfort ou remplacement",
    intro: "Cadrez un relais temporaire ou une surcharge d'activité.",
    stepOneLabel: "Cadre de mission",
    stepOneHint: "Choisissez le type de collaboration.",
    stepTwoLabel: "Périmètre",
    stepTwoHint: "Ville, services attendus et budget indicatif.",
    stepThreeLabel: "Message",
    stepThreeHint: "Donnez assez d'éléments pour une première réponse.",
    titleLabel: "Intitulé du renfort",
    titlePlaceholder: "Ex : renfort check-in/check-out pendant les vacances scolaires",
    detailsLabel: "Description",
    detailsPlaceholder:
      "Expliquez le volume attendu, les services à reprendre et le niveau d'autonomie recherché.",
    budgetHint:
      "Sert à cadrer la demande, sans engager le tarif final. Laissez vide si non défini.",
  },
  durable: {
    title: "Besoin durable",
    intro: "Présentez une collaboration récurrente pour recevoir un devis.",
    stepOneLabel: "Cadre",
    stepOneHint: "Positionnez la nature du partenariat.",
    stepTwoLabel: "Zone et budget",
    stepTwoHint: "Précisez ville, services et budget indicatif.",
    stepThreeLabel: "Message",
    stepThreeHint: "Décrivez vos attentes sur la durée.",
    titleLabel: "Intitulé du besoin durable",
    titlePlaceholder: "Ex : gestion récurrente des séjours courte durée sur Lyon 6e",
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

function formatMissingInfo(value: string) {
  return toDisplayText(value.replace(/^logement concerne$/, "logement").replace(/^adresse ou repere$/, "adresse"));
}

export function RequestPanel({
  styles,
  selectedConcierges,
  selectedServices,
  selectedCategories,
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
  const guidance = getServiceRequestBriefFormGuidance(requestForm.ownerGoal);
  const oneOffIdeas = buildOneOffIdeas(selectedServices, selectedConcierges);
  const requestedServices = selectedServices.length > 0 ? selectedServices : selectedCategories;
  const uniqueSearchSummary = Array.from(new Set(activeSearchSummary));
  const selectedPreview = selectedConcierges.slice(0, 4);
  const hiddenSelectedCount = Math.max(selectedConcierges.length - selectedPreview.length, 0);
  const requestBrief = buildServiceRequestBrief({
    ownerGoal: requestForm.ownerGoal,
    collaborationType: requestForm.collaborationType,
    frequency: requestForm.frequency,
    estimatedDuration: requestForm.estimatedDuration,
    responsibilityLevel: requestForm.responsibilityLevel,
    city: requestForm.city,
    propertyName: requestForm.propertyName,
    propertyAddress: requestForm.propertyAddress,
    propertyType: requestForm.propertyType,
    sleepingCapacity: requestForm.sleepingCapacity,
    propertyConstraints: requestForm.propertyConstraints,
    requestedServices,
    desiredDate: requestForm.desiredDate,
    urgency: requestForm.urgency,
    description: requestForm.description,
  });

  return (
    <form className={styles.requestPanel} onSubmit={onSubmit} id="owner-request-panel">
      <div className={styles.requestHeader}>
        <div className={styles.requestHeaderCopy}>
          <p className={styles.eyebrow}>Demande</p>
          <h2 className={styles.requestTitle}>{copy.title}</h2>
        </div>
        <span className={styles.requestCount}>{selectedConcierges.length} concierge(s)</span>
      </div>

      <div className={styles.selectionSummary}>
        <div className={styles.panelSummary}>
          <span className={styles.requestSectionLabel}>Recherche active</span>
          <div className={styles.summaryChips}>
            {uniqueSearchSummary.length > 0 ? (
              uniqueSearchSummary.map((item) => (
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
          <strong>{selectedConcierges.length} sélectionné(s)</strong>
        </div>

        {lastSubmittedStatus ? (
          <div className={styles.panelSummary}>
            <span className={styles.requestSectionLabel}>Statut actuel</span>
            <RequestStatusBadge status={lastSubmittedStatus} />
          </div>
        ) : null}

        <div className={styles.selectedList}>
          {selectedConcierges.length > 0 ? (
            <>
            {selectedPreview.map((item) => (
              <span key={item.id} className={styles.selectedChip}>
                <span className={styles.selectedChipAvatar}>
                  <ConciergeAvatar
                    src={item.avatar_url}
                    alt={item.display_name}
                    className={styles.selectedChipAvatarImage}
                    width={28}
                    height={28}
                  />
                </span>
                <span className={styles.selectedChipLabel}>{item.display_name}</span>
              </span>
            ))}
            {hiddenSelectedCount > 0 ? (
              <span className={styles.selectedChip}>+{hiddenSelectedCount} autre{hiddenSelectedCount > 1 ? "s" : ""}</span>
            ) : null}
            </>
          ) : (
            <span className={styles.tagMuted}>Sélectionnez un ou plusieurs concierges dans la liste.</span>
          )}
        </div>
      </div>

      <div className={styles.sidebarFields}>
        <div className={styles.requestBlock}>
          <div className={styles.requestBlockHeader}>
            <span className={styles.requestSectionLabel}>Objectif principal</span>
          </div>
          <div className={styles.choiceGrid}>
            {OWNER_REQUEST_GOAL_OPTIONS.map((option) => {
              const isActive = requestForm.ownerGoal === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={isActive ? styles.choiceCardActive : styles.choiceCard}
                  aria-pressed={isActive}
                  onClick={() => onRequestFormChange("ownerGoal", option.value)}
                >
                  <strong>{option.label}</strong>
                  {isActive ? <span>{option.helper}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.requestBlock}>
          <div className={styles.requestBlockHeader}>
            <span className={styles.requestSectionLabel}>Collaboration recherchée</span>
          </div>
          <div className={styles.choiceGrid}>
            {OWNER_COLLABORATION_TYPE_OPTIONS.map((option) => {
              const isActive = requestForm.collaborationType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={isActive ? styles.choiceCardActive : styles.choiceCard}
                  aria-pressed={isActive}
                  onClick={() => onRequestFormChange("collaborationType", option.value)}
                >
                  <strong>{option.label}</strong>
                  {isActive ? <span>{option.helper}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.requestBlock}>
          <div className={styles.requestBlockHeader}>
            <span className={styles.requestSectionLabel}>{copy.stepTwoLabel}</span>
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
            <label className={styles.field}>
              <span>{guidance.titleLabel}</span>
              <Input
                value={requestForm.title}
                onChange={(event) => onRequestFormChange("title", event.target.value)}
                placeholder={guidance.titlePlaceholder}
              />
            </label>

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

            <label className={styles.field}>
              <span>Logement concerne</span>
              <Input
                value={requestForm.propertyName}
                onChange={(event) => onRequestFormChange("propertyName", event.target.value)}
                placeholder="Ex : Appartement Paris 15, Villa des Pins"
              />
            </label>

            <label className={styles.field}>
              <span>Adresse ou repere</span>
              <Input
                value={requestForm.propertyAddress}
                onChange={(event) => onRequestFormChange("propertyAddress", event.target.value)}
                placeholder="Adresse, quartier ou acces utile"
              />
            </label>

            <label className={styles.field}>
              <span>Type de logement</span>
              <Input
                value={requestForm.propertyType}
                onChange={(event) => onRequestFormChange("propertyType", event.target.value)}
                placeholder="Appartement, maison, villa, studio..."
              />
            </label>

            <label className={styles.field}>
              <span>Couchages</span>
              <Input
                value={requestForm.sleepingCapacity}
                onChange={(event) => onRequestFormChange("sleepingCapacity", event.target.value)}
                placeholder="Ex : 4"
                inputMode="numeric"
              />
            </label>

            <label className={styles.field}>
              <span>Code postal</span>
              <Input
                value={requestForm.postalCode}
                onChange={(event) => onRequestFormChange("postalCode", event.target.value)}
                placeholder="75015"
                inputMode="numeric"
              />
            </label>

            <label className={styles.field}>
              <span>Date souhaitée</span>
              <Input
                type="date"
                value={requestForm.desiredDate}
                onChange={(event) => onRequestFormChange("desiredDate", event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>Fréquence estimée</span>
              <Select
                value={requestForm.frequency}
                onChange={(event) =>
                  onRequestFormChange("frequency", event.target.value as RequestFormState["frequency"])
                }
              >
                {OWNER_REQUEST_FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>

            <label className={styles.field}>
              <span>Durée estimée</span>
              <Input
                value={requestForm.estimatedDuration}
                onChange={(event) => onRequestFormChange("estimatedDuration", event.target.value)}
                placeholder="Ex : 1 mission, 3 mois, toute l'annee"
              />
            </label>

            <label className={styles.field}>
              <span>Niveau de responsabilité</span>
              <Select
                value={requestForm.responsibilityLevel}
                onChange={(event) =>
                  onRequestFormChange(
                    "responsibilityLevel",
                    event.target.value as RequestFormState["responsibilityLevel"],
                  )
                }
              >
                {OWNER_RESPONSIBILITY_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>

            <div className={styles.field}>
              <span>Budget indicatif du propriétaire</span>
              <div className={styles.budgetRow}>
                <Input
                  type="number"
                  min="0"
                  aria-label="Budget indicatif"
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
            </div>
          </div>
        </div>

        <div className={styles.requestBlock}>
          <div className={styles.requestBlockHeader}>
            <span className={styles.requestSectionLabel}>{copy.stepThreeLabel}</span>
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
          </label>

          <label className={styles.field}>
            <span>Contraintes du logement</span>
            <Textarea
              className={styles.requestTextarea}
              value={requestForm.propertyConstraints}
              onChange={(event) => onRequestFormChange("propertyConstraints", event.target.value)}
              placeholder="Ex : accès autonome, linge à prévoir, escalier sans ascenseur, consignes voyageurs, horaires imposés."
              rows={4}
            />
          </label>
        </div>

        <div className={styles.requestBriefPreview}>
          <div className={styles.requestBlockHeader}>
            <span className={styles.requestSectionLabel}>Synthèse avant envoi</span>
          </div>
          <p>{requestBrief.summary}</p>
          <div className={styles.summaryChips}>
            <span className={styles.summaryChip}>{requestBrief.owner_goal_label}</span>
            <span className={styles.summaryChip}>{requestBrief.collaboration_type_label}</span>
            <span className={styles.summaryChip}>{requestBrief.frequency_label}</span>
            <span className={styles.summaryChip}>{requestBrief.responsibility_level_label}</span>
            <span className={styles.summaryChip}>{requestBrief.pricing_expectation}</span>
          </div>
          {requestBrief.missing_information.length > 0 ? (
            <div className={styles.missingInfoBox} role="status">
              <strong>À compléter</strong>
              <span>{requestBrief.missing_information.map(formatMissingInfo).join(", ")}</span>
            </div>
          ) : null}
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
                <strong>Demande :</strong> {lastSentSummary.title}
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
