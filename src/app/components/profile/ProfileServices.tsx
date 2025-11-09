"use client";

import React, { useEffect, useState } from "react";
import styles from "./ProfileServices.module.scss";
type ProfileService = Tables<"profile_services">;

interface ProfileServicesProps {
  profileId: number;
  category: "proprietaire" | "concierge" | "artisan";
  editable?: boolean;
}

const defaultServices: Record<ProfileServicesProps["category"], string[]> = {
  proprietaire: [
    "Gestion complète de la location",
    "Check-in / Check-out",
    "Nettoyage entre séjours",
    "Linge / blanchisserie",
    "Maintenance / petites réparations",
    "Photographies professionnelles",
    "Communication voyageurs",
    "Décoration et aménagement",
  ],
  concierge: [
    "Accueil des voyageurs",
    "Service de ménage professionnel",
    "Gestion des clés",
    "Support client 24/7",
    "Reporting et transparence",
    "Gestion multi-biens",
    "Maintenance et réparations",
  ],
  artisan: [
    "Plomberie / Électricité",
    "Peinture / Décoration",
    "Menuiserie / Ameublement",
    "Jardinage / Extérieur",
    "Entretien général",
    "Réparations urgentes",
    "Installation d’équipements",
  ],
};

export default function ProfileServices({
  profileId,
  category,
  editable = false,
}: ProfileServicesProps) {
  const [services, setServices] = useState<ProfileService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Chargement des services depuis Supabase
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("profile_services")
        .select("*")
        .eq("profile_id", profileId)
        .eq("category", category);

      if (error) console.error(error);

      if (!data || data.length === 0) {
        // Initialisation si pas de données
        const base: ProfileService[] = defaultServices[category].map((s) => ({
          id: 0,
          profile_id: profileId,
          category,
          service: s,
          new_id: null,
          new_profile_id: null,
        }));
        setServices(base);
      } else {
        setServices(data);
      }

      setLoading(false);
    })();
  }, [profileId, category]);

  // Toggle case à cocher
  const handleToggle = (serviceName: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.service === serviceName ? { ...s, is_active: !s.is_active } : s
      )
    );
  };

  // Sauvegarde Supabase
  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      // Supprime les anciens services pour ce profil/catégorie
      await supabase
        .from("profile_services")
        .delete()
        .eq("profile_id", profileId)
        .eq("category", category);

      const payload: Partial<ProfileService>[] = services.map((s) => ({
        profile_id: profileId,
        category,
        service: s.service,
        new_id: s.new_id,
        new_profile_id: s.new_profile_id,
      }));

      const { error } = await supabase.from("profile_services").insert(payload);
      if (error) throw error;

      setMessage("✅ Services mis à jour !");
    } catch (err) {
      if (err instanceof Error) {
        setMessage("❌ Erreur : " + err.message);
      } else {
        setMessage("❌ Erreur inconnue.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Chargement des services…</div>;

  return (
    <div className={styles.servicesContainer}>
      <h2 className={styles.title}>Services ({category})</h2>
      <ul className={styles.servicesList}>
        {services.map((s) => (
          <li key={s.service}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!s.is_active}
                onChange={() => editable && handleToggle(s.service!)}
                disabled={!editable}
              />
              <span>{s.service}</span>
            </label>
          </li>
        ))}
      </ul>

      {editable && (
        <button
          onClick={handleSave}
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? "💾 Sauvegarde..." : "Sauvegarder"}
        </button>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}