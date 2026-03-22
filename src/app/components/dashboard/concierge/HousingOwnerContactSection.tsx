"use client";

import { useEffect, useState } from "react";
import EditableSectionCard from "./EditableSectionCard";
import styles from "./LogementWorkspace.module.scss";
import type { HousingOwnerInfo, HousingRow } from "@/types/housing";
import { normalizeHousingRow } from "@/types/housing";

export default function HousingOwnerContactSection({
  housingId,
  owner,
  onOwnerSaved,
}: {
  housingId: string;
  owner: HousingOwnerInfo;
  onOwnerSaved: (nextOwner: HousingOwnerInfo, row: HousingRow) => void;
}) {
  const [draft, setDraft] = useState(owner);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(owner);
  }, [owner]);

  async function handleSave() {
    if (!draft.fullName.trim()) {
      setError("Le nom complet du propriétaire est obligatoire.");
      setSuccess("");
      return;
    }
    if (!draft.email.trim()) {
      setError("L'email du propriétaire est obligatoire pour envoyer une invitation.");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response = await fetch(`/api/housing/${housingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proprietaire: {
            owner_profile_id: draft.profileId,
            manager_profile_id: draft.managerProfileId,
            full_name: draft.fullName.trim(),
            email: draft.email.trim(),
            phone: draft.phone.trim(),
            company_name: draft.companyName.trim(),
            city: draft.city.trim(),
            notes: draft.notes.trim(),
            invitation_message_template: (draft.invitationMessageTemplate ?? "").trim(),
            source: draft.source,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'enregistrer le contact propriétaire.");
      }

      const normalized = normalizeHousingRow(payload as HousingRow);
      onOwnerSaved(normalized.owner, payload as HousingRow);
      setDraft(normalized.owner);
      setEditing(false);
      setSuccess("Contact propriétaire bien enregistré.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Impossible d'enregistrer le contact propriétaire.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditableSectionCard
      eyebrow="Propriétaire"
      title="Contact principal rattaché au logement"
      isEditing={editing}
      onEdit={() => {
        setDraft(owner);
        setSuccess("");
        setError("");
        setEditing(true);
      }}
      onCancel={() => {
        setDraft(owner);
        setError("");
        setSuccess("Modifications annulées.");
        setEditing(false);
      }}
      onSave={handleSave}
      saving={saving}
      successMessage={success}
      errorMessage={error}
    >
      <div className={styles.fieldGrid}>
        <label className={styles.label}>
          <span>Nom complet</span>
          <input
            className={styles.field}
            value={draft.fullName}
            disabled={!editing}
            onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))}
          />
        </label>

        <label className={styles.label}>
          <span>Email propriétaire</span>
          <input
            className={styles.field}
            value={draft.email}
            disabled={!editing}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
          />
        </label>

        <label className={styles.label}>
          <span>Téléphone</span>
          <input
            className={styles.field}
            value={draft.phone}
            disabled={!editing}
            onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
          />
        </label>

        <label className={styles.label}>
          <span>Société</span>
          <input
            className={styles.field}
            value={draft.companyName}
            disabled={!editing}
            onChange={(event) => setDraft((current) => ({ ...current, companyName: event.target.value }))}
          />
        </label>
      </div>
    </EditableSectionCard>
  );
}
