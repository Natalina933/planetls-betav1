import Link from "next/link";
import {
    ArrowRight,
    Bell,
    BarChart3,
    CalendarCheck,
    CheckCircle2,
    Clock3,
    FileText,
    ListTodo,
    MessageSquareText,
    Navigation,
    Plus,
    Route,
    TriangleAlert,
    UserRound,
} from "lucide-react";
import type { DashboardEvent } from "@/app/components/dashboard/calendar/DashboardCalendar";
import { Badge, Card } from "@/components/ui";
import ConciergeRoutePreview from "./ConciergeRoutePreview";
import styles from "./ConciergeReferenceDashboard.module.scss";

type ConciergeReferenceDashboardProps = {
    events: readonly DashboardEvent[];
    missionCount: number;
    todayCompletedCount: number;
    todayStayCount: number;
    nextPlannedAt: Date | null;
    toPlanCount: number;
    toConfirmCount: number;
    weekCompletedCount: number;
    weekUpcomingCount: number;
    pendingValidationCount: number;
    unreadConversationCount: number;
    urgentCount: number;
    housingActionsCount: number;
    priorityTitle: string;
    priorityDetail: string;
    priorityHref: string;
    activityItems: readonly { id: string; title: string; detail: string; meta: string; href?: string }[];
};

function eventLabel(event: DashboardEvent) {
    return event.type === "reminder" ? "Intervention urgente" : "Mission";
}

function formatTime(value: Date) {
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(value);
}

function formatNextDate(value: Date) {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value);
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
    return `${count} ${count > 1 ? plural : singular}`;
}

