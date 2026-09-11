import { MessageCircle, Mail, MessagesSquare, CheckCircle, CalendarDays, ArrowRight, House } from "lucide-react";
import { Button, ButtonLink, Card, Badge } from "@/components/ui";
import type { ConversationDetailPayload, OwnerConversationRow } from "./page";
import styles from "./OwnerMessagesPage.module.scss";

export function MessagesHeader({ conversations, loading, onUnread }: {
  conversations: OwnerConversationRow[];
  loading: boolean;
  onUnread: () => void;
}) {
  const unread = conversations.filter(item => (item.unread_count ?? 0) > 0).length;
  const metrics = [
    { label: "Conversations", value: conversations.length, icon: MessagesSquare, hint: "Échanges chargés" },
    { label: "Avec les conciergeries", value: conversations.length, icon: MessageCircle, hint: "Votre réseau de contacts" },
    { label: "Non lues", value: unread, icon: Mail, hint: "Conversations avec du nouveau" },
    { label: "Ouvertes", value: conversations.filter(item => (item.status ?? "open") === "open").length, icon: CheckCircle, hint: "Statut des échanges" },
  ];
  return <>
    <header className={styles.hero}>
      <nav aria-label="Fil d’Ariane"><span>Propriétaire</span><span aria-hidden="true">›</span><span>Messagerie et arbitrages</span></nav>
      <p className={styles.eyebrow}>Messagerie et arbitrages</p>
      <h1>Suivi des échanges</h1>
      <p>Centralisez vos conversations avec vos conciergeries et gardez une trace claire des décisions prises.</p>
      <blockquote>« Des séjours sereins, des logements qui performent. »</blockquote>
    </header>
    <section className={styles.metrics} aria-label="Indicateurs de messagerie">
      {metrics.map(({ label, value, hint, icon: Icon }) => <Card key={label} className={styles.metric}>
        <Icon size={22} aria-hidden="true" /><div><strong>{loading ? "—" : value}</strong><h2>{label}</h2><p>{hint}</p></div>
      </Card>)}
    </section>
    <Card className={styles.quickActions}>
      <div><p className={styles.eyebrow}>Actions rapides</p><h2>Faire maintenant</h2></div>
      <Button className={styles.quickAction} variant="secondary" onClick={onUnread} disabled={loading}><MessageCircle aria-hidden="true" /><span><small>Étape 1</small>Traiter les nouveaux messages</span><Badge variant="warning">{loading ? "—" : unread} non lus</Badge><ArrowRight size={18} aria-hidden="true" /></Button>
      <ButtonLink className={styles.quickAction} href="/dashboard/owner/planning" variant="secondary"><CalendarDays aria-hidden="true" /><span><small>Étape 2</small>Vérifier le planning</span><ArrowRight size={18} aria-hidden="true" /></ButtonLink>
    </Card>
  </>;
}

export function MessagesContext({ detail, row, loading }: {
  detail: ConversationDetailPayload | null;
  row?: OwnerConversationRow;
  loading: boolean;
}) {
  return <aside className={styles.details} aria-label="Contexte de la conversation">
    <h2>Détails</h2>
    {loading ? <p>Chargement du contexte…</p> : !detail ? <p>Sélectionnez un échange pour retrouver son contexte.</p> : <>
      <section><h3>Participants</h3>
        {detail.participants.map(person => <p key={person.id}>
          {`${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || person.company_name || person.username || "Utilisateur"}
          {person.id === detail.current_user_id ? " (vous)" : ""}
          {person.company_name ? <small>{person.company_name}</small> : null}
        </p>)}
        {detail.participants.length === 0 ? <p>{row?.counterpart_name || "Identité non renseignée"}</p> : null}
      </section>
      <section><h3>Échange</h3><p>{detail.conversation.subject || "Conversation directe"}</p>
        <Badge variant={detail.conversation.status === "closed" ? "neutral" : "success"}>
          {detail.conversation.status === "closed" ? "Fermé" : detail.conversation.status === "open" ? "Ouvert" : detail.conversation.status}
        </Badge>
        {row?.source_reference ? <p className={styles.reference}>Référence : {row.source_reference}</p> : null}
      </section>
      <section><h3>Retrouver le contexte</h3>
        <p>Consultez les informations utiles avant de répondre.</p>
        <ButtonLink href="/dashboard/owner/missions/voyageurs" variant="ghost" size="sm">Séjours voyageurs</ButtonLink>
        <ButtonLink href="/dashboard/owner/logements" variant="ghost" size="sm">Mes logements</ButtonLink>
        <ButtonLink href="/dashboard/owner/documents" variant="ghost" size="sm">Mes documents</ButtonLink>
      </section>
    </>}
  </aside>;
}

export function MessagesFooter({ conversations, onSelect }: { conversations: OwnerConversationRow[]; onSelect: (id: string) => void }) {
  const unread = conversations.filter(item => (item.unread_count ?? 0) > 0);
  return <>
    <section className={styles.bottomGrid} aria-label="Pour vos prochains échanges">
      <Card className={styles.summaryCard}><h2>Conversations non lues</h2><p>{unread.length} échange(s) avec de nouveaux messages</p>
        <div className={styles.unreadList}>{unread.slice(0,3).map(item => <Button variant="ghost" size="sm" key={item.id} onClick={() => onSelect(item.id)}><span className={styles.avatar} aria-hidden="true">{(item.counterpart_name || "C").slice(0,1)}</span>{item.counterpart_name || "Concierge"}<ArrowRight size={14} aria-hidden="true" /></Button>)}</div>
        {!unread.length ? <p>Aucun échange non lu dans cette liste.</p> : null}
        <ButtonLink href="#owner-conversations" variant="secondary">Voir toutes les conversations</ButtonLink>
      </Card>
      <Card className={styles.summaryCard}><h2>Demandes et décisions</h2><p>Retrouvez vos demandes et leur suivi dans votre espace dédié.</p><ButtonLink href="/dashboard/owner/demandes" variant="secondary">Voir mes demandes</ButtonLink></Card>
      <Card className={styles.summaryCard}><h2>Conseils</h2><ul><li><strong>Répondez rapidement</strong><p>Une réponse claire facilite l’organisation du séjour.</p></li><li><strong>Centralisez les échanges</strong><p>Gardez les décisions partagées dans votre conversation PlanetLS.</p></li><li><strong>Anticipez les arrivées</strong><p>Vérifiez les instructions avec votre conciergerie avant le séjour.</p></li></ul></Card>
    </section>
    <footer className={styles.footer}><div><House aria-hidden="true" /><span><strong>PlanetLS</strong><small>Mon espace propriétaire</small></span></div><p>« Des séjours sereins,<br />des logements qui performent. »</p></footer>
  </>;
}
