"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileSignature, FileText, Home, MessageSquareText, ReceiptText } from "lucide-react";
import { buildOwnerCrmRecords, type OwnerCrmRecord } from "@/app/lib/ownerCrm";
import { formatEuroAmountLabel } from "@/app/utils/formatters";
import { takeFirst } from "../../shared/collections.ts";
import ConciergeWorkspacePage from "../_components/ConciergeWorkspacePage";
import {
  formatContactDate,
  isOlderThanDays,
  normalizeContactStatus,
  toConversationItem,
} from "./contactsHelpers";
import crmStyles from "./OwnerCrm.module.scss";

type ContactConversation = {
  id: string;
  counterpart_name: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  subject: string | null;
  status: string | null;
  unread_count?: number;
  counterpart_profile_id?: string | null;
  owner_profile_id?: string | null;
  source?: string | null;
  created_at?: string | null;
};

type OwnerDirectoryProfile = {
  id?: string | null;
  profileId?: string | null;
  fullName?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  company_name?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
};

function getRelationshipLabel(status: OwnerCrmRecord["relationshipStatus"]) {
  switch (status) {
    case "actif":
      return "Actif";
    case "a_relancer":
      return "A relancer";
    case "dormant":
      return "Dormant";
    case "nouveau":
    default:
      return "Nouveau";
  }
}

