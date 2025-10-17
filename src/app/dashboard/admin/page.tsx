"use client";

import React, { useEffect, useState } from "react";
import StatCard from "@/app/components/dashboard/StatCard";
import {supabaseBrowser} from "@/app/lib/dbClient";

interface DashboardStats {
  users: number;
  activeProviders: number;
  bookings: number;
}

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

        const [
          { count: usersCount },
          { count: providersCount },
          { count: bookingsCount },
        ] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("type", "provider"),
          supabase
            .from("reservations")
            .select("*", { count: "exact", head: true }),
        ]);

        setStats({
          users: usersCount ?? 0,
          activeProviders: providersCount ?? 0,
          bookings: bookingsCount ?? 0,
        });
      } catch (err) {
        console.error("❌ Erreur chargement stats admin :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="center">Chargement des statistiques...</div>;

  return (
    <section className="dashboard-grid">
      <div className="stats-row">
        <StatCard title="Utilisateurs" value={stats.users} />
        <StatCard title="Prestataires actifs" value={stats.activeProviders} />
        <StatCard title="Réservations" value={stats.bookings} />
      </div>

      <div className="main-section">
        <h2>Administration</h2>
        <p>Tableau de bord administratif — surveillance et gestion globale.</p>
      </div>
    </section>
  );
}
