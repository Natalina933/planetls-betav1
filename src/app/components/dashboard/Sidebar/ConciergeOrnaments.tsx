import Image from "next/image";
import { MoonStar } from "lucide-react";

type OrnamentKind = "frieze" | "separator" | "corner" | "foot" | "moon" | "botanical";
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
      <g strokeWidth=".65" opacity=".8">
        <path d="M4 46 13 72M5 53 10 56M8 63 13 62M21 119 12 148M19 129 14 130M4 209 13 235M6 217 12 220M22 288 12 320M19 301 13 303M5 385 12 413M7 394 12 397M20 479 15 507M18 490 13 494M4 572 13 601M6 582 12 585M21 672 10 702M17 684 11 687M4 749 10 771" />
        <path d="M7 90C1 97 2 110 8 110S14 101 9 100M16 350C23 357 23 370 17 370S11 361 16 360M7 534C0 542 2 554 8 553S13 544 8 543M16 727C23 735 22 747 16 746S11 738 16 737" />
      </g>
      {[112, 270, 466, 645].map(y => (
        <g key={y} transform={`translate(12 ${y})`} strokeWidth=".75">
          <path d="M0 0C-7-2-6-8-2-6L0-3C2-9 7-7 5-3L2 0C9 2 6 7 2 5L0 2C-3 8-8 5-5 2Z" fill="currentColor" fillOpacity=".16" />
          <circle r="1.4" fill="currentColor" />
        </g>
      ))}
      <path d="M6 207Q1 198 6 195Q12 198 6 207ZM18 568Q12 559 18 556Q23 559 18 568Z" fill="currentColor" fillOpacity=".3" strokeWidth=".7" />
    </svg>
  );
  if (kind === "botanical") return (
    <svg className={className} aria-hidden="true" focusable="false" viewBox="0 0 220 300" fill="none" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" style={{ pointerEvents: "none" }}>
      <g opacity=".75">
        <path d="M6 298C26 281 4 269 16 248S30 225 18 214M6 288C23 292 31 280 25 275S15 279 20 282M14 262C2 262 2 249 8 246M214 298C193 281 216 269 204 248S190 225 202 214M214 288C197 292 189 280 195 275S205 279 200 282M206 262C218 262 218 249 212 246" />
        <path d="M14 276C2 275 0 266 3 261 12 265 16 270 14 276ZM17 248C12 236 15 228 21 226 24 237 23 243 17 248ZM206 276C218 275 220 266 217 261 208 265 204 270 206 276ZM203 248C208 236 205 228 199 226 196 237 197 243 203 248Z" fill="currentColor" fillOpacity=".18" />
        {[18, 202].map(x => (
          <g key={x} transform={`translate(${x} 286)`}>
            <path d="M0-2C-9-10-12-2-5 1C-12 7-4 12 0 5C4 12 12 7 5 1C12-2 9-10 0-2Z" fill="currentColor" fillOpacity=".2" />
            <circle cy="2" r="1.8" fill="currentColor" />
          </g>
        ))}
      </g>
      <path d="m202 35 1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5ZM16 144l1 3 3 1-3 1-1 3-1-3-3-1 3-1ZM192 196l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="currentColor" fillOpacity=".5" stroke="none" />
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

/** Illustration décorative complète ; proportions du PNG lunaire fourni. */
export function ConciergeMuchaIllustration({ src, className }: { src?: string; className?: string }) {
  if (!src) return null;
  return <div className={className} aria-hidden="true" style={{ pointerEvents: "none" }}>
    <Image src={src} alt="" width={1086} height={1448} sizes="196px" />
  </div>;
}
