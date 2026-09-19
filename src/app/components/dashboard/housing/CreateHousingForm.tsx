"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Building2, Camera, Check, ChevronRight, Home, MapPin, Save, Sparkles, Users } from "lucide-react";
import HousingPhotoManager from "./HousingPhotoManager";
import { removeHousingPhoto } from "@/app/lib/housingPhotoUrl";
import { type FormState, buildCreateLogementPayload, buildCreateLogementSummary, validateCreateLogementForm } from "@/app/dashboard/concierge/logements/create/createLogementHelpers";
import styles from "./CreateHousingForm.module.scss";

type Props = { redirectPath: string };
const initialForm: FormState = { name: "", propertyType: "Appartement", description: "", surface: "", capacity: "", bedrooms: "", equipments: "", address: "", city: "", platform: "Airbnb", photo: "", photos: [], status: "pret" };

export default function CreateHousingForm({ redirectPath }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const housingPhotos = form.photos ?? (form.photo ? [form.photo] : []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const uploadHousingPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      setPhotoUploading(true); setError("");
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const data = new FormData(); data.append("file", file); data.append("housingId", "draft");
        const response = await fetch("/api/housing/photos", { method: "POST", body: data });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || typeof payload?.path !== "string") throw new Error(typeof payload?.error === "string" ? payload.error : "Upload photo impossible.");
        uploadedUrls.push(payload.path);
      }
      setForm((previous) => { const current = previous.photos ?? (previous.photo ? [previous.photo] : []); const photos = [...current, ...uploadedUrls]; return { ...previous, photo: previous.photo || uploadedUrls[0] || "", photos }; });
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Upload photo impossible."); }
    finally { setPhotoUploading(false); }
  };

  const setPrimaryHousingPhoto = (photo: string) => setForm((previous) => { const current = previous.photos ?? (previous.photo ? [previous.photo] : []); return { ...previous, photo, photos: [photo, ...current.filter((item) => item !== photo)] }; });
  const removePhoto = async (photo: string) => {
    try { await removeHousingPhoto(photo, "draft"); }
    catch (removeError) { setError(removeError instanceof Error ? removeError.message : "Suppression de la photo impossible."); return; }
    setForm((previous) => { const photos = (previous.photos ?? (previous.photo ? [previous.photo] : [])).filter((item) => item !== photo); return { ...previous, photo: previous.photo === photo ? photos[0] ?? "" : previous.photo, photos }; });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const userId = session?.user?.id;
    const validationError = validateCreateLogementForm(form, userId);
    if (validationError) { setError(validationError); setSuccess(""); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/housing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildCreateLogementPayload(form, userId!)) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "Impossible de créer le logement");
      setSubmitted(true); setSuccess("Logement enregistré avec succès. Redirection en cours…"); router.push(redirectPath); router.refresh();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Erreur inconnue"); }
    finally { setSaving(false); }
  };

  const summary = buildCreateLogementSummary(form);
  const requiredCompleted = [form.name, form.city, form.address].filter((value) => value.trim()).length;
  const progress = Math.round((requiredCompleted / 3) * 100);
  const sectionTitle = (number: string, icon: ReactNode, eyebrow: string, title: string, helper: string) => <header className={styles.sectionHeading}><span className={styles.sectionNumber}>{number}</span><span className={styles.sectionIcon}>{icon}</span><div><p>{eyebrow}</p><h2>{title}</h2><span>{helper}</span></div></header>;

  return <main className={styles.page}>
    <Link href="/dashboard/owner/logements/overview" className={styles.backLink}><ArrowLeft size={15} /> Retour aux logements</Link>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>Nouvelle fiche logement</p><h1>Ajouter un logement</h1><p>Créez une base claire pour centraliser les séjours, les missions, les documents et les informations de votre bien.</p></div>
      <div className={styles.progressCard}><div><span>Informations essentielles</span><strong>{progress}%</strong></div><div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div><small>{requiredCompleted} champ{requiredCompleted > 1 ? "s" : ""} obligatoire{requiredCompleted > 1 ? "s" : ""} sur 3</small></div>
    </section>

    <form onSubmit={handleSubmit} className={styles.formLayout}>
      <div className={styles.formColumn}>
        <section className={styles.formSection}>
          {sectionTitle("01", <Home size={19} />, "Informations générales", "Identité du logement", "Les informations qui permettent d’identifier immédiatement le bien.")}
          <div className={styles.fields}>
            <label className={styles.fieldWide}><span>Nom du logement <b>*</b></span><input id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Ex. Villa des Pins" /></label>
            <label><span>Type de bien</span><select name="propertyType" id="propertyType" value={form.propertyType} onChange={handleChange}><option>Appartement</option><option>Maison</option><option>Villa</option><option>Studio</option><option>Loft</option></select></label>
            <label><span>Statut initial</span><select name="status" id="status" value={form.status} onChange={handleChange}><option value="pret">Prêt</option><option value="menage">Ménage en cours</option><option value="arrivee">Arrivée du jour</option><option value="depart">Départ du jour</option></select></label>
          </div>
        </section>

        <section className={styles.formSection}>
          {sectionTitle("02", <MapPin size={19} />, "Localisation", "Adresse du logement", "Une adresse précise facilite l’organisation des interventions.")}
          <div className={styles.fields}>
            <label className={styles.fieldWide}><span>Adresse <b>*</b></span><input id="address" name="address" value={form.address} onChange={handleChange} required placeholder="Ex. 123 route des Pins" /></label>
            <label className={styles.fieldWide}><span>Ville <b>*</b></span><input id="city" name="city" value={form.city} onChange={handleChange} required placeholder="Ex. Sainte-Maxime" /></label>
          </div>
        </section>

        <section className={styles.formSection}>
          {sectionTitle("03", <Users size={19} />, "Configuration", "Capacité et diffusion", "Décrivez le volume d’accueil et le canal principal du logement.")}
          <div className={styles.fieldsThree}>
            <label><span>Surface (m²)</span><input type="number" id="surface" name="surface" value={form.surface} onChange={handleChange} min="1" placeholder="180" /></label>
            <label><span>Capacité maximale</span><input type="number" id="capacity" name="capacity" value={form.capacity} onChange={handleChange} min="1" placeholder="6" /></label>
            <label><span>Chambres</span><input type="number" id="bedrooms" name="bedrooms" value={form.bedrooms} onChange={handleChange} min="0" placeholder="3" /></label>
            <label className={styles.fieldWide}><span>Plateforme principale</span><select name="platform" id="platform" value={form.platform} onChange={handleChange}><option>Airbnb</option><option>Booking</option><option>Abritel</option><option>Direct</option></select></label>
          </div>
        </section>

        <section className={styles.formSection}>
          {sectionTitle("04", <Sparkles size={19} />, "Mise en valeur", "Description et équipements", "Ajoutez les éléments qui rendent cette fiche immédiatement utile.")}
          <div className={styles.fields}>
            <label className={styles.fieldFull}><span>Description</span><textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Décrivez l’ambiance, la situation et les points forts du logement…" /></label>
            <label className={styles.fieldFull}><span>Équipements principaux</span><input id="equipments" name="equipments" value={form.equipments} onChange={handleChange} placeholder="Ex. Piscine, climatisation, Wi-Fi, parking" /><small>Séparez les équipements par une virgule.</small></label>
          </div>
          <div className={styles.photoBlock}><div className={styles.photoIntro}><Camera size={19} /><div><strong>Photos du logement</strong><span>Ajoutez des visuels de qualité et choisissez la photo principale.</span></div></div><HousingPhotoManager editing photos={housingPhotos} primaryPhoto={form.photo ?? null} housingId="draft" uploading={photoUploading} title="Galerie photos" helperText="Vous pourrez réorganiser la galerie depuis la fiche." onUpload={uploadHousingPhotos} onSetPrimary={setPrimaryHousingPhoto} onRemove={removePhoto} /></div>
        </section>
      </div>

      <aside className={styles.summaryColumn}>
        <section className={styles.summaryCard}><p className={styles.eyebrow}>Aperçu de la fiche</p><div className={styles.summaryHome}><span><Building2 size={22} /></span><div><small>{form.propertyType}</small><h2>{form.name || "Votre logement"}</h2><p><MapPin size={13} /> {form.city || "Ville à renseigner"}</p></div></div><dl>{summary.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section>
        <section className={styles.tipCard}><Check size={18} /><div><strong>Vous pourrez compléter la fiche ensuite</strong><p>Documents, contacts, accès détaillés et contrôles récurrents restent modifiables après la création.</p></div></section>
      </aside>

      <footer className={styles.formFooter}>
        <Link href="/dashboard/owner/logements/overview" className={styles.cancelButton}>Annuler</Link>
        <button type="submit" className={styles.saveButton} disabled={saving || photoUploading}><Save size={16} /> {saving ? "Enregistrement…" : "Créer le logement"}<ChevronRight size={16} /></button>
        {submitted ? <p className={styles.successMessage}>Logement enregistré avec succès.</p> : null}
        {success ? <p className={styles.successMessage}>{success}</p> : null}
        {error ? <p className={styles.errorMessage} role="alert">{error}</p> : null}
      </footer>
    </form>
  </main>;
}
