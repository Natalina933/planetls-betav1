import { Button, ButtonLink, Checkbox, Input, Select, Textarea } from "@/components/ui";
import { ConciergeAvatar } from "@/features/owner-concierges/components/ConciergeAvatar";
import { OwnerLocationAutocomplete } from "@/features/owner-concierges/components/OwnerLocationAutocomplete";
import type { ConciergeSearchRow } from "@/features/owner-concierges/lib/search";
import type { RequestFormState, RequestType } from "../types";

type RequestPanelProps = {
  styles: Record<string, string>;
  selectedConcierges: ConciergeSearchRow[];
  activeSearchSummary: string[];
  requestForm: RequestFormState;
  submittingRequest: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onRequestFormChange: <Key extends keyof RequestFormState>(
    key: Key,
    value: RequestFormState[Key],
  ) => void;
  getCitySuggestions: (query: string) => string[];
};

export function RequestPanel({
  styles,
  selectedConcierges,
  activeSearchSummary,
  requestForm,
  submittingRequest,
  onSubmit,
  onRequestFormChange,
  getCitySuggestions,
}: RequestPanelProps) {
  return (
    <form className={styles.requestPanel} onSubmit={onSubmit} id="owner-request-panel">
      <div className={styles.requestHeader}>
        <div className={styles.requestHeaderCopy}>
          <p className={styles.eyebrow}>Demande</p>
          <h2 className={styles.requestTitle}>Votre brief concierge</h2>
          <p className={styles.requestIntro}>
            Formalisez votre besoin comme une fiche mission claire, puis ciblez les profils les
            plus adaptÃ©s.
          </p>
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
          <strong>Concierges sÃ©lectionnÃ©s</strong>
        </div>
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
                        : `Avatar par dÃ©faut de ${item.display_name}`
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
            <span className={styles.tagMuted}>SÃ©lectionnez un ou plusieurs concierges dans la liste.</span>
          )}
        </div>
      </div>

      <div className={styles.sidebarFields}>
        <div className={styles.requestBlock}>
          <div className={styles.requestBlockHeader}>
            <span className={styles.requestSectionLabel}>Cadre de mission</span>
            <p className={styles.requestBlockHint}>Les informations visibles en tÃªte de brief.</p>
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
            <span className={styles.requestSectionLabel}>Zone et budget</span>
            <p className={styles.requestBlockHint}>PrÃ©cisez l&apos;intervention attendue.</p>
          </div>
          <div className={styles.fieldGrid}>
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
              <Input
                type="number"
                min="0"
                inputMode="numeric"
                value={requestForm.budgetMax}
                onChange={(event) => onRequestFormChange("budgetMax", event.target.value)}
                placeholder="120"
              />
              <small className={styles.fieldHint}>Sert à cadrer la demande, sans engager le tarif final. Laissez vide si non défini.</small>
            </div>
          </div>
        </div>

        <div className={styles.requestBlock}>
          <div className={styles.requestBlockHeader}>
            <span className={styles.requestSectionLabel}>Contenu du brief</span>
            <p className={styles.requestBlockHint}>Donnez assez de contexte pour obtenir une rÃ©ponse utile.</p>
          </div>
          <div className={styles.field}>
            <span>Date de dÃ©but de mission</span>
            <Input
              type="datetime-local"
              value={requestForm.desiredDate}
              onChange={(event) => onRequestFormChange("desiredDate", event.target.value)}
            />
            <small className={styles.fieldHint}>
              Cette date est transmise aux concierges pour qu&apos;ils sachent quand la mission commence.
            </small>
          </div>

          <div className={styles.field}>
            <span>Titre</span>
            <Input
              value={requestForm.title}
              onChange={(event) => onRequestFormChange("title", event.target.value)}
              placeholder="Ex: besoin de check-in ce week-end"
            />
          </div>

          <label className={styles.field}>
            <span>Description</span>
            <Textarea
              className={styles.requestTextarea}
              value={requestForm.description}
              onChange={(event) => onRequestFormChange("description", event.target.value)}
              placeholder="Expliquez la situation, le logement, l'urgence et ce que vous attendez."
              rows={5}
            />
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

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="primary"
          className={styles.primaryBtn}
          disabled={submittingRequest || selectedConcierges.length === 0}
        >
          {submittingRequest ? "Envoi..." : "Envoyer ma demande"}
        </Button>
        <ButtonLink href="/dashboard/owner/demandes" variant="secondary" className={styles.secondaryBtn}>
          Suivre mes demandes envoyÃ©es
        </ButtonLink>
      </div>
    </form>
  );
}

