"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sun } from "lucide-react";
import Sidebar from "@/app/components/dashboard/Sidebar/Sidebar";
import Navbar from "@/app/components/dashboard/navbar/DashboardNavbar";
import { DashboardMobileExperience } from "@/app/components/dashboard/mobile/DashboardMobileExperience";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { DashboardBottomNav } from "@/components/dashboard/DashboardLayout/DashboardBottomNav";
import { useOwnerDashboardData } from "./owner/useOwnerDashboardData";

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
        {showHeaderBandeau ? (
          <div className={`headerBandeau ${isOwnerPage ? "ownerHeaderBandeau" : ""}`}>
            <Image
              src="/images/generated/dashboard/dashboard-header-bandeau.png"
              alt="Bandeau du tableau de bord"
              fill
              sizes="100vw"
              priority={isOwnerPage}
            />
            <div className="headerOverlay">
              <div className="headerHero conciergeHeaderHero">
                <div className="headerIdentity">
                  <div className="headerCopy">
                    <span className="headerEyebrow">
                      {isConciergePage ? "Espace conciergerie" : isOwnerPage ? "Espace propriétaire" : isAdminPage ? "Espace administrateur" : "Espace artisan"}
                    </span>
                    <h1>
                      {isConciergePage
                        ? `Bonjour ${user?.firstName || user?.company_name || ""}`
                        : isOwnerPage
                          ? (isOwnerHome ? `Bonjour ${user?.firstName || user?.company_name || "Propriétaire"}` : currentOwnerSectionLabel)
                          : `Bonjour ${user?.firstName || user?.company_name || ""} `}
                    </h1>
                  </div>
                </div>

                <div className="headerActionRow conciergeHeaderAside">
                  <div className="conciergeWeather">
                    <div className="weatherTopline">
                      <span>M&eacute;t&eacute;o locale</span>
                    </div>
                    <div className="weatherMain">
                      <div className="weatherDate">
                        <strong>
                          {new Intl.DateTimeFormat("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long"
                          }).format(new Date())}
                        </strong>
                        <small>Le Barcar&egrave;s</small>
                      </div>
                      <div className="weatherTemp">
                        <Sun size={22} strokeWidth={2.2} aria-hidden="true" />
                        <span>24&deg;C</span>
                      </div>
                    </div>
                    <p className="weatherStatus">Ensoleill&eacute;, conditions id&eacute;ales pour les arriv&eacute;es.</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        ) : null}
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

