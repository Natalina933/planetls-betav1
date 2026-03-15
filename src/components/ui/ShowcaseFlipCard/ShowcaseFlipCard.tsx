"use client";

import React from "react";
import clsx from "clsx";
import styles from "./ShowcaseFlipCard.module.scss";

export type ShowcaseFlipCardSize = "standard" | "wide" | "heroWide" | "tall";
export type ShowcaseFlipCardPosterTone = "gold" | "navy" | "emerald" | "plum" | "copper";
export type ShowcaseFlipCardPosterLayout = "classic" | "sunrise" | "gallery" | "ornate";
type ShowcasePosterTheme = "default" | "art-deco" | "mucha-dark";

export interface ShowcaseFlipCardProps {
  title: string;
  description: string;
  quote: string;
  posterLabel?: string;
  posterTone?: ShowcaseFlipCardPosterTone;
  posterLayout?: ShowcaseFlipCardPosterLayout;
  icon: React.ElementType | null;
  isFlipped: boolean;
  onToggle: () => void;
  size?: ShowcaseFlipCardSize;
  className?: string;
}

type PosterPalette = {
  start: string;
  end: string;
  accent: string;
  ink: string;
};

type PosterThemePalette = PosterPalette & {
  haloOpacity: string;
  quotePanelFill: string;
  quotePanelOpacity: string;
  quoteInk: string;
};

type QuoteConfig = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  innerX: number;
  innerY: number;
  innerWidth: number;
  innerHeight: number;
  innerRadius: number;
  glyphX: number;
  glyphY: number;
  glyphSize: number;
  textX: number;
  textY: number;
  fontSize: number;
  maxLineLength: number;
};

type RuleConfig = {
  x1: number;
  x2: number;
  y: number;
};

type PosterLayoutConfig = {
  wordmarkX: number;
  wordmarkY: number;
  titleX: number;
  titleY: number;
  line1: RuleConfig;
  line2: RuleConfig;
  line3: RuleConfig;
  line4: RuleConfig;
  quote: QuoteConfig;
  ornaments: (themeConfig: PosterThemePalette) => string;
};

const POSTER_TONES: Record<ShowcaseFlipCardPosterTone, PosterPalette> = {
  gold: { start: "#4f3815", end: "#1f160b", accent: "#d7b25b", ink: "#fff0c7" },
  navy: { start: "#243246", end: "#101823", accent: "#d6b76b", ink: "#f4f0e8" },
  emerald: { start: "#26453d", end: "#0d1f1c", accent: "#d9bb74", ink: "#eef6ef" },
  plum: { start: "#4b2a39", end: "#1d1017", accent: "#ddb175", ink: "#f9edf2" },
  copper: { start: "#5a3525", end: "#22130d", accent: "#e0b17f", ink: "#fff1e3" },
};

const QUOTE_GLYPH = "&#8220;";

function getPosterTheme(): ShowcasePosterTheme {
  if (typeof document === "undefined") {
    return "default";
  }

  const theme = document.documentElement.getAttribute("data-theme");
  if (theme === "art-deco" || theme === "mucha-dark") {
    return theme;
  }

  return "default";
}

function getPosterWordmarkSize(label: string) {
  const length = label.length;
  if (length >= 12) return 74;
  if (length >= 10) return 82;
  if (length >= 8) return 94;
  return 108;
}

function splitQuoteLines(quote: string, maxLineLength: number) {
  const words = quote.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxLineLength) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 4);
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getPosterThemeConfig(theme: ShowcasePosterTheme, palette: PosterPalette): PosterThemePalette {
  if (theme === "art-deco") {
    return {
      start: "#efe3cb",
      end: "#d8c099",
      accent: "#8c6830",
      ink: "#302116",
      haloOpacity: "0.22",
      quotePanelFill: "#fff9ee",
      quotePanelOpacity: "0.88",
      quoteInk: "#2f2418",
    };
  }

  if (theme === "mucha-dark") {
    return {
      start: "#171f2c",
      end: "#0c121b",
      accent: "#d7b25b",
      ink: "#f7f0df",
      haloOpacity: "0.36",
      quotePanelFill: "#111a25",
      quotePanelOpacity: "0.78",
      quoteInk: "#fff6e6",
    };
  }

  return {
    ...palette,
    haloOpacity: "0.32",
    quotePanelFill: "#1a1008",
    quotePanelOpacity: "0.38",
    quoteInk: palette.ink,
  };
}

