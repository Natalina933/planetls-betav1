"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiPlus } from "react-icons/fi";
import formStyles from "@/app/dashboard/concierge/logements/LogementsPage.module.scss";
import pageStyles from "@/app/dashboard/owner/OwnerDashboardPages.module.scss";
import {
  FormState,
  buildCreateLogementPayload,
  buildCreateLogementSummary,
  buildManualOwnerPayload,
  validateCreateLogementForm,
} from "@/app/dashboard/concierge/logements/create/createLogementHelpers";

type CreateHousingFormProps = {
  redirectPath: string;
};

type CreatedOwnerResult = {
  owner_profile_id: string;
  owner_label: string;
};

const initialForm: FormState = {
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
  ownerFirstName: "",
  ownerLastName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerCompanyName: "",
};

const CONCIERGE_ROLES = new Set(["concierge", "concierge_pro"]);

export default function CreateHousingForm({ redirectPath }: CreateHousingFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const isConciergeFlow = typeof userRole === "string" && CONCIERGE_ROLES.has(userRole);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const createManualOwner = async (): Promise<CreatedOwnerResult> => {
    const response = await fetch("/api/concierge/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildManualOwnerPayload(form)),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        typeof result?.error === "string"
          ? result.error
          : "Impossible de creer le proprietaire.",
      );
    }

    if (
      !result ||
      typeof result.owner_profile_id !== "string" ||
      typeof result.owner_label !== "string"
    ) {
      throw new Error("Le proprietaire a ete cree mais la reponse est incomplete.");
    }

    return result as CreatedOwnerResult;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateCreateLogementForm(form, userId, {
      isConciergeFlow,
    });
    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let ownerProfileId = userId!;
      let ownerLabel = "";

      if (isConciergeFlow) {
        const ownerResult = await createManualOwner();
        ownerProfileId = ownerResult.owner_profile_id;
        ownerLabel = ownerResult.owner_label;
      }

      const response = await fetch("/api/housing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCreateLogementPayload(form, ownerProfileId)),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : "Impossible de creer le logement.",
        );
      }

      setSubmitted(true);

      if (isConciergeFlow) {
        const targetLabel =
          ownerLabel ||
          `${form.ownerFirstName} ${form.ownerLastName}`.trim() ||
          form.ownerCompanyName.trim() ||
          form.ownerEmail.trim();

        setSuccess("Proprietaire et logement enregistres. Redirection vers le devis...");
        const query = new URLSearchParams({
          tab: "tarifs",
          ownerProfileId,
          ownerLabel: targetLabel,
        });
        router.push(`/dashboard/concierge/profile?${query.toString()}`);
      } else {
        setSuccess("Logement enregistre avec succes. Redirection en cours...");
        router.push(redirectPath);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const summary = buildCreateLogementSummary(form);

  return (
    <section className="dashboard-grid">
      <div className={pageStyles.dashboardFlow}>
        <section className={pageStyles.heroPanel}>
          <div className={pageStyles.sectionHeading}>
            <div>
              <p className={pageStyles.eyebrow}>Parc immobilier</p>
              <h1 className={pageStyles.terracottaTitle}>Ajouter un logement</h1>
              <p className={pageStyles.meta}>
                Renseignez une fiche claire des le depart pour mieux relier ensuite
                planning, documents et operations a ce bien.
              </p>
            </div>
          </div>

          <div className={pageStyles.priorityGrid}>
            <article className={pageStyles.priorityCard}>
              <p className={pageStyles.cardLabel}>Fiche</p>
              <strong className={pageStyles.cardValue}>1</strong>
              <span className={pageStyles.meta}>
                Un logement, une base claire pour toutes les suites.
              </span>
            </article>
            <article className={pageStyles.priorityCard}>
              <p className={pageStyles.cardLabel}>Coordonnees</p>
              <strong className={pageStyles.cardValue}>{form.city || "-"}</strong>
              <span className={pageStyles.meta}>Ville de reference du bien.</span>
            </article>
            <article className={`${pageStyles.priorityCard} ${pageStyles.priorityWarning}`}>
              <p className={pageStyles.cardLabel}>Statut</p>
              <strong className={pageStyles.cardValue}>{form.status}</strong>
              <span className={pageStyles.meta}>Preparation initiale du logement.</span>
            </article>
          </div>
        </section>

        <form onSubmit={handleSubmit} className={pageStyles.sectionStack}>
          {isConciergeFlow ? (
            <section className={pageStyles.panel}>
              <div className={pageStyles.sectionHeading}>
                <div>
                  <p className={pageStyles.eyebrow}>Proprietaire hors plateforme</p>
                  <h2 className={pageStyles.terracottaSectionTitle}>
                    Creer le proprietaire avant le logement
                  </h2>
                  <p className={pageStyles.meta}>
                    Ce proprietaire sera rattache a votre portefeuille puis reutilisable
                    immediatement pour preparer un devis.
                  </p>
                </div>
              </div>

              <div className={formStyles.form}>
                <div className={formStyles.formGroup}>
                  <label htmlFor="ownerFirstName">Prenom</label>
                  <input
                    type="text"
                    id="ownerFirstName"
                    name="ownerFirstName"
                    value={form.ownerFirstName}
                    onChange={handleChange}
                    placeholder="Camille"
                  />
                </div>

                <div className={formStyles.formGroup}>
                  <label htmlFor="ownerLastName">Nom</label>
                  <input
                    type="text"
                    id="ownerLastName"
                    name="ownerLastName"
                    value={form.ownerLastName}
                    onChange={handleChange}
                    placeholder="Martin"
                  />
                </div>

                <div className={formStyles.formGroup}>
                  <label htmlFor="ownerCompanyName">Societe</label>
                  <input
                    type="text"
                    id="ownerCompanyName"
                    name="ownerCompanyName"
                    value={form.ownerCompanyName}
                    onChange={handleChange}
                    placeholder="SCI Martin"
                  />
                </div>

                <div className={formStyles.formGroup}>
                  <label htmlFor="ownerEmail">Email</label>
                  <input
                    type="email"
                    id="ownerEmail"
                    name="ownerEmail"
                    value={form.ownerEmail}
                    onChange={handleChange}
                    required={isConciergeFlow}
                    placeholder="client@email.com"
                  />
                </div>

                <div className={formStyles.formGroup}>
                  <label htmlFor="ownerPhone">Telephone</label>
                  <input
                    type="text"
                    id="ownerPhone"
                    name="ownerPhone"
                    value={form.ownerPhone}
                    onChange={handleChange}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className={pageStyles.panel}>
            <div className={pageStyles.sectionHeading}>
              <div>
                <p className={pageStyles.eyebrow}>Informations</p>
                <h2 className={pageStyles.terracottaSectionTitle}>Identite du logement</h2>
              </div>
            </div>

            <div className={formStyles.form}>
              <div className={formStyles.formGroup}>
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

              <div className={formStyles.formGroup}>
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

              <div className={formStyles.formGroup}>
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

              <div className={formStyles.formGroup}>
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
            </div>
          </section>

          <section className={pageStyles.panel}>
            <div className={pageStyles.sectionHeading}>
              <div>
                <p className={pageStyles.eyebrow}>Capacite</p>
                <h2 className={pageStyles.terracottaSectionTitle}>Configuration d&apos;accueil</h2>
              </div>
            </div>

            <div className={formStyles.form}>
              <div className={formStyles.formGroup}>
                <label htmlFor="capacity">Capacite</label>
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

              <div className={formStyles.formGroup}>
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

              <div className={formStyles.formGroup}>
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

              <div className={formStyles.formGroup}>
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
            </div>
          </section>

          <section className={pageStyles.panel}>
            <div className={pageStyles.sectionHeading}>
              <div>
                <p className={pageStyles.eyebrow}>Contenu</p>
                <h2 className={pageStyles.terracottaSectionTitle}>
                  Description et equipements
                </h2>
              </div>
            </div>

            <div className={formStyles.form}>
              <div className={formStyles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Bien calme, lumineux, proche centre-ville..."
                  rows={3}
                />
              </div>

              <div className={formStyles.formGroup}>
                <label htmlFor="equipments">Equipements</label>
                <input
                  type="text"
                  id="equipments"
                  name="equipments"
                  value={form.equipments}
                  onChange={handleChange}
                  placeholder="Wifi, Climatisation, Parking, Piscine"
                />
              </div>

              <div className={formStyles.formGroup}>
                <label htmlFor="status">Statut</label>
                <select name="status" id="status" value={form.status} onChange={handleChange}>
                  <option value="pret">Pret</option>
                  <option value="menage">Menage en cours</option>
                  <option value="arrivee">Arrivee du jour</option>
                  <option value="depart">Depart du jour</option>
                </select>
              </div>
            </div>
          </section>

          <section className={pageStyles.panel}>
            <div className={pageStyles.sectionHeading}>
              <div>
                <p className={pageStyles.eyebrow}>Resume</p>
                <h2 className={pageStyles.terracottaSectionTitle}>Avant enregistrement</h2>
              </div>
            </div>

            <div className={formStyles.demoNotice}>
              <p>Resume avant creation</p>
              <div className={formStyles.cardMeta}>
                {summary.map((item) => (
                  <span key={item.label} className={formStyles.metaItem}>
                    {item.label} : {item.value}
                  </span>
                ))}
              </div>
            </div>

            <div className={pageStyles.inlineActions}>
              <button type="submit" className={pageStyles.buttonPrimary} disabled={saving}>
                <FiPlus />{" "}
                {saving
                  ? "Enregistrement..."
                  : isConciergeFlow
                    ? "Creer le proprietaire puis le logement"
                    : "Enregistrer"}
              </button>
            </div>

            {submitted ? (
              <p className={`${pageStyles.message} ${pageStyles.messageSuccess}`}>
                Logement enregistre avec succes.
              </p>
            ) : null}
            {success ? (
              <p className={`${pageStyles.message} ${pageStyles.messageSuccess}`}>{success}</p>
            ) : null}
            {error ? (
              <p className={`${pageStyles.message} ${pageStyles.messageError}`}>{error}</p>
            ) : null}
          </section>
        </form>
      </div>
    </section>
  );
}
