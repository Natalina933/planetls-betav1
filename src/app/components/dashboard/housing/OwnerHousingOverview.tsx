"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  MessageCircle,
  Plus,
  Search,
} from "lucide-react";
import { Button, ButtonLink, Input } from "@/components/ui";
import { formatDateValue } from "@/app/utils/formatters";
import { getHousingReferenceId } from "@/app/lib/listingReferences";
import type { HousingListItem } from "./HousingListPage";
import { getUpcomingHousingStays, type HousingStay } from "./ownerHousingPresentation";
import styles from "./OwnerHousingOverview.module.scss";

type ReviewPreview = {
  housingName: string;
  detail: string;
  href: string;
};

type Props = {
  logements: HousingListItem[];
  visibleLogements: HousingListItem[];
  total: number;
  reviewCount: number;
  reviewPreview: ReviewPreview | null;
  loading: boolean;
  error: string | null;
  onRetry: () => Promise<void>;
  addHref: string;
  isReviewMode: boolean;
  onFilter: (value: string) => void;
  renderCards: (items: HousingListItem[], nextStay: (id: number) => ReactNode, addCard?: ReactNode) => ReactNode;
};

function getStayHousingId(stay: HousingStay) {
  return getHousingReferenceId({ propertyId: stay.property_id, metadata: stay.metadata });
}

function formatStayRange(stay: HousingStay) {
  const start = formatDateValue(stay.check_in_at, { day: "numeric", month: "short" });
  const end = formatDateValue(stay.check_out_at, { day: "numeric", month: "short" });
  return `${start} – ${end}`;
}

