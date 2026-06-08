"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BedDouble, ClipboardList, PackageCheck, Plus, Save, Shirt, Trash2 } from "lucide-react";
import {
  EMPTY_HOUSING_STOCK_MANAGEMENT,
  createStockItemId,
  getHousingStockSummary,
  normalizeHousingStockManagement,
  type HousingStockBed,
  type HousingStockConsumable,
  type HousingStockManagement,
} from "@/app/lib/housingStock";
import styles from "../OwnerDashboardPages.module.scss";

type HousingInfos = {
  equipements?: string[];
  amenities?: string[];
  stock_management?: unknown;
  [key: string]: unknown;
};

type HousingRow = {
  id: number;
  nom_logement: string | null;
  ville: string | null;
  statut: string | null;
  infos?: HousingInfos | null;
};

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asInfos(value: HousingRow["infos"]): HousingInfos {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getEquipmentList(housing: HousingRow | null) {
  const infos = asInfos(housing?.infos);
  const source = Array.isArray(infos.equipements)
    ? infos.equipements
    : Array.isArray(infos.amenities)
      ? infos.amenities
      : [];
  return source.map((item) => String(item).trim()).filter(Boolean);
}

function getHousingLabel(housing: HousingRow) {
  return housing.nom_logement || `Logement #${housing.id}`;
}

function createEmptyBed(): HousingStockBed {
  return {
    id: createStockItemId("bed"),
    room: "",
    type: "Lit double",
    quantity: 1,
    mattressSize: "140x190",
    linenKit: "Drap housse + housse de couette + 2 taies",
    notes: "",
  };
}

function createEmptyConsumable(): HousingStockConsumable {
  return {
    id: createStockItemId("consumable"),
    name: "",
    category: "Accueil",
    currentQty: 0,
    minQty: 1,
    unit: "unité",
    storageLocation: "",
    notes: "",
  };
}

export default function OwnerStocksPage() {
  const [housing, setHousing] = useState<HousingRow[]>([]);
  const [selectedHousingId, setSelectedHousingId] = useState<number | null>(null);
  const [equipmentText, setEquipmentText] = useState("");
  const [draftStock, setDraftStock] = useState<HousingStockManagement>(EMPTY_HOUSING_STOCK_MANAGEMENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadHousing() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/housing", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Impossible de charger vos logements.");
        }

        const rows = Array.isArray(payload) ? (payload as HousingRow[]) : [];
        setHousing(rows);
        setSelectedHousingId((current) => current ?? rows[0]?.id ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger vos stocks.");
      } finally {
        setLoading(false);
      }
    }

    void loadHousing();
  }, []);

  const selectedHousing = useMemo(
    () => housing.find((item) => item.id === selectedHousingId) ?? null,
    [housing, selectedHousingId],
  );

  useEffect(() => {
    setEquipmentText(getEquipmentList(selectedHousing).join(", "));
    setDraftStock(normalizeHousingStockManagement(asInfos(selectedHousing?.infos).stock_management));
  }, [selectedHousing]);

  useEffect(() => {
    setSuccess(null);
  }, [selectedHousingId]);

  const housingSummaries = useMemo(
    () =>
      housing.map((item) => {
        const stock = normalizeHousingStockManagement(asInfos(item.infos).stock_management);
        const summary = getHousingStockSummary(stock);
        const equipments = getEquipmentList(item);
        return {
          housing: item,
          stock,
          summary,
          equipments,
          isReady: summary.isStarted || equipments.length > 0,
        };
      }),
    [housing],
  );

  const startedCount = housingSummaries.filter((item) => item.isReady).length;
  const lowStockCount = housingSummaries.reduce((total, item) => total + item.summary.lowConsumableCount, 0);
  const totalBeds = housingSummaries.reduce((total, item) => total + item.summary.bedCount, 0);
  const selectedSummary = getHousingStockSummary(draftStock);

  function updateLaundry(field: keyof HousingStockManagement["laundry"], value: string) {
    setDraftStock((current) => ({
      ...current,
      laundry: {
        ...current.laundry,
        [field]: typeof current.laundry[field] === "number" ? Number(value) || 0 : value,
      },
    }));
  }

  function updateBed(index: number, field: keyof HousingStockBed, value: string) {
    setDraftStock((current) => ({
      ...current,
      beds: current.beds.map((bed, bedIndex) =>
        bedIndex === index
          ? {
              ...bed,
              [field]: field === "quantity" ? Number(value) || 0 : value,
            }
          : bed,
      ),
    }));
  }

  function updateConsumable(index: number, field: keyof HousingStockConsumable, value: string) {
    setDraftStock((current) => ({
      ...current,
      consumables: current.consumables.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: field === "currentQty" || field === "minQty" ? Number(value) || 0 : value,
            }
          : item,
      ),
    }));
  }

  async function saveStock() {
    if (!selectedHousing) return;

    const equipments = parseList(equipmentText);
    const infos = asInfos(selectedHousing.infos);
    const nextStock: HousingStockManagement = {
      ...draftStock,
      lastUpdatedAt: new Date().toISOString(),
    };

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const response = await fetch(`/api/housing/${selectedHousing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          infos: {
            ...infos,
            equipements: equipments,
            amenities: equipments,
            stock_management: nextStock,
          },
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de sauvegarder les informations.");
      }

      setHousing((current) =>
        current.map((item) => (item.id === selectedHousing.id ? (payload as HousingRow) : item)),
      );
      setDraftStock(nextStock);
      setSuccess("Informations sauvegardées. Elles seront visibles par la conciergerie rattachée au logement.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder les informations.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-grid">
      <div className={styles.dashboardFlow}>
        <section className={styles.heroPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Logistique propriétaire</p>
              <h1 className={styles.terracottaTitle}>Équipements, linge et consommables</h1>
              <p className={styles.meta}>
                Centralisez les informations utiles au ménage, aux draps, aux lits, aux réassorts et
                aux interventions. Ces données restent dans la fiche logement et peuvent être reprises
                par la conciergerie qui s&apos;occupe du bien.
              </p>
            </div>
            <div className={styles.inlineActions}>
              <Link href="/dashboard/owner/logements" className={styles.buttonSecondary}>
                Voir mes logements
              </Link>
              <button className={styles.buttonPrimary} type="button" onClick={saveStock} disabled={!selectedHousing || saving}>
                <Save size={16} /> {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </div>

          <div className={styles.priorityGrid}>
            <article className={styles.priorityCard}>
              <p className={styles.cardLabel}>Logements suivis</p>
              <strong className={styles.cardValue}>{housing.length}</strong>
              <span className={styles.meta}>Biens pouvant recevoir un inventaire exploitable.</span>
            </article>
            <article className={styles.priorityCard}>
              <p className={styles.cardLabel}>Inventaires démarrés</p>
              <strong className={styles.cardValue}>{startedCount}</strong>
              <span className={styles.meta}>Logements avec équipements, linge ou consommables saisis.</span>
            </article>
            <article className={`${styles.priorityCard} ${lowStockCount > 0 ? styles.priorityWarning : ""}`}>
              <p className={styles.cardLabel}>Alertes réassort</p>
              <strong className={styles.cardValue}>{lowStockCount}</strong>
              <span className={styles.meta}>Consommables au seuil minimum ou en dessous.</span>
            </article>
            <article className={styles.priorityCard}>
              <p className={styles.cardLabel}>Lits déclarés</p>
              <strong className={styles.cardValue}>{totalBeds}</strong>
              <span className={styles.meta}>Base pour préparer draps, taies et rotations de linge.</span>
            </article>
          </div>
        </section>

        {error ? <p className={`${styles.feedbackMessage} ${styles.messageError}`}>{error}</p> : null}
        {success ? <p className={`${styles.feedbackMessage} ${styles.messageSuccess}`}>{success}</p> : null}

        {loading ? (
          <section className={styles.panel}>
            <p className={styles.meta}>Chargement des logements...</p>
          </section>
        ) : null}

        {!loading && housing.length === 0 ? (
          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Aucun logement</p>
                <h2 className={styles.terracottaSectionTitle}>Commencez par ajouter un logement</h2>
              </div>
              <Link href="/dashboard/owner/logements/create" className={styles.buttonPrimary}>
                Ajouter un logement
              </Link>
            </div>
          </section>
        ) : null}

        {selectedHousing ? (
          <div className={styles.stockWorkspace}>
            <aside className={styles.stockSidebar}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>Logements</p>
                  <h2 className={styles.terracottaSectionTitle}>Inventaires</h2>
                </div>
              </div>
              <div className={styles.stockHousingList}>
                {housingSummaries.map((item) => (
                  <button
                    key={item.housing.id}
                    className={`${styles.stockHousingButton} ${
                      item.housing.id === selectedHousing.id ? styles.stockHousingButtonActive : ""
                    }`}
                    type="button"
                    onClick={() => setSelectedHousingId(item.housing.id)}
                  >
                    <strong>{getHousingLabel(item.housing)}</strong>
                    <span>{item.housing.ville || "Ville non renseignée"}</span>
                    <small>
                      {item.isReady
                        ? `${item.summary.bedCount} lit(s), ${item.summary.consumableCount} consommable(s)`
                        : "À renseigner"}
                    </small>
                  </button>
                ))}
              </div>
            </aside>

            <div className={styles.stockEditor}>
              <section className={styles.panel}>
                <div className={styles.sectionHeading}>
                  <div>
                    <p className={styles.eyebrow}>Logement sélectionné</p>
                    <h2 className={styles.terracottaSectionTitle}>{getHousingLabel(selectedHousing)}</h2>
                    <p className={styles.meta}>
                      {selectedHousing.ville || "Ville non renseignée"} · {selectedHousing.statut || "Brouillon"}
                    </p>
                  </div>
                  <div className={styles.stockMiniStats}>
                    <span><BedDouble size={15} /> {selectedSummary.bedCount} lit(s)</span>
                    <span><Shirt size={15} /> {selectedSummary.laundryTotal} pièces linge</span>
                    <span><PackageCheck size={15} /> {selectedSummary.consumableCount} consommable(s)</span>
                  </div>
                </div>

                <label className={styles.stockFieldFull}>
                  <span>Équipements et repères généraux</span>
                  <textarea
                    value={equipmentText}
                    onChange={(event) => setEquipmentText(event.target.value)}
                    placeholder="Wi-Fi, aspirateur, fer à repasser, lit parapluie, coffre, produits piscine..."
                    rows={3}
                  />
                  <small>Saisissez les éléments séparés par des virgules. Ils restent visibles dans la fiche logement.</small>
                </label>
              </section>

              <section className={styles.panel}>
                <div className={styles.sectionHeading}>
                  <div>
                    <p className={styles.eyebrow}>Couchages</p>
                    <h2 className={styles.terracottaSectionTitle}>Lits et kits de draps</h2>
                  </div>
                  <button
                    className={styles.buttonSecondary}
                    type="button"
                    onClick={() => setDraftStock((current) => ({ ...current, beds: [...current.beds, createEmptyBed()] }))}
                  >
                    <Plus size={16} /> Ajouter un lit
                  </button>
                </div>

                <div className={styles.stockItemList}>
                  {draftStock.beds.map((bed, index) => (
                    <article className={styles.stockItemCard} key={bed.id}>
                      <div className={styles.stockFormGrid}>
                        <label className={styles.stockField}>
                          <span>Pièce</span>
                          <input value={bed.room} onChange={(event) => updateBed(index, "room", event.target.value)} placeholder="Chambre 1" />
                        </label>
                        <label className={styles.stockField}>
                          <span>Type de lit</span>
                          <input value={bed.type} onChange={(event) => updateBed(index, "type", event.target.value)} placeholder="Lit double, canapé-lit..." />
                        </label>
                        <label className={styles.stockField}>
                          <span>Quantité</span>
                          <input min={0} type="number" value={bed.quantity} onChange={(event) => updateBed(index, "quantity", event.target.value)} />
                        </label>
                        <label className={styles.stockField}>
                          <span>Taille matelas</span>
                          <input value={bed.mattressSize} onChange={(event) => updateBed(index, "mattressSize", event.target.value)} placeholder="160x200" />
                        </label>
                        <label className={styles.stockFieldFull}>
                          <span>Kit linge à préparer</span>
                          <input value={bed.linenKit} onChange={(event) => updateBed(index, "linenKit", event.target.value)} />
                        </label>
                        <label className={styles.stockFieldFull}>
                          <span>Notes</span>
                          <input value={bed.notes} onChange={(event) => updateBed(index, "notes", event.target.value)} placeholder="Alèse spécifique, oreillers supplémentaires..." />
                        </label>
                      </div>
                      <button
                        className={styles.iconButton}
                        type="button"
                        aria-label="Supprimer ce lit"
                        onClick={() =>
                          setDraftStock((current) => ({
                            ...current,
                            beds: current.beds.filter((_, bedIndex) => bedIndex !== index),
                          }))
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  ))}
                  {draftStock.beds.length === 0 ? (
                    <p className={styles.meta}>Aucun couchage renseigné. Ajoutez les lits pour préparer les bons draps.</p>
                  ) : null}
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.sectionHeading}>
                  <div>
                    <p className={styles.eyebrow}>Linge</p>
                    <h2 className={styles.terracottaSectionTitle}>Stock linge disponible</h2>
                  </div>
                </div>
                <div className={styles.stockFormGrid}>
                  {[
                    ["sheetSets", "Parures draps"],
                    ["duvetCovers", "Housses de couette"],
                    ["pillowcases", "Taies oreiller"],
                    ["towelSets", "Kits serviettes"],
                    ["bathMats", "Tapis de bain"],
                    ["blankets", "Plaids / couvertures"],
                  ].map(([field, label]) => (
                    <label className={styles.stockField} key={field}>
                      <span>{label}</span>
                      <input
                        min={0}
                        type="number"
                        value={draftStock.laundry[field as keyof HousingStockManagement["laundry"]] as number}
                        onChange={(event) => updateLaundry(field as keyof HousingStockManagement["laundry"], event.target.value)}
                      />
                    </label>
                  ))}
                  <label className={styles.stockFieldFull}>
                    <span>Lieu de rangement du linge</span>
                    <input
                      value={draftStock.laundry.storageLocation}
                      onChange={(event) => updateLaundry("storageLocation", event.target.value)}
                      placeholder="Placard entrée, armoire chambre 2..."
                    />
                  </label>
                  <label className={styles.stockFieldFull}>
                    <span>Notes linge</span>
                    <textarea
                      rows={3}
                      value={draftStock.laundry.notes}
                      onChange={(event) => updateLaundry("notes", event.target.value)}
                      placeholder="Rotation recommandée, linge propriétaire, pièces à ne pas utiliser..."
                    />
                  </label>
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.sectionHeading}>
                  <div>
                    <p className={styles.eyebrow}>Consommables</p>
                    <h2 className={styles.terracottaSectionTitle}>Réassort et seuils</h2>
                  </div>
                  <button
                    className={styles.buttonSecondary}
                    type="button"
                    onClick={() =>
                      setDraftStock((current) => ({
                        ...current,
                        consumables: [...current.consumables, createEmptyConsumable()],
                      }))
                    }
                  >
                    <Plus size={16} /> Ajouter un consommable
                  </button>
                </div>
                <div className={styles.stockItemList}>
                  {draftStock.consumables.map((item, index) => (
                    <article className={styles.stockItemCard} key={item.id}>
                      <div className={styles.stockFormGrid}>
                        <label className={styles.stockField}>
                          <span>Nom</span>
                          <input value={item.name} onChange={(event) => updateConsumable(index, "name", event.target.value)} placeholder="Papier toilette" />
                        </label>
                        <label className={styles.stockField}>
                          <span>Catégorie</span>
                          <input value={item.category} onChange={(event) => updateConsumable(index, "category", event.target.value)} placeholder="Accueil, ménage, cuisine..." />
                        </label>
                        <label className={styles.stockField}>
                          <span>Quantité actuelle</span>
                          <input min={0} type="number" value={item.currentQty} onChange={(event) => updateConsumable(index, "currentQty", event.target.value)} />
                        </label>
                        <label className={styles.stockField}>
                          <span>Seuil minimum</span>
                          <input min={0} type="number" value={item.minQty} onChange={(event) => updateConsumable(index, "minQty", event.target.value)} />
                        </label>
                        <label className={styles.stockField}>
                          <span>Unité</span>
                          <input value={item.unit} onChange={(event) => updateConsumable(index, "unit", event.target.value)} placeholder="rouleau, flacon, kit..." />
                        </label>
                        <label className={styles.stockField}>
                          <span>Rangement</span>
                          <input value={item.storageLocation} onChange={(event) => updateConsumable(index, "storageLocation", event.target.value)} placeholder="Placard cuisine" />
                        </label>
                        <label className={styles.stockFieldFull}>
                          <span>Notes</span>
                          <input value={item.notes} onChange={(event) => updateConsumable(index, "notes", event.target.value)} placeholder="Marque préférée, à remplacer avant chaque séjour..." />
                        </label>
                      </div>
                      <button
                        className={styles.iconButton}
                        type="button"
                        aria-label="Supprimer ce consommable"
                        onClick={() =>
                          setDraftStock((current) => ({
                            ...current,
                            consumables: current.consumables.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  ))}
                  {draftStock.consumables.length === 0 ? (
                    <p className={styles.meta}>Aucun consommable renseigné. Ajoutez les produits à suivre ou à réassortir.</p>
                  ) : null}
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.sectionHeading}>
                  <div>
                    <p className={styles.eyebrow}>Transmission concierge</p>
                    <h2 className={styles.terracottaSectionTitle}>Consignes et repères terrain</h2>
                  </div>
                  <ClipboardList size={22} aria-hidden="true" />
                </div>
                <div className={styles.stockFormGrid}>
                  <label className={styles.stockFieldFull}>
                    <span>Notes équipements</span>
                    <textarea
                      rows={3}
                      value={draftStock.equipmentNotes}
                      onChange={(event) => setDraftStock((current) => ({ ...current, equipmentNotes: event.target.value }))}
                      placeholder="Équipements fragiles, matériel à contrôler, notices..."
                    />
                  </label>
                  <label className={styles.stockFieldFull}>
                    <span>Rangements importants</span>
                    <textarea
                      rows={3}
                      value={draftStock.storageNotes}
                      onChange={(event) => setDraftStock((current) => ({ ...current, storageNotes: event.target.value }))}
                      placeholder="Où trouver le linge propre, les produits, les ampoules, les sacs..."
                    />
                  </label>
                  <label className={styles.stockFieldFull}>
                    <span>Consignes pour la conciergerie</span>
                    <textarea
                      rows={4}
                      value={draftStock.conciergeInstructions}
                      onChange={(event) => setDraftStock((current) => ({ ...current, conciergeInstructions: event.target.value }))}
                      placeholder="Ce que la conciergerie doit vérifier, compléter ou signaler après chaque passage..."
                    />
                  </label>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