function OwnerCrmPanel({ records, loading, error }: { records: OwnerCrmRecord[]; loading: boolean; error: string | null }) {
  const primaryOwner = records[0] ?? null;
  const averageScore = records.length > 0 ? Math.round(records.reduce((sum, owner) => sum + owner.healthScore, 0) / records.length) : 0;
  const totals = records.reduce(
    (acc, owner) => ({
      logements: acc.logements + owner.stats.logements,
      revenus: acc.revenus + owner.stats.revenus,
      commissions: acc.commissions + owner.stats.commissions,
      contrats: acc.contrats + owner.stats.contrats,
      devis: acc.devis + owner.stats.devis,
      documents: acc.documents + owner.stats.documents,
      incidents: acc.incidents + owner.stats.incidents,
      conversations: acc.conversations + owner.stats.conversations,
    }),
    { logements: 0, revenus: 0, commissions: 0, contrats: 0, devis: 0, documents: 0, incidents: 0, conversations: 0 },
  );

  return (
    <section className={crmStyles.crmPanel} aria-labelledby="owner-crm-title">
      <div className={crmStyles.crmHeader}>
        <div>
          <p className={crmStyles.eyebrow}>CRM proprietaires</p>
          <h2 id="owner-crm-title">Fiches proprietaires enrichies</h2>
          <p>
            Historique, logements, revenus, commissions, statistiques, contrats, devis, documents, incidents,
            preferences, conversations et timeline complete sont consolides dans une lecture CRM unique.
          </p>
        </div>
        <div className={crmStyles.crmScore} aria-label="Score moyen CRM proprietaires">
          <strong>{loading ? "..." : `${averageScore}%`}</strong>
          <span>score CRM</span>
          <progress value={averageScore} max={100} />
        </div>
      </div>

      {error ? <p className={crmStyles.empty}>{error}</p> : null}

      <div className={crmStyles.ownerGrid}>
        {records.length > 0 ? records.slice(0, 6).map((owner) => (
          <article className={crmStyles.ownerCard} key={owner.id}>
            <div className={crmStyles.ownerTop}>
              <div>
                <p className={crmStyles.eyebrow}>{owner.city}</p>
                <h3>{owner.name}</h3>
              </div>
              <span className={crmStyles.ownerBadge}>{getRelationshipLabel(owner.relationshipStatus)}</span>
            </div>
            <div className={crmStyles.ownerHealth}>
              <span>Qualite fiche {owner.healthScore}%</span>
              <progress value={owner.healthScore} max={100} />
            </div>
            <div className={crmStyles.ownerStats}>
              <div><span>Logements</span><strong>{owner.stats.logements}</strong></div>
              <div><span>Revenus</span><strong>{formatEuroAmountLabel(owner.stats.revenus, "0 EUR")}</strong></div>
              <div><span>Commissions</span><strong>{formatEuroAmountLabel(owner.stats.commissions, "0 EUR")}</strong></div>
              <div><span>Conversations</span><strong>{owner.stats.conversations}</strong></div>
            </div>
            <div className={crmStyles.ownerLinks}>
              <Link href={`/dashboard/concierge/messages${owner.conversations[0]?.id ? `?conversation=${owner.conversations[0].id}` : ""}`}>
                Messages
              </Link>
              <Link href="/dashboard/concierge/logements">Logements</Link>
            </div>
          </article>
        )) : (
          <article className={crmStyles.ownerCard}>
            <h3>{loading ? "Chargement du CRM" : "Aucune fiche proprietaire"}</h3>
            <p className={crmStyles.empty}>
              {loading ? "Consolidation des proprietaires en cours." : "Les fiches CRM apparaitront apres une conversation ou une creation de proprietaire."}
            </p>
          </article>
        )}
      </div>

      <div className={crmStyles.moduleGrid}>
        <article className={crmStyles.moduleCard}>
          <div className={crmStyles.moduleHeader}><Home size={18} aria-hidden="true" /><h3>Logements et contrats</h3></div>
          <div className={crmStyles.moduleStats}>
            <div><span>Logements</span><strong>{totals.logements}</strong></div>
            <div><span>Contrats</span><strong>{totals.contrats}</strong></div>
          </div>
          <p>Rattachement des biens, contrats actifs et pieces contractuelles par proprietaire.</p>
        </article>

        <article className={crmStyles.moduleCard}>
          <div className={crmStyles.moduleHeader}><ReceiptText size={18} aria-hidden="true" /><h3>Revenus et commissions</h3></div>
          <div className={crmStyles.moduleStats}>
            <div><span>Revenus</span><strong>{formatEuroAmountLabel(totals.revenus, "0 EUR")}</strong></div>
            <div><span>Commissions</span><strong>{formatEuroAmountLabel(totals.commissions, "0 EUR")}</strong></div>
          </div>
          <p>Vue financiere du portefeuille proprietaires et potentiel de marge par relation.</p>
        </article>

        <article className={crmStyles.moduleCard}>
          <div className={crmStyles.moduleHeader}><FileSignature size={18} aria-hidden="true" /><h3>Devis et documents</h3></div>
          <div className={crmStyles.moduleStats}>
            <div><span>Devis</span><strong>{totals.devis}</strong></div>
            <div><span>Documents</span><strong>{totals.documents}</strong></div>
          </div>
          <p>Centralisation des devis, justificatifs, contrats signes et documents administratifs.</p>
        </article>

        <article className={crmStyles.moduleCard}>
          <div className={crmStyles.moduleHeader}><AlertTriangle size={18} aria-hidden="true" /><h3>Incidents et preferences</h3></div>
          <div className={crmStyles.moduleStats}>
            <div><span>Incidents</span><strong>{totals.incidents}</strong></div>
            <div><span>Preferences</span><strong>{primaryOwner?.preferences.length ?? 0}</strong></div>
          </div>
          <p>Memo relationnel pour suivre les irritants, habitudes, contraintes et attentes recurrentes.</p>
        </article>

        <article className={crmStyles.moduleCard}>
          <div className={crmStyles.moduleHeader}><MessageSquareText size={18} aria-hidden="true" /><h3>Conversations</h3></div>
          <div className={crmStyles.moduleStats}>
            <div><span>Fils</span><strong>{totals.conversations}</strong></div>
            <div><span>Proprietaires</span><strong>{records.length}</strong></div>
          </div>
          <p>Suivi commercial et operationnel depuis la messagerie concierge.</p>
        </article>

        <article className={crmStyles.timelineCard}>
          <div className={crmStyles.moduleHeader}><FileText size={18} aria-hidden="true" /><h3>Timeline complete</h3></div>
          <div className={crmStyles.timeline}>
            {primaryOwner?.timeline.length ? primaryOwner.timeline.slice(0, 5).map((event) => (
              <div className={crmStyles.timelineItem} key={event.id}>
                <strong>{event.label}</strong>
                <span>{event.kind} - {formatContactDate(event.date)}</span>
              </div>
            )) : <p className={crmStyles.empty}>Aucun evenement CRM consolide pour le moment.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
export default function ConciergeContactsPage() {
  const [items, setItems] = useState<ContactConversation[]>([]);
  const [ownerProfiles, setOwnerProfiles] = useState<OwnerDirectoryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        setLoading(true);
        setError(null);
        const [contactsResponse, ownersResponse] = await Promise.all([
          fetch("/api/messages/conversations?role=concierge&limit=60", { cache: "no-store" }),
          fetch("/api/profiles/housing/owners?limit=25", { cache: "no-store" }),
        ]);
        const contactsPayload = await contactsResponse.json();
        const ownersPayload = await ownersResponse.json();

        if (!contactsResponse.ok) {
          throw new Error(contactsPayload?.error || "Impossible de charger vos contacts.");
        }

        setItems(Array.isArray(contactsPayload?.items) ? contactsPayload.items : []);
        setOwnerProfiles(Array.isArray(ownersPayload) ? ownersPayload : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos contacts.");
      } finally {
        setLoading(false);
      }
    }

    void loadContacts();
  }, []);

  const activeConversations = useMemo(
    () => items.filter((item) => item.status !== "closed"),
    [items],
  );
  const recentContacts = useMemo(() => takeFirst(activeConversations, 4), [activeConversations]);
  const dormantConversations = useMemo(
    () => takeFirst(activeConversations.filter((item) => isOlderThanDays(item.last_message_at, 5)), 6),
    [activeConversations],
  );
  const freshOpportunities = useMemo(
    () => takeFirst(activeConversations.filter((item) => !isOlderThanDays(item.last_message_at, 2)), 6),
    [activeConversations],
  );
  const closedConversations = useMemo(
    () => items.filter((item) => item.status === "closed").length,
    [items],
  );
  const crmRecords = useMemo(
    () => buildOwnerCrmRecords({ conversations: items, profiles: ownerProfiles }),
    [items, ownerProfiles],
  );
  const crmOwnersToFollow = useMemo(
    () => crmRecords.filter((owner) => owner.relationshipStatus === "a_relancer" || owner.relationshipStatus === "dormant"),
    [crmRecords],
  );

  return (
    <ConciergeWorkspacePage
      eyebrow="Relation propriétaires"
      title="Contacts et relation"
      description={
        loading
          ? "Chargement de vos propriétaires et opportunités en cours..."
          : error ||
            "Pilotez vos échanges commerciaux, vos relances et les conversations les plus chaudes sans perdre le fil."
      }
      chips={[
        `${crmRecords.length} fiche(s) CRM`,
        `${activeConversations.length} conversation(s) active(s)`,
        `${crmOwnersToFollow.length} proprietaire(s) a relancer`,
      ]}
      actions={[
        { label: "Ouvrir la messagerie", href: "/dashboard/concierge/messages" },
        { label: "Trouver de nouveaux propriétaires", href: "/dashboard/concierge/recherche" },
      ]}
      metrics={[
        {
          label: "Contacts suivis",
          value: loading ? "..." : String(crmRecords.length),
          hint: "Fiches proprietaires consolidees",
        },
        {
          label: "Conversations chaudes",
          value: loading ? "..." : String(freshOpportunities.length),
          hint: "À traiter rapidement",
        },
        {
          label: "Relances à faire",
          value: loading ? "..." : String(dormantConversations.length),
          hint: "Plus de 5 jours sans réponse",
        },
        {
          label: "Clôturées",
          value: loading ? "..." : String(closedConversations),
          hint: "Fils déjà terminés",
        },
      ]}
      cards={
        recentContacts.length > 0
          ? recentContacts.map((conversation) => ({
              title: conversation.counterpart_name || "Propriétaire",
              text: `${conversation.subject || "Conversation directe"} - ${
                conversation.last_message_preview || "Aucun aperçu"
              } (${formatContactDate(conversation.last_message_at)})`,
              actions: [
                {
                  label: "Voir la conversation",
                  href: `/dashboard/concierge/messages?conversation=${conversation.id}`,
                  variant: "primary" as const,
                },
              ],
            }))
          : [
              {
                title: "Aucun contact pour le moment",
                text: loading
                  ? "Synchronisation des contacts en cours."
                  : error ||
                    "Lancez une prise de contact depuis la recherche propriétaires pour alimenter cette vue.",
                actions: [
                  {
                    label: "Explorer les annonces",
                    href: "/dashboard/concierge/recherche",
                    variant: "primary" as const,
                  },
                ],
              },
            ]
      }
      detailSections={[
        {
          title: "Suivi actif",
          description:
            "Toutes les conversations ouvertes qui méritent une prochaine étape commerciale ou opérationnelle.",
          emptyText:
            loading
              ? "Chargement des conversations en cours."
              : error || "Aucun contact actif à suivre pour le moment.",
          items: takeFirst(activeConversations, 8).map((conversation) =>
            toConversationItem(
              conversation,
              normalizeContactStatus(conversation.status),
              "Reprendre l'échange",
            ),
          ),
        },
        {
          title: "Relances commerciales",
          description:
            "Conversations qui refroidissent et qui demandent une reprise de contact proactive.",
          emptyText:
            loading
              ? "Analyse des relances commerciales."
              : error || "Aucune relance prioritaire détectée.",
          items: dormantConversations.map((conversation) =>
            toConversationItem(
              conversation,
              `Dernier message ${formatContactDate(conversation.last_message_at)}`,
              "Relancer maintenant",
              "warning",
            ),
          ),
        },
        {
          title: "Opportunités récentes",
          description:
            "Conversations encore chaudes à traiter rapidement pour maximiser la conversion.",
          emptyText:
            loading
              ? "Chargement des conversations récentes."
              : error || "Aucune opportunité récente à traiter.",
          items: freshOpportunities.map((conversation) =>
            toConversationItem(
              conversation,
              `Actif au ${formatContactDate(conversation.last_message_at)}`,
              "Continuer l'échange",
              "success",
            ),
          ),
        },
      ]}
    >
      <OwnerCrmPanel records={crmRecords} loading={loading} error={error} />
    </ConciergeWorkspacePage>
  );
}