export default function OwnerHousingOverview(props: Props) {
  const [search, setSearch] = useState("");
  const [stays, setStays] = useState<HousingStay[]>([]);
  const [staysLoading, setStaysLoading] = useState(true);
  const [staysError, setStaysError] = useState(false);
  const [stayRefresh, setStayRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStaysLoading(true);
    setStaysError(false);

    async function load() {
      try {
        const response = await fetch("/api/owner/reservations", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.reservations)) throw new Error("Séjours indisponibles");
        if (!controller.signal.aborted) setStays(data.reservations);
      } catch {
        if (!controller.signal.aborted) {
          setStays([]);
          setStaysError(true);
        }
      } finally {
        if (!controller.signal.aborted) setStaysLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [stayRefresh]);

  const upcoming = useMemo(() => getUpcomingHousingStays(stays, Date.now()), [stays]);
  const normalized = search.trim().toLocaleLowerCase("fr");
  const items = useMemo(
    () =>
      props.visibleLogements.filter((item) =>
        `${item.nom_logement} ${item.ville}`.toLocaleLowerCase("fr").includes(normalized),
      ),
    [normalized, props.visibleLogements],
  );

  const readyCount = props.logements.filter((item) => item.statut === "pret").length;
  const preparingCount = props.logements.filter((item) => item.statut === "menage").length;
  const arrivalCount = props.logements.filter((item) => item.statut === "arrivee").length;
  const departureCount = props.logements.filter((item) => item.statut === "depart").length;
  const firstReadyHousing = props.logements.find((item) => item.statut === "pret");
  const upcomingStayItems = useMemo(
    () =>
      Array.from(upcoming.values())
        .sort((left, right) => Date.parse(left.check_in_at ?? "") - Date.parse(right.check_in_at ?? ""))
        .slice(0, 3)
        .map((stay) => ({
          stay,
          housing: props.logements.find((item) => String(item.id) === getStayHousingId(stay)),
        }))
        .filter((item): item is { stay: HousingStay; housing: HousingListItem } => Boolean(item.housing)),
    [props.logements, upcoming],
  );

  const nextStay = (id: number) => {
    const stay = upcoming.get(String(id));
    return (
      <div className={styles.nextStay}>
        <CalendarDays aria-hidden="true" />
        <div>
          <span>Prochain séjour</span>
          <strong>
            {staysLoading
              ? "Chargement…"
              : staysError
                ? "Dates indisponibles"
                : stay
                  ? formatStayRange(stay)
                  : "Aucun séjour à venir chargé"}
          </strong>
        </div>
      </div>
    );
  };

  const addCard = (
    <Link
      href={props.addHref}
      className={styles.addCard}
      aria-label="Votre parc Ajouter un logement"
    >
      <span className={styles.addSymbol}>
        <Plus aria-hidden="true" />
      </span>
      <h3>Ajouter un logement</h3>
      <p>Complétez votre parc et commencez à le gérer simplement.</p>
      <span className={styles.addCta}>Ajouter</span>
    </Link>
  );

  const isDataUnavailable = props.loading || Boolean(props.error);
  const readinessValue = (value: string) => (isDataUnavailable ? "—" : value);
  const registerHeading = "Tous les logements";

  return (
    <div className={styles.page} aria-busy={props.loading}>
      <header className={styles.masthead}>
        <div>
          <p className={styles.breadcrumb}>
            Propriétaire <span aria-hidden="true">›</span> Logements
          </p>
          <h1>Mes logements</h1>
          <p className={styles.statusLine}>
            {isDataUnavailable ? (
              <strong>État du parc indisponible</strong>
            ) : (
              <>
                <strong>{props.total} logement{props.total > 1 ? "s" : ""}</strong> dans votre parc ·{" "}
                <strong>{readyCount} prêt{readyCount > 1 ? "s" : ""}</strong> ·{" "}
                <strong>{props.reviewCount} fiche{props.reviewCount > 1 ? "s" : ""} à revoir</strong>
              </>
            )}
          </p>
        </div>
        <ButtonLink href={props.addHref} variant="primary" className={styles.primaryAction}>
          <Plus size={17} aria-hidden="true" />
          Ajouter un logement
        </ButtonLink>
      </header>

      {props.loading || props.error || props.total > 0 ? (
        <section className={styles.readiness} aria-labelledby="housing-readiness-title">
          <h2 id="housing-readiness-title" className={styles.srOnly}>État du parc</h2>
          <div className={styles.readinessGrid}>
            <article className={`${styles.readinessPanel} ${styles.reviewPanel}`}>
              <p className={styles.kicker}>Priorité du parc</p>
              <h3>Fiches à compléter</h3>
              <div className={styles.reviewSummary}>
                <span className={`${styles.readinessValue} ${props.loading ? styles.skeletonValue : ""}`}>
                  {readinessValue(String(props.reviewCount))}
                </span>
                <div className={styles.reviewCopy}>
                  <strong>
                    {props.error
                      ? "État du parc indisponible"
                      : props.reviewCount === 1
                        ? "logement nécessite une correction"
                        : props.reviewCount > 1
                          ? "logements nécessitent une correction"
                          : "Aucune fiche à finaliser"}
                  </strong>
                  <span>
                    {props.error
                      ? "Réessayez pour retrouver votre parc et son état."
                      : props.reviewCount > 0
                        ? "Une fiche à finaliser avant le prochain séjour."
                        : "Les fiches de votre parc sont à jour."}
                  </span>
                </div>
              </div>
              {props.reviewPreview ? (
                <div className={styles.reviewItem}>
                  <div>
                    <strong>{props.reviewPreview.housingName}</strong>
                    <span>{props.reviewPreview.detail}</span>
                  </div>
                  <Link href={props.reviewPreview.href} className={styles.textAction}>
                    Corriger <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              ) : null}
            </article>

            <article className={styles.readinessPanel}>
              <p className={styles.kicker}>Préparation</p>
              <div className={styles.compactBody}>
                <div>
                  <span className={`${styles.compactValue} ${props.loading ? styles.skeletonValue : ""}`}>
                    {readinessValue(String(preparingCount))}
                  </span>
                  <strong>À préparer</strong>
                </div>
                <span className={styles.compactNote}>
                  {props.error ? "Données indisponibles" : preparingCount > 0 ? "Ménage en cours" : "Aucun ménage en cours"}
                </span>
              </div>
            </article>

            <article className={styles.readinessPanel}>
              <p className={styles.kicker}>Disponibilité</p>
              <div className={styles.compactBody}>
                <div>
                  <span className={`${styles.compactValue} ${styles.ratioValue} ${props.loading ? styles.skeletonValue : ""}`}>
                    {readinessValue(`${readyCount} / ${props.total}`)}
                  </span>
                  <strong>Prêts</strong>
                </div>
                <span className={styles.compactNote}>
                  {props.error
                    ? "Données indisponibles"
                    : firstReadyHousing
                      ? `${firstReadyHousing.nom_logement} est prêt`
                      : "Aucun logement prêt"}
                </span>
              </div>
            </article>
          </div>
          <div className={styles.movementStrip}>
            <strong>Arrivées et départs</strong>
            <div className={styles.movementData}>
              <span><b>{readinessValue(String(arrivalCount))}</b> arrivée{arrivalCount > 1 ? "s" : ""}</span>
              <span><b>{readinessValue(String(departureCount))}</b> départ{departureCount > 1 ? "s" : ""}</span>
            </div>
            <Link href="/dashboard/owner/planning" className={styles.textLink}>
              Voir le planning <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : (
        <section className={styles.emptyPark} aria-labelledby="empty-park-title">
          <ClipboardCheck aria-hidden="true" />
          <h2 id="empty-park-title">Commencez votre parc</h2>
          <p>Ajoutez votre premier logement pour préparer son suivi.</p>
          <ButtonLink href={props.addHref} variant="secondary">Ajouter mon premier logement</ButtonLink>
        </section>
      )}

      {props.error ? (
        <div className={styles.feedback} role="alert">
          <div>
            <strong>Impossible de charger les logements.</strong>
            <p>Réessayez pour retrouver votre parc et son état.</p>
          </div>
          <Button onClick={() => void props.onRetry()} variant="secondary">Réessayer</Button>
        </div>
      ) : null}

      <section className={styles.upcoming} aria-labelledby="upcoming-title">
        <div className={styles.upcomingHeading}>
          <h2 id="upcoming-title">Prochains séjours</h2>
          <p>Les dates liées à votre parc</p>
        </div>
        {staysError ? (
          <div className={styles.railFeedback} role="status">
            <span>Les dates des séjours sont indisponibles.</span>
            <Button variant="secondary" size="sm" onClick={() => setStayRefresh((value) => value + 1)}>
              Réessayer les séjours
            </Button>
          </div>
        ) : staysLoading ? (
          <div className={styles.staySkeletons} aria-label="Chargement des prochains séjours" role="status">
            <span /><span /><span />
          </div>
        ) : upcomingStayItems.length > 0 ? (
          <div className={styles.stayRail}>
            {upcomingStayItems.map(({ stay, housing }) => (
              <Link key={`${housing.id}-${stay.check_in_at}`} href={`/dashboard/owner/logements/${housing.id}`} className={styles.stayItem}>
                <strong>{formatDateValue(stay.check_in_at, { day: "numeric", month: "short" })}</strong>
                <span>{housing.nom_logement}</span>
                <small>{formatStayRange(stay)}</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.upcomingEmpty}>
            <span className={styles.calendarMark}><CalendarDays size={15} aria-hidden="true" /></span>
            <span>Aucun séjour à venir chargé</span>
          </div>
        )}
        <Link href="/dashboard/owner/planning" className={styles.textLink}>
          Voir le planning <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>

      <section className={styles.register} aria-labelledby="housing-register-title">
        <div className={styles.registerHead}>
          <div>
            <h2 id="housing-register-title">{registerHeading}</h2>
            <p>Retrouvez les informations essentielles de chaque fiche.</p>
          </div>
          <span className={styles.registerCount}>{items.length} logement{items.length > 1 ? "s" : ""} affiché{items.length > 1 ? "s" : ""}</span>
        </div>

        <div className={styles.filterBar}>
          <label className={styles.searchField}>
            <Search size={16} aria-hidden="true" />
            <Input
              bare
              aria-label="Rechercher un logement"
              placeholder="Rechercher un logement ou une ville…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={styles.searchInput}
            />
          </label>
          <div className={styles.filterTabs} aria-label="Filtrer les logements">
            <Link
              href="/dashboard/owner/logements"
              className={`${styles.filterTab} ${!props.isReviewMode ? styles.activeFilter : ""}`}
              onClick={() => props.onFilter("")}
            >
              Tous
            </Link>
            <Link
              href="/dashboard/owner/logements?filter=review"
              className={`${styles.filterTab} ${props.isReviewMode ? styles.activeFilter : ""}`}
              onClick={() => props.onFilter("review")}
            >
              À revoir ({props.reviewCount})
            </Link>
          </div>
        </div>

        {props.loading ? (
          <div className={styles.loadingState} role="status">
            <span>Chargement des logements...</span>
            <div className={styles.cardSkeletons} aria-hidden="true">
              <div /><div />
            </div>
          </div>
        ) : props.error ? null : items.length > 0 ? (
          <div className={styles.cards}>{props.renderCards(items, nextStay, props.isReviewMode ? undefined : addCard)}</div>
        ) : (
          <div className={styles.emptyResults}>
            <ClipboardCheck aria-hidden="true" />
            <h3>{props.isReviewMode && props.total > 0 ? "Aucune fiche n’est à revoir." : "Aucun logement trouvé"}</h3>
            <p>
              {props.isReviewMode && props.total > 0
                ? "Toutes les fiches de votre parc sont à jour."
                : props.total > 0
                  ? "Modifiez votre recherche ou consultez tous les logements."
                  : "Ajoutez votre premier logement pour préparer son suivi."}
            </p>
            {props.isReviewMode && props.total > 0 ? (
              <ButtonLink
                href="/dashboard/owner/logements"
                variant="secondary"
                onClick={() => props.onFilter("")}
              >
                Voir tous les logements
              </ButtonLink>
            ) : (
              <ButtonLink href={props.total > 0 ? "/dashboard/owner/logements" : props.addHref} variant="secondary">
                {props.total > 0 ? "Réinitialiser la recherche" : "Ajouter mon premier logement"}
              </ButtonLink>
            )}
          </div>
        )}
      </section>

      <footer className={styles.help}>
        <div>
          <h2>Besoin d’aide pour gérer vos logements ?</h2>
          <p>Échangez avec votre conciergerie pour organiser les prochaines étapes.</p>
        </div>
        <ButtonLink href="/dashboard/owner/messages?scope=conciergeries" variant="secondary">
          <MessageCircle size={16} aria-hidden="true" />
          Contacter ma concierge
        </ButtonLink>
      </footer>
    </div>
  );
}
