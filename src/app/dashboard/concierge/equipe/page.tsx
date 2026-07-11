"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import {
  buildTeamManagementDashboard,
  type TeamMemberInput,
  type TeamMissionInput,
} from "@/app/lib/teamManagement";
import styles from "./EquipePage.module.scss";

type ProfilePayload = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  company_name?: string | null;
  role?: string | null;
};

function profileName(profile: ProfilePayload | null) {
  if (!profile) return "Responsable equipe";
  return (
    profile.company_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.username ||
    "Responsable equipe"
  );
}

function roleLabel(role: string) {
  if (role === "manager") return "Manager";
  if (role === "lead") return "Lead terrain";
  if (role === "employee") return "Employe";
  if (role === "provider") return "Prestataire";
  return "Collaborateur";
}

function availabilityLabel(value: string) {
  if (value === "available") return "Disponible";
  if (value === "busy") return "Occupe";
  return "Hors ligne";
}

function buildDefaultMembers(profile: ProfilePayload | null): TeamMemberInput[] {
  const managerId = profile?.id || "manager";
  return [
    {
      id: managerId,
      name: profileName(profile),
      role: profile?.role || "manager",
      title: "Responsable conciergerie",
      availability: "available",
      skills: ["Pilotage", "Clients", "Validation"],
    },
    {
      id: "employee-cleaning-lead",
      name: "Referent menage",
      role: "lead",
      title: "Employe terrain",
      availability: "available",
      skills: ["Menage", "Controle", "Photos"],
    },
    {
      id: "collaborator-checkin",
      name: "Collaborateur accueil",
      role: "collaborator",
      title: "Check-in et voyageurs",
      availability: "available",
      skills: ["Accueil", "Cles", "Messages"],
    },
    {
      id: "provider-maintenance",
      name: "Prestataire maintenance",
      role: "provider",
      title: "Interventions techniques",
      availability: "offline",
      skills: ["Maintenance", "Urgences"],
    },
  ];
}

