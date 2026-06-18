"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiPlus } from "react-icons/fi";
import HousingPhotoManager from "@/app/components/dashboard/housing/HousingPhotoManager";
import formStyles from "@/app/dashboard/concierge/logements/LogementsPage.module.scss";
import pageStyles from "@/app/dashboard/owner/OwnerDashboardPages.module.scss";
import {
  type FormState,
  buildCreateLogementPayload,
  buildCreateLogementSummary,
  validateCreateLogementForm,
} from "@/app/dashboard/concierge/logements/create/createLogementHelpers";

type CreateHousingFormProps = {
  redirectPath: string;
};

const initialForm: FormState = {
  name: "",
  propertyType: "Appartement",
  description: "",
  surface: "",
  capacity: "",
  bedrooms: "",
  equipments: "",
  address: "",
  city: "",
  platform: "Airbnb",
  photo: "",
  photos: [],
  status: "pret",
};

export default function CreateHousingForm({ redirectPath }: CreateHousingFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const housingPhotos = form.photos ?? (form.photo ? [form.photo] : []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const uploadHousingPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      setPhotoUploading(true);
      setError("");

      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("housingId", "draft");

        const response = await fetch("/api/housing/photos", {
          method: "POST",
          body: formData,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || typeof payload?.url !== "string") {
          throw new Error(typeof payload?.error === "string" ? payload.error : "Upload photo impossible.");
        }

        uploadedUrls.push(payload.url);
      }

      setForm((prev) => {
        const currentPhotos = prev.photos ?? (prev.photo ? [prev.photo] : []);
        const nextPhotos = [...currentPhotos, ...uploadedUrls];

        return {
          ...prev,
          photo: prev.photo || uploadedUrls[0] || "",
          photos: nextPhotos,
        };
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload photo impossible.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const setPrimaryHousingPhoto = (photo: string) => {
    setForm((prev) => {
      const currentPhotos = prev.photos ?? (prev.photo ? [prev.photo] : []);
      const nextPhotos = currentPhotos.includes(photo) ? currentPhotos : [photo, ...currentPhotos];

      return {
        ...prev,
        photo,
        photos: [photo, ...nextPhotos.filter((item) => item !== photo)],
      };
    });
  };

  const removeHousingPhoto = (photo: string) => {
    setForm((prev) => {
      const currentPhotos = prev.photos ?? (prev.photo ? [prev.photo] : []);
      const nextPhotos = currentPhotos.filter((item) => item !== photo);

      return {
        ...prev,
        photo: prev.photo === photo ? nextPhotos[0] ?? "" : prev.photo,
        photos: nextPhotos,
      };
    });
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

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : "Impossible de créer le logement",
        );
      }

      setSubmitted(true);
      setSuccess("Logement enregistré avec succès. Redirection en cours...");
      router.push(redirectPath);
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
                Renseignez une fiche claire dès le départ pour mieux relier ensuite planning,
                documents et opérations à ce bien.
              </p>
            </div>
          </div>

          <div className={pageStyles.priorityGrid}>
            <article className={pageStyles.priorityCard}>
              <p className={pageStyles.cardLabel}>Fiche</p>
              <strong className={pageStyles.cardValue}>1</strong>
              <span className={pageStyles.meta}>Un logement, une base claire pour toutes les suites.</span>
            </article>
            <article className={pageStyles.priorityCard}>
              <p className={pageStyles.cardLabel}>Coordonnées</p>
              <strong className={pageStyles.cardValue}>{form.city || "-"}</strong>
              <span className={pageStyles.meta}>Ville de référence du bien.</span>
            </article>
            <article className={`${pageStyles.priorityCard} ${pageStyles.priorityWarning}`}>
              <p className={pageStyles.cardLabel}>Statut</p>
              <strong className={pageStyles.cardValue}>{form.status}</strong>
              <span className={pageStyles.meta}>Préparation initiale du logement.</span>
            </article>
          </div>
        </section>

        <form onSubmit={handleSubmit} className={pageStyles.sectionStack}>
          <section className={pageStyles.panel}>
            <div className={pageStyles.sectionHeading}>
              <div>
                <p className={pageStyles.eyebrow}>Informations</p>
                <h2 className={pageStyles.terracottaSectionTitle}>Identité du logement</h2>
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
                <p className={pageStyles.eyebrow}>Capacité maximale</p>
                <h2 className={pageStyles.terracottaSectionTitle}>Configuration d’accueil</h2>
              </div>
            </div>

            <div className={formStyles.form}>
              <div className={formStyles.formGroup}>
                <label htmlFor="surface">Surface</label>
                <input
                  type="number"
                  id="surface"
                  name="surface"
                  value={form.surface}
                  onChange={handleChange}
                  min="1"
                  placeholder="55"
                />
              </div>

              <div className={formStyles.formGroup}>
                <label htmlFor="capacity">Capacité maximale</label>
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
            </div>

            <HousingPhotoManager
              editing={true}
              photos={housingPhotos}
              primaryPhoto={form.photo ?? null}
              uploading={photoUploading}
              title="Photos du logement"
              helperText="Sélectionnez vos photos depuis votre appareil puis choisissez la photo principale."
              onUpload={uploadHousingPhotos}
              onSetPrimary={setPrimaryHousingPhoto}
              onRemove={removeHousingPhoto}
            />
          </section>

          <section className={pageStyles.panel}>
            <div className={pageStyles.sectionHeading}>
              <div>
                <p className={pageStyles.eyebrow}>Contenu</p>
                <h2 className={pageStyles.terracottaSectionTitle}>Description et équipements</h2>
              </div>
            </div>

            <div className={formStyles.form}>
              <div className={formStyles.formGroup}>
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

              <div className={formStyles.formGroup}>
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

              <div className={formStyles.formGroup}>
                <label htmlFor="status">Statut</label>
                <select name="status" id="status" value={form.status} onChange={handleChange}>
                  <option value="pret">Prêt</option>
                  <option value="menage">Ménage en cours</option>
                  <option value="arrivee">Arrivée du jour</option>
                  <option value="depart">Départ du jour</option>
                </select>
              </div>
            </div>
          </section>

          <section className={pageStyles.panel}>
            <div className={pageStyles.sectionHeading}>
              <div>
                <p className={pageStyles.eyebrow}>Résumé</p>
                <h2 className={pageStyles.terracottaSectionTitle}>Avant enregistrement</h2>
              </div>
            </div>

            <div className={formStyles.demoNotice}>
              <p>Résumé avant création</p>
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
                <FiPlus /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>

            {submitted ? (
              <p className={`${pageStyles.message} ${pageStyles.messageSuccess}`}>
                Logement enregistré avec succès.
              </p>
            ) : null}
            {success ? <p className={`${pageStyles.message} ${pageStyles.messageSuccess}`}>{success}</p> : null}
            {error ? <p className={`${pageStyles.message} ${pageStyles.messageError}`}>{error}</p> : null}
          </section>
        </form>
      </div>
    </section>
  );
}
