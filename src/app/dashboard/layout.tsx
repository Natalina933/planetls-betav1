"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Sun } from "lucide-react";
import Sidebar from "@/app/components/dashboard/Sidebar/Sidebar";
import Navbar from "@/app/components/dashboard/navbar/DashboardNavbar";
import { DashboardMobileExperience } from "@/app/components/dashboard/mobile/DashboardMobileExperience";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { DashboardBottomNav } from "@/components/dashboard/DashboardLayout/DashboardBottomNav";
import { useOwnerDashboardData } from "./owner/useOwnerDashboardData";
import "@/app/styles/abstracts/_dashboards.scss";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarBreakpoint, setSidebarBreakpoint] = useState(0);

  const { user, isAuthenticated } = useCurrentUser();

  const isOwnerPage = pathname?.startsWith("/dashboard/owner");
  const isOwnerHome = pathname === "/dashboard/owner";
  const isCompactOwnerPage = pathname === "/dashboard/owner/missions/voyageurs" || pathname === "/dashboard/owner/planning" || pathname === "/dashboard/owner/finances/overview" || pathname === "/dashboard/owner/factures" || pathname === "/dashboard/owner/messages" || pathname === "/dashboard/owner/documents" || pathname === "/dashboard/owner/devis" || pathname === "/dashboard/owner/logements";
  const isConciergeHome = pathname === "/dashboard/concierge";
  const isConciergePage = pathname?.startsWith("/dashboard/concierge");
  const isAdminPage = pathname?.startsWith("/dashboard/admin");
  const isProviderPage = pathname?.startsWith("/dashboard/provider");
  const showHeaderBandeau = !isCompactOwnerPage && (isOwnerPage || isConciergePage || isAdminPage || isProviderPage);
  const { draftCount, ongoingMissions, pendingInvoices, unreadConversationCount } = useOwnerDashboardData(
    Boolean(isAuthenticated && isOwnerPage),
  );

  const ownerBottomNavItems = useMemo(
    () => [
      { label: "Logements", href: "/dashboard/owner/logements", badgeCount: draftCount },
      { label: "Missions", href: "/dashboard/owner/planning", badgeCount: ongoingMissions.length },
      { label: "Factures", href: "/dashboard/owner/factures", badgeCount: pendingInvoices.length },
      { label: "Messages", href: "/dashboard/owner/messages", badgeCount: unreadConversationCount },
    ],
    [draftCount, ongoingMissions.length, pendingInvoices.length, unreadConversationCount],
  );

  const currentOwnerSectionLabel = useMemo(() => {
    if (!isOwnerPage) return "Tableau de bord";
    if (pathname === "/dashboard/owner") return "Cockpit propriétaire";
    if (pathname.includes("/messages")) return "Messagerie et arbitrages";
    if (pathname.includes("/factures")) return "Finance et règlements";
    if (pathname.includes("/planning")) return "Planning et opérations";
    if (pathname.includes("/logements")) return "Parc et annonces";
    if (pathname.includes("/devis")) return "Devis et validation";
    if (pathname.includes("/conciergerie")) return "Conciergeries partenaires";
    if (pathname.includes("/demandes")) return "Demandes en cours";
    return "Pilotage propriétaire";
  }, [isOwnerPage, pathname]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const breakpoint = Number.parseFloat(getComputedStyle(main).getPropertyValue("--ds-breakpoint-dashboard-nav"));
    if (!Number.isFinite(breakpoint)) return;
    setSidebarBreakpoint(breakpoint);
    const desktopQuery = window.matchMedia(`(min-width: ${breakpoint + 1}px)`);
    const syncSidebar = () => setIsSidebarOpen(desktopQuery.matches);

    syncSidebar();
    desktopQuery.addEventListener("change", syncSidebar);
    return () => desktopQuery.removeEventListener("change", syncSidebar);
  }, []);

  useEffect(() => {
    if (!showHeaderBandeau) return;
    const main = mainRef.current;
    const navbar = main?.querySelector<HTMLElement>(":scope > header");
    if (!main || !navbar) return;
    const updateHeaderHeight = () => {
      main.style.setProperty("--dashboard-nav-height", `${navbar.getBoundingClientRect().height}px`);
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(navbar);
    return () => {
      observer.disconnect();
      main.style.removeProperty("--dashboard-nav-height");
    };
  }, [showHeaderBandeau]);

  return (
    <div className="dashboard-root" data-dashboard-hero={showHeaderBandeau ? "" : undefined} data-concierge-home={isConciergeHome ? "" : undefined} data-owner-dashboard={isOwnerPage ? "" : undefined}>
      <Suspense fallback={null}>
        <Sidebar conciergeBranding={Boolean(isConciergePage)} mobileBreakpoint={sidebarBreakpoint} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((current) => !current)} />
      </Suspense>
      <div ref={mainRef} className={`dashboard-main ${isSidebarOpen ? "with-sidebar" : "no-sidebar"}`}>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((current) => !current)} />
        {showHeaderBandeau ? <div className={`headerBandeau ${isOwnerPage ? "ownerHeaderBandeau" : ""}`}>
          <Image
            src="/images/generated/dashboard/dashboard-header-bandeau.png"
            alt="Bandeau chaleureux du tableau de bord"
            fill
            sizes="100vw"
            priority={isOwnerPage}
          />
          <div className="headerOverlay">
            <div className="headerHero conciergeHeaderHero">
              <div className="headerIdentity">
                <span className="headerAvatar" aria-hidden="true">
                  <Compass size={22} />
                </span>
                <div className="headerCopy">
                  <span className="headerEyebrow">{isConciergePage ? "Espace conciergerie" : isOwnerPage ? "Espace propriétaire" : isAdminPage ? "Espace administrateur" : "Espace artisan"}</span>
                  <h1>{isConciergePage ? `Bonjour ${user?.firstName || user?.company_name || ""},` : isOwnerPage ? (isOwnerHome ? `Bonjour ${user?.firstName || user?.company_name || "Propriétaire"} 👋` : currentOwnerSectionLabel) : `Bonjour ${user?.firstName || user?.company_name || ""},`}</h1>
                  <p>{isConciergePage ? "Une nouvelle journée pour faire la différence." : isOwnerPage ? "Vos logements créent de beaux souvenirs, suivez-les en un coup d'œil." : isAdminPage ? "Gardez une vision claire de la plateforme et de son activité." : "Des interventions bien préparées, des clients satisfaits."}</p>
                  <blockquote>{isConciergePage ? <>« Prendre soin des lieux,<br />c&apos;est prendre soin des gens »</> : isOwnerPage ? <>« Des séjours sereins,<br />des logements qui performent »</> : isAdminPage ? <>« Une plateforme fiable,<br />des équipes accompagnées »</> : <>« Des interventions soignées,<br />une confiance qui dure »</>}</blockquote>
                </div>
              </div>
              <div className="headerActionRow conciergeHeaderAside">
                <div className="conciergeWeather">
                  <strong>{(isConciergeHome || isOwnerHome || isAdminPage || isProviderPage) ? new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(new Date()) : "Mardi"}</strong>
                  <span>{(isConciergeHome || isOwnerHome || isAdminPage || isProviderPage) ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date()) : "9 septembre 2026"}</span>
                  {(isConciergeHome || isOwnerHome || isAdminPage || isProviderPage) && <hr className="conciergeWeatherDivider" />}<b><Sun size={30} strokeWidth={1.5} aria-hidden="true" /> <em>24°C</em></b>
                  <small>Le Barcarès{(isConciergeHome || isOwnerHome) && <span className="conciergeWeatherExample">Exemple météo</span>}</small>
                </div>
                <div className="headerActionLinks">
                  {isConciergePage ? (
                    <>
                      <a href="/dashboard/concierge/planning" className="headerActionPrimary">Voir le planning</a>
                      <a href="/dashboard/concierge/demandes" className="headerActionSecondary">Ouvrir les demandes</a>
                    </>
                  ) : isOwnerPage ? (
                    <>
                      <Link href="/dashboard/owner/planning" className="headerActionPrimary">Voir mes réservations</Link>
                      <Link href="/dashboard/owner/logements" className="headerActionSecondary">Ouvrir mes logements</Link>
                    </>
                  ) : isAdminPage ? (
                    <>
                      <Link href="/dashboard/admin" className="headerActionPrimary">Voir le pilotage</Link>
                      <Link href="/dashboard/admin/developpement" className="headerActionSecondary">Ouvrir le registre</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard/provider/planning" className="headerActionPrimary">Voir mon planning</Link>
                      <Link href="/dashboard/provider/devis" className="headerActionSecondary">Ouvrir mes devis</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div> : null}
        {isOwnerPage && pathname !== "/dashboard/owner" ? (
          isCompactOwnerPage ? <div className="owner-business-shortcuts">
            <DashboardBottomNav items={ownerBottomNavItems} ariaLabel="Navigation propriétaire" />
          </div> : <DashboardBottomNav items={ownerBottomNavItems} ariaLabel="Navigation propriétaire" />
        ) : null}
        <main className="dashboard-content">{children}</main>
        <DashboardMobileExperience role={user?.role} pathname={pathname} />
      </div>
    </div>
  );
}