export default function EquipePage() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [missions, setMissions] = useState<TeamMissionInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMissionId, setSavingMissionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [profileResponse, missionsResponse] = await Promise.all([
        fetch("/api/profiles/current", { cache: "no-store" }),
        fetch("/api/missions?scope=concierge&limit=80", { cache: "no-store" }),
      ]);
      const profilePayload = await profileResponse.json();
      const missionsPayload = await missionsResponse.json();
      if (!profileResponse.ok) throw new Error(profilePayload?.error || "Impossible de charger le profil.");
      if (!missionsResponse.ok) throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
      setProfile(profilePayload);
      setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement equipe impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const members = useMemo(() => buildDefaultMembers(profile), [profile]);
  const dashboard = useMemo(() => buildTeamManagementDashboard({ members, missions }), [members, missions]);

  async function assignMission(missionId: string, teamMemberId: string) {
    const member = dashboard.members.find((entry) => entry.id === teamMemberId);
    if (!member) return;
    try {
      setSavingMissionId(missionId);
      setMessage(null);
      setError(null);
      const response = await fetch(`/api/missions/${missionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_team_member",
          team_member_id: member.id,
          team_member_name: member.name,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Attribution impossible.");
      setMessage(`Mission attribuee a ${member.name}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attribution impossible.");
    } finally {
      setSavingMissionId(null);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Gestion d'equipe</p>
            <h1>Employes, collaborateurs et attribution des missions</h1>
            <p>
              Pilotez roles, permissions, planning, disponibilite, performances et notifications depuis un centre equipe unique.
            </p>
          </div>
          <div className={styles.score} aria-label="Performance equipe moyenne">
            <strong>{loading ? "..." : `${dashboard.metrics.averagePerformance}%`}</strong>
            <span>performance</span>
          </div>
        </div>

        {message ? <p className={styles.message}>{message}</p> : null}
        {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}

        <div className={styles.metricGrid}>
          <article><span>Employes</span><strong>{dashboard.metrics.employees}</strong></article>
          <article><span>Collaborateurs</span><strong>{dashboard.metrics.collaborators}</strong></article>
          <article><span>Disponibles</span><strong>{dashboard.metrics.available}</strong></article>
          <article><span>Notifications</span><strong>{dashboard.metrics.notifications}</strong></article>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Equipe</p>
            <h2>Roles, disponibilites et performances</h2>
          </div>
          <UsersRound size={24} aria-hidden="true" />
        </div>
        <div className={styles.memberGrid}>
          {dashboard.members.map((member) => (
            <article className={styles.memberCard} key={member.id}>
              <div className={styles.memberTop}>
                <div>
                  <p className={styles.eyebrow}>{roleLabel(member.role)}</p>
                  <h3>{member.name}</h3>
                </div>
                <span className={`${styles.badge} ${member.availability === "busy" ? styles.warningBadge : ""}`}>
                  {availabilityLabel(member.availability)}
                </span>
              </div>
              <div className={styles.memberFacts}>
                <div><span>Planning</span><strong>{member.assignedMissionCount} mission(s)</strong></div>
                <div><span>Terminees</span><strong>{member.completedMissionCount}</strong></div>
                <div><span>Performance</span><strong>{member.performanceScore}%</strong></div>
                <div><span>Alertes</span><strong>{member.notificationCount}</strong></div>
              </div>
              <div className={styles.permissionList}>
                {member.permissions.slice(0, 5).map((permission) => <span key={permission}>{permission}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className={styles.sectionGrid}>
        <section className={styles.section}>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Permissions</p>
              <h2>Roles et droits</h2>
            </div>
            <ShieldCheck size={22} aria-hidden="true" />
          </div>
          <div className={styles.roleList}>
            {dashboard.roleMatrix.map((role) => (
              <div key={role.role}>
                <span>{roleLabel(role.role)}</span>
                <strong>{role.permissions.length} permission(s)</strong>
                <div className={styles.permissionList}>{role.permissions.map((permission) => <span key={permission}>{permission}</span>)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Planning</p>
              <h2>Disponibilites et missions</h2>
            </div>
            <CalendarDays size={22} aria-hidden="true" />
          </div>
          <div className={styles.planningList}>
            {dashboard.planning.length > 0 ? dashboard.planning.map((item) => (
              <div key={`${item.memberId}-${item.label}`}>
                <span>{item.memberName}</span>
                <strong>{item.label}</strong>
                <span>{item.start ? new Date(item.start).toLocaleString("fr-FR") : "Date a planifier"} - {item.status}</span>
              </div>
            )) : <p className={styles.message}>Aucune mission encore attribuee.</p>}
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Attribution</p>
            <h2>Chaque mission peut etre attribuee</h2>
          </div>
          <Bell size={24} aria-hidden="true" />
        </div>
        <div className={styles.assignmentList}>
          {dashboard.assignableMissions.slice(0, 12).map((mission) => (
            <article className={styles.assignmentCard} key={mission.id}>
              <div className={styles.assignmentTop}>
                <div>
                  <p className={styles.eyebrow}>{mission.priority || "normal"}</p>
                  <h3>{mission.title || "Mission"}</h3>
                </div>
                <span className={styles.badge}>{mission.status || "draft"}</span>
              </div>
              <select
                aria-label={`Attribuer ${mission.title || "mission"}`}
                defaultValue={mission.assigned_team_member_id || ""}
                onChange={(event) => void assignMission(mission.id, event.target.value)}
                disabled={savingMissionId === mission.id}
              >
                <option value="">Non attribuee</option>
                {dashboard.members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name} - {roleLabel(member.role)}</option>
                ))}
              </select>
            </article>
          ))}
          {dashboard.assignableMissions.length === 0 ? <p className={styles.message}>Aucune mission disponible.</p> : null}
        </div>
      </section>
    </main>
  );
}