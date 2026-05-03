"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout, DashboardPanel } from "@/components/dashboard";
import { supabaseBrowser } from "@/app/lib/dbClient";
import styles from "./AdminDashboard.module.scss";

interface DashboardStats {
  users: number;
  activeProviders: number;
  bookings: number;
}

const categoryAccess = [
  {
    title: "Propriétaires",
    href: "/dashboard/owner",
    badge: "Owner",
    description: "Suivre le parc, les demandes, les règlements et la relation conciergerie.",
    checkpoints: ["Logements", "Missions", "Finances", "Messages"],
  },
  {
    title: "Conciergeries",
    href: "/dashboard/concierge",
    badge: "Concierge",
    description: "Piloter les biens gérés, les propriétaires, les prestations et les urgences.",
    checkpoints: ["Demandes reçues", "Planning", "Logements", "Tarifs"],
  },
  {
    title: "Artisans",
    href: "/dashboard/provider",
    badge: "Artisan",
    description: "Contrôler les interventions terrain, les alertes, les clients et les devis.",
    checkpoints: ["Interventions", "Clients", "Alertes", "Devis"],
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    activeProviders: 0,
    bookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = supabaseBrowser();

        const [{ count: usersCount }, { count: providersCount }, { count: bookingsCount }] =
          await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("profiles").select("*", { count: "exact", head: true }).eq("type", "provider"),
            supabase.from("planning_entries").select("*", { count: "exact", head: true }),
          ]);

        setStats({
          users: usersCount ?? 0,
          activeProviders: providersCount ?? 0,
          bookings: bookingsCount ?? 0,
        });
      } catch (error) {
        console.error("Erreur chargement stats admin :", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  if (loading) return <div className="center">Chargement des statistiques...</div>;

  return (
    <DashboardLayout
      persona="admin"
      title="Console plateforme"
      subtitle="Vision globale, arbitrages transverses et points de surveillance de l'écosystème."
      navTitle="Espaces suivis"
      navItems={[
        { label: "Vue plateforme", href: "/dashboard/admin" },
        { label: "Propriétaires", href: "/dashboard/owner" },
        { label: "Conciergeries", href: "/dashboard/concierge" },
        { label: "Artisans", href: "/dashboard/provider" },
      ]}
      stats={[
        { label: "Utilisateurs", value: String(stats.users), hint: "Base profils consolidée" },
        { label: "Prestataires actifs", value: String(stats.activeProviders), hint: "Réseau terrain actif" },
        { label: "Réservations", value: String(stats.bookings), hint: "Volume plateforme suivi" },
        { label: "Couverture espaces", value: "3", hint: "Owner, concierge, artisan" },
      ]}
      actions={[
        { label: "Ouvrir l'espace propriétaire", href: "/dashboard/owner" },
        { label: "Ouvrir l'espace conciergerie", href: "/dashboard/concierge" },
        { label: "Ouvrir l'espace artisan", href: "/dashboard/provider" },
      ]}
      activity={[
        {
          id: "admin-owner",
          title: "Suivi propriétaires",
          description: "Vision rentabilité et opérations",
          href: "/dashboard/owner",
        },
        {
          id: "admin-concierge",
          title: "Suivi conciergeries",
          description: "Qualité de service et activité commerciale",
          href: "/dashboard/concierge",
        },
        {
          id: "admin-provider",
          title: "Suivi artisans",
          description: "Interventions, alertes et clients",
          href: "/dashboard/provider",
        },
      ]}
      notifications={[
        {
          id: "admin-n1",
          title:
            stats.bookings > 0
              ? `${stats.bookings} réservation(s) suivie(s) sur la plateforme.`
              : "Aucune réservation consolidée.",
          level: stats.bookings > 0 ? "info" : "warning",
          href: "/dashboard/admin",
        },
        {
          id: "admin-n2",
          title:
            stats.activeProviders > 0
              ? `${stats.activeProviders} prestataire(s) actif(s) connectés à l'écosystème.`
              : "Aucun prestataire actif détecté.",
          level: stats.activeProviders > 0 ? "info" : "danger",
          href: "/dashboard/provider",
        },
      ]}
      shortcuts={[
        { label: "Owner", href: "/dashboard/owner" },
        { label: "Concierge", href: "/dashboard/concierge" },
        { label: "Artisan", href: "/dashboard/provider" },
      ]}
      profile={{
        name: "PlanetLS",
        subtitle: "Pilotage global",
        badge: "Administration",
      }}
    >
      <DashboardPanel title="Avancées par catégorie">
        <div className={styles.categoryGrid}>
          {categoryAccess.map((category) => (
            <Link key={category.href} href={category.href} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <h3>{category.title}</h3>
                <span className={styles.categoryBadge}>{category.badge}</span>
              </div>
              <p className={styles.categoryDescription}>{category.description}</p>
              <ul className={styles.categoryList}>
                {category.checkpoints.map((checkpoint) => (
                  <li key={checkpoint}>{checkpoint}</li>
                ))}
              </ul>
              <span className={styles.categoryLink}>Voir l'espace</span>
            </Link>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel title="Vue d'ensemble">
        <p>
          La plateforme consolide actuellement {stats.users} utilisateur(s), {stats.activeProviders} prestataire(s)
          actif(s) et {stats.bookings} réservation(s) dans le périmètre de suivi.
        </p>
        <p>Cette page sert de poste d'arbitrage entre acquisition, qualité d'exécution et continuité de service.</p>
      </DashboardPanel>

      <DashboardPanel title="Pilotage stratégique">
        <p>
          Priorité stratégique: maintenir un équilibre entre croissance des profils, qualité des partenaires actifs
          et absorption du volume opérationnel.
        </p>
        <p>
          Recommandation: utiliser les trois espaces métier pour distinguer clairement la vision décisionnelle
          plateforme du reporting local par rôle.
        </p>
      </DashboardPanel>

      <DashboardPanel title="Reporting de gestion">
        <p>Utilisateurs: {stats.users}</p>
        <p>Prestataires actifs: {stats.activeProviders}</p>
        <p>Réservations: {stats.bookings}</p>
        <Link href="/dashboard/owner">Basculer vers le reporting métier</Link>
      </DashboardPanel>
    </DashboardLayout>
  );
}
