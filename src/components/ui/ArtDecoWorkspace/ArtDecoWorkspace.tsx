"use client";

import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BadgeCheck,
  CalendarCheck,
  Euro,
  FileText,
  Home,
  MapPin,
  Route,
  Search,
  Sparkles,
} from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import styles from "./ArtDecoWorkspace.module.scss";

type MetricIconName = "money" | "missions" | "homes" | "quote";

export type LiveMetric = {
  label: string;
  value: string;
  icon: MetricIconName;
};

export type ArtDecoSearchItem = {
  id: string;
  title: string;
  category: string;
  place: string;
  detail: string;
  meta: string;
};

export type ArtDecoQuote = {
  name: string;
  price: string;
  items: readonly string[];
  detail: string;
  action: string;
};

const metricIcons = {
  money: Euro,
  missions: CalendarCheck,
  homes: Home,
  quote: FileText,
} as const;

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();

const getPinLabel = (index: number) => String.fromCharCode(65 + (index % 26));

function getPinPosition(index: number) {
  const positions = [
    { left: "20%", top: "20%" },
    { left: "55%", top: "45%" },
    { left: "30%", top: "70%" },
    { left: "72%", top: "18%" },
    { left: "70%", top: "72%" },
    { left: "12%", top: "52%" },
  ];

  return positions[index % positions.length];
}

function ResultCard({
  item,
  optionId,
  pinLabel,
  selected,
  onSelect,
}: {
  item: ArtDecoSearchItem;
  optionId: string;
  pinLabel: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      id={optionId}
      className={styles.resultCard}
      role="option"
      aria-selected={selected}
      data-selected={selected}
    >
      <h4>{item.title}</h4>

      <p>
        <MapPin size={15} aria-hidden="true" />
        {item.place}
      </p>

      <span>{item.category}</span>
      <strong>{item.meta}</strong>

      <Button
        type="button"
        variant="ghost"
        aria-label={`Ouvrir l’aperçu ${pinLabel} : ${item.title}`}
        onClick={onSelect}
      >
        Ouvrir l’aperçu {pinLabel}
      </Button>
    </article>
  );
}

