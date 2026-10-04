"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, MapPin, MessageCircle, Navigation, Star } from "lucide-react";
import { Badge, Button, ButtonLink } from "@/components/ui";
import { ConciergeAvatar } from "@/app/dashboard/owner/concierges/ConciergeAvatar";
import { getServiceCategoryIconPath } from "@/app/lib/serviceCategoryIcon";
import { getPublicProfileLinks } from "@/features/public-concierges/publicProfileLinks";
import type { PublicProfileCtaKey } from "@/features/public-concierges/publicProfileCtas";
import type { PublicProfilePayload } from "./PublicConciergeProfilePage";
import styles from "./OwnerConciergeProfileView.module.scss";
import { ConciergeInterventionMap } from "./ConciergeInterventionMap";

type Props = {
  data: PublicProfilePayload | null;
  loading: boolean;
  error: string | null;
  returnTo: string;
  publicView?: boolean;
  onRetry: () => void;
  onTrack: (key: PublicProfileCtaKey, href: string, source: string) => void;
};
const currency = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
const hasNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const linkKeys = { website: "visit_website", linkedin: "view_linkedin", instagram: "view_instagram", facebook: "view_facebook" } as const;

export function OwnerConciergeProfileView({ data, loading, error, returnTo, publicView = false, onRetry, onTrack }: Props) {
  const profile = data?.profile;
  const services = Array.from(new Set(profile?.services?.filter(Boolean) || []));
  const links = profile ? getPublicProfileLinks(profile) : [];
  const reviews = data?.reviews || [];
  const rating = data?.stats?.average_rating;
  const reviewCount = data?.stats?.reviews_count || 0;
  const isPro = profile?.role === "concierge_pro";

  return <section className={styles.page} aria-busy={loading}>
    <div className={styles.topbar}>
      <Link href={returnTo} className={styles.back}><ArrowLeft size={17} aria-hidden="true" />{publicView ? "Retour aux profils" : "Retour aux résultats"}</Link>
      <span className={styles.eyebrow}>Le réseau PlanetLS</span>
    </div>
    {loading ? <div className={styles.state} role="status"><span className={styles.eyebrow}>Profil professionnel</span><h1>Chargement du profil…</h1><p>Nous préparons les informations de cette concierge.</p></div>
      : error || !profile ? <div className={styles.state} role="alert"><h1>Ce profil est indisponible</h1><p>{error || "Les informations de cette concierge n’ont pas pu être chargées."}</p><Button onClick={onRetry}>Réessayer</Button></div>
      : <>
        <header className={styles.hero}>
          <div className={styles.cover} aria-hidden="true">
            {profile.image && <Image src={profile.image} alt="" fill sizes="(max-width: 767px) 100vw, 80vw" unoptimized onError={(event) => { event.currentTarget.style.opacity = "0"; }} />}
            <span className={styles.coverLabel}>Une rencontre, un projet, une confiance.</span>
          </div>
          <div className={styles.identity}>
            <ConciergeAvatar src={profile.avatar_url} alt="" className={styles.avatar} width={108} height={108} />
            <div className={styles.identityCopy}><div className={styles.nameRow}><h1>{profile.company_name || profile.display_name}</h1>{isPro && <Badge variant="gold">Concierge PRO</Badge>}</div>
              <p className={styles.location}><MapPin size={16} aria-hidden="true" />{profile.city || profile.service_area || "Localisation non renseignée"}{profile.country ? `, ${profile.country}` : ""}</p>
              <div className={styles.facts}>
                {reviewCount > 0 && hasNumber(rating) && <a href="#concierge-reviews"><Star size={15} aria-hidden="true" />{rating.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} / 5 <span>({reviewCount} avis)</span></a>}
                {hasNumber(profile.years_experience) && profile.years_experience > 0 && <span><BriefcaseBusiness size={15} aria-hidden="true" />{profile.years_experience} {profile.years_experience === 1 ? "an" : "ans"} d’expérience</span>}
                {hasNumber(profile.service_radius_km) && profile.service_radius_km > 0 && <span><Navigation size={15} aria-hidden="true" />Rayon d’intervention : {profile.service_radius_km} km</span>}
              </div>
            </div>
          </div>
        </header>

        <div className={styles.layout}>
          <div className={styles.content}>
            <section className={styles.panel} aria-labelledby="concierge-services"><div className={styles.sectionHeading}><span className={styles.eyebrow}>Son savoir-faire</span><h2 id="concierge-services">Les prestations proposées</h2><p>Découvrez les services renseignés par cette concierge.</p></div>
              {services.length ? <ul className={styles.services}>{services.map((service) => <li key={service}><span className={styles.serviceIcon}><Image src={getServiceCategoryIconPath(service)} alt="" width={26} height={26} /></span><span>{service}</span></li>)}</ul>
                : <p className={styles.empty}>Les prestations ne sont pas encore renseignées.</p>}
            </section>

            <section className={styles.panel} aria-labelledby="concierge-area"><div className={styles.sectionHeading}><span className={styles.eyebrow}>À proximité</span><h2 id="concierge-area">Sa zone d’intervention</h2></div>
              <div className={styles.zone}><span className={styles.zoneIcon}><MapPin size={24} aria-hidden="true" /></span><div><strong>{profile.service_area || profile.city || "Zone non renseignée"}</strong>
                {hasNumber(profile.service_radius_km) && profile.service_radius_km > 0 ? <p>Rayon déclaré de {profile.service_radius_km} km.</p> : <p>Le rayon d’intervention n’est pas renseigné.</p>}</div></div>
              <ConciergeInterventionMap profile={profile} />
            </section>

            <section className={styles.panel} id="concierge-reviews" aria-labelledby="concierge-reviews-title"><div className={styles.sectionHeading}><span className={styles.eyebrow}>Les retours d’expérience</span><h2 id="concierge-reviews-title">Avis des clients{reviewCount > 0 ? ` (${reviewCount})` : ""}</h2></div>
              {reviews.length ? <div className={styles.reviews}>{reviews.map((review) => <article key={review.id} className={styles.review}>
                <div>{hasNumber(review.rating) && <strong><Star size={14} aria-hidden="true" />{review.rating.toLocaleString("fr-FR")} / 5</strong>}
                  {review.created_at && !Number.isNaN(Date.parse(review.created_at)) && <time dateTime={review.created_at}>{new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(review.created_at))}</time>}</div>
                <p>{review.comment || "Avis publié sans commentaire."}</p></article>)}</div>
                : <p className={styles.empty}>Aucun avis publié pour le moment.</p>}
            </section>
          </div>

          <aside className={styles.sidebar} aria-label="Tarifs et prise de contact">
            <section className={styles.contact}><span className={styles.eyebrow}>Votre prochain échange</span><h2>Parlons de votre logement</h2><p>Présentez votre projet et les prestations que vous souhaitez confier.</p>
              <ButtonLink href="/login" variant="primary" className={styles.contactButton} onClick={() => onTrack("contact_platform", "/login", "cta_section")}><MessageCircle size={17} aria-hidden="true" />Contacter</ButtonLink>
              <Link href={returnTo} className={styles.compare}>{publicView ? "Explorer les profils" : "Revenir à ma recherche"}<ArrowUpRight size={15} aria-hidden="true" /></Link>
            </section>
            <section className={styles.panel}><div className={styles.sectionHeading}><span className={styles.eyebrow}>Les repères</span><h2>Tarifs indicatifs</h2></div>
              <dl className={styles.prices}>
                {hasNumber(profile.hourly_rate) && <div><dt>À l’heure</dt><dd>{currency.format(profile.hourly_rate)}<small>/ heure</small></dd></div>}
                {hasNumber(profile.monthly_rate) && <div><dt>Au mois</dt><dd>{currency.format(profile.monthly_rate)}<small>/ mois</small></dd></div>}
              </dl>
              {!hasNumber(profile.hourly_rate) && !hasNumber(profile.monthly_rate) && <p className={styles.empty}>Les tarifs ne sont pas encore renseignés.</p>}
            </section>
            {links.length > 0 && <section className={styles.panel}><div className={styles.sectionHeading}><h2>Découvrir son univers</h2></div><div className={styles.links}>{links.map((link) => <a key={link.key} href={link.href} target="_blank" rel="noreferrer" onClick={() => onTrack(linkKeys[link.key], link.href, "links_section")}>
              {link.label}<ArrowUpRight size={16} aria-hidden="true" /></a>)}</div></section>}
          </aside>
        </div>
      </>}
  </section>;
}
