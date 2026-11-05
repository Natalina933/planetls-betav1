"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  FileText,
  Handshake,
  Home,
  ShieldCheck,
  XCircle,
  Clock,
  User,
  Building2,
  Sparkles,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ButtonLink } from "@/components/ui";
import type { PendingHousingCollaboration } from "@/features/housing-collaborations/types";
import styles from "./CollaborationDetailPage.module.scss";

/**
 * Type étendu pour les détails de la collaboration
 */
type CollaborationDetail = PendingHousingCollaboration & {
  quote: PendingHousingCollaboration["quote"] & {
    total_amount?: number | null;
    currency?: string | null;
    accepted_at?: string | null;
    valid_until?: string | null;
    notes?: string | null;
  };
  request: PendingHousingCollaboration["request"] & {
    requested_services?: string[] | null;
  } | null;
  mission: { id: string; title: string; status: string | null } | null;
  termination?: Record<string, unknown> | null;
  collaboration_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

/**
 * Type pour la réponse de l'API
 */
type CollaborationDetailPayload = {
  item?: CollaborationDetail;
  error?: string;
};

/**
 * Type pour la demande de résiliation
 */
type TerminationRequest = {
  notice_days: number;
  requested_by: string;
  requested_at: string;
  effective_date: string;
  effective_at: string;
  state: "notice" | "effective";
  schema_version?: number;
  notice_source?: string;
  conditions_version_id?: string | null;
};

/**
 * Type pour la réponse de l'API de résiliation
 */
type TerminationResponse = {
  status: number;
  collaboration_status: string;
  stored_status: string;
  termination_request: TerminationRequest | null;
  interventions_requiring_arbitration: Array<{
    id: string;
    title: string;
    requires_arbitration: boolean;
    reason: string;
  }>;
  error?: string;
};

/**
 * Formate un montant en euros
 */
function formatAmount(value: number | null | undefined, currency = "EUR") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Sur devis";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formate une date en français
 */
function formatDate(value: string | null | undefined) {
  if (!value) return "À confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Retourne le label du statut de collaboration
 */
function getCollaborationStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "pending_handover":
      return "En attente";
    case "scheduled":
      return "Planifiée";
    case "paused":
      return "En pause";
    case "ended":
      return "Terminée";
    case "cancelled":
      return "Annulée";
    default:
      return "Inconnue";
  }
}

/**
 * Retourne la classe CSS pour le badge de statut
 */
function getStatusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return styles.statusActive;
    case "pending_handover":
      return styles.statusPending;
    case "scheduled":
      return styles.statusScheduled;
    case "paused":
      return styles.statusPaused;
    case "ended":
      return styles.statusEnded;
    case "cancelled":
      return styles.statusCancelled;
    default:
      return styles.statusUnknown;
  }
}

/**
 * Retourne le type de collaboration en français
 */
function getCollaborationTypeLabel(type: string | null | undefined) {
  if (!type) return "Non spécifié";
  switch (type.toLowerCase()) {
    case "continuous":
    case "continue":
      return "Continue";
    case "ponctual":
    case "ponctuelle":
    case "one-time":
    case "one_off":
      return "Ponctuelle";
    case "regular": return "Régulière";
    case "full_management": return "Gestion complète";
    case "partial_management": return "Gestion partielle";
    case "temporary_replacement": return "Remplacement temporaire";
    case "trial": return "Essai";
    case "onboarding": return "Mise en place";
    default:
      return type;
  }
}

/**
 * Extrait les initiales d'un nom
 */
function getInitials(value: string) {
  const words = value.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "C";
}

/**
 * Composant principal de la page de détail d'une collaboration
 */
