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

type TeamPayload = { items?: TeamMemberInput[]; schema_ready?: boolean; error?: string };

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
      dailyCapacityMinutes: 480,
    },
    {
      id: "employee-cleaning-lead",
      name: "Referent menage",
      role: "lead",
      title: "Employe terrain",
      availability: "available",
      skills: ["Menage", "Controle", "Photos"],
      dailyCapacityMinutes: 420,
    },
    {
      id: "collaborator-checkin",
      name: "Collaborateur accueil",
      role: "collaborator",
      title: "Check-in et voyageurs",
      availability: "available",
      skills: ["Accueil", "Cles", "Messages"],
      dailyCapacityMinutes: 360,
    },
    {
      id: "provider-maintenance",
      name: "Prestataire maintenance",
      role: "provider",
      title: "Interventions techniques",
      availability: "offline",
      skills: ["Maintenance", "Urgences"],
      dailyCapacityMinutes: 480,
    },
  ];
}

export default function EquipePage() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [missions, setMissions] = useState<TeamMissionInput[]>([]);
  const [persistedMembers, setPersistedMembers] = useState<TeamMemberInput[]>([]);
  const [schemaReady, setSchemaReady] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("employee");
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMissionId, setSavingMissionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [profileResponse, missionsResponse, teamResponse] = await Promise.all([
        fetch("/api/profiles/current", { cache: "no-store" }),
        fetch("/api/missions?scope=concierge&limit=80", { cache: "no-store" }),
        fetch("/api/concierge/team", { cache: "no-store" }),
      ]);
      const profilePayload = await profileResponse.json();
      const missionsPayload = await missionsResponse.json();
      const teamPayload = await teamResponse.json() as TeamPayload;
      if (!profileResponse.ok) throw new Error(profilePayload?.error || "Impossible de charger le profil.");
      if (!missionsResponse.ok) throw new Error(missionsPayload?.error || "Impossible de charger les missions.");
      if (!teamResponse.ok) throw new Error(teamPayload.error || "Impossible de charger equipe.");
      setProfile(profilePayload);
      setMissions(Array.isArray(missionsPayload) ? missionsPayload : []);
      setPersistedMembers(Array.isArray(teamPayload.items) ? teamPayload.items : []);
      setSchemaReady(teamPayload.schema_ready === true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement equipe impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const members = useMemo(
    () => schemaReady ? persistedMembers : buildDefaultMembers(profile),
    [persistedMembers, profile, schemaReady],
  );
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

  async function createMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSavingMemberId("new");
      setError(null);
      const response = await fetch("/api/concierge/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMemberName, role: newMemberRole }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Creation impossible.");
      setNewMemberName("");
      setMessage(`${payload.name} a ete ajoute a l'equipe.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation impossible.");
    } finally {
      setSavingMemberId(null);
    }
  }

  async function updateMember(memberId: string, availability: string) {
    try {
      setSavingMemberId(memberId);
      setError(null);
      const response = await fetch(`/api/concierge/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Modification impossible.");
      setMessage("Disponibilite mise a jour.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification impossible.");
    } finally {
      setSavingMemberId(null);
    }
  }

  async function deactivateMember(memberId: string, memberName: string) {
    if (!window.confirm(`Desactiver ${memberName} de l'equipe ?`)) return;
    try {
      setSavingMemberId(memberId);
      setError(null);
      const response = await fetch(`/api/concierge/team/${memberId}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Desactivation impossible.");
      setMessage(`${memberName} a ete desactive.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Desactivation impossible.");
    } finally {
      setSavingMemberId(null);
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
          <article><span>Surcharges</span><strong>{dashboard.metrics.overloaded}</strong></article>
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
                <div><span>Charge du jour</span><strong>{member.capacityUsagePercent}%</strong></div>
              </div>
              <div className={styles.permissionList}>
                {member.permissions.slice(0, 5).map((permission) => <span key={permission}>{permission}</span>)}
              </div>
              {schemaReady ? (
                <div className={styles.memberActions}>
                  <select
                    aria-label={`Disponibilite de ${member.name}`}
                    value={member.availability}
                    disabled={savingMemberId === member.id}
                    onChange={(event) => void updateMember(member.id, event.target.value)}
                  >
                    <option value="available">Disponible</option>
                    <option value="busy">Occupe</option>
                    <option value="offline">Hors ligne</option>
                  </select>
                  <button type="button" disabled={savingMemberId === member.id} onClick={() => void deactivateMember(member.id, member.name)}>
                    Desactiver
                  </button>
                </div>
              ) : null}
            </article>
          ))}
          {schemaReady && dashboard.members.length === 0 ? <p className={styles.message}>Ajoutez le premier membre de votre equipe.</p> : null}
        </div>
        {schemaReady ? (
          <form className={styles.memberForm} onSubmit={(event) => void createMember(event)}>
            <label>
              Nom du membre
              <input value={newMemberName} minLength={2} maxLength={120} required onChange={(event) => setNewMemberName(event.target.value)} />
            </label>
            <label>
              Role
              <select value={newMemberRole} onChange={(event) => setNewMemberRole(event.target.value)}>
                <option value="manager">Manager</option>
                <option value="lead">Lead terrain</option>
                <option value="employee">Employe</option>
                <option value="collaborator">Collaborateur</option>
                <option value="provider">Prestataire</option>
              </select>
            </label>
            <button type="submit" disabled={savingMemberId === "new"}>{savingMemberId === "new" ? "Ajout..." : "Ajouter a l'equipe"}</button>
          </form>
        ) : <p className={styles.message}>Mode demonstration : appliquez la migration Supabase equipe pour activer la gestion persistante.</p>}
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