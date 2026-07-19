"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Compass, Home, MessageSquareText, Receipt } from "lucide-react";
import Sidebar from "@/app/components/dashboard/Sidebar/Sidebar";
import Navbar from "@/app/components/dashboard/navbar/DashboardNavbar";
import { DashboardMobileExperience } from "@/app/components/dashboard/mobile/DashboardMobileExperience";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { DashboardBottomNav } from "@/components/dashboard/DashboardLayout/DashboardBottomNav";
import { useOwnerDashboardData } from "./owner/useOwnerDashboardData";
import "@/app/styles/abstracts/_dashboards.scss";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { user, isAuthenticated } = useCurrentUser();

  const isOwnerPage = pathname?.startsWith("/dashboard/owner");
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

  const ownerHeaderMetrics = useMemo(
    () => [
      {
        label: "Annonces à finaliser",
        value: `${draftCount}`,
        icon: Home,
      },
      {
        label: "Factures à traiter",
        value: `${pendingInvoices.length}`,
        icon: Receipt,
      },
      {
        label: "Messages non lus",
        value: `${unreadConversationCount}`,
        icon: MessageSquareText,
      },
    ],
    [draftCount, pendingInvoices.length, unreadConversationCount],
  );

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const syncSidebar = () => setIsSidebarOpen(desktopQuery.matches);

    syncSidebar();
    desktopQuery.addEventListener("change", syncSidebar);
    return () => desktopQuery.removeEventListener("change", syncSidebar);
  }, []);

  return (
    <div className="dashboard-root">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((current) => !current)} />
      <div className={`dashboard-main ${isSidebarOpen ? "with-sidebar" : "no-sidebar"}`}>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen((current) => !current)} />
        <div className={`headerBandeau ${isOwnerPage ? "ownerHeaderBandeau" : ""}`}>
          <Image
            src="/images/generated/dashboard/dashboard-header-bandeau.png"
            alt="Bandeau chaleureux du tableau de bord"
            fill
            sizes="100vw"
            priority={isOwnerPage}
          />
          <div className="headerOverlay">
            {isOwnerPage ? (
              <div className="headerHero">
                <div className="headerIdentity">
                  <span className="headerAvatar" aria-hidden="true">
                    <Compass size={22} />
                  </span>
                  <div className="headerCopy">
                    <span className="headerEyebrow">Cap du jour</span>
                    <h1>{currentOwnerSectionLabel}</h1>
                    <p>
                      Retrouvez en un coup d&apos;œil vos priorités, vos points de vigilance et la prochaine action utile
                      pour faire avancer votre parc.
                    </p>
                  </div>
                </div>
                <div className="headerMetrics" aria-label="Indicateurs rapides">
                  {ownerHeaderMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <article key={metric.label} className="headerMetricCard">
                        <span className="headerMetricIcon" aria-hidden="true">
                          <Icon size={16} />
                        </span>
                        <strong>{metric.value}</strong>
                        <span>{metric.label}</span>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {isOwnerPage ? (
          <DashboardBottomNav items={ownerBottomNavItems} ariaLabel="Navigation propriétaire" />
        ) : null}
        <main className="dashboard-content">{children}</main>
        <DashboardMobileExperience role={user?.role} pathname={pathname} />
      </div>
    </div>
  );
}



