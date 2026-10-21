import Image from "next/image";
import { MoonStar } from "lucide-react";

type OrnamentKind = "frieze" | "separator" | "corner" | "foot" | "moon";
const resources = {
  corner: "/ornements/mucha-corner-bottom-right.svg",
};

/** Les ressources décoratives locales restent indépendantes de la navigation. */
export function ConciergeOrnament({ kind, className }: { kind: OrnamentKind; className?: string }) {
  if (kind === "moon") return <MoonStar className={className} aria-hidden="true" style={{ pointerEvents: "none" }} />;
  if (kind === "frieze") return (
    <svg className={className} aria-hidden="true" focusable="false" viewBox="0 0 24 800" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1" style={{ pointerEvents: "none" }}>
      <path d="M5 0V800 M9 0C24 70 1 115 13 177S23 273 11 333 4 437 15 501 22 615 11 672 6 754 13 800" />
      <path d="M13 74C2 66 2 51 4 44 14 50 19 60 13 74ZM12 150C22 140 24 125 21 117 12 124 9 138 12 150ZM13 237C1 228 1 214 4 206 14 215 17 225 13 237ZM12 322C23 314 24 295 22 285 12 294 8 309 12 322ZM12 415C1 402 2 389 5 382 15 392 17 405 12 415ZM15 509C24 498 23 483 20 476 11 485 9 499 15 509ZM13 603C1 593 2 577 4 569 14 580 17 591 13 603ZM10 704C21 695 23 677 21 669 11 677 7 691 10 704ZM10 773C1 765 1 752 4 746 12 753 14 765 10 773Z" fill="currentColor" fillOpacity=".18" />
      <path d="M13 177C24 169 23 153 17 155 12 157 16 163 20 161 M11 333C0 326 1 311 6 313 11 315 8 320 4 318 M15 501C24 513 23 528 18 525 13 522 16 517 20 519 M11 672C0 660 0 646 6 648 11 650 8 655 4 653" />
      <path d="m18 91 2 4 2-4-2-4Z m-8 172 2 4 2-4-2-4Z m6 201 2 4 2-4-2-4Z m-8 183 2 4 2-4-2-4Z" fill="currentColor" stroke="none" />
      <circle cx="17" cy="193" r="2" /><circle cx="8" cy="451" r="2" /><circle cx="17" cy="628" r="2" />
    </svg>
  );
  if (kind === "separator" || kind === "foot") return (
    <svg className={className} aria-hidden="true" focusable="false" viewBox="0 0 220 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ pointerEvents: "none" }}>
      <path d="M2 12H66M154 12H218M68 12C79 20 92 20 104 12M116 12C128 20 141 20 152 12" />
      <path d="M80 13C79 6 84 3 91 4 89 10 85 13 80 13ZM94 16C93 9 97 6 103 7 102 12 99 15 94 16ZM140 13C141 6 136 3 129 4 131 10 135 13 140 13ZM126 16C127 9 123 6 117 7 118 12 121 15 126 16Z" fill="currentColor" fillOpacity=".22" />
      <path d="m110 7 4 5-4 5-4-5Z" fill="currentColor" fillOpacity=".55" />
    </svg>
  );
  return (
    <svg className={className} aria-hidden="true" focusable="false" viewBox="0 0 100 100" style={{ pointerEvents: "none" }}>
      <image href={resources.corner} width="100" height="100" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

/** Fournir un PNG/WebP transparent local validé, sans texte, avant activation. */
export function ConciergeMuchaIllustration({ src, className }: { src?: string; className?: string }) {
  if (!src) return null;
  return <div className={className} aria-hidden="true" style={{ pointerEvents: "none" }}>
    <Image src={src} alt="" width={220} height={260} sizes="220px" />
  </div>;
}
