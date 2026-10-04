"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { MapPin, Search, List, Map as MapIcon, Star } from "lucide-react";
import { Badge, Button, ButtonLink, Input, Select } from "@/components/ui";
import { ConciergeAvatar } from "@/app/dashboard/owner/concierges/ConciergeAvatar";
import type { ConciergeSearchRow } from "@/app/dashboard/owner/concierges/conciergeSearchTypes";
import { getServiceCategoryIconPath } from "@/app/lib/serviceCategoryIcon";
import { distanceKm, isSearchPoint, type SearchPoint } from "../lib/geography";
import styles from "./GeographicConciergeSearch.module.scss";

const SearchMap = dynamic(() => import("@/app/components/MapWithList/MapWithList"), {
  ssr: false, loading: () => <p role="status">Chargement de la carte…</p>,
});
type Result = ConciergeSearchRow & SearchPoint;
type Payload = { items?: Result[]; center?: SearchPoint; unlocated?: number; error?: string; warning?: string; available_filters?: { services?: string[] } };

const distanceFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const ratingFormat = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function GeographicConciergeSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [profileCity, setProfileCity] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState("20");
  const [services, setServices] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [items, setItems] = useState<Result[]>([]);
  const [center, setCenter] = useState<SearchPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocated, setUnlocated] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState("list");
  const [retry, setRetry] = useState(0);
  const cards = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/profiles/current", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Profil inaccessible");
        const profile = await response.json();
        setProfileCity(profile.city || profile.location || "");
      }).catch(() => { if (!controller.signal.aborted) setProfileCity(""); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (profileCity === null) return;
    const params = new URLSearchParams(query);
    const nextCity = params.get("city") ?? params.get("postalCode") ?? profileCity;
    const rawRadius = Number(params.get("radiusKm") || 20);
    const nextRadius = Number.isFinite(rawRadius) && rawRadius > 0 && rawRadius <= 250 ? String(rawRadius) : "20";
    const nextServices = (params.get("services") || "").split(",").filter(Boolean);
    setCity(nextCity); setRadius(nextRadius); setServices(nextServices); setSelected(null);
    setError(null); setItems([]); setCenter(null); setUnlocated(0); setWarning(null);
    if (!nextCity.trim()) { setLoading(false); return; }
    // Canonical URL also makes the initial profile defaults available to profile/back navigation.
    if (params.get("city") !== nextCity || params.get("radiusKm") !== nextRadius) {
      params.set("city", nextCity); params.set("radiusKm", nextRadius);
      router.replace(`/dashboard/owner/concierges?${params}`, { scroll: false });
      return;
    }
    const controller = new AbortController();
    params.set("geographic", "1"); params.set("availableOnly", "0");
    setLoading(true);
    void fetch(`/api/profiles/concierges?${params}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload: Payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "La recherche est momentanément indisponible.");
        if (controller.signal.aborted) return;
        setItems((payload.items || []).filter(isSearchPoint));
        setCenter(payload.center && isSearchPoint(payload.center) ? payload.center : null);
        setOptions(payload.available_filters?.services || []); setUnlocated(payload.unlocated || 0); setWarning(payload.warning || null);
      }).catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Recherche indisponible."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, profileCity, router, retry]);

  function submit(nextRadius = radius) {
    const params = new URLSearchParams(query);
    params.set("city", city.trim()); params.set("radiusKm", nextRadius);
    if (services.length) params.set("services", services.join(",")); else params.delete("services");
    if (params.toString() === query) setRetry((value) => value + 1);
    router.push(`/dashboard/owner/concierges?${params}`, { scroll: false });
  }
  function select(id: string, fromMap = false) {
    setSelected(id);
    if (fromMap) {
      setMobileView("list");
      requestAnimationFrame(() => cards.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
  }
  const returnTo = `/dashboard/owner/concierges${query ? `?${query}` : ""}`;
  const applied = new URLSearchParams(query);
  const appliedRadius = Number(applied.get("radiusKm") || 20);
  const appliedCity = (applied.get("city") || "").trim();
  const resultsLabel = `${items.length} résultat${items.length === 1 ? "" : "s"}${appliedCity ? ` · ${appliedRadius} km autour de ${appliedCity}` : ""}`;
  return <section className={styles.page}>
    <header className={styles.header}><span>Le réseau PlanetLS</span><h1>Trouver ma concierge</h1>
      <p>Découvrez les professionnels près de votre logement.</p></header>
    <form className={styles.search} onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <label className={styles.city}>Ville<Input bare required aria-label="Ville de recherche" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Votre ville" /></label>
      <label>Rayon<Select bare aria-label="Rayon de recherche" value={radius} onChange={(event) => setRadius(event.target.value)}>
        {Array.from(new Set(["10", "20", "30", "50", "100", "250", radius])).sort((a, b) => Number(a) - Number(b)).map((value) => <option key={value} value={value}>{value} km</option>)}
      </Select></label>
      <Button type="submit" disabled={loading || !city.trim()}><Search size={17} aria-hidden="true" />Rechercher</Button>
      {(options.length > 0 || services.length > 0) && <fieldset className={styles.services}><legend>Prestations</legend>
        {Array.from(new Set([...options, ...services])).map((service) => <label key={service}>
          <input type="checkbox" checked={services.includes(service)} onChange={() => setServices((previous) => previous.includes(service) ? previous.filter((value) => value !== service) : [...previous, service])} />
          <Image src={getServiceCategoryIconPath(service)} width={18} height={18} alt="" />{service}
        </label>)}
      </fieldset>}
    </form>
    <div className={styles.resultsHeader}><p className={styles.resultsCount} role="status" aria-live="polite">{loading ? "Recherche des professionnels…" : error ? "Recherche indisponible" : resultsLabel}</p>
      <div className={styles.toggle} role="group" aria-label="Présentation des résultats">
        <Button variant="secondary" aria-pressed={mobileView === "list"} onClick={() => setMobileView("list")}><List size={16} aria-hidden="true" />Liste</Button>
        <Button variant="secondary" aria-pressed={mobileView === "map"} onClick={() => setMobileView("map")}><MapIcon size={16} aria-hidden="true" />Carte</Button>
      </div></div>
    {error && <div className={styles.empty} role="alert"><p>{error}</p><Button variant="secondary" onClick={() => submit()}>Réessayer</Button></div>}
    {!loading && !error && items.length === 0 && <div className={styles.empty}><MapPin size={28} aria-hidden="true" />
      <h2>{city.trim() ? "Aucune concierge dans cette recherche" : "Où se situe votre logement ?"}</h2>
      <p>{city.trim() ? "Essayez un rayon plus large ou ajustez les prestations." : "Renseignez une ville pour découvrir les professionnels à proximité."}</p>
      {city.trim() && Number(radius) < 250 && <Button onClick={() => { const wider = String(Math.min(250, Number(radius) * 2)); setRadius(wider); submit(wider); }}>Élargir à {Math.min(250, Number(radius) * 2)} km</Button>}
    </div>}
    {!loading && !error && center && <div className={styles.results} data-view={mobileView}>
      <div className={styles.map} id="concierge-search-map"><SearchMap center={center} radiusKm={appliedRadius} selectedId={selected} onSelect={(id) => select(id, true)}
        profiles={items.map((item) => ({ id: item.id, name: item.display_name, type: "concierge", city: item.city || item.service_area || "", latitude: item.latitude, longitude: item.longitude, services: item.services }))} /></div>
      <div className={styles.list}>{items.map((item, index) => {
        const distance = center ? distanceKm(center, item) : null;
        const rating = item.reviews_count > 0 && item.average_rating !== null ? item.average_rating : null;
        const years = item.years_experience && item.years_experience > 0 ? item.years_experience : null;
        const shownServices = item.services.slice(0, 3);
        const hiddenServices = item.services.length - shownServices.length;
        return <article key={item.id} ref={(element) => { if (element) cards.current.set(item.id, element); else cards.current.delete(item.id); }}
          className={`${styles.card} ${selected === item.id ? styles.selected : ""}`} aria-current={selected === item.id || undefined}>
          <button type="button" className={styles.identity} onClick={() => select(item.id)} aria-pressed={selected === item.id} aria-controls="concierge-search-map"
            aria-label={`Sélectionner ${item.display_name} sur la carte`}>
            <span className={styles.rank} aria-hidden="true">{index + 1}</span>
            <ConciergeAvatar src={item.avatar_url} alt="" className={styles.avatar} width={56} height={56} />
            <span className={styles.cardName}><strong>{item.display_name}</strong>
              <span className={styles.cardMeta}><MapPin size={14} aria-hidden="true" />{item.city || item.service_area || "Zone non renseignée"}
                {distance !== null && <span className={styles.cardDistance}>{distanceFormat.format(distance)} km</span>}</span></span>
          </button>
          {(item.is_pro || rating !== null || years !== null || item.service_radius_km) && <div className={styles.badges}>
            {item.is_pro && <Badge variant="gold">Pro</Badge>}
            {rating !== null && <Badge variant="neutral"><Star size={12} aria-hidden="true" />{ratingFormat.format(rating)} · {item.reviews_count} avis</Badge>}
            {years !== null && <Badge variant="neutral">{years} an{years > 1 ? "s" : ""} d’expérience</Badge>}
            {item.service_radius_km ? <Badge variant="neutral">Intervient jusqu’à {item.service_radius_km} km</Badge> : null}
          </div>}
          {shownServices.length > 0 && <div className={styles.cardServices}>
            {shownServices.map((service) => <span key={service}><Image src={getServiceCategoryIconPath(service)} width={16} height={16} alt="" />{service}</span>)}
            {hiddenServices > 0 && <span className={styles.moreServices}>+{hiddenServices}</span>}
          </div>}
          <ButtonLink className={styles.cardAction} variant="secondary" href={`/dashboard/owner/concierges/${encodeURIComponent(item.id)}?returnTo=${encodeURIComponent(returnTo)}`}>Voir le profil</ButtonLink>
        </article>;
      })}</div>
    </div>}
    {!loading && !error && warning && <p className={styles.note} role="status">{warning}</p>}
    {!loading && !error && unlocated > 0 && !warning && <p className={styles.note}>Les profils dont la localisation n’a pas pu être vérifiée sont exclus de cette recherche.</p>}
  </section>;
}