function getPosterLayoutConfig(layout: ShowcaseFlipCardPosterLayout): PosterLayoutConfig {
  const base: PosterLayoutConfig = {
    wordmarkX: 86,
    wordmarkY: 465,
    titleX: 88,
    titleY: 548,
    line1: { x1: 88, x2: 712, y: 620 },
    line2: { x1: 88, x2: 580, y: 668 },
    line3: { x1: 88, x2: 640, y: 706 },
    line4: { x1: 88, x2: 520, y: 744 },
    quote: {
      x: 392,
      y: 640,
      width: 344,
      height: 244,
      radius: 24,
      innerX: 410,
      innerY: 658,
      innerWidth: 308,
      innerHeight: 208,
      innerRadius: 18,
      glyphX: 434,
      glyphY: 710,
      glyphSize: 58,
      textX: 442,
      textY: 748,
      fontSize: 26,
      maxLineLength: 34,
    },
    ornaments: (themeConfig) => `
      <circle cx="620" cy="150" r="220" fill="url(#halo)" />
      <path d="M120 280 C 250 140, 520 160, 650 300" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.4" stroke-width="3"/>
      <path d="M155 330 C 290 220, 500 235, 625 352" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.22" stroke-width="2"/>
      <circle cx="610" cy="275" r="88" fill="url(#sun)" opacity="0.72"/>
      <path d="M108 904 C 178 812, 238 776, 312 748 C 376 724, 456 716, 528 742 C 602 768, 666 820, 722 902 L 722 970 L 108 970 Z" fill="${themeConfig.end}" fill-opacity="0.72"/>
      <path d="M124 884 C 212 776, 290 748, 348 736 C 428 718, 518 734, 586 774 C 644 808, 690 850, 718 886" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.26" stroke-width="3"/>
      <path d="M202 858 C 230 774, 252 702, 266 616" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.28" stroke-width="5" stroke-linecap="round"/>
      <path d="M266 616 C 234 570, 212 524, 196 474" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.24" stroke-width="4" stroke-linecap="round"/>
      <path d="M266 616 C 306 584, 336 546, 356 498" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.24" stroke-width="4" stroke-linecap="round"/>
      <path d="M262 640 C 214 636, 166 644, 116 670" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.24" stroke-width="4" stroke-linecap="round"/>
      <path d="M282 644 C 330 648, 374 666, 418 700" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.24" stroke-width="4" stroke-linecap="round"/>
      <path d="M532 864 C 558 774, 582 694, 596 606" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.22" stroke-width="5" stroke-linecap="round"/>
      <path d="M596 606 C 566 558, 544 514, 528 462" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.2" stroke-width="4" stroke-linecap="round"/>
      <path d="M596 606 C 632 574, 660 536, 678 492" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.2" stroke-width="4" stroke-linecap="round"/>
      <path d="M590 632 C 548 628, 508 638, 464 660" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.2" stroke-width="4" stroke-linecap="round"/>
      <path d="M606 636 C 648 642, 688 658, 724 686" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.2" stroke-width="4" stroke-linecap="round"/>
    `,
  };

  if (layout === "sunrise") {
    return {
      ...base,
      wordmarkY: 438,
      titleY: 520,
      line1: { x1: 88, x2: 694, y: 588 },
      line2: { x1: 88, x2: 548, y: 636 },
      line3: { x1: 88, x2: 610, y: 674 },
      line4: { x1: 88, x2: 496, y: 712 },
      quote: {
        x: 96,
        y: 724,
        width: 608,
        height: 170,
        radius: 26,
        innerX: 114,
        innerY: 742,
        innerWidth: 572,
        innerHeight: 134,
        innerRadius: 18,
        glyphX: 140,
        glyphY: 788,
        glyphSize: 58,
        textX: 166,
        textY: 790,
        fontSize: 28,
        maxLineLength: 52,
      },
      ornaments: (themeConfig) => `
        <circle cx="618" cy="194" r="248" fill="url(#halo)" />
        <circle cx="604" cy="296" r="132" fill="url(#sun)" opacity="0.78"/>
        <path d="M78 516 C 190 404, 338 372, 460 390 C 598 410, 688 484, 740 590" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.28" stroke-width="3"/>
        <path d="M78 900 C 204 768, 328 714, 466 722 C 596 730, 690 796, 742 900 L 742 970 L 78 970 Z" fill="${themeConfig.end}" fill-opacity="0.7"/>
        <path d="M150 854 C 214 760, 264 666, 286 556" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.24" stroke-width="4" stroke-linecap="round"/>
        <path d="M286 556 C 246 512, 214 470, 192 420" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.2" stroke-width="3" stroke-linecap="round"/>
        <path d="M286 556 C 330 530, 378 496, 418 446" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.18" stroke-width="3" stroke-linecap="round"/>
        <path d="M590 878 C 614 776, 634 694, 646 598" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.24" stroke-width="4" stroke-linecap="round"/>
        <path d="M646 598 C 622 556, 602 514, 590 466" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.18" stroke-width="3" stroke-linecap="round"/>
        <path d="M646 598 C 684 566, 714 532, 734 492" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.18" stroke-width="3" stroke-linecap="round"/>
      `,
    };
  }

  if (layout === "gallery") {
    return {
      ...base,
      wordmarkX: 112,
      wordmarkY: 428,
      titleX: 114,
      titleY: 512,
      line1: { x1: 114, x2: 706, y: 582 },
      line2: { x1: 114, x2: 524, y: 630 },
      line3: { x1: 114, x2: 572, y: 668 },
      line4: { x1: 114, x2: 468, y: 706 },
      quote: {
        x: 446,
        y: 150,
        width: 256,
        height: 428,
        radius: 26,
        innerX: 462,
        innerY: 168,
        innerWidth: 224,
        innerHeight: 392,
        innerRadius: 20,
        glyphX: 488,
        glyphY: 234,
        glyphSize: 64,
        textX: 486,
        textY: 286,
        fontSize: 25,
        maxLineLength: 20,
      },
      ornaments: (themeConfig) => `
        <circle cx="162" cy="164" r="186" fill="url(#halo)" />
        <rect x="96" y="156" width="278" height="178" rx="22" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.28" stroke-width="2"/>
        <rect x="118" y="176" width="234" height="136" rx="16" fill="none" stroke="${themeConfig.ink}" stroke-opacity="0.14" stroke-width="1.5"/>
        <path d="M92 844 C 164 724, 246 654, 360 620 C 462 590, 560 598, 678 660" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.26" stroke-width="3"/>
        <path d="M98 898 C 196 770, 306 714, 442 714 C 566 714, 664 760, 730 844 L 730 970 L 98 970 Z" fill="${themeConfig.end}" fill-opacity="0.68"/>
        <path d="M176 874 C 212 772, 242 686, 258 586" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.22" stroke-width="4" stroke-linecap="round"/>
        <path d="M258 586 C 226 552, 198 512, 176 462" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.18" stroke-width="3" stroke-linecap="round"/>
        <path d="M258 586 C 300 562, 340 532, 376 494" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.18" stroke-width="3" stroke-linecap="round"/>
      `,
    };
  }

  if (layout === "ornate") {
    return {
      ...base,
      wordmarkX: 94,
      wordmarkY: 444,
      titleX: 96,
      titleY: 528,
      line1: { x1: 96, x2: 694, y: 596 },
      line2: { x1: 96, x2: 548, y: 642 },
      line3: { x1: 96, x2: 612, y: 680 },
      line4: { x1: 96, x2: 472, y: 718 },
      quote: {
        x: 118,
        y: 716,
        width: 564,
        height: 174,
        radius: 28,
        innerX: 136,
        innerY: 734,
        innerWidth: 528,
        innerHeight: 138,
        innerRadius: 20,
        glyphX: 160,
        glyphY: 784,
        glyphSize: 60,
        textX: 188,
        textY: 786,
        fontSize: 27,
        maxLineLength: 48,
      },
      ornaments: (themeConfig) => `
        <circle cx="620" cy="162" r="210" fill="url(#halo)" />
        <circle cx="610" cy="256" r="92" fill="url(#sun)" opacity="0.68"/>
        <path d="M124 868 C 178 756, 226 654, 256 540" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.26" stroke-width="5" stroke-linecap="round"/>
        <path d="M256 540 C 222 502, 194 458, 176 404" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.2" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M256 540 C 298 510, 344 470, 378 420" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.2" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M246 566 C 194 562, 154 574, 108 608" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.18" stroke-width="3" stroke-linecap="round"/>
        <path d="M268 572 C 316 580, 362 602, 410 640" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.18" stroke-width="3" stroke-linecap="round"/>
        <path d="M574 860 C 604 752, 626 650, 642 536" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.24" stroke-width="5" stroke-linecap="round"/>
        <path d="M642 536 C 612 496, 590 454, 572 404" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.18" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M642 536 C 678 502, 710 466, 734 420" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.18" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M632 562 C 586 558, 542 570, 498 598" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.16" stroke-width="3" stroke-linecap="round"/>
        <path d="M652 568 C 696 576, 734 594, 768 624" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.16" stroke-width="3" stroke-linecap="round"/>
        <path d="M96 892 C 188 782, 286 730, 410 730 C 532 730, 632 778, 712 878 L 712 970 L 96 970 Z" fill="${themeConfig.end}" fill-opacity="0.66"/>
      `,
    };
  }

  return base;
}