function QuoteRadioCard({
  option,
  index,
  selected,
  groupName,
  onSelect,
}: {
  option: ArtDecoQuote;
  index: number;
  selected: boolean;
  groupName: string;
  onSelect: (index: number) => void;
}) {
  const inputId = `${groupName}-${index}`;

  return (
    <label
      htmlFor={inputId}
      className={styles.quoteCard}
      data-selected={selected}
    >
      <input
        id={inputId}
        className={styles.quoteRadio}
        type="radio"
        name={groupName}
        value={option.name}
        checked={selected}
        onChange={() => onSelect(index)}
      />

      <span className={styles.quoteCardContent}>
        <span className={styles.quoteCardHeader}>
          <span className={styles.quoteCardTitle}>{option.name}</span>
          <strong className={styles.price}>{option.price}</strong>
        </span>

        <span className={styles.quoteCardList}>
          {option.items.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </span>

        <span className={styles.quoteCardAction}>
          Voir l’offre {option.name}
        </span>
      </span>
    </label>
  );
}

export function ArtDecoLiveDashboard({
  metrics,
  detail,
}: {
  metrics: readonly LiveMetric[];
  detail: string;
}) {
  return (
    <section
      className={styles.live}
      aria-label="Tableau de bord live"
      data-live-dashboard
      data-wide={metrics.length > 2}
    >
      <header>
        <strong>Tableau de bord live</strong>
        <BadgeCheck size={20} aria-hidden="true" />
      </header>

      <p className={styles.liveNote}>Aperçu de démonstration</p>

      <div className={styles.metrics}>
        {metrics.map((metric) => {
          const Icon = metricIcons[metric.icon];

          return (
            <article key={metric.label}>
              <Icon size={22} aria-hidden="true" />
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          );
        })}
      </div>

      <div className={styles.route}>
        <div className={styles.map} aria-hidden="true">
          <span className={styles.pinA}>A</span>
          <span className={styles.pinB}>B</span>
          <span className={styles.pinC}>C</span>
        </div>

        <div>
          <Route size={22} aria-hidden="true" />
          <strong>Tournée à préparer</strong>
          <p>{detail}</p>
        </div>
      </div>
    </section>
  );
}

export function ArtDecoSmartSearch({
  scope,
  items,
}: {
  scope: string;
  items: readonly ArtDecoSearchItem[];
}) {
  const id = useId();
  const listboxId = `${id}-results`;
  const typeAheadBuffer = useRef("");
  const typeAheadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [place, setPlace] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))],
    [items]
  );

  const results = useMemo(() => {
    const words = normalize(submitted).split(/\s+/).filter(Boolean);
    const normalizedPlace = normalize(place);

    return items.filter((item) => {
      const searchableText = normalize(
        `${item.title} ${item.category} ${item.place} ${item.detail} ${item.meta}`
      );

      const matchesQuery = words.every((word) => searchableText.includes(word));
      const matchesPlace = normalize(item.place).includes(normalizedPlace);
      const matchesCategory = category === "all" || category === item.category;

      return matchesQuery && matchesPlace && matchesCategory;
    });
  }, [items, submitted, place, category]);

  const selectedIndex = results.findIndex((item) => item.id === selectedId);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const active = results[activeIndex] ?? null;

  useEffect(() => {
    if (results.length === 0) {
      setSelectedId(null);
      return;
    }

    const currentSelectionStillExists = results.some(
      (item) => item.id === selectedId
    );

    if (!currentSelectionStillExists) {
      setSelectedId(results[0].id);
    }
  }, [results, selectedId]);

  useEffect(() => {
    return () => {
      if (typeAheadTimeout.current) {
        clearTimeout(typeAheadTimeout.current);
      }
    };
  }, []);

  const selectResult = (index: number) => {
    const result = results[index];

    if (!result) return;

    setSelectedId(result.id);
  };

  const clearFilters = () => {
    setQuery("");
    setSubmitted("");
    setPlace("");
    setCategory("all");
    setSelectedId(null);
  };

  const handleResultsKeyDown = (
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (results.length === 0) return;

    const currentIndex = Math.max(0, activeIndex);
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        nextIndex = (currentIndex + 1) % results.length;
        break;

      case "ArrowUp":
        event.preventDefault();
        nextIndex = (currentIndex - 1 + results.length) % results.length;
        break;

      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;

      case "End":
        event.preventDefault();
        nextIndex = results.length - 1;
        break;

      case "Enter":
      case " ":
        event.preventDefault();
        selectResult(currentIndex);
        return;

      default:
        break;
    }

    if (nextIndex !== null) {
      selectResult(nextIndex);
      return;
    }

    const isTypingCharacter =
      event.key.length === 1 && /[\p{L}\p{N}]/u.test(event.key);

    if (!isTypingCharacter) return;

    typeAheadBuffer.current += normalize(event.key);

    const matchIndex = results.findIndex((item) =>
      normalize(item.title).startsWith(typeAheadBuffer.current)
    );

    if (matchIndex >= 0) {
      event.preventDefault();
      selectResult(matchIndex);
    }

    if (typeAheadTimeout.current) {
      clearTimeout(typeAheadTimeout.current);
    }

    typeAheadTimeout.current = setTimeout(() => {
      typeAheadBuffer.current = "";
      typeAheadTimeout.current = null;
    }, 600);
  };

  return (
    <section
      className={styles.panel}
      aria-labelledby={`${id}-heading`}
      data-smart-search
    >
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Recherche intelligente</span>

          <h3 id={`${id}-heading`} className={styles.title}>
            Rechercher, filtrer, retrouver
          </h3>
        </div>

        <Search size={24} aria-hidden="true" />
      </header>

      <p className={styles.copy}>{scope}</p>

      <form
        className={styles.searchBar}
        role="search"
        aria-label={`Recherche intelligente — ${scope}`}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(query);
          setSelectedId(null);
        }}
      >
        <Search size={20} aria-hidden="true" />

        <Input
          bare
          aria-label="Rechercher dans cet espace"
          placeholder="Nom, logement, service ou dossier…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      <div className={styles.searchGrid}>
        <aside className={styles.filters} aria-label="Filtres de recherche">
          <Input
            id={`${id}-place`}
            label="Localisation"
            placeholder="Toutes les villes"
            value={place}
            onChange={(event) => {
              setPlace(event.target.value);
              setSelectedId(null);
            }}
          />

          <Select
            id={`${id}-category`}
            label="Type de résultat"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setSelectedId(null);
            }}
          >
            <option value="all">Tous les types</option>

            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>

          <Button type="button" variant="ghost" onClick={clearFilters}>
            Effacer la recherche
          </Button>
        </aside>

        <div>
          <p className={styles.count} aria-live="polite">
            {results.length} résultat(s) de démonstration
          </p>

          {results.length > 0 ? (
            <div
              id={listboxId}
              className={styles.results}
              role="listbox"
              tabIndex={0}
              aria-label="Résultats de recherche"
              aria-activedescendant={`${listboxId}-option-${active.id}`}
              onKeyDown={handleResultsKeyDown}
            >
              {results.map((item, index) => (
                <ResultCard
                  key={item.id}
                  item={item}
                  optionId={`${listboxId}-option-${item.id}`}
                  pinLabel={getPinLabel(index)}
                  selected={item.id === active.id}
                  onSelect={() => selectResult(index)}
                />
              ))}
            </div>
          ) : (
            <p className={styles.emptyState} role="status">
              Aucun résultat. Essayez un autre terme ou effacez les filtres.
            </p>
          )}
        </div>

        <aside className={styles.mapColumn} aria-label="Repères des résultats">
          <div className={styles.map}>
            {results.map((item, index) => {
              const isSelected = item.id === active?.id;
              const pinLabel = getPinLabel(index);

              return (
                <button
                  key={item.id}
                  type="button"
                  className={styles.mapPin}
                  style={getPinPosition(index)}
                  aria-label={`Afficher l’aperçu ${pinLabel} : ${item.title}`}
                  aria-pressed={isSelected}
                  onClick={() => selectResult(index)}
                >
                  {pinLabel}
                </button>
              );
            })}
          </div>

          <p>Repères illustratifs, sans géolocalisation réelle.</p>
        </aside>
      </div>

      {active && (
        <div
          className={styles.preview}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <strong>{active.title}</strong>
          <p>{active.detail}</p>
          <p>Aperçu fictif ; aucune action enregistrée.</p>
        </div>
      )}
    </section>
  );
}

