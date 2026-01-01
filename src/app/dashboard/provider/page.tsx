"use client";

import React, { useState, useEffect } from "react";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiDollarSign, 
  FiClock,
  FiAlertCircle,
  FiTrendingUp 
} from "react-icons/fi";

export interface Job {
  id: string;
  title: string;
  description?: string | null;
  status?: "pending" | "accepted" | "in_progress" | "completed" | "cancelled" | null;
  service?: string | null;
  client_name?: string;
  deadline?: string;
  budget?: number;
  created_at?: string;
}

interface ProviderStats {
  quotes: number;
  accepted: number;
  in_progress: number;
  completed: number;
  revenue: number;
  monthly_revenue: number;
}

const STATUS_CONFIG = {
  pending: { label: "En attente", color: "#f39c12", icon: FiClock },
  accepted: { label: "Accepté", color: "#3498db", icon: FiCheckCircle },
  in_progress: { label: "En cours", color: "#9b59b6", icon: FiTrendingUp },
  completed: { label: "Terminé", color: "#27ae60", icon: FiCheckCircle },
  cancelled: { label: "Annulé", color: "#e74c3c", icon: FiAlertCircle },
};

export default function ProviderDashboard() {
  const [jobs, setJobs] = useState<Job[]>([
    { 
      id: "1", 
      title: "Installation cuisine complète", 
      description: "Pose de meubles, plans de travail et électroménager", 
      status: "accepted", 
      service: "Menuiserie",
      client_name: "M. Dubois",
      deadline: "2025-01-15",
      budget: 2500,
      created_at: "2024-12-20"
    },
    { 
      id: "2", 
      title: "Peinture salon et couloir", 
      description: "Peinture murale avec lessivage préalable", 
      status: "pending", 
      service: "Peinture",
      client_name: "Mme Martin",
      deadline: "2025-01-10",
      budget: 800,
      created_at: "2024-12-28"
    },
    { 
      id: "3", 
      title: "Réparation toiture urgente", 
      description: "Remplacement de tuiles cassées suite à tempête", 
      status: "in_progress", 
      service: "Toiture",
      client_name: "M. Lefèvre",
      deadline: "2025-01-05",
      budget: 1500,
      created_at: "2024-12-15"
    },
    { 
      id: "4", 
      title: "Installation électrique", 
      description: "Mise aux normes tableau électrique", 
      status: "completed", 
      service: "Électricité",
      client_name: "Mme Rousseau",
      budget: 1200,
      created_at: "2024-11-20"
    },
  ]);

  const [stats, setStats] = useState<ProviderStats>({
    quotes: 0,
    accepted: 0,
    in_progress: 0,
    completed: 0,
    revenue: 0,
    monthly_revenue: 0,
  });

  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "budget" | "deadline">("date");

  useEffect(() => {
    const newStats: ProviderStats = {
      quotes: jobs.length,
      accepted: jobs.filter((j) => j.status === "accepted").length,
      in_progress: jobs.filter((j) => j.status === "in_progress").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      revenue: jobs
        .filter((j) => j.status === "completed")
        .reduce((sum, j) => sum + (j.budget || 0), 0),
      monthly_revenue: jobs
        .filter((j) => {
          const createdDate = new Date(j.created_at || "");
          const currentMonth = new Date().getMonth();
          return j.status === "completed" && createdDate.getMonth() === currentMonth;
        })
        .reduce((sum, j) => sum + (j.budget || 0), 0),
    };
    setStats(newStats);
  }, [jobs]);

  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true;
    return job.status === filter;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
    }
    if (sortBy === "budget") {
      return (b.budget || 0) - (a.budget || 0);
    }
    if (sortBy === "deadline") {
      return new Date(a.deadline || "").getTime() - new Date(b.deadline || "").getTime();
    }
    return 0;
  });

  const handleAcceptJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: "accepted" as const } : job
      )
    );
  };

  const handleStartJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: "in_progress" as const } : job
      )
    );
  };

  const handleCompleteJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: "completed" as const } : job
      )
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 700, 
          color: '#2c3e50', 
          marginBottom: '0.5rem' 
        }}>
          Tableau de bord prestataire
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#7f8c8d' }}>
          Gérez vos chantiers et suivez vos performances
        </p>
      </header>

      {/* Statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {[
          { icon: FiFileText, label: "Devis reçus", value: stats.quotes, bgColor: "#3498db20", color: "#3498db" },
          { icon: FiCheckCircle, label: "Chantiers acceptés", value: stats.accepted, bgColor: "#27ae6020", color: "#27ae60" },
          { icon: FiTrendingUp, label: "En cours", value: stats.in_progress, bgColor: "#9b59b620", color: "#9b59b6" },
          { icon: FiDollarSign, label: "Revenus totaux", value: formatCurrency(stats.revenue), bgColor: "#f39c1220", color: "#f39c12" }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                backgroundColor: stat.bgColor,
                color: stat.color
              }}>
                <Icon />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#7f8c8d',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {stat.label}
                </h3>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#2c3e50',
                  margin: 0
                }}>
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtres et tri */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { key: "all", label: `Tous (${jobs.length})` },
            { key: "pending", label: "En attente" },
            { key: "accepted", label: "Acceptés" },
            { key: "in_progress", label: "En cours" },
            { key: "completed", label: "Terminés" }
          ].map((filterBtn) => (
            <button
              key={filterBtn.key}
              onClick={() => setFilter(filterBtn.key)}
              style={{
                padding: '0.625rem 1.25rem',
                border: filter === filterBtn.key ? '2px solid #3498db' : '2px solid #e0e0e0',
                background: filter === filterBtn.key ? '#3498db' : 'white',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: filter === filterBtn.key ? 'white' : '#7f8c8d',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {filterBtn.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label htmlFor="sort-select" style={{
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#5a6c7d',
            whiteSpace: 'nowrap'
          }}>
            Trier par
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "budget" | "deadline")}
            aria-label="Trier les chantiers"
            style={{
              padding: '0.625rem 1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '0.9rem',
              background: 'white',
              color: '#2c3e50',
              cursor: 'pointer'
            }}
          >
            <option value="date">Date de création</option>
            <option value="budget">Budget</option>
            <option value="deadline">Échéance</option>
          </select>
        </div>
      </div>

      {/* Liste des chantiers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {sortedJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#95a5a6' }}>
            <FiAlertCircle size={48} style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.1rem', margin: 0 }}>Aucun chantier trouvé</p>
          </div>
        ) : (
          sortedJobs.map((job) => {
            const statusInfo = STATUS_CONFIG[job.status || "pending"];
            const StatusIcon = statusInfo.icon;

            return (
              <div key={job.id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.75rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: '#2c3e50',
                      margin: '0 0 0.25rem 0'
                    }}>
                      {job.title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#7f8c8d', margin: 0 }}>
                      {job.service}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    backgroundColor: `${statusInfo.color}20`,
                    color: statusInfo.color
                  }}>
                    <StatusIcon size={16} />
                    {statusInfo.label}
                  </div>
                </div>

                <p style={{ color: '#5a6c7d', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  {job.description}
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#5a6c7d' }}>
                    <strong style={{ color: '#2c3e50', fontWeight: 600, marginRight: '0.5rem' }}>
                      Client:
                    </strong>
                    {job.client_name}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#5a6c7d' }}>
                    <strong style={{ color: '#2c3e50', fontWeight: 600, marginRight: '0.5rem' }}>
                      Budget:
                    </strong>
                    {formatCurrency(job.budget || 0)}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#5a6c7d' }}>
                    <strong style={{ color: '#2c3e50', fontWeight: 600, marginRight: '0.5rem' }}>
                      Échéance:
                    </strong>
                    {formatDate(job.deadline)}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#5a6c7d' }}>
                    <strong style={{ color: '#2c3e50', fontWeight: 600, marginRight: '0.5rem' }}>
                      Créé le:
                    </strong>
                    {formatDate(job.created_at)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {job.status === "pending" && (
                    <button
                      onClick={() => handleAcceptJob(job.id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: '#27ae60',
                        color: 'white',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Accepter le devis
                    </button>
                  )}
                  {job.status === "accepted" && (
                    <button
                      onClick={() => handleStartJob(job.id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: '#9b59b6',
                        color: 'white',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Démarrer le chantier
                    </button>
                  )}
                  {job.status === "in_progress" && (
                    <button
                      onClick={() => handleCompleteJob(job.id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: '#3498db',
                        color: 'white',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Marquer comme terminé
                    </button>
                  )}
                  <button style={{
                    padding: '0.75rem 1.5rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'white',
                    color: '#7f8c8d',
                    transition: 'all 0.2s ease'
                  }}>
                    Voir détails
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}