export default function ConciergeReferenceDashboard({
    events,
    missionCount,
    todayCompletedCount,
    todayStayCount,
    nextPlannedAt,
    toPlanCount,
    toConfirmCount,
    weekCompletedCount,
    weekUpcomingCount,
    pendingValidationCount,
    unreadConversationCount,
    urgentCount,
    housingActionsCount,
    priorityTitle,
    priorityDetail,
    priorityHref,
    activityItems,
}: ConciergeReferenceDashboardProps) {
    const visibleEvents = events.slice(0, 5);
    const nextEvent = visibleEvents[0];
    const organizationCount = toPlanCount + toConfirmCount;
    const weekActivityCount = weekCompletedCount + weekUpcomingCount;
    const todayCompletion = missionCount > 0 ? Math.min(100, Math.round((todayCompletedCount / missionCount) * 100)) : 0;
    const kpiCards = [
        {
            label: "À faire aujourd'hui",
            value: String(missionCount),
            hint: missionCount > 0 ? `${pluralize(todayStayCount, "séjour")} · ${pluralize(missionCount, "intervention")}` : "Journée libre",
            support:
                missionCount > 0
                    ? `${todayCompletion} % de la journée`
                    : nextPlannedAt
                        ? `Prochaine intervention : ${formatNextDate(nextPlannedAt)}`
                        : null,
            progress: missionCount > 0 ? todayCompletion : null,
            Icon: CalendarCheck,
            tone: "gold",
            href: "/dashboard/concierge/planning",
        },
        {
            label: organizationCount > 0 ? "À organiser" : "Tout est organisé",
            value: organizationCount > 0 ? String(organizationCount) : "âœ“",
            hint: organizationCount > 0 ? "Actions en attente" : "Aucune action en attente",
            support:
                organizationCount > 0
                    ? `${toPlanCount} à planifier · ${toConfirmCount} à confirmer`
                    : null,
            split: organizationCount > 0 ? [
                { value: toPlanCount, label: "à planifier" },
                { value: toConfirmCount, label: "à confirmer" },
            ] : null,
            Icon: organizationCount > 0 ? ListTodo : CheckCircle2,
            tone: organizationCount > 0 ? "warning" : "success",
            href: "/dashboard/concierge/planning",
        },
        {
            label: "Tournée du jour",
            value: "—",
            hint: missionCount > 0 ? `${pluralize(missionCount, "étape")} planifiée${missionCount > 1 ? "s" : ""}` : "Aucune tournée aujourd'hui",
            support:
                missionCount > 0
                    ? "Distances à calculer dans le planning"
                    : nextPlannedAt
                        ? `Prochaine tournée : ${formatNextDate(nextPlannedAt)}`
                        : null,
            Icon: Route,
            tone: "gold",
            href: "/dashboard/concierge/planning",
        },
        {
            label: "Activité semaine",
            value: String(weekActivityCount),
            hint: weekActivityCount > 0 ? "Semaine courante" : "Aucune intervention cette semaine",
            support:
                weekActivityCount > 0
                    ? `${weekCompletedCount} terminée${weekCompletedCount > 1 ? "s" : ""} · ${weekUpcomingCount} à venir`
                    : "Votre activité apparaîtra ici dès vos prochaines interventions.",
            Icon: BarChart3,
            tone: "success",
            href: "/dashboard/concierge/planning",
        },
    ];

    return (
        <div className={styles.referenceDashboard}>
            <section className={styles.kpiGrid} aria-label="Indicateurs prioritaires du dashboard concierge">
                {kpiCards.map(({ label, value, hint, support, progress, split, Icon, tone, href }) => (
                    <Card key={label} className={styles.metric} data-tone={tone}>
                        <div className={styles.metricTop}>
                            <span className={styles.metricIconWrap} aria-hidden="true">
                                <Icon className={styles.metricIcon} size={23} strokeWidth={1.8} />
                            </span>
                            <Link href={href} className={styles.metricLink} aria-label={`${label} - ouvrir le planning`}>
                                <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                        </div>
                        <div className={styles.metricBody}>
                            <strong>{value}</strong>
                            <span>{label}</span>
                            <small>{hint}</small>
                        </div>
                        {typeof progress === "number" ? (
                            <div className={styles.metricProgress} aria-label={support ?? undefined}>
                                <span><i style={{ width: `${progress}%` }} /></span>
                                <small>{support}</small>
                            </div>
                        ) : split ? (
                            <div className={styles.metricSplit}>
                                {split.map((item) => (
                                    <span key={item.label}>
                                        <strong>{item.value}</strong>
                                        <small>{item.label}</small>
                                    </span>
                                ))}
                            </div>
                        ) : support ? (
                            <div className={styles.metricSupport}>{support}</div>
                        ) : null}
                    </Card>
                ))}
            </section>

            <section className={styles.mainGrid} aria-label="Pilotage de la journée">
                <div className={styles.leftColumn}>
                    <article className={`${styles.card} ${styles.nextMission}`}>
                        <header className={styles.cardHeader}>
                            <div><span className={styles.eyebrow}>À faire maintenant</span><h2>Prochaine mission</h2></div>
                            <Badge variant={nextEvent?.type === "reminder" ? "warning" : "info"}>{nextEvent ? "En route" : "À planifier"}</Badge>
                        </header>
                        {nextEvent ? (
                            <div className={styles.nextContent}>
                                <div className={styles.nextImage} aria-hidden="true"><CalendarCheck size={34} /></div>
                                <div className={styles.nextDetails}>
                                    <time className={styles.missionTime} dateTime={nextEvent.start.toISOString()}>{formatTime(nextEvent.start)}</time>
                                    <h3>{String(nextEvent.title || "Mission sans titre")}</h3>
                                    <p className={styles.missionType}>{eventLabel(nextEvent)}</p>
                                    <div className={styles.detailList}>
                                        <span><Clock3 size={15} aria-hidden="true" /> Créneau planifié</span>
                                        <span><Navigation size={15} aria-hidden="true" /> Itinéraire à ouvrir</span>
                                    </div>
                                    <div className={styles.actionRow}>
                                        <Link href={priorityHref} className={styles.primaryButton}>Ouvrir la mission <ArrowRight size={15} aria-hidden="true" /></Link>
                                        <Link href="/dashboard/concierge/planning" className={styles.secondaryButton}>Voir l&apos;itinéraire <Navigation size={15} aria-hidden="true" /></Link>
                                    </div>
                                </div>
                            </div>
                        ) : <p className={styles.empty}>Aucune mission planifiée aujourd&apos;hui.</p>}
                    </article>

                    <article className={`${styles.card} ${styles.stepsCard}`}>
                        <header className={styles.cardHeader}><div><span className={styles.eyebrow}>Ordre de la journée</span><h2>Étapes de la tournée</h2></div><Link href="/dashboard/concierge/planning" className={styles.cardLink}>Voir le planning <ArrowRight size={14} /></Link></header>
                        {visibleEvents.length > 0 ? <ol className={styles.steps}>
                            {visibleEvents.map((event, index) => (
                                <li
                                    key={`${event.bookingId ?? event.title}-${index}`}
                                    className={index === 0 ? styles.stepCurrent : styles.stepUpcoming}
                                    aria-current={index === 0 ? "step" : undefined}
                                >
                                    <span className={styles.stepNumber}>{index + 1}</span>
                                    <time className={styles.stepTime} dateTime={event.start.toISOString()}>{formatTime(event.start)}</time>
                                    <span className={styles.stepContent}>
                                        <small>{eventLabel(event)}</small>
                                        <strong>{String(event.title || "Mission sans titre")}</strong>
                                    </span>
                                    <Badge variant={event.type === "reminder" ? "warning" : index === 0 ? "info" : "neutral"}>
                                        {event.type === "reminder" ? "Urgente" : index === 0 ? "En route" : "À venir"}
                                    </Badge>
                                </li>
                            ))}
                        </ol> : (
                            <p className={styles.stepsEmpty}>
                                <strong>Aucune étape planifiée aujourd&apos;hui.</strong>
                                <span>Les missions apparaîtront ici dans l&apos;ordre de votre tournée.</span>
                            </p>
                        )}
                    </article>
                </div>

                <div className={styles.centerColumn}>
                    <ConciergeRoutePreview events={events} compact />
                    <article className={`${styles.card} ${styles.tableCard}`}>
                        <header className={styles.cardHeader}><div><span className={styles.eyebrow}>Vue condensée</span><h2>Mes missions du jour</h2></div><Link href="/dashboard/concierge/missions" className={styles.cardLink}>Voir toutes les missions <ArrowRight size={14} /></Link></header>
                        <div className={styles.tableWrap}><table><thead><tr><th>Heure</th><th>Logement</th><th>Type</th><th>Statut</th></tr></thead><tbody>{visibleEvents.map((event, index) => <tr key={`table-${event.bookingId ?? event.title}-${index}`}><td>{formatTime(event.start)}</td><td>{String(event.title || "Mission sans titre")}</td><td>{eventLabel(event)}</td><td><Badge variant={event.type === "reminder" ? "warning" : index === 0 ? "info" : "neutral"}>{index === 0 ? "En route" : event.type === "reminder" ? "Urgente" : "À venir"}</Badge></td></tr>)}</tbody></table></div>
                    </article>
                </div>

                <aside className={styles.rightColumn}>
                    <article className={`${styles.card} ${styles.alert}`}><h2><Clock3 size={20} aria-hidden="true" /> Retard estimé</h2><strong>Estimation non disponible</strong><p>{pendingValidationCount > 0 ? `${pendingValidationCount} mission(s) nécessitent une validation.` : `${urgentCount} point(s) urgent(s) à surveiller. Le retard nécessite les temps de trajet réels.`}</p><Link href="/dashboard/concierge/alertes" className={styles.alertButton}>Ouvrir les alertes</Link></article>
                    <article className={`${styles.card} ${styles.quickCard}`}><header className={styles.cardHeader}><h2><Plus size={19} aria-hidden="true" /> Raccourcis rapides</h2></header><div className={styles.quickGrid}><Link href="/dashboard/concierge/interventions/new"><Plus size={18} />Ajouter une intervention</Link><Link href="/dashboard/concierge/messages"><MessageSquareText size={18} />Contacter un voyageur</Link><Link href="/dashboard/concierge/alertes"><Bell size={18} />Signaler un problème</Link><Link href="/dashboard/concierge/profile?tab=documents"><FileText size={18} />Voir mes documents</Link></div></article>
                    <article className={`${styles.card} ${styles.messages}`}><header className={styles.cardHeader}><h2><MessageSquareText size={19} aria-hidden="true" /> Messages récents</h2><Link href="/dashboard/concierge/messages" className={styles.cardLink}>Voir tous</Link></header>{activityItems.slice(0, 4).map((item) => <Link key={item.id} href={item.href || "/dashboard/concierge/messages"} className={styles.message}><span className={styles.avatar}><UserRound size={15} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{item.meta}</time></Link>)}{activityItems.length === 0 ? <p className={styles.empty}>Aucun message récent.</p> : null}</article>
                </aside>
            </section>

            <article className={`${styles.card} ${styles.priorityBar}`}><span><TriangleAlert size={17} /> {priorityTitle}</span><p>{priorityDetail}</p><Link href={priorityHref}>Ouvrir le point prioritaire <ArrowRight size={14} /></Link></article>
            <p className={styles.footerNote}>{unreadConversationCount} message(s) non lu(s) · {housingActionsCount} logement(s) à suivre · PlanetLS Conciergerie</p>
        </div>
    );
}
