"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { toHousingPhotoUrl } from "@/app/lib/housingPhotoUrl";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, FileText, House, MessageCircle, Plus, Search, Sparkles, Wrench } from "lucide-react";
import type { useOwnerDashboardData } from "@/app/dashboard/owner/useOwnerDashboardData";
import { matchesHousingReference } from "@/app/lib/listingReferences";
import { ownerDashboardContent as copy } from "./ownerDashboardContent";
import { Card, CardHeader, CardBody } from "@/components/ui/Card/Card";
import { Button } from "@/components/ui/Button/Button";
import { ButtonLink } from "@/components/ui/Button/ButtonLink";
import { Badge } from "@/components/ui/Badge/Badge";
import { Input } from "@/components/ui/Input/Input";
import { Select } from "@/components/ui/Select/Select";
import { Textarea } from "@/components/ui/Textarea/Textarea";
import styles from "./OwnerDashboardView.module.scss";

type Data = ReturnType<typeof useOwnerDashboardData>;
type Mission = Data["missions"][number];
const root = "/dashboard/owner";
const validDate = (value?: string | null) => value && Number.isFinite(Date.parse(value)) ? new Date(value) : null;
const dateLabel = (value?: string | null) => validDate(value)?.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) ?? copy.unknownDate;
const isStay = (mission: Mission) => (mission.metadata?.mission_kind || mission.metadata?.kind) === "traveler_stay";
const isCanceled = (mission: Mission) => ["canceled", "cancelled", "rejected"].includes(mission.status ?? "");
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");

function Section({ title, href, label, children, id }: { title: string; href?: string; label?: string; children: ReactNode; id?: string }) {
  return <Card variant="large" className={styles.card} id={id}><CardHeader className={styles.sectionHeader}><h2>{title}</h2>{href && <ButtonLink variant={label === copy.addProperty ? "primary" : "ghost"} className={label === copy.addProperty ? styles.primary : styles.sectionLink} href={href}>{label ?? copy.all}<ArrowUpRight size={15} aria-hidden="true" /></ButtonLink>}</CardHeader><CardBody className={styles.sectionBody}>{children}</CardBody></Card>;
}

function Memo({ userId }: { userId: string }) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const key = `planetls:owner-memo:v1:${userId}`;
  useEffect(() => { try { setNote(localStorage.getItem(key) ?? ""); } catch { setMessage(copy.memoError); } }, [key]);
  return <Section title={copy.memo}><label className={styles.srOnly} htmlFor="owner-memo">{copy.memo}</label><Textarea bare id="owner-memo" value={note} maxLength={5000} onChange={(event) => { setNote(event.target.value); setMessage(""); }} placeholder={copy.memoPlaceholder} /><p className={styles.muted}>{copy.memoHint}</p><Button className={styles.primary} onClick={() => { try { localStorage.setItem(key, note); setMessage(copy.memoSaved); } catch { setMessage(copy.memoError); } }}>{copy.save}</Button><p role="status">{message}</p></Section>;
}

function StayCalendar({ stays, properties }: { stays: Mission[]; properties: Data["properties"] }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [housing, setHousing] = useState("");
  const selected = stays.filter((stay) => !housing || matchesHousingReference({ propertyId: stay.property_id ?? null, metadata: stay.metadata ?? null }, housing));
  const offset = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return <Section title={copy.calendar} href={`${root}/planning`} label={copy.calendarLink}>
    <label className={styles.selectLabel}>{copy.housingLabel}<Select bare aria-label={copy.housingLabel} value={housing} onChange={(event) => setHousing(event.target.value)}><option value="">{copy.allProperties}</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.nom_logement ?? copy.unknownProperty}</option>)}</Select></label>
    <div className={styles.month}><Button aria-label={copy.previousMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></Button><strong aria-live="polite">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</strong><Button aria-label={copy.nextMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></Button></div>
    <div className={styles.calendar}>{copy.weekdays.map((day, index) => <span key={index} className={styles.weekday}>{day}</span>)}{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: count }, (_, index) => {
      const day = new Date(month.getFullYear(), month.getMonth(), index + 1);
      const end = new Date(month.getFullYear(), month.getMonth(), index + 2);
      const sameDay = (value: Date | null) => value?.toDateString() === day.toDateString();
      const arriving = selected.some((stay) => sameDay(validDate(stay.scheduled_start)));
      const departing = selected.some((stay) => sameDay(validDate(stay.scheduled_end)));
      const booked = selected.some((stay) => { const start = validDate(stay.scheduled_start); const finish = validDate(stay.scheduled_end); return start && finish && start < end && finish > day; });
      const label = [arriving && copy.arrival, departing && copy.departure, booked && copy.reserved].filter(Boolean).join(", ") || copy.noStay;
      return <span key={index} className={`${styles.day} ${booked ? styles.booked : ""} ${arriving ? styles.arriving : ""} ${departing ? styles.departing : ""}`} title={`${dateLabel(day.toISOString())} : ${label}`}><span>{index + 1}</span><span className={styles.srOnly}>{label}</span></span>;
    })}</div><div className={styles.legend}><span>● {copy.reserved}</span><span>↳ {copy.arrival}</span><span>↱ {copy.departure}</span></div><p className={styles.muted}>{copy.calendarHint}</p>
  </Section>;
}