export function ArtDecoQuotes({
  title,
  options,
  onAction,
}: {
  title: string;
  options: readonly ArtDecoQuote[];
  onAction?: (quote: ArtDecoQuote) => void;
}) {
  const id = useId();
  const groupName = `${id}-quote-options`;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notice, setNotice] = useState("");

  const selected = options[selectedIndex];

  if (!selected) {
    return null;
  }

  const selectQuote = (index: number) => {
    setSelectedIndex(index);
    setNotice("");
  };

  return (
    <section
      className={styles.panel}
      aria-labelledby={`${id}-quotes-title`}
      data-dynamic-quotes
    >
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Devis dynamique</span>

          <h3 id={`${id}-quotes-title`} className={styles.title}>
            {title}
          </h3>
        </div>

        <Sparkles size={24} aria-hidden="true" />
      </header>

      <fieldset className={styles.quoteFieldset}>
        <legend className={styles.srOnly}>
          Choisir une offre pour {title}
        </legend>

        <div className={styles.packs}>
          {options.map((option, index) => (
            <QuoteRadioCard
              key={option.name}
              option={option}
              index={index}
              groupName={groupName}
              selected={selectedIndex === index}
              onSelect={selectQuote}
            />
          ))}
        </div>
      </fieldset>

      <div
        className={styles.offer}
        data-quote-details
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <strong>
          {selected.name} · {selected.price}
        </strong>

        <p>{selected.detail}</p>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (onAction) {
              onAction(selected);
              return;
            }

            setNotice(
              `${selected.action} — démonstration, aucun message envoyé ni devis enregistré.`
            );
          }}
        >
          {selected.action}
        </Button>
      </div>

      <p className={styles.copy}>
        Montants et conditions illustratifs. La sélection d’une offre modifie
        uniquement cet aperçu : aucun devis n’est accepté ou envoyé.
      </p>

      {notice && (
        <p className={styles.notice} role="status" aria-live="polite">
          {notice}
        </p>
      )}
    </section>
  );
}