"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OwnerWorkspacePage from "../../_components/OwnerWorkspacePage";
import { Button, Input, Select, Textarea } from "@/components/ui";
import styles from "@/app/dashboard/missions/MissionDetailPage.module.scss";
import { isAcceptedMissionPartner, isUuidLike } from "../missionPartnerUtils";

type HousingRow = { id: string | number; nom_logement?: string | null; ville?: string | null };
type PartnerRow = {
  id: string;
  selected_concierge_profile_id?: string | null;
  selected_concierge_name?: string | null;
  property_name?: string | null;
  city?: string | null;
  workflow_status?: string | null;
  status?: string | null;
  mission_id?: string | null;
  recipients?: Array<{ status?: string | null }> | null;
};

export default function OwnerNewMissionPage() {
  const router = useRouter();
  const [housing, setHousing] = useState<HousingRow[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    property_id: "",
    concierge_profile_id: "",
    priority: "normal",
    scheduled_start: "",
    scheduled_end: "",
    amount: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [housingResponse, requestsResponse] = await Promise.all([
        fetch("/api/housing", { cache: "no-store" }),
        fetch("/api/service-requests?limit=100", { cache: "no-store" }),
      ]);
      const housingPayload = await housingResponse.json();
      const requestsPayload = await requestsResponse.json();
      if (!housingResponse.ok) throw new Error(housingPayload?.error || "Impossible de charger les logements.");
      if (!requestsResponse.ok) throw new Error(requestsPayload?.error || "Impossible de charger les partenaires.");

      const nextHousing = Array.isArray(housingPayload) ? housingPayload : [];
      const acceptedPartners = (Array.isArray(requestsPayload?.items) ? requestsPayload.items : []).filter(
        isAcceptedMissionPartner,
      );
      setHousing(nextHousing);
      setPartners(acceptedPartners);
      setForm((current) => ({
        ...current,
        property_id: current.property_id || String(nextHousing[0]?.id ?? ""),
        concierge_profile_id: current.concierge_profile_id || acceptedPartners[0]?.selected_concierge_profile_id || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de préparer la mission.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (partners.length === 0) {
        setError("Aucune conciergerie partenaire acceptée n'est disponible. Acceptez d'abord un devis ou une demande partenaire.");
        setSubmitting(false);
        return;
      }
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          property_id: isUuidLike(form.property_id) ? form.property_id : null,
          concierge_profile_id: form.concierge_profile_id,
          priority: form.priority,
          status: "assigned",
          scheduled_start: form.scheduled_start ? new Date(form.scheduled_start).toISOString() : null,
          scheduled_end: form.scheduled_end ? new Date(form.scheduled_end).toISOString() : null,
          amount: form.amount ? Number(form.amount) : null,
          metadata: {
            mission_kind: "classic",
            housing_id: form.property_id || null,
            notification_reason: "new_classic_mission",
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Impossible de créer la mission.");
      router.push(`/dashboard/owner/missions/${payload.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la mission.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OwnerWorkspacePage
      eyebrow="Nouvelle mission"
      title="Créer une mission classique"
      description={loading ? "Chargement des partenaires..." : "Créez une mission opérationnelle hors séjour voyageur et hors urgence."}
      actions={[{ label: "Missions voyageurs", href: "/dashboard/owner/missions/voyageurs" }]}
      cards={[]}
    >
      <section className={styles.panel}>
        {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}
        <form className={styles.formGrid} onSubmit={submit}>
          <label className={styles.label}>
            Titre
            <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
          </label>
          <label className={styles.label}>
            Priorité
            <Select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </Select>
          </label>
          <label className={styles.label}>
            Logement
            <Select value={form.property_id} onChange={(event) => setForm((current) => ({ ...current, property_id: event.target.value }))}>
              <option value="">Sans logement</option>
              {housing.map((item) => (
                <option key={String(item.id)} value={String(item.id)}>
                  {item.nom_logement || item.ville || "Logement"}
                </option>
              ))}
            </Select>
          </label>
          <label className={styles.label}>
            Conciergerie
            <Select value={form.concierge_profile_id} onChange={(event) => setForm((current) => ({ ...current, concierge_profile_id: event.target.value }))} required>
              <option value="">Choisir</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.selected_concierge_profile_id || ""}>
                  {partner.selected_concierge_name || "Conciergerie"} - {partner.property_name || partner.city || "partenaire"}
                </option>
              ))}
            </Select>
            {partners.length === 0 ? (
              <span>Aucun partenaire accepté trouvé pour le moment.</span>
            ) : null}
          </label>
          <label className={styles.label}>
            Début
            <Input type="datetime-local" value={form.scheduled_start} onChange={(event) => setForm((current) => ({ ...current, scheduled_start: event.target.value }))} />
          </label>
          <label className={styles.label}>
            Fin
            <Input type="datetime-local" value={form.scheduled_end} onChange={(event) => setForm((current) => ({ ...current, scheduled_end: event.target.value }))} />
          </label>
          <label className={styles.label}>
            Budget
            <Input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
          </label>
          <label className={`${styles.label} ${styles.fullWidth}`}>
            Consignes
            <Textarea rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <div className={styles.fullWidth}>
            <Button type="submit" disabled={submitting || !form.title || !form.concierge_profile_id}>
              {submitting ? "Création..." : "Créer la mission"}
            </Button>
          </div>
        </form>
      </section>
    </OwnerWorkspacePage>
  );
}