export default function OwnerDashboardView({ data, userId }: { data: Data; name: string; userId: string }) {
  const [query, setQuery] = useState("");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const stays = data.missions.filter((mission) => isStay(mission) && !isCanceled(mission));
  const arrivals = stays.filter((stay) => (validDate(stay.scheduled_start)?.getTime() ?? 0) >= today.getTime()).sort((a, b) => Date.parse(a.scheduled_start!) - Date.parse(b.scheduled_start!));
  const interventions = data.missions.filter((mission) => !isStay(mission) && !isCanceled(mission));
  const propertyName = (mission: Mission) => data.properties.find((property) => matchesHousingReference({ propertyId: mission.property_id ?? null, metadata: mission.metadata ?? null }, property.id))?.nom_logement ?? copy.unknownProperty;
  const pendingQuotes = data.quotes.filter((quote) => ["sent", "pending"].includes(quote.status ?? ""));
  const nextArrival = arrivals[0] ?? null;
  const nextArrivalNights = nextArrival ? (() => {
    const start = validDate(nextArrival.scheduled_start);
    const end = validDate(nextArrival.scheduled_end);
    return start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000)) : null;
  })() : null;
  const actions = [
    { label: copy.finishProperty, count: data.draftCount, href: `${root}/logements` },
    { label: copy.checkQuotes, count: pendingQuotes.length, href: `${root}/devis` },
    { label: copy.checkInvoices, count: data.pendingInvoices.length, href: `${root}/factures` },
    { label: copy.answerMessages, count: data.unreadConversationCount, href: `${root}/messages` },
    { label: copy.followRequests, count: data.requestsCount, href: `${root}/demandes` },
  ].filter((action) => action.count > 0);
  const documents = [...data.latestQuotes.map((quote) => ({ id: `quote-${quote.id}`, title: quote.quote_number || copy.estimate, type: copy.estimate, href: `${root}/devis` })), ...data.latestInvoices.map((invoice) => ({ id: `invoice-${invoice.id}`, title: invoice.invoice_number || copy.invoice, type: copy.invoice, href: `${root}/factures` }))];
  const searchItems = [...data.properties.map((property) => ({ id: `housing-${property.id}`, title: property.nom_logement || copy.unknownProperty, detail: property.ville || "", href: `${root}/logements/${property.id}` })), ...arrivals.map((stay) => ({ id: stay.id, title: stay.title || copy.upcoming, detail: propertyName(stay), href: `${root}/missions/${stay.id}` })), ...documents.map((document) => ({ ...document, detail: document.type }))];
  const results = query.trim() ? searchItems.filter((item) => normalize(`${item.title} ${item.detail}`).includes(normalize(query.trim()))) : [];
  return <div className={styles.dashboard} data-owner-dashboard="">
    <div className={styles.search}><Search size={20} aria-hidden="true" /><label className={styles.srOnly} htmlFor="owner-search">{copy.searchLabel}</label><Input bare id="owner-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} aria-describedby="owner-search-scope" /></div><p id="owner-search-scope" className={styles.muted}>{copy.searchScope}</p>
    {query.trim() && <div className={styles.card} aria-live="polite">{results.length ? results.map((item) => <Link className={styles.row} href={item.href} key={item.id}><strong>{item.title}</strong><span>{item.detail}</span><ArrowUpRight size={16} /></Link>) : copy.noResults}</div>}
    <div className={styles.metrics}>{[
      { label: copy.upcoming, value: arrivals.length, icon: CalendarDays, hint: copy.recentData },
      { label: copy.actions, value: actions.reduce((total, action) => total + action.count, 0), icon: CircleCheck, hint: copy.recentData },
      { label: copy.interventions, value: interventions.filter((mission) => mission.status === "in_progress").length, icon: Wrench, hint: copy.recentData },
      { label: copy.occupancy, value: "—", icon: House, hint: copy.unavailable },
    ].map(({ label, value, icon: Icon, hint }) => <Card className={styles.metric} key={label}><span className={styles.icon}><Icon size={21} aria-hidden="true" /></span><strong>{value}</strong><span>{label}</span><small>{hint}</small></Card>)}</div>
    {nextArrival ? <Card className={`${styles.card} ${styles.nextArrival}`}>
      <CardHeader className={styles.sectionHeader}><h2>{copy.nextArrival}</h2><Badge className={styles.badge}>{copy.inDays(Math.round(((validDate(nextArrival.scheduled_start)?.getTime() ?? 0) - today.getTime()) / 86_400_000))}</Badge></CardHeader>
      <CardBody className={styles.nextArrivalBody}>
        <div className={styles.nextArrivalImage} aria-hidden="true"><House size={34} /></div>
        <div className={styles.nextArrivalDetails}>
          <div className={styles.nextArrivalTop}><span>{dateLabel(nextArrival.scheduled_start)}</span><strong>{validDate(nextArrival.scheduled_start)?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) ?? copy.unknownDate}</strong></div>
          <h3>{nextArrival.title || copy.upcoming}</h3>
          <p className={styles.muted}>{propertyName(nextArrival)}</p>
          <ul className={styles.arrivalDetails}>{nextArrivalNights ? <li>{copy.nights(nextArrivalNights)}</li> : null}<li>{dateLabel(nextArrival.scheduled_start)} → {dateLabel(nextArrival.scheduled_end)}</li></ul>
          <div className={styles.arrivalActions}>
            <ButtonLink className={styles.primary} href={`${root}/missions/${nextArrival.id}`}>{copy.viewReservation}</ButtonLink>
            <ButtonLink variant="ghost" className={styles.sectionLink} href={`${root}/messages`}>{copy.contactTravelers}</ButtonLink>
          </div>
        </div>
      </CardBody>
    </Card> : null}
    <div className={styles.twoColumns}>
      <Section title={copy.arrivals} href={`${root}/planning`} label={copy.calendarLink}>{arrivals.length ? arrivals.slice(0, 3).map((stay) => <Link className={styles.row} key={stay.id} href={`${root}/missions/${stay.id}`}><span className={styles.icon}><CalendarDays size={20} /></span><div><strong>{stay.title || copy.upcoming}</strong><span>{propertyName(stay)}</span><small>{dateLabel(stay.scheduled_start)} → {dateLabel(stay.scheduled_end)}</small></div><ArrowUpRight size={17} /></Link>) : <p className={styles.empty}>{copy.noArrivals}</p>}</Section>
      <Section title={copy.actions}>{actions.length ? actions.map((action) => <Link className={styles.row} key={action.label} href={action.href}><CircleCheck size={19} aria-hidden="true" /><strong>{action.label}</strong><Badge className={styles.badge}>{action.count}</Badge><ChevronRight size={16} /></Link>) : <p className={styles.empty}>{copy.noActions}</p>}</Section>
    </div>
    <Section title={copy.properties} href={`${root}/logements/create`} label={copy.addProperty}><div className={styles.propertyGrid}>{data.properties.slice(0, 3).map((property) => <Card className={styles.property} key={property.id}><div className={styles.propertyImage}>{property.photo_principale ? <Image src={toHousingPhotoUrl(property.photo_principale, property.id)} unoptimized alt={property.nom_logement || copy.unknownProperty} fill sizes="(max-width: 700px) 100vw, 33vw" /> : <House size={52} aria-hidden="true" />}<Badge className={styles.badge} data-tone={["active", "published"].includes(property.statut ?? "") ? "success" : "warning"}>{["active", "published"].includes(property.statut ?? "") ? copy.online : copy.draft}</Badge></div><div className={styles.propertyBody}><h3>{property.nom_logement || copy.unknownProperty}</h3><p>{property.ville || copy.unknownProperty}</p><p className={styles.muted}>{[property.infos?.property_type, typeof property.infos?.guest_capacity === "number" ? copy.guests(property.infos.guest_capacity) : null].filter(Boolean).join(" · ")}</p><p className={styles.muted}>{[typeof property.infos?.bedroom_count === "number" ? copy.bedrooms(property.infos.bedroom_count) : null, typeof property.infos?.bathroom_count === "number" ? copy.bathrooms(property.infos.bathroom_count) : null, typeof property.infos?.surface_sqm === "number" ? copy.area(property.infos.surface_sqm) : null].filter(Boolean).join(" · ")}</p><p className={styles.muted}>{property.infos?.equipements?.slice(0, 3).join(" · ")}</p><div className={styles.propertyActions}><Link href={`${root}/logements/${property.id}`}>{copy.details}<ArrowUpRight size={15} /></Link><Link href={`${root}/logements/${property.id}`}>{copy.edit}</Link></div></div></Card>)}</div>{!data.properties.length && <div className={styles.empty}><House size={35} /><p>{copy.noProperties}</p><ButtonLink className={styles.primary} href={`${root}/logements/create`}><Plus size={17} />{copy.addProperty}</ButtonLink></div>}<ButtonLink variant="ghost" className={styles.sectionLink} href={`${root}/logements`}>{copy.allPropertiesLink}<ArrowUpRight size={15} aria-hidden="true" /></ButtonLink></Section>
    <Section title={copy.performance} href={`${root}/finances/overview`} label={copy.statistics}><div className={styles.performance}>{[copy.revenue, copy.occupancy, copy.rating, copy.forecast].map((label) => <div key={label}><span>{label}</span><strong>{label === copy.rating && data.averageRating !== null && data.averageRating !== undefined ? `${data.averageRating.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} / 5` : "—"}</strong><small>{label === copy.rating ? copy.recentData : copy.unavailable}</small></div>)}</div><p className={styles.muted}>{copy.performanceHint}</p></Section>
    <div className={styles.twoColumns}><StayCalendar stays={stays} properties={data.properties} /><Section title={copy.recentInterventions} href={`${root}/missions`} label={copy.allInterventions}>{interventions.length ? [...interventions].sort((a, b) => (validDate(b.updated_at || b.scheduled_start)?.getTime() ?? 0) - (validDate(a.updated_at || a.scheduled_start)?.getTime() ?? 0)).slice(0, 3).map((mission) => <Link className={styles.row} key={mission.id} href={`${root}/missions/${mission.id}`}><span className={styles.icon}><Wrench size={18} /></span><div><strong>{mission.title || copy.recentInterventions}</strong><span>{propertyName(mission)}</span><small>{dateLabel(mission.scheduled_start)}</small></div><Badge className={styles.badge} data-tone={mission.status === "completed" ? "success" : mission.status === "in_progress" ? "info" : "warning"}>{copy.statuses[mission.status ?? ""] ?? copy.unknownDate}</Badge></Link>) : <p className={styles.empty}>{copy.noInterventions}</p>}</Section></div>
    <div className={styles.twoColumns}><Section title={copy.messages} href={`${root}/messages`} label={copy.allMessages}>{data.conversations.length ? data.conversations.slice(0, 3).map((conversation) => <Link className={styles.row} key={conversation.id} href={`${root}/messages`}><span className={styles.icon}><MessageCircle size={19} /></span><div><strong>{conversation.counterpart_name || conversation.subject || copy.messageFallback}</strong><span>{conversation.last_message_preview || copy.noPreview}</span><small>{dateLabel(conversation.last_message_at)}</small></div>{Boolean(conversation.unread_count) && <Badge className={styles.badge}>{conversation.unread_count}</Badge>}</Link>) : <p className={styles.empty}>{copy.noMessages}</p>}</Section><Section title={copy.documents} href={`${root}/documents`} label={copy.allDocuments}>{documents.length ? documents.slice(0, 3).map((document) => <Link className={styles.row} href={document.href} key={document.id}><FileText size={22} aria-hidden="true" /><div><strong>{document.title}</strong><small>{document.type}</small></div><ArrowUpRight size={16} /></Link>) : <p className={styles.empty}>{copy.noDocuments}</p>}</Section></div>
    <div className={styles.bottomGrid}><div className={styles.tips}><Sparkles size={26} aria-hidden="true" /><h2>{copy.tips}</h2><p>{copy.tipsCopy}</p><details><summary>{copy.tipsButton}</summary><ul>{copy.tipsList.map((tip) => <li key={tip}>{tip}</li>)}</ul></details></div><Section title={copy.shortcutsTitle}><div className={styles.shortcuts}>{copy.shortcuts.map((shortcut) => <Link key={shortcut.label} href={shortcut.href}>{shortcut.label}<ArrowUpRight size={15} /></Link>)}</div></Section><Memo key={userId} userId={userId} /></div>
    <blockquote className={styles.closing}>{copy.closing}</blockquote><footer className={styles.footer}><div><strong>{copy.brand}</strong><span>{copy.tagline}</span></div><Link href="/contact">{copy.help}</Link><Link href="/contact">{copy.contact}</Link></footer>
  </div>;
}
