"use client";

import { useMemo, useState } from "react";
import { FiPlus, FiSearch, FiUserPlus } from "react-icons/fi";
import { useSession } from "next-auth/react";
import styles from "./LogementWorkspace.module.scss";
import {
  HOUSING_PLATFORM_OPTIONS,
  HOUSING_PROPERTY_TYPE_OPTIONS,
  HOUSING_STATUS_EXPLANATIONS,
  HOUSING_STATUS_OPTIONS,
} from "@/types/housing";
import type { HousingOwnerInfo } from "@/types/housing";
import {
  buildCreateLogementPayload,
  buildCreateLogementSummary,
  buildOwnerFromDirectoryProfile,
  createEmptyOwner,
  createInitialManualForm,
  type ManualCreateFormState,
} from "@/app/dashboard/concierge/logements/create/createLogementHelpers";

type Props = {
  onCreated?: (housingId?: number) => void;
};

type OwnerCreateState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  companyName: string;
};

const emptyOwnerCreateState: OwnerCreateState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  companyName: "",
};

export default function LogementCreateManual({ onCreated }: Props) {
  const { data: session } = useSession();
  const managerProfileId = typeof session?.user?.id === "string" ? session.user.id : null;
  const [form, setForm] = useState<ManualCreateFormState>(() => createInitialManualForm(managerProfileId));
  const [ownerQuery, setOwnerQuery] = useState("");
  const [ownerResults, setOwnerResults] = useState<HousingOwnerInfo[]>([]);
  const [ownerBusy, setOwnerBusy] = useState(false);
  const [ownerCreate, setOwnerCreate] = useState<OwnerCreateState>(emptyOwnerCreateState);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const summary = useMemo(() => buildCreateLogementSummary(form), [form]);

  function togglePlatform(platform: string, checked: boolean) {
    const currentPlatforms = form.platform
      ? form.platform.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    const nextPlatforms = checked
      ? Array.from(new Set([...currentPlatforms, platform]))
      : currentPlatforms.filter((item) => item !== platform);

    updateForm("platform", nextPlatforms.join(", "));
  }

  const updateForm = <K extends keyof ManualCreateFormState>(key: K, value: ManualCreateFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateOwner = <K extends keyof HousingOwnerInfo>(key: K, value: HousingOwnerInfo[K]) => {
    setForm((current) => ({
      ...current,
      owner: {
        ...current.owner,
        [key]: value,
      },
    }));
  };

  async function searchOwners() {
    try {
      setOwnerBusy(true);
      setError("");
      const response = await fetch(`/api/profiles/housing/owners?q=${encodeURIComponent(ownerQuery)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Recherche proprietaires impossible.");
      }
      setOwnerResults(Array.isArray(payload) ? payload : []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Recherche proprietaires impossible.");
    } finally {
      setOwnerBusy(false);
    }
  }

  async function createOwner() {
    try {
      setOwnerBusy(true);
      setError("");
      const response = await fetch("/api/profiles/housing/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ownerCreate),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Creation proprietaire impossible.");
      }

      setForm((current) => ({ ...current, owner: payload }));
      setOwnerCreate(emptyOwnerCreateState);
      setSuccess("Proprietaire cree et associe au logement.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Creation proprietaire impossible.");
    } finally {
      setOwnerBusy(false);
    }
  }

  function addService() {
    setForm((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          id: `manual-service-${current.services.length + 1}`,
          label: "",
          category: "",
          frequency: "",
          unitPrice: "",
          totalPrice: "",
          notes: "",
        },
      ],
    }));
  }

  async function saveManualHousing() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/housing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCreateLogementPayload(form)),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Creation logement impossible.");
      }

      setSuccess("Logement manuel cree avec succes.");
      onCreated?.(typeof payload?.id === "number" ? payload.id : undefined);
      setForm(createInitialManualForm(managerProfileId));
      setOwnerResults([]);
      setOwnerQuery("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Creation logement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Flux Manuel</p>
            <h2 className={styles.cardTitle}>Création guidée avec propriétaire intégré</h2>
          </div>
          <span className={styles.pill}>Toutes les informations clefs sont requises</span>
        </div>
        <p className={styles.muted}>
          Renseignez le propriétaire, la localisation, les caractéristiques et les services
          directement dans le même flux pour éviter les fiches incomplètes.
        </p>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Propriétaire</p>
            <h3 className={styles.cardTitle}>Recherche ou création à la volée</h3>
          </div>
        </div>

        <div className={styles.row}>
          <input
            className={styles.field}
            value={ownerQuery}
            onChange={(event) => setOwnerQuery(event.target.value)}
            placeholder="Nom, email ou ville"
          />
          <button className={styles.actionSecondary} type="button" onClick={searchOwners} disabled={ownerBusy}>
            <FiSearch /> {ownerBusy ? "Recherche..." : "Rechercher"}
          </button>
        </div>

        {ownerResults.length > 0 ? (
          <div className={styles.searchResults}>
            {ownerResults.map((owner) => (
              <button
                key={`${owner.profileId}-${owner.email}`}
                type="button"
                className={styles.searchResultButton}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    owner: buildOwnerFromDirectoryProfile(
                      {
                        id: owner.profileId ?? "",
                        first_name: owner.fullName.split(" ")[0] ?? "",
                        last_name: owner.fullName.split(" ").slice(1).join(" "),
                        email: owner.email,
                        phone: owner.phone,
                        city: owner.city,
                        company_name: owner.companyName,
                        username: owner.fullName,
                      },
                      managerProfileId,
                    ),
                  }))
                }
              >
                <strong>{owner.fullName || owner.companyName || "Proprietaire"}</strong>
                <span className={styles.helper}>
                  {owner.email || "Sans email"}{owner.city ? ` | ${owner.city}` : ""}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.fieldGrid}>
          <label className={styles.label}>
            Nom complet
            <input
              className={styles.field}
              value={form.owner.fullName}
              onChange={(event) => updateOwner("fullName", event.target.value)}
              placeholder="Jean Dupont"
            />
          </label>
          <label className={styles.label}>
            Email
            <input
              className={styles.field}
              value={form.owner.email}
              onChange={(event) => updateOwner("email", event.target.value)}
              placeholder="jean@email.com"
            />
          </label>
          <label className={styles.label}>
            Telephone
            <input
              className={styles.field}
              value={form.owner.phone}
              onChange={(event) => updateOwner("phone", event.target.value)}
              placeholder="+33 6 00 00 00 00"
            />
          </label>
          <label className={styles.label}>
            Ville
            <input
              className={styles.field}
              value={form.owner.city}
              onChange={(event) => updateOwner("city", event.target.value)}
              placeholder="Paris"
            />
          </label>
        </div>

        <div className={styles.panel}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.cardTitle}>Créer un nouveau propriétaire</h4>
            <button className={styles.actionSecondary} type="button" onClick={() => setForm((current) => ({ ...current, owner: createEmptyOwner(managerProfileId) }))}>
              Réinitialiser
            </button>
          </div>
          <div className={styles.fieldGrid}>
            <input className={styles.field} value={ownerCreate.firstName} onChange={(event) => setOwnerCreate((current) => ({ ...current, firstName: event.target.value }))} placeholder="Prénom" />
            <input className={styles.field} value={ownerCreate.lastName} onChange={(event) => setOwnerCreate((current) => ({ ...current, lastName: event.target.value }))} placeholder="Nom" />
            <input className={styles.field} value={ownerCreate.email} onChange={(event) => setOwnerCreate((current) => ({ ...current, email: event.target.value }))} placeholder="Email" />
            <input className={styles.field} value={ownerCreate.phone} onChange={(event) => setOwnerCreate((current) => ({ ...current, phone: event.target.value }))} placeholder="Téléphone" />
            <input className={styles.field} value={ownerCreate.city} onChange={(event) => setOwnerCreate((current) => ({ ...current, city: event.target.value }))} placeholder="Ville" />
            <input className={styles.field} value={ownerCreate.companyName} onChange={(event) => setOwnerCreate((current) => ({ ...current, companyName: event.target.value }))} placeholder="Société (optionnel)" />
          </div>
          <button className={styles.actionSecondary} type="button" onClick={createOwner} disabled={ownerBusy}>
            <FiUserPlus /> Créer ce propriétaire
          </button>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Logement</p>
            <h3 className={styles.cardTitle}>Identité et localisation</h3>
          </div>
        </div>
        <div className={styles.fieldGrid}>
                    <label className={styles.label}><span>Nom du logement</span><input className={styles.field} value={form.housingName} onChange={(event) => updateForm("housingName", event.target.value)} placeholder="Appart Montmartre" /></label>
                    <label className={styles.label}>
                      <span>Type</span>
                      <select className={styles.select} value={form.propertyType} onChange={(event) => updateForm("propertyType", event.target.value)}>
                        {HOUSING_PROPERTY_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.label}><span>Adresse</span><input className={styles.field} value={form.addressLine1} onChange={(event) => updateForm("addressLine1", event.target.value)} placeholder="12 rue des Abbesses" /></label>
                    <label className={styles.label}><span>Complément</span><input className={styles.field} value={form.addressLine2} onChange={(event) => updateForm("addressLine2", event.target.value)} placeholder="Bâtiment B, porte 8" /></label>
                    <label className={styles.label}><span>Code postal</span><input className={styles.field} value={form.postalCode} onChange={(event) => updateForm("postalCode", event.target.value)} placeholder="75018" /></label>
                    <label className={styles.label}><span>Ville</span><input className={styles.field} value={form.city} onChange={(event) => updateForm("city", event.target.value)} placeholder="Paris" /></label>
                    <label className={styles.label}><span>Pays</span><input className={styles.field} value={form.country} onChange={(event) => updateForm("country", event.target.value)} placeholder="France" /></label>
                    <label className={`${styles.label} ${styles.fieldFull}`}>
                      <span>Plateformes</span>
                      <div className={styles.checkboxGroup}>
                        {HOUSING_PLATFORM_OPTIONS.map((option) => (
                          <label key={option} className={styles.checkboxCard}>
                            <input
                              type="checkbox"
                              checked={form.platform.split(",").map((item) => item.trim()).filter(Boolean).includes(option)}
                              onChange={(event) => togglePlatform(option, event.target.checked)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                      <span className={styles.helper}>
                        Coche une ou plusieurs plateformes de diffusion.
                      </span>
                    </label>
                  </div>
                </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Caractéristiques</p>
            <h3 className={styles.cardTitle}>Surface, capacité, équipements</h3>
          </div>
        </div>
        <div className={styles.fieldGrid}>
          <input className={styles.field} value={form.surfaceSqm} onChange={(event) => updateForm("surfaceSqm", event.target.value)} placeholder="Surface m2" />
          <input className={styles.field} value={form.roomCount} onChange={(event) => updateForm("roomCount", event.target.value)} placeholder="Pièces" />
          <input className={styles.field} value={form.bedroomCount} onChange={(event) => updateForm("bedroomCount", event.target.value)} placeholder="Chambres" />
          <input className={styles.field} value={form.bathroomCount} onChange={(event) => updateForm("bathroomCount", event.target.value)} placeholder="Salles de bain" />
          <input className={styles.field} value={form.bedCount} onChange={(event) => updateForm("bedCount", event.target.value)} placeholder="Lits" />
          <input className={styles.field} value={form.guestCapacity} onChange={(event) => updateForm("guestCapacity", event.target.value)} placeholder="Capacité voyageurs" />
          <input className={`${styles.field} ${styles.fieldFull}`} value={form.amenities} onChange={(event) => updateForm("amenities", event.target.value)} placeholder="Wifi, balcon, serrure connectee" />
          <textarea className={`${styles.textArea} ${styles.fieldFull}`} value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Description d'exploitation, points de vigilance, ambiance du bien..." />
          <label className={styles.label}>
            <span>Statut initial</span>
            <select className={styles.select} value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
              {HOUSING_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.inlineHelper}>
            {HOUSING_STATUS_EXPLANATIONS[form.status] ??
              "Choisissez le statut qui décrit le mieux le niveau d'activation du logement."}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Services</p>
            <h3 className={styles.cardTitle}>Services associes au logement</h3>
          </div>
          <button className={styles.actionSecondary} type="button" onClick={addService}>
            <FiPlus /> Ajouter un service
          </button>
        </div>
        <div className={styles.cardGrid}>
          {form.services.map((service, index) => (
            <div key={service.id} className={styles.serviceCard}>
              <strong className={styles.cardTitle}>Service {index + 1}</strong>
              <div className={styles.fieldGrid}>
                <input className={styles.field} value={service.label} onChange={(event) => setForm((current) => ({ ...current, services: current.services.map((item) => item.id === service.id ? { ...item, label: event.target.value } : item) }))} placeholder="Menage hebdo" />
                <input className={styles.field} value={service.category} onChange={(event) => setForm((current) => ({ ...current, services: current.services.map((item) => item.id === service.id ? { ...item, category: event.target.value } : item) }))} placeholder="Categorie" />
                <input className={styles.field} value={service.frequency} onChange={(event) => setForm((current) => ({ ...current, services: current.services.map((item) => item.id === service.id ? { ...item, frequency: event.target.value } : item) }))} placeholder="Frequence" />
                <input className={styles.field} value={service.unitPrice} onChange={(event) => setForm((current) => ({ ...current, services: current.services.map((item) => item.id === service.id ? { ...item, unitPrice: event.target.value } : item) }))} placeholder="Prix unitaire" />
                <input className={styles.field} value={service.totalPrice} onChange={(event) => setForm((current) => ({ ...current, services: current.services.map((item) => item.id === service.id ? { ...item, totalPrice: event.target.value } : item) }))} placeholder="Total estime" />
                <textarea className={`${styles.textArea} ${styles.fieldFull}`} value={service.notes} onChange={(event) => setForm((current) => ({ ...current, services: current.services.map((item) => item.id === service.id ? { ...item, notes: event.target.value } : item) }))} placeholder="Notes d'execution ou particularites" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Resume</p>
            <h3 className={styles.cardTitle}>Verification avant creation</h3>
          </div>
        </div>
        <div className={styles.cardGrid}>
          {summary.map((item) => (
            <div key={item.label} className={styles.summaryCard}>
              <span className={styles.statLabel}>{item.label}</span>
              <strong className={styles.cardTitle}>{item.value}</strong>
            </div>
          ))}
        </div>
        <div className={styles.toolbar}>
          <button className={styles.actionPrimary} type="button" onClick={saveManualHousing} disabled={saving}>
            {saving ? "Creation..." : "Creer le logement"}
          </button>
        </div>
        {success ? <p className={styles.messageSuccess}>{success}</p> : null}
        {error ? <p className={styles.messageError}>{error}</p> : null}
      </section>
    </div>
  );
}
