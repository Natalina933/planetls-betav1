"use client";

import React, { useEffect, useState } from "react";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import StatCard from "@/app/components/dashboard/StatCard";
import PropertyList from "@/app/components/dashboard/PropertyList";
import {supabaseBrowser} from "@/app/lib/dbClient";

interface OwnerStats {
    properties: number;
    upcomingBookings: number;
    monthlyRevenue: string;
}

interface Property {
    id: string;
    name: string | null;
    city: string | null;
    status?: string | null;
}

export default function OwnerDashboardPage() {
    const { user, loading, isAuthenticated } = useCurrentUser();
    const [stats, setStats] = useState<OwnerStats>({
        properties: 0,
        upcomingBookings: 0,
        monthlyRevenue: "0 €",
    });
    const [properties, setProperties] = useState<Property[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        const fetchData = async () => {
            try {
                const supabase = supabaseBrowser();

                const { data: propsData } = await supabase
                    .from("properties")
                    .select("id, name, city, status")
                    .eq("owner_id", user.id);

                const { data: bookingsData } = await supabase
                    .from("reservations")
                    .select("id")
                    .eq("owner_id", user.id)
                    .gte("start_date", new Date().toISOString());

                setProperties(propsData ?? []);
                setStats({
                    properties: propsData?.length ?? 0,
                    upcomingBookings: bookingsData?.length ?? 0,
                    monthlyRevenue: "2 350 €", // TODO: calcul dynamique
                });
            } catch (err) {
                console.error("❌ Erreur chargement dashboard propriétaire :", err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [isAuthenticated, user]);

    if (loading || loadingData) return <div className="center">Chargement...</div>;
    if (!isAuthenticated) return <div className="center">Veuillez vous connecter</div>;

    return (
        <section className="dashboard-grid">
            <div className="stats-row">
                <StatCard title="Biens gérés" value={stats.properties} small="Total propriétés" />
                <StatCard title="Réservations à venir" value={stats.upcomingBookings} />
                <StatCard title="Revenus du mois" value={stats.monthlyRevenue} />
            </div>

            <div className="main-section">
                <h2>Vos propriétés</h2>
                <PropertyList properties={properties} />
            </div>
        </section>
    );
}
