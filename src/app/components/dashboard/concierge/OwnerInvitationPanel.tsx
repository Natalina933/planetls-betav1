"use client";

import { useEffect, useMemo, useState } from "react";
import { FiMail, FiRefreshCcw, FiSend } from "react-icons/fi";
import styles from "./LogementWorkspace.module.scss";
import OwnerInvitationStatusBadge from "./OwnerInvitationStatusBadge";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import EditableSectionCard from "./EditableSectionCard";
import type { HousingOwnerInfo, HousingRow } from "@/types/housing";
import { normalizeHousingRow } from "@/types/housing";
import {
  getInvitationLastActivity,
  OWNER_INVITATION_STATUS_META,
  type OwnerInvitationListItem,
} from "@/types/ownerInvitations";

function formatDateTime(value: string | null) {
  if (!value) return "À venir";
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

export default function OwnerInvitationPanel({
  housingId,
  housingName,
  owner,
  onOwnerSaved,
  disabled = false,
}: {
  housingId: string;
  housingName?: string;
  owner: HousingOwnerInfo;
  onOwnerSaved: (nextOwner: HousingOwnerInfo, row: HousingRow) => void;
  disabled?: boolean;
}) {
  const { user } = useCurrentUser();
  const [items, setItems] = useState<OwnerInvitationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [note, setNote] = useState(owner.invitationMessageTemplate ?? "");
  const [editingMessage, setEditingMessage] = useState(false);

  useEffect(() => {
    setNote(owner.invitationMessageTemplate ?? "");
  }, [owner.invitationMessageTemplate]);

  const conciergeLabel = useMemo(() => {
    const fullName = [user?.firstName?.trim(), user?.lastName?.trim()].filter(Boolean).join(" ");
    return fullName || user?.company_name?.trim() || user?.email?.trim() || "votre concierge";
  }, [user?.company_name, user?.email, user?.firstName, user?.lastName]);

  const suggestedMessage = useMemo(() => {
    const ownerName = owner.fullName?.trim() || "Bonjour";
    const housingLabel = housingName?.trim() || "votre logement";
    return [
      `${ownerName},`,
      "",
      `Je vous invite à rejoindre PlanetLS pour centraliser les informations utiles liées à ${housingLabel}, vos missions à venir et vos devis déjà validés.`,
      "",
      `Une fois votre compte créé, vous pourrez échanger directement avec ${conciergeLabel} et transmettre plus facilement les éléments nécessaires à l'organisation des prochaines interventions.`,
    ].join("\n");
  }, [conciergeLabel, housingName, owner.fullName]);

  const suggestedSubject = useMemo(() => {
    const housingLabel = housingName?.trim();
    return housingLabel
      ? `Invitation à rejoindre PlanetLS pour ${housingLabel}`
      : "Invitation à rejoindre PlanetLS";
  }, [housingName]);

  const previewMessage = useMemo(() => {
    const base = (note || suggestedMessage).replace(/\s+/g, " ").trim();
    if (base.length <= 170) return base;
    return `${base.slice(0, 167).trim()}...`;
  }, [note, suggestedMessage]);

  async function loadInvitations() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/owner-invitations?housingId=${encodeURIComponent(housingId)}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger les invitations.");
      }
      setItems(Array.isArray(payload?.items) ? payload.items : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les invitations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInvitations();
  }, [housingId]);

  const latestInvitation = useMemo(() => items[0] ?? null, [items]);

  async function handleInvite() {
    if (!owner.email.trim()) {
      setError("Renseignez et enregistrez d'abord l'email du propriétaire dans le contact principal.");
      setSuccess("");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const response = await fetch("/api/owner-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          housingId,
          email: owner.email,
          ownerNameHint: owner.fullName || undefined,
          personalNote: (note || suggestedMessage) || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'envoyer l'invitation.");
      }
      setSuccess(
        payload?.delivery?.deliveryMode === "preview"
          ? "Invitation préparée. L'envoi réel d'email reste à brancher sur votre provider."
          : "Invitation envoyée au propriétaire.",
      );
      await loadInvitations();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible d'envoyer l'invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend(invitationId: string) {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const response = await fetch(`/api/owner-invitations/${invitationId}/resend`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de relancer l'invitation.");
      }
      setSuccess(
        payload?.delivery?.deliveryMode === "preview"
          ? "Relance preparee. Le branchement email final reste a connecter."
          : "Invitation relancee.",
      );
      await loadInvitations();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible de relancer l'invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveTemplate() {
    try {
      setSavingTemplate(true);
      setSaveError("");
      setSaveSuccess("");
      const response = await fetch(`/api/housing/${housingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proprietaire: {
            invitation_message_template: note.trim(),
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'enregistrer le message d'invitation.");
      }
      const normalized = normalizeHousingRow(payload as HousingRow);
      onOwnerSaved(normalized.owner, payload as HousingRow);
      setNote(normalized.owner.invitationMessageTemplate ?? "");
      setEditingMessage(false);
      setSaveSuccess("Message d'invitation bien enregistré.");
    } catch (saveError) {
      setSaveError(
        saveError instanceof Error ? saveError.message : "Impossible d'enregistrer le message d'invitation.",
      );
    } finally {
      setSavingTemplate(false);
    }
  }

  return (
    <div className={styles.invitationStack}>
      <EditableSectionCard
        eyebrow="Invitation plateforme"
        title="Inviter ce propriétaire à rejoindre PlanetLS"
        isEditing={editingMessage}
        onEdit={() => {
          setNote(owner.invitationMessageTemplate || suggestedMessage);
          setSaveError("");
          setSaveSuccess("");
          setEditingMessage(true);
        }}
        onCancel={() => {
          setNote(owner.invitationMessageTemplate || "");
          setSaveError("");
          setSaveSuccess("Modifications annulées.");
          setEditingMessage(false);
        }}
        onSave={handleSaveTemplate}
        saving={savingTemplate}
        successMessage={saveSuccess}
        errorMessage={saveError}
      >
        <div className={styles.sectionHeader}>
          <p className={styles.cardMeta}>
            Le propriétaire pourra créer son compte, retrouver ses missions à venir, ses devis acceptés et transmettre ses besoins directement à son concierge.
          </p>
          <FiMail aria-hidden="true" />
        </div>

        <div className={styles.inlineHelper}>
          Destinataire actuel : <strong>{owner.email || "Email propriétaire à enregistrer"}</strong>
        </div>

        <div className={styles.fieldGrid}>
          <label className={`${styles.label} ${styles.fieldFull}`}>
            <span>Message d&apos;invitation</span>
            {!editingMessage ? (
              <div className={styles.messagePreviewCard}>
                <div className={styles.emailPreviewHeader}>
                  <strong className={styles.cardTitle}>Aperçu de l&apos;email</strong>
                  <span className={styles.pill}>Lien sécurisé inclus</span>
                </div>

                <div className={styles.emailPreviewMeta}>
                  <span>
                    <strong>Objet :</strong> {suggestedSubject}
                  </span>
                  <span>
                    <strong>Destinataire :</strong> {owner.email || "proprietaire@email.com"}
                  </span>
                </div>

                <p className={styles.cardMeta}>{previewMessage}</p>

                <div className={styles.inlineHelper}>
                  Le propriétaire recevra un lien d&apos;inscription sécurisé valable 7 jours pour rejoindre la plateforme et se rattacher automatiquement à son concierge.
                </div>

                <div className={styles.invitationActions}>
                  <button
                    type="button"
                    className={styles.actionSecondary}
                    disabled={disabled || submitting}
                    onClick={() => {
                      if (!note.trim()) {
                        setNote(suggestedMessage);
                      }
                      setEditingMessage(true);
                    }}
                  >
                    Personnaliser le message
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.messageEditor}>
                <div className={styles.emailPreviewMeta}>
                  <span>
                    <strong>Objet :</strong> {suggestedSubject}
                  </span>
                  <span>
                    <strong>Destinataire :</strong> {owner.email || "proprietaire@email.com"}
                  </span>
                </div>
                <textarea
                  className={styles.textArea}
                  value={note}
                  disabled={!editingMessage || disabled || savingTemplate}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={suggestedMessage}
                />
                <div className={styles.invitationActions}>
                  <button
                    type="button"
                    className={styles.actionSecondary}
                    disabled={disabled || savingTemplate}
                    onClick={() => {
                      setNote(suggestedMessage);
                    }}
                  >
                    Utiliser la version proposée
                  </button>
                  <button
                    type="button"
                    className={styles.actionSecondary}
                    disabled={disabled || savingTemplate}
                    onClick={() => setEditingMessage(false)}
                  >
                    Revenir à l&apos;aperçu
                  </button>
                </div>
              </div>
            )}
          </label>
        </div>

        <div className={styles.invitationActions}>
          <button
            type="button"
            className={styles.actionPrimary}
            disabled={disabled || submitting || !owner.email.trim()}
            onClick={handleInvite}
          >
            <FiSend /> {submitting ? "Envoi..." : "Envoyer l'invitation"}
          </button>
          <span className={styles.helper}>
            Le lien sécurisé reste valable 7 jours et la relation concierge/propriétaire sera créée automatiquement à l&apos;acceptation.
          </span>
        </div>

        {success ? <p className={styles.messageSuccess}>{success}</p> : null}
        {error ? <p className={styles.messageError}>{error}</p> : null}
      </EditableSectionCard>

      <div className={styles.invitationCard}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Suivi</p>
            <h3 className={styles.cardTitle}>Statut des invitations envoyées</h3>
          </div>
        </div>

        {loading ? (
          <p className={styles.cardMeta}>Chargement des invitations...</p>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <strong className={styles.cardTitle}>Aucune invitation envoyée</strong>
            <p className={styles.cardMeta}>
              Dès qu&apos;une invitation partira, vous pourrez suivre ici son ouverture, son acceptation ou sa relance.
            </p>
          </div>
        ) : (
          <div className={styles.invitationList}>
            {items.map((item) => {
              const meta = OWNER_INVITATION_STATUS_META[item.status];
              const canResend = item.status !== "accepted" && item.status !== "cancelled";
              return (
                <article key={item.id} className={styles.invitationListItem}>
                  <div className={styles.invitationListHead}>
                    <div>
                      <strong className={styles.cardTitle}>{item.invitedOwnerName || item.invitedEmail}</strong>
                      <p className={styles.cardMeta}>{item.invitedEmail}</p>
                    </div>
                    <OwnerInvitationStatusBadge status={item.status} />
                  </div>

                  <p className={styles.cardMeta}>{meta.description}</p>

                  <div className={styles.invitationMetaGrid}>
                    <span>Dernière activité : {formatDateTime(getInvitationLastActivity(item))}</span>
                    <span>Expiration : {formatDateTime(item.expiresAt)}</span>
                    <span>Relances : {item.relaunchCount}</span>
                  </div>

                  {canResend ? (
                    <div className={styles.invitationActions}>
                      <button
                        type="button"
                        className={styles.actionSecondary}
                        disabled={submitting}
                        onClick={() => handleResend(item.id)}
                      >
                        <FiRefreshCcw /> Relancer
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        {latestInvitation ? (
          <div className={styles.inlineHelper}>
            Dernier état suivi : {OWNER_INVITATION_STATUS_META[latestInvitation.status].label}. Une fois acceptée, l&apos;invitation servira de point d&apos;entrée pour relier automatiquement le propriétaire à son concierge.
          </div>
        ) : null}
      </div>
    </div>
  );
}
