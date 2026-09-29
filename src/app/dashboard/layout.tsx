"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Snowflake,
  Sun,
} from "lucide-react";

import Sidebar from "@/app/components/dashboard/Sidebar/Sidebar";
import Navbar from "@/app/components/dashboard/navbar/DashboardNavbar";
import { DashboardMobileExperience } from "@/app/components/dashboard/mobile/DashboardMobileExperience";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import { DashboardBottomNav } from "@/components/dashboard/DashboardLayout/DashboardBottomNav";
import { useOwnerDashboardData } from "./owner/useOwnerDashboardData";

type WeatherData = {
  location: {
    city: string;
    latitude: number;
    longitude: number;
    displayName: string;
  };
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    precipitation: number;
    weatherCode: number;
    windSpeed: number;
    windGusts: number;
    condition: {
      label: string;
      icon: string;
    };
  };
};

function getWeatherIcon(icon: string) {
  const props = {
    size: 30,
    strokeWidth: 1.5,
    "aria-hidden": true as const,
  };

  switch (icon) {
    case "clear":
    case "mostly-clear":
      return <Sun {...props} />;

    case "partly-cloudy":
      return <CloudSun {...props} />;

    case "cloudy":
      return <Cloud {...props} />;

    case "fog":
      return <CloudFog {...props} />;

    case "drizzle":
    case "freezing-drizzle":
      return <CloudDrizzle {...props} />;

    case "rain":
    case "freezing-rain":
    case "showers":
      return <CloudRain {...props} />;

    case "snow":
      return <Snowflake {...props} />;

    case "snow-showers":
      return <CloudSnow {...props} />;

    case "thunderstorm":
    case "thunderstorm-hail":
      return <CloudLightning {...props} />;

    default:
      return <Cloud {...props} />;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLDivElement>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarBreakpoint, setSidebarBreakpoint] = useState(0);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const { user, isAuthenticated } = useCurrentUser();

  const isOwnerPage = pathname?.startsWith("/dashboard/owner");
  const isOwnerHome = pathname === "/dashboard/owner";

  const isCompactOwnerPage =
    pathname === "/dashboard/owner/missions/voyageurs" ||
    pathname === "/dashboard/owner/planning" ||
    pathname === "/dashboard/owner/finances/overview" ||
    pathname === "/dashboard/owner/factures" ||
    pathname === "/dashboard/owner/messages" ||
    pathname === "/dashboard/owner/documents" ||
    pathname === "/dashboard/owner/devis" ||
    pathname === "/dashboard/owner/logements";

  const isConciergeHome = pathname === "/dashboard/concierge";
  const isConciergePage = pathname?.startsWith("/dashboard/concierge");
  const isAdminPage = pathname?.startsWith("/dashboard/admin");
  const isProviderPage = pathname?.startsWith("/dashboard/provider");

  const showHeaderBandeau =
    !isCompactOwnerPage &&
    (isOwnerPage || isConciergePage || isAdminPage || isProviderPage);

  const {
    draftCount,
    ongoingMissions,
    pendingInvoices,
    unreadConversationCount,
  } = useOwnerDashboardData(Boolean(isAuthenticated && isOwnerPage && !isOwnerHome));

  const ownerBottomNavItems = useMemo(
    () => [
      {
        label: "Logements",
        href: "/dashboard/owner/logements",
        badgeCount: draftCount,
      },
      {
        label: "Missions",
        href: "/dashboard/owner/planning",
        badgeCount: ongoingMissions.length,
      },
      {
        label: "Factures",
        href: "/dashboard/owner/factures",
        badgeCount: pendingInvoices.length,
      },
      {
        label: "Messages",
        href: "/dashboard/owner/messages",
        badgeCount: unreadConversationCount,
      },
    ],
    [
      draftCount,
      ongoingMissions.length,
      pendingInvoices.length,
      unreadConversationCount,
    ],
  );

  const currentOwnerSectionLabel = useMemo(() => {
    if (!isOwnerPage) return "Tableau de bord";

    if (pathname === "/dashboard/owner") {
      return "Cockpit propriétaire";
    }

    if (pathname.includes("/profile")) {
      return "Mon profil";
    }

    if (pathname.includes("/settings")) {
      return "Mon profil";
    }

    if (pathname.includes("/messages")) {
      return "Messagerie";
    }

    if (pathname.includes("/factures")) {
      return "Factures et règlements";
    }

    if (pathname.includes("/planning")) {
      return "Planning et opérations";
    }

    if (pathname.includes("/logements")) {
      return "Mes logements";
    }

    if (pathname.includes("/devis")) {
      return "Devis";
    }

    if (pathname.includes("/conciergerie")) {
      return "Mes conciergeries";
    }

    if (pathname.includes("/demandes")) {
      return "Mes demandes";
    }

    return "Espace propriétaire";
  }, [isOwnerPage, pathname]);

  const headerDescription = useMemo(() => {
    if (isOwnerPage) {
      if (isOwnerHome) {
        return "Suivez vos logements, missions et collaborations depuis votre espace.";
      }

      if (
        pathname.includes("/profile") ||
        pathname.includes("/settings")
      ) {
        return "Gérez vos informations et votre présence sur PlanetLS.";
      }

      if (pathname.includes("/messages")) {
        return "Centralisez vos échanges et suivez vos conversations.";
      }

      if (pathname.includes("/factures")) {
        return "Suivez vos factures, règlements et opérations financières.";
      }

      if (pathname.includes("/planning")) {
        return "Visualisez vos arrivées, départs et interventions planifiées.";
      }

      if (pathname.includes("/logements")) {
        return "Retrouvez et gérez les logements associés à votre espace.";
      }

      if (pathname.includes("/devis")) {
        return "Consultez les propositions reçues et suivez leur validation.";
      }

      if (pathname.includes("/demandes")) {
        return "Suivez vos besoins transmis aux concierges.";
      }

      return "Gérez votre activité et vos informations PlanetLS.";
    }

    if (isConciergePage) {
      return "Organisez vos interventions et votre activité depuis votre espace.";
    }

    if (isAdminPage) {
      return "Supervisez l'activité et les principaux indicateurs PlanetLS.";
    }

    return "Retrouvez ici les informations essentielles de votre activité.";
  }, [
    isAdminPage,
    isConciergePage,
    isOwnerHome,
    isOwnerPage,
    pathname,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      setWeather(null);
      return;
    }

    let cancelled = false;

    async function loadWeather() {
      try {
        const response = await fetch("/api/weather", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 422 || response.status === 404) {
            if (!cancelled) {
              setWeather(null);
            }
            return;
          }

          throw new Error(
            `Weather request failed: ${response.status}`,
          );
        }

        const data = (await response.json()) as WeatherData;

        if (!cancelled) {
          setWeather(data);
        }
      } catch (error) {
        console.error("[dashboard] Weather error:", error);

        if (!cancelled) {
          setWeather(null);
        }
      }
    }

    void loadWeather();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const main = mainRef.current;

    if (!main) return;

    const breakpoint = Number.parseFloat(
      getComputedStyle(main).getPropertyValue(
        "--ds-breakpoint-dashboard-nav",
      ),
    );

    if (!Number.isFinite(breakpoint)) return;

    setSidebarBreakpoint(breakpoint);

    const desktopQuery = window.matchMedia(
      `(min-width: ${breakpoint + 1}px)`,
    );

    const syncSidebar = () =>
      setIsSidebarOpen(desktopQuery.matches);

    syncSidebar();

    desktopQuery.addEventListener("change", syncSidebar);

    return () =>
      desktopQuery.removeEventListener("change", syncSidebar);
  }, []);

  useEffect(() => {
    if (!showHeaderBandeau) return;

    const main = mainRef.current;
    const navbar =
      main?.querySelector<HTMLElement>(":scope > header");

    if (!main || !navbar) return;

    const updateHeaderHeight = () => {
      main.style.setProperty(
        "--dashboard-nav-height",
        `${navbar.getBoundingClientRect().height}px`,
      );
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
    <div
      className="dashboard-root"
      data-dashboard-hero={showHeaderBandeau ? "" : undefined}
      data-concierge-home={isConciergeHome ? "" : undefined}
      data-owner-dashboard={isOwnerPage ? "" : undefined}
      data-owner-profile={isOwnerPage && (pathname.includes("/settings") || pathname.includes("/profile")) ? "" : undefined}
    >
      <Suspense fallback={null}>
        <Sidebar
          conciergeBranding={Boolean(isConciergePage)}
          mobileBreakpoint={sidebarBreakpoint}
          isOpen={isSidebarOpen}
          toggleSidebar={() =>
            setIsSidebarOpen((current) => !current)
          }
        />
      </Suspense>

      <div
        ref={mainRef}
        className={`dashboard-main ${
          isSidebarOpen ? "with-sidebar" : "no-sidebar"
        }`}
      >
        <Navbar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() =>
            setIsSidebarOpen((current) => !current)
          }
        />

        {showHeaderBandeau ? (
          <div
            className={`headerBandeau ${
              isOwnerPage ? "ownerHeaderBandeau" : ""
            }`}
          >
            <Image
              src="/images/generated/dashboard/dashboard-header-bandeau.png"
              alt=""
              fill
              sizes="100vw"
              priority={isOwnerPage}
            />

            <div className="headerOverlay">
              <div className="headerHero conciergeHeaderHero">
                <div className="headerIdentity">
                  <div className="headerCopy">
                    <span className="headerEyebrow">
                      {isConciergePage
                        ? "Espace conciergerie"
                        : isOwnerPage
                          ? "Espace propriétaire"
                          : isAdminPage
                            ? "Espace administrateur"
                            : "Espace artisan"}
                    </span>

                    <h1>
                      {isConciergePage
                        ? `Bonjour ${
                            user?.firstName ||
                            user?.company_name ||
                            ""
                          }`
                        : isOwnerPage
                          ? isOwnerHome
                            ? `Bonjour ${
                                user?.firstName ||
                                user?.company_name ||
                                "Propriétaire"
                              }`
                            : currentOwnerSectionLabel
                          : `Bonjour ${
                              user?.firstName ||
                              user?.company_name ||
                              ""
                            }`}
                    </h1>

                    <p>{headerDescription}</p>
                  </div>
                </div>

                <div className="headerActionRow conciergeHeaderAside">
                  <div
                    className="conciergeWeather"
                    aria-label={
                      weather
                        ? `Météo à ${weather.location.city} : ${weather.current.condition.label}`
                        : "Météo locale"
                    }
                  >
                    <strong>
                      {new Intl.DateTimeFormat("fr-FR", {
                        weekday: "long",
                      }).format(new Date())}
                    </strong>

                    <span className="conciergeWeatherDate">
                      {new Intl.DateTimeFormat("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(new Date())}
                    </span>

                    <hr className="conciergeWeatherDivider" />

                    <b>
                      {weather ? (
                        getWeatherIcon(
                          weather.current.condition.icon,
                        )
                      ) : (
                        <Cloud
                          size={30}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      )}

                      <em>
                        {weather
                          ? `${Math.round(
                              weather.current.temperature,
                            )}°C`
                          : "--°C"}
                      </em>
                    </b>

                    <small>
                      {weather?.location.city ??
                        "Météo indisponible"}

                      {weather ? (
                        <>
                          <span className="conciergeWeatherExample">
                            {weather.current.condition.label}
                          </span>

                          <span className="conciergeWeatherDetails">
                            Ressenti{" "}
                            {Math.round(
                              weather.current.apparentTemperature,
                            )}
                            °
                            {" · "}
                            Humidité {weather.current.humidity}%
                            {" · "}
                            Vent{" "}
                            {Math.round(
                              weather.current.windSpeed,
                            )}{" "}
                            km/h
                          </span>
                        </>
                      ) : null}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isOwnerPage && pathname !== "/dashboard/owner" ? (
          isCompactOwnerPage ? (
            <div className="owner-business-shortcuts">
              <DashboardBottomNav
                items={ownerBottomNavItems}
                ariaLabel="Navigation propriétaire"
              />
            </div>
          ) : (
            <DashboardBottomNav
              items={ownerBottomNavItems}
              ariaLabel="Navigation propriétaire"
            />
          )
        ) : null}

        <main className="dashboard-content">
          {children}
        </main>

        <DashboardMobileExperience
          role={user?.role}
          pathname={pathname}
        />
      </div>
    </div>
  );
}
