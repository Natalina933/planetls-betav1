"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { AdminTone } from "./AdminOperations";
import styles from "./AdminVisuals.module.scss";

type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

type BubbleItem = {
  id: string;
  label: string;
  value: number | string;
  tone?: AdminTone;
  icon: IconType;
  href?: string;
};

type AdminVisualDecoration = {
  illustrationSrc?: string;
  illustrationAlt?: string;
  textureSrc?: string;
  accentColor?: string;
};

function totalize(segments: DonutSegment[]) {
  return segments.reduce((sum, segment) => sum + segment.value, 0);
}

function percentOf(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function resolveSegmentTone(label: string): AdminTone {
  const normalized = label.toLowerCase();
  if (normalized.includes("crit")) return "danger";
  if (normalized.includes("suivre")) return "warning";
  if (normalized.includes("sain")) return "positive";
  return "neutral";
}

function resolveToneLabel(tone: AdminTone) {
  if (tone === "positive") return "Stable";
  if (tone === "warning") return "Sous tension";
  if (tone === "danger") return "Critique";
  return "Neutre";
}

function VisualDecoration({
  illustrationSrc,
  illustrationAlt,
  textureSrc,
  accentColor,
}: AdminVisualDecoration) {
  if (!illustrationSrc && !textureSrc) return null;

  return (
    <div
      className={styles.mediaLayer}
      aria-hidden="true"
      style={accentColor ? ({ "--admin-visual-accent": accentColor } as CSSProperties) : undefined}
    >
      {textureSrc ? (
        <div className={styles.textureWrap}>
          <Image src={textureSrc} alt="" fill className={styles.textureImage} />
        </div>
      ) : null}
      {illustrationSrc ? (
        <div className={styles.illustrationWrap}>
          <Image
            src={illustrationSrc}
            alt={illustrationAlt ?? ""}
            fill
            className={styles.illustrationImage}
            sizes="140px"
          />
        </div>
      ) : null}
    </div>
  );
}

export function AdminDonutCard({
  title,
  subtitle,
  icon: Icon,
  segments,
  totalLabel = "total",
  illustrationSrc,
  illustrationAlt,
  textureSrc,
  accentColor,
}: {
  title: string;
  subtitle: string;
  icon: IconType;
  segments: DonutSegment[];
  totalLabel?: string;
} & AdminVisualDecoration) {
  const legendId = useId();
  const [legendOpen, setLegendOpen] = useState(false);
  const total = totalize(segments);
  const primarySegment = [...segments].sort((left, right) => right.value - left.value)[0];
  const primaryTone = primarySegment ? resolveSegmentTone(primarySegment.label) : "neutral";

  useEffect(() => {
    if (window.matchMedia("(min-width: 980px)").matches) {
      setLegendOpen(true);
    }
  }, []);

  return (
    <article className={styles.donutCard}>
      <VisualDecoration
        illustrationSrc={illustrationSrc}
        illustrationAlt={illustrationAlt}
        textureSrc={textureSrc}
        accentColor={accentColor}
      />
      <div className={styles.cardInner}>
        <div className={styles.donutHeader}>
          <div>
            <div className={styles.headerMetaRow}>
              <span className={styles.cardEyebrow}>Lecture immédiate</span>
              <span className={`${styles.toneBadge} ${styles[`toneBadge_${primaryTone}`]}`}>
                {resolveToneLabel(primaryTone)}
              </span>
            </div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <span className={styles.iconBadge}>
            <Icon />
          </span>
        </div>

        <div className={styles.artDecoDivider} aria-hidden="true">
          <span />
        </div>

        <div className={styles.chartRow}>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  strokeWidth={0}
                  paddingAngle={2}
                >
                  {segments.map((segment) => (
                    <Cell key={segment.label} fill={segment.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.chartCenter}>
              <strong className={total === 0 ? styles.chartCenterEmpty : ""}>{total}</strong>
              <span>{totalLabel}</span>
              <small>{primarySegment?.label ?? "Aucun signal"}</small>
            </div>
          </div>
        </div>

        <div className={styles.legendPanelInline}>
          <button
            type="button"
            className={styles.legendToggle}
            aria-expanded={legendOpen}
            aria-controls={legendId}
            onClick={() => setLegendOpen((current) => !current)}
          >
            <span>Légende du camembert</span>
            <span className={`${styles.legendChevron} ${legendOpen ? styles.legendChevronOpen : ""}`} aria-hidden="true">
              ^
            </span>
          </button>

          {legendOpen ? (
            <div id={legendId} className={styles.legend}>
              {segments.map((segment) => (
                <div key={segment.label} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: segment.color }} />
                  <div className={styles.legendText}>
                    <span className={styles.legendLabel}>{segment.label}</span>
                    <small>{percentOf(segment.value, total)}%</small>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function AdminBubblePanel({
  title,
  subtitle,
  items,
  illustrationSrc,
  illustrationAlt,
  textureSrc,
  accentColor,
}: {
  title: string;
  subtitle: string;
  items: BubbleItem[];
} & AdminVisualDecoration) {
  return (
    <section className={styles.bubblePanel}>
      <VisualDecoration
        illustrationSrc={illustrationSrc}
        illustrationAlt={illustrationAlt}
        textureSrc={textureSrc}
        accentColor={accentColor}
      />
      <div className={styles.cardInner}>
        <div className={styles.bubbleHeader}>
          <div className={styles.headerMetaRow}>
            <span className={styles.cardEyebrow}>Signaux immédiats</span>
            <span className={`${styles.toneBadge} ${styles.toneBadge_warning}`}>À traiter vite</span>
          </div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        <div className={styles.artDecoDivider} aria-hidden="true">
          <span />
        </div>

        <div className={styles.bubbleList}>
          {items.map((item) => {
            const Icon = item.icon;
            const toneClass =
              item.tone === "positive"
                ? styles.tonePositive
                : item.tone === "warning"
                  ? styles.toneWarning
                  : item.tone === "danger"
                    ? styles.toneDanger
                    : styles.toneNeutral;

            const content = (
              <article className={`${styles.bubble} ${toneClass}`}>
                <div className={styles.bubbleTop}>
                  <span className={styles.bubbleIcon}>
                    <Icon />
                  </span>
                  <span className={styles.bubbleLabel}>{item.label}</span>
                </div>
                <strong className={styles.bubbleValue}>{item.value}</strong>
              </article>
            );

            return item.href ? (
              <Link key={item.id} href={item.href} className={styles.bubbleLink}>
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AdminGaugeCard({
  title,
  subtitle,
  icon: Icon,
  value,
  total,
  tone = "neutral",
  illustrationSrc,
  illustrationAlt,
  textureSrc,
  accentColor,
}: {
  title: string;
  subtitle: string;
  icon: IconType;
  value: number;
  total: number;
  tone?: AdminTone;
} & AdminVisualDecoration) {
  const percent = total > 0 ? Math.max(0, Math.min(100, Math.round((value / total) * 100))) : 0;
  const stroke =
    tone === "positive"
      ? "#1f9d55"
      : tone === "warning"
        ? "#f59e0b"
        : tone === "danger"
          ? "#ef4444"
          : "#64748b";
  const toneLabel =
    tone === "positive"
      ? "Exploitable"
      : tone === "warning"
        ? "À surveiller"
        : tone === "danger"
          ? "Bloquant"
          : "Neutre";

  return (
    <article className={styles.gaugeCard}>
      <VisualDecoration
        illustrationSrc={illustrationSrc}
        illustrationAlt={illustrationAlt}
        textureSrc={textureSrc}
        accentColor={accentColor}
      />
      <div className={styles.cardInner}>
        <div className={styles.donutHeader}>
          <div>
            <div className={styles.headerMetaRow}>
              <span className={styles.cardEyebrow}>Indice de fiabilité</span>
              <span className={`${styles.toneBadge} ${styles[`toneBadge_${tone}`]}`}>
                {toneLabel}
              </span>
            </div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <span className={styles.iconBadge}>
            <Icon />
          </span>
        </div>

        <div className={styles.artDecoDivider} aria-hidden="true">
          <span />
        </div>

        <div className={styles.gaugeWrap}>
          <svg viewBox="0 0 120 120" className={styles.gaugeSvg} aria-hidden="true">
            <circle cx="60" cy="60" r="42" className={styles.gaugeTrack} />
            <circle
              cx="60"
              cy="60"
              r="42"
              className={styles.gaugeProgress}
              style={{
                stroke,
                strokeDasharray: `${Math.PI * 2 * 42}`,
                strokeDashoffset: `${Math.PI * 2 * 42 * (1 - percent / 100)}`,
              }}
            />
          </svg>
          <div className={styles.gaugeCenter}>
            <strong>{percent}%</strong>
            <span>
              {value}/{total}
            </span>
            <small>{toneLabel}</small>
          </div>
        </div>
      </div>
    </article>
  );
}

export function AdminToneLegend({
  illustrationSrc,
  illustrationAlt,
  textureSrc,
  accentColor,
}: AdminVisualDecoration) {
  return (
    <section className={styles.legendPanel}>
      <VisualDecoration
        illustrationSrc={illustrationSrc}
        illustrationAlt={illustrationAlt}
        textureSrc={textureSrc}
        accentColor={accentColor}
      />
      <div className={styles.cardInner}>
        <div className={styles.bubbleHeader}>
          <div className={styles.headerMetaRow}>
            <span className={styles.cardEyebrow}>Référence commune</span>
            <span className={styles.toneBadge}>Palette admin</span>
          </div>
          <h3>Légende visuelle</h3>
          <p>Un seul code couleur pour toute la lecture visuelle.</p>
        </div>

        <div className={styles.artDecoDivider} aria-hidden="true">
          <span />
        </div>

        <div className={styles.toneLegendRow}>
          <div className={styles.toneLegendItem}>
            <span className={`${styles.legendDot} ${styles.tonePositive}`} />
            <strong>Vert</strong>
            <small>Exploitable</small>
          </div>
          <div className={styles.toneLegendItem}>
            <span className={`${styles.legendDot} ${styles.toneWarning}`} />
            <strong>Orange</strong>
            <small>À suivre</small>
          </div>
          <div className={styles.toneLegendItem}>
            <span className={`${styles.legendDot} ${styles.toneDanger}`} />
            <strong>Rouge</strong>
            <small>Blocage</small>
          </div>
        </div>
      </div>
    </section>
  );
}