export default function CollaborationDetailPage() {
  const params = useParams();
  const [collaboration, setCollaboration] = useState<CollaborationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termination, setTermination] = useState<TerminationResponse | null>(null);
  const [terminationError, setTerminationError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const collaborationId = params.id as string;

  /**
   * Charge les détails de la collaboration
   */
  /**
   * Charge les détails de la collaboration
   */
  const loadCollaboration = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!collaborationId) {
        throw new Error("ID de collaboration manquant.");
      }

      const response = await fetch(`/api/housing-collaborations/${encodeURIComponent(collaborationId)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Impossible de charger les détails de la collaboration.");
      }

      const payload = (await response.json()) as CollaborationDetailPayload;
      
      if (payload.error) {
        throw new Error(payload.error);
      }

      if (!payload.item) {
        throw new Error("Collaboration introuvable.");
      }

      setCollaboration(payload.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les détails de la collaboration.");
    } finally {
      setLoading(false);
    }
  }, [collaborationId]);

  /**
   * Charge les informations de résiliation
   */
  const loadTermination = useCallback(async () => {
    setTermination(null);
    setTerminationError(null);
    try {
      if (!collaborationId) return;

      const response = await fetch(`/api/housing-collaborations/${encodeURIComponent(collaborationId)}/termination`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Impossible de charger les informations de résiliation.");
      }

      const payload = await response.json();
      if (payload.error) {
        throw new Error(payload.error);
      }

      setTermination(payload);
    } catch (err) {
      // Ne pas bloquer l'affichage de la page si le chargement de la résiliation échoue
      console.error("Erreur lors du chargement de la résiliation:", err);
      setTerminationError(err instanceof Error ? err.message : "Informations de résiliation indisponibles.");
      setTermination(null);
    }
  }, [collaborationId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCollaboration();
      void loadTermination();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCollaboration, loadTermination]);

  /**
   * Retourne la date de fin de collaboration si disponible
   */
  function getEndDate() {
    if (!collaboration) return null;
    const termination = collaboration.termination;
    if (termination && typeof termination === "object" && termination !== null) {
      const endsOn = termination as Record<string, unknown>;
      if (typeof endsOn.ends_on === "string") {
        return endsOn.ends_on;
      }
      if (typeof endsOn.effective_date === "string") {
        return endsOn.effective_date;
      }
    }
    return collaboration.end_date ?? null;
  }

  /**
   * Vérifie si la résiliation peut être demandée
   */
  function canRequestTermination(): boolean {
    if (!collaboration) return false;
    if (!termination) return false;
    
    // La résiliation ne peut être demandée que pour les collaborations actives ou en pause
    const allowableStates = ["active", "paused"];
    if (!allowableStates.includes(collaboration.status)) return false;
    
    // Si une demande de résiliation existe déjà, ne pas permettre une nouvelle demande
    if (termination.termination_request) return false;
    
    // Si la collaboration est déjà terminée ou annulée côté serveur
    if (termination.collaboration_status === "ended" || termination.collaboration_status === "cancelled") return false;
    
    return true;
  }

  /**
   * Demande la résiliation de la collaboration
   */
  const handleRequestTermination = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      if (!collaborationId) {
        throw new Error("ID de collaboration manquant.");
      }

      const response = await fetch(`/api/housing-collaborations/${encodeURIComponent(collaborationId)}/termination`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Impossible de demander la résiliation.");
      }

      const payload = await response.json();
      
      if (payload.error) {
        throw new Error(payload.error);
      }

      setSubmitSuccess(true);
      setTermination(payload);
      
      // Recharger la collaboration pour mettre à jour le statut
      await loadCollaboration();
      
      // Fermer la modal après un délai
      setTimeout(() => {
        setShowTerminationModal(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Impossible de demander la résiliation.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [collaborationId, loadCollaboration]);

  /**
   * Retourne l'état actuel de la résiliation
   */
  function getTerminationStatus(): string {
    if (!termination) return "Inconnue";
    
    if (termination.collaboration_status === "ended" || termination.collaboration_status === "cancelled") {
      return "Terminée";
    }
    
    if (termination.termination_request) {
      if (termination.termination_request.state === "effective") {
        return "Résiliée";
      }
      return "Résiliation demandée";
    }
    
    return "Aucune résiliation en cours";
  }

  /**
   * Retourne la date de fin prévue de la résiliation
   */
  function getTerminationEndDate(): string | null {
    if (!termination?.termination_request) return null;
    return termination.termination_request.effective_date || null;
  }

  /**
   * Retourne le nombre de jours de préavis
   */
  function getNoticeDays(): number | null {
    if (!termination?.termination_request) return null;
    return termination.termination_request.notice_days ?? null;
  }

  /**
   * Retourne la source du préavis
   */
  function getNoticeSource(): string {
    if (!termination?.termination_request) return "Par défaut (30 jours)";
    
    switch (termination.termination_request.notice_source) {
      case "bilateral_contract_conditions":
        return "Conditions contractuelles bilatérales";
      case "default_30_calendar_days":
      default:
        return "Par défaut (30 jours)";
    }
  }

  /**
   * Ferme la modal de résiliation
   */
  const handleCloseTerminationModal = useCallback(() => {
    if (submittingRef.current) return;
    setShowTerminationModal(false);
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingPanel}>
          <div className={styles.loadingSpinner} />
          <p>Chargement des détails de la collaboration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorPanel}>
          <XCircle size={24} />
          <h2>Erreur</h2>
          <p>{error}</p>
          <Link href="/dashboard/owner/conciergerie/partenaires" className={styles.backLink}>
            <ArrowLeft size={16} /> Retour à mes partenaires
          </Link>
        </div>
      </div>
    );
  }

  if (!collaboration) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyPanel}>
          <Handshake size={24} />
          <h2>Collaboration introuvable</h2>
          <p>Cette collaboration n\'existe pas ou vous n\'avez pas les droits pour y accéder.</p>
          <Link href="/dashboard/owner/conciergerie/partenaires" className={styles.backLink}>
            <ArrowLeft size={16} /> Retour à mes partenaires
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel = getCollaborationStatusLabel(collaboration.status);
  const statusClass = getStatusBadgeClass(collaboration.status);
  const endDate = getEndDate();
  const typeLabel = getCollaborationTypeLabel(collaboration.collaboration_type);

  return (
    <div className={styles.page}>
      {/* En-tête avec retour */}
      <header className={styles.header}>
        <Link href="/dashboard/owner/conciergerie/partenaires" className={styles.backLink}>
          <ArrowLeft size={18} /> Retour à mes partenaires
        </Link>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Détails de la collaboration</p>
          <h1>Collaboration avec {collaboration.concierge.name}</h1>
          <p>
            Consultez les informations détaillées de votre collaboration avec la conciergerie 
            {collaboration.concierge.name} pour le logement {collaboration.housing.name}.
          </p>
        </div>
      </header>

      {/* Carte principale de la collaboration */}
      <section className={styles.mainCard}>
        <div className={styles.cardHeader}>
          <div className={styles.identity}>
            <div className={styles.avatar}>{getInitials(collaboration.concierge.name)}</div>
            <div>
              <p className={styles.eyebrow}>Conciergerie partenaire</p>
              <h2>{collaboration.concierge.name}</h2>
              <span>{collaboration.housing.name}</span>
            </div>
          </div>
          <span className={`${styles.statusBubble} ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        {/* Grille des informations principales */}
        <div className={styles.infoGrid}>
          <InfoBlock icon={<Handshake size={18} />} label="Type de collaboration" value={typeLabel} />
          <InfoBlock icon={<Clock size={18} />} label="Statut" value={statusLabel} />
          {collaboration.start_date ? (
            <InfoBlock icon={<Calendar size={18} />} label="Date de début" value={formatDate(collaboration.start_date)} />
          ) : null}
          {endDate ? (
            <InfoBlock icon={<CalendarClock size={18} />} label="Date de fin" value={formatDate(endDate)} />
          ) : null}
        </div>

        {/* ID de collaboration */}
        <div className={styles.idSection}>
          <span className={styles.idLabel}>ID Collaboration</span>
          <code className={styles.idValue}>{collaboration.id}</code>
        </div>
      </section>

      {/* Section Devis */}
      {collaboration.quote.id ? (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h3>
              <FileText size={18} /> Devis associé
            </h3>
          </div>
          <div className={styles.subGrid}>
            <InfoBlock icon={<FileText size={16} />} label="Numéro de devis" value={collaboration.quote.number || collaboration.quote.id.slice(0, 8)} />
            <InfoBlock icon={<Sparkles size={16} />} label="Montant" value={formatAmount(collaboration.quote.total_amount, collaboration.quote.currency ?? "EUR")} />
            {collaboration.quote.accepted_at ? (
              <InfoBlock icon={<CheckCircle2 size={16} />} label="Accepté le" value={formatDate(collaboration.quote.accepted_at)} />
            ) : null}
            {collaboration.quote.valid_until ? (
              <InfoBlock icon={<CalendarClock size={16} />} label="Valable jusqu'au" value={formatDate(collaboration.quote.valid_until)} />
            ) : null}
          </div>
          {collaboration.quote.notes ? (
            <div className={styles.notesBlock}>
              <p>{collaboration.quote.notes}</p>
            </div>
          ) : null}
          <div className={styles.sectionActions}>
            <Link href={`/dashboard/owner/devis?quote=${encodeURIComponent(collaboration.quote.id)}`} className={styles.actionLink}>
              Voir le devis complet <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      ) : (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h3>
              <FileText size={18} /> Devis
            </h3>
          </div>
          <p className={styles.noData}>Aucun devis associé à cette collaboration.</p>
        </section>
      )}

      {/* Section Demande */}
      {collaboration.request ? (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h3>
              <User size={18} /> Demande associée
            </h3>
          </div>
          <div className={styles.subGrid}>
            <InfoBlock icon={<User size={16} />} label="Titre" value={collaboration.request.title} />
            {collaboration.request.requested_services && collaboration.request.requested_services.length > 0 ? (
              <InfoBlock icon={<Sparkles size={16} />} label="Services demandés" value={collaboration.request.requested_services.join(", ")} />
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Section Mission */}
      {collaboration.mission ? (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h3>
              <Building2 size={18} /> Mission associée
            </h3>
          </div>
          <div className={styles.subGrid}>
            <InfoBlock icon={<Building2 size={16} />} label="Titre" value={collaboration.mission.title} />
            <InfoBlock icon={<ShieldCheck size={16} />} label="Statut" value={collaboration.mission.status || "Non spécifié"} />
          </div>
          <div className={styles.sectionActions}>
            <Link href={`/dashboard/owner/missions/${collaboration.mission.id}`} className={styles.actionLink}>
              Voir la mission <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      ) : null}

      {/* Section Logement */}
      <section className={styles.sectionPanel}>
        <div className={styles.sectionHeader}>
          <h3>
            <Home size={18} /> Logement concerné
          </h3>
        </div>
        <div className={styles.subGrid}>
          <InfoBlock icon={<Home size={16} />} label="Nom" value={collaboration.housing.name} />
          <InfoBlock icon={<User size={16} />} label="ID Logement" value={String(collaboration.housing.id)} />
        </div>
        <div className={styles.sectionActions}>
          <Link href={`/dashboard/owner/logements/${collaboration.housing.id}`} className={styles.actionLink}>
            Voir le logement <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Section Propriétaire */}
      <section className={styles.sectionPanel}>
        <div className={styles.sectionHeader}>
          <h3>
            <User size={18} /> Propriétaire
          </h3>
        </div>
        <div className={styles.subGrid}>
          <InfoBlock icon={<User size={16} />} label="Nom" value={collaboration.owner.name} />
          <InfoBlock icon={<ShieldCheck size={16} />} label="ID" value={collaboration.owner.id} />
        </div>
      </section>

      {/* Section Résiliation de la collaboration */}
      <section className={styles.sectionPanel}>
        <div className={styles.sectionHeader}>
          <h3>
            <AlertTriangle size={18} /> Résiliation de la collaboration
          </h3>
        </div>
        <div className={styles.subGrid}>
          <InfoBlock icon={<Clock size={16} />} label="Statut de résiliation" value={getTerminationStatus()} />
          {getTerminationEndDate() ? (
            <InfoBlock icon={<CalendarClock size={16} />} label="Date de fin prévue" value={formatDate(getTerminationEndDate()!)} />
          ) : null}
          {getNoticeDays() !== null ? (
            <InfoBlock icon={<Calendar size={16} />} label="Préavis" value={`${getNoticeDays()} jours (${getNoticeSource()})`} />
          ) : null}
        </div>
        {terminationError ? <p role="alert">{terminationError}</p> : null}
        
        {canRequestTermination() && (
          <div className={styles.terminationActions}>
            <button 
              className={styles.terminationButton}
              onClick={() => setShowTerminationModal(true)}
              disabled={isSubmitting}
            >
              <AlertTriangle size={16} /> Demander la résiliation
            </button>
          </div>
        )}
        
        {termination && termination.interventions_requiring_arbitration.length > 0 && (
          <div className={styles.warningBox}>
            <AlertTriangle size={18} />
            <p>
              <strong>Attention :</strong> {termination.interventions_requiring_arbitration.length} intervention(s) 
              nécessitent un arbitrage après la date de résiliation.
            </p>
          </div>
        )}
      </section>

      {/* Actions en bas */}
      <div className={styles.bottomActions}>
        <ButtonLink href="/dashboard/owner/conciergerie/partenaires" variant="secondary">
          <ArrowLeft size={16} /> Retour à la liste
        </ButtonLink>
      </div>

      {/* Modal de confirmation de résiliation */}
      {showTerminationModal && (
        <TerminationModal
          onClose={handleCloseTerminationModal}
          onConfirm={handleRequestTermination}
          isSubmitting={isSubmitting}
          error={submitError}
          success={submitSuccess}
          endDate={getTerminationEndDate()}
          noticeDays={getNoticeDays()}
        />
      )}
    </div>
  );
}

/**
 * Composant Modal de confirmation de résiliation
 */
function TerminationModal({
  onClose,
  onConfirm,
  isSubmitting,
  error,
  success,
  endDate,
  noticeDays,
}: {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  endDate: string | null;
  noticeDays: number | null;
}) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} disabled={isSubmitting}>
          <XCircle size={20} />
        </button>
        
        <header className={styles.modalHeader}>
          <AlertTriangle size={28} className={styles.modalIcon} />
          <h2>Confirmer la demande de résiliation</h2>
        </header>

        <div className={styles.modalBody}>
          {success ? (
            <div className={styles.successMessage}>
              <CheckCircle2 size={24} />
              <p>Votre demande de résiliation a été enregistrée avec succès.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className={styles.modalText}>
                Vous êtes sur le point de demander la résiliation de cette collaboration.
                Cette action est <strong>irréversible</strong> et entraînera la fin de la collaboration
                après le préavis requis.
              </p>

              {endDate && (
                <div className={styles.modalInfo}>
                  <p>
                    <strong>Date de fin prévue :</strong> {formatDate(endDate)}
                  </p>
                </div>
              )}

              {noticeDays !== null && (
                <div className={styles.modalInfo}>
                  <p>
                    <strong>Préavis :</strong> {noticeDays} jours
                  </p>
                </div>
              )}

              <div className={styles.modalWarning}>
                <AlertTriangle size={18} />
                <p>
                  Le préavis standard est de 30 jours, sauf conditions particulières acceptées par les deux parties.
                  Le serveur déterminera le préavis applicable et la date de fin lors de la confirmation.
                  Les interventions dépassant cette échéance nécessiteront un arbitrage.
                  Après la date de fin, aucune nouvelle intervention ne pourra être créée.
                </p>
              </div>

              {error && (
                <div className={styles.modalError}>
                  <XCircle size={18} />
                  <p>{error}</p>
                </div>
              )}

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.modalButtonSecondary}
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className={styles.modalButtonPrimary}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} /> Confirmer...
                    </>
                  ) : (
                    "Confirmer la résiliation"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Bloc d'information réutilisable
 */
function InfoBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={styles.infoBlock}>
      <span className={styles.infoIcon}>{icon}</span>
      <div>
        <span className={styles.infoLabel}>{label}</span>
        <strong className={styles.infoValue}>{value}</strong>
      </div>
    </div>
  );
}
