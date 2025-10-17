"use client";

import React, { useEffect, useState } from "react";
import { useCurrentUser } from "@/app/components/hooks/useCurrentUser";
import StatCard from "@/app/components/dashboard/StatCard";
import JobList from "@/app/components/dashboard/JobList";
import { supabaseBrowser } from "@/app/lib/dbClient";

export interface Job {
    id: string;
    title: string;
    description?: string | null;
    status?: string | null;
    service?: string | null;
}

interface ProviderStats {
    quotes: number;
    accepted: number;
    revenue: string;
}
export default function ProviderDashboard() {
    const { user, loading, isAuthenticated } = useCurrentUser();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [stats, setStats] = useState<ProviderStats>({
        quotes: 0,
        accepted: 0,
        revenue: "0 €",
    });
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        const fetchJobs = async () => {
            try {
                const supabase = supabaseBrowser();

                const { data } = await supabase
                    .from("jobs")
                    .select("id, title, description, status, service")
                    .eq("provider_id", user.id);

                const jobsList: Job[] = data ?? [];
                setJobs(jobsList);

                setStats({
                    quotes: jobsList.length,
                    accepted: jobsList.filter((j) => j.status === "accepted").length,
                    revenue: "1 200 €",
                });
            } catch (err) {
                console.error("❌ Erreur chargement dashboard prestataire :", err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchJobs();
    }, [isAuthenticated, user]);

    if (loading || loadingData) return <div className="center">Chargement...</div>;
    if (!isAuthenticated) return <div className="center">Veuillez vous connecter</div>;

    return (
        <section className="dashboard-grid">
            <div className="stats-row">
                <StatCard title="Devis reçus" value={stats.quotes} />
                <StatCard title="Chantiers acceptés" value={stats.accepted} />
                <StatCard title="Revenus" value={stats.revenue} />
            </div>

            <div className="main-section">
                <h2>Vos chantiers</h2>
                <JobList jobs={jobs} />
            </div>
        </section>
    );
}