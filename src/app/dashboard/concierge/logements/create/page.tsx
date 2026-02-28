"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiPlus } from "react-icons/fi";
import styles from "../LogementsPage.module.scss";
import {
  FormState,
  buildCreateLogementPayload,
  buildCreateLogementSummary,
  validateCreateLogementForm,
} from "./createLogementHelpers";

export default function AddLogementPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>({
    name: "",
    propertyType: "Appartement",
    description: "",
    capacity: "",
    bedrooms: "",
    equipments: "",
    address: "",
    city: "",
    platform: "Airbnb",
    photo: "",
    status: "pret",
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = session?.user?.id;
    const validationError = validateCreateLogementForm(form, userId);
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/housing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCreateLogementPayload(form, userId!)),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : "Impossible de créer le logement",
        );
      }

      setSubmitted(true);
      setSuccess("Logement enregistré avec succès. Redirection en cours...");
      router.push("/dashboard/concierge/logements");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const summary = buildCreateLogementSummary(form);

  return (
    <div className={styles.logementsPage}>
      <div className={styles.header}>
        <h1>Ajouter un logement</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Nom du logement</label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Appartement Haussmannien"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="propertyType">Type de bien</label>
          <select
            name="propertyType"
            id="propertyType"
            value={form.propertyType}
            onChange={handleChange}
          >
            <option value="Appartement">Appartement</option>
            <option value="Maison">Maison</option>
            <option value="Villa">Villa</option>
            <option value="Studio">Studio</option>
            <option value="Loft">Loft</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="city">Ville</label>
          <input
            type="text"
            id="city"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
            placeholder="Paris"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="address">Adresse</label>
          <input
            type="text"
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            placeholder="12 rue des Tilleuls"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="capacity">Capacité</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
            min="1"
            placeholder="4"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="bedrooms">Nombre de chambres</label>
          <input
            type="number"
            id="bedrooms"
            name="bedrooms"
            value={form.bedrooms}
            onChange={handleChange}
            min="0"
            placeholder="2"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="platform">Plateforme principale</label>
          <select
            name="platform"
            id="platform"
            value={form.platform}
            onChange={handleChange}
          >
            <option value="Airbnb">Airbnb</option>
            <option value="Booking">Booking</option>
            <option value="Abritel">Abritel</option>
            <option value="Direct">Direct</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="photo">URL de la photo</label>
          <input
            type="text"
            id="photo"
            name="photo"
            value={form.photo}
            onChange={handleChange}
            placeholder="/images/default-logement.jpg"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <input
            type="text"
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Bien calme, lumineux, proche centre-ville..."
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="equipments">Équipements</label>
          <input
            type="text"
            id="equipments"
            name="equipments"
            value={form.equipments}
            onChange={handleChange}
            placeholder="Wifi, Climatisation, Parking, Piscine"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="status">Statut</label>
          <select name="status" id="status" value={form.status} onChange={handleChange}>
            <option value="pret">Prêt</option>
            <option value="menage">Ménage en cours</option>
            <option value="arrivee">Arrivée du jour</option>
            <option value="depart">Départ du jour</option>
          </select>
        </div>

        <div className={styles.demoNotice}>
          <p>Résumé avant création</p>
          <div className={styles.cardMeta}>
            {summary.map((item) => (
              <span key={item.label} className={styles.metaItem}>
                {item.label} : {item.value}
              </span>
            ))}
          </div>
        </div>

        <button type="submit" className={styles.btnAdd} disabled={saving}>
          <FiPlus /> {saving ? "Enregistrement..." : "Enregistrer"}
        </button>

        {submitted && (
          <p className={styles.successMessage}>Logement enregistré avec succès.</p>
        )}
        {success && <p className={styles.successMessage}>{success}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </form>
    </div>
  );
}