function buildPosterDataUri(
  label: string,
  title: string,
  quote: string,
  tone: ShowcaseFlipCardPosterTone,
  theme: ShowcasePosterTheme,
  layout: ShowcaseFlipCardPosterLayout,
) {
  const palette = POSTER_TONES[tone];
  const themeConfig = getPosterThemeConfig(theme, palette);
  const layoutConfig = getPosterLayoutConfig(layout);
  const wordmarkSize = getPosterWordmarkSize(label);
  const quoteLines = splitQuoteLines(quote, layoutConfig.quote.maxLineLength);
  const quoteTspans = quoteLines
    .map((line, index) => {
      const dy = index === 0 ? "0" : "34";
      return `<tspan x="${layoutConfig.quote.textX}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${themeConfig.start}" />
          <stop offset="100%" stop-color="${themeConfig.end}" />
        </linearGradient>
        <radialGradient id="halo" cx="75%" cy="15%" r="55%">
          <stop offset="0%" stop-color="${themeConfig.accent}" stop-opacity="${themeConfig.haloOpacity}" />
          <stop offset="100%" stop-color="${themeConfig.accent}" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${themeConfig.accent}" stop-opacity="0.92" />
          <stop offset="100%" stop-color="${themeConfig.accent}" stop-opacity="0.18" />
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#bg)" />
      <rect x="30" y="30" width="740" height="940" rx="26" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.7" stroke-width="2"/>
      <rect x="58" y="58" width="684" height="884" rx="18" fill="none" stroke="${themeConfig.accent}" stroke-opacity="0.28" stroke-width="2"/>
      ${layoutConfig.ornaments(themeConfig)}
      <text x="86" y="170" fill="${themeConfig.ink}" font-size="42" font-family="Georgia, serif" opacity="0.72" letter-spacing="4">PLANETLS</text>
      <text x="${layoutConfig.wordmarkX}" y="${layoutConfig.wordmarkY}" fill="${themeConfig.accent}" font-size="${wordmarkSize}" font-family="Georgia, serif" font-weight="700" letter-spacing="1.5">${escapeXml(label.toUpperCase())}</text>
      <text x="${layoutConfig.titleX}" y="${layoutConfig.titleY}" fill="${themeConfig.ink}" font-size="30" font-family="Arial, sans-serif" opacity="0.9">${escapeXml(title)}</text>
      <line x1="${layoutConfig.line1.x1}" y1="${layoutConfig.line1.y}" x2="${layoutConfig.line1.x2}" y2="${layoutConfig.line1.y}" stroke="${themeConfig.accent}" stroke-opacity="0.5" stroke-width="2"/>
      <line x1="${layoutConfig.line2.x1}" y1="${layoutConfig.line2.y}" x2="${layoutConfig.line2.x2}" y2="${layoutConfig.line2.y}" stroke="${themeConfig.ink}" stroke-opacity="0.18" stroke-width="6"/>
      <line x1="${layoutConfig.line3.x1}" y1="${layoutConfig.line3.y}" x2="${layoutConfig.line3.x2}" y2="${layoutConfig.line3.y}" stroke="${themeConfig.ink}" stroke-opacity="0.14" stroke-width="6"/>
      <line x1="${layoutConfig.line4.x1}" y1="${layoutConfig.line4.y}" x2="${layoutConfig.line4.x2}" y2="${layoutConfig.line4.y}" stroke="${themeConfig.ink}" stroke-opacity="0.12" stroke-width="6"/>
      <rect x="${layoutConfig.quote.x}" y="${layoutConfig.quote.y}" width="${layoutConfig.quote.width}" height="${layoutConfig.quote.height}" rx="${layoutConfig.quote.radius}" fill="${themeConfig.quotePanelFill}" fill-opacity="${themeConfig.quotePanelOpacity}" stroke="${themeConfig.accent}" stroke-opacity="0.34" stroke-width="2"/>
      <rect x="${layoutConfig.quote.innerX}" y="${layoutConfig.quote.innerY}" width="${layoutConfig.quote.innerWidth}" height="${layoutConfig.quote.innerHeight}" rx="${layoutConfig.quote.innerRadius}" fill="none" stroke="${themeConfig.ink}" stroke-opacity="0.18" stroke-width="1.5"/>
      <text x="${layoutConfig.quote.glyphX}" y="${layoutConfig.quote.glyphY}" fill="${themeConfig.accent}" font-size="${layoutConfig.quote.glyphSize}" font-family="Georgia, serif" opacity="0.7">${QUOTE_GLYPH}</text>
      <text x="${layoutConfig.quote.textX}" y="${layoutConfig.quote.textY}" fill="${themeConfig.quoteInk}" font-size="${layoutConfig.quote.fontSize}" font-family="Georgia, serif" font-style="italic" font-weight="600">${quoteTspans}</text>
    </svg>
  `.trim();

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function ShowcaseFlipCard({
  title,
  description,
  quote,
  posterLabel = "PlanetLS",
  posterTone = "gold",
  posterLayout = "classic",
  icon: Icon,
  isFlipped,
  onToggle,
  size = "standard",
  className,
}: ShowcaseFlipCardProps) {
  const [theme, setTheme] = React.useState<ShowcasePosterTheme>("default");

  React.useEffect(() => {
    const updateTheme = () => setTheme(getPosterTheme());

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const posterImage = buildPosterDataUri(posterLabel, title, quote, posterTone, theme, posterLayout);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      tabIndex={0}
      role="button"
      aria-pressed={isFlipped}
      className={clsx(styles.card, styles[size], className, {
        [styles.flipped]: isFlipped,
      })}
      onClick={onToggle}
      onKeyDown={onKeyDown}
    >
      <div className={styles.inner}>
        <div className={styles.front}>
          <span className={styles.icon} aria-hidden="true">
            {Icon ? <Icon className={styles.goldenIcon} /> : null}
          </span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div
          className={styles.back}
          style={
            {
              "--showcase-poster-image": posterImage,
            } as React.CSSProperties
          }
        >
          <span className={styles.backLabel} aria-hidden="true">
            {posterLabel}
          </span>
          <blockquote className={styles.quote}>{quote}</blockquote>
        </div>
      </div>
    </div>
  );
}
