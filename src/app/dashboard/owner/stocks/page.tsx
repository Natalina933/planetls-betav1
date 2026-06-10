"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Euro,
  FileDown,
  History,
  PackageCheck,
  Plus,
  Save,
  Shirt,
  ShoppingCart,
  Trash2,
  Wrench,
} from "lucide-react";
import { DashboardSectionShell, MetricDonut } from "@/components/dashboard";
import {
  EMPTY_HOUSING_STOCK_MANAGEMENT,
  createStockItemId,
  getHousingStockSummary,
  normalizeHousingStockManagement,
  type HousingStockBed,
  type HousingStockConsumable,
  type HousingStockManagement,
} from "@/app/lib/housingStock";
import sharedStyles from "../OwnerDashboardPages.module.scss";
import styles from "./page.module.scss";

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

type PreparedHousing = {
  housing: HousingRow;
  stock: HousingStockManagement;
  summary: ReturnType<typeof getHousingStockSummary>;
  equipments: string[];
  lowConsumables: HousingStockConsumable[];
  watchEquipments: string[];
  score: number;
  status: "ready" | "watch" | "action" | "urgent";
  lastControlLabel: string;
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

function getConsumableLevel(item: HousingStockConsumable) {
  if (item.minQty <= 0) return 100;
  return Math.min(100, Math.round((item.currentQty / Math.max(item.minQty * 2, 1)) * 100));
}

function getRelativeControlDate(value: string | null) {
  if (!value) return "Contrôle à planifier";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Contrôle à planifier";
  const days = Math.max(0, Math.round((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000)));
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

function estimateMonthlyCost(lowCount: number, consumableCount: number) {
  return lowCount * 18 + Math.max(0, consumableCount - lowCount) * 7;
}

function getPreparedHousing(housing: HousingRow): PreparedHousing {
  const stock = normalizeHousingStockManagement(asInfos(housing.infos).stock_management);
  const summary = getHousingStockSummary(stock);
  const equipments = getEquipmentList(housing);
  const lowConsumables = stock.consumables.filter((item) => item.minQty > 0 && item.currentQty <= item.minQty);
  const watchEquipments = [stock.equipmentNotes, ...equipments.filter((item) => /absent|cass|panne|signal|manquant|surveill/i.test(item))]
    .map((item) => item.trim())
    .filter(Boolean);
  const hasOperationalBase = summary.isStarted || equipments.length > 0;
  const score = Math.max(
    0,
    Math.min(
      100,
      (hasOperationalBase ? 42 : 0) +
        (summary.bedCount > 0 ? 18 : 0) +
        (summary.laundryTotal > 0 ? 16 : 0) +
        (summary.consumableCount > 0 ? 16 : 0) -
        lowConsumables.length * 12 -
        watchEquipments.length * 8,
    ),
  );
  const status = lowConsumables.some((item) => item.currentQty === 0)
    ? "urgent"
    : lowConsumables.length > 0
      ? "action"
      : watchEquipments.length > 0 || score < 85
        ? "watch"
        : "ready";

  return {
    housing,
    stock,
    summary,
    equipments,
    lowConsumables,
    watchEquipments,
    score,
    status,
    lastControlLabel: getRelativeControlDate(stock.lastUpdatedAt),
  };
}

function getStatusLabel(status: PreparedHousing["status"]) {
  if (status === "ready") return "Prêt";
  if (status === "watch") return "À surveiller";
  if (status === "action") return "Action requise";
  return "Urgent";
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

  const preparedHousing = useMemo(() => housing.map(getPreparedHousing), [housing]);
  const selectedPrepared = useMemo(
    () => preparedHousing.find((item) => item.housing.id === selectedHousingId) ?? preparedHousing[0] ?? null,
    [preparedHousing, selectedHousingId],
  );
  const selectedSummary = getHousingStockSummary(draftStock);

  const readyCount = preparedHousing.filter((item) => item.status === "ready").length;
  const criticalCount = preparedHousing.filter((item) => item.status === "urgent").length;
  const reorders = preparedHousing.flatMap((item) =>
    item.lowConsumables.map((consumable) => ({
      housing: item.housing,
      consumable,
      level: getConsumableLevel(consumable),
    })),
  );
  const equipmentWatchCount = preparedHousing.reduce((total, item) => total + item.watchEquipments.length, 0);
  const controlPendingCount = preparedHousing.filter((item) => item.stock.lastUpdatedAt === null).length;
  const monthlySpend = preparedHousing.reduce(
    (total, item) => total + estimateMonthlyCost(item.lowConsumables.length, item.summary.consumableCount),
    0,
  );
  const monthlyBudget = Math.max(100, housing.length * 100);
  const forecastSpend = Math.round(monthlySpend * 1.32);
  const priority = reorders[0] ?? null;

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
      setSuccess("Contrôle sauvegardé. La conciergerie dispose des repères à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder les informations.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardSectionShell
      persona="owner"
      title="Préparation logements"
      subtitle={error || "Stocks, équipements et contrôles terrain traduits en décisions simples."}
      actions={[
        { label: "Voir les logements", href: "/dashboard/owner/logements" },
        { label: "Demander un contrôle", href: "/dashboard/owner/demandes" },
      ]}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Exploitation du parc</span>
            <h1>Bonjour Nathalie, vos logements sont-ils prêts ?</h1>
            <p>
              {readyCount} prêt(s) à accueillir, {criticalCount} critique(s), {reorders.length} réapprovisionnement(s)
              à prévoir et {equipmentWatchCount} équipement(s) à surveiller.
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/dashboard/owner/demandes" className={styles.secondaryLink}>
              Demander à la conciergerie
            </Link>
            <button className={styles.primaryButton} type="button" onClick={saveStock} disabled={!selectedHousing || saving}>
              <Save size={16} /> {saving ? "Sauvegarde..." : "Sauvegarder le contrôle"}
            </button>
          </div>
        </section>

        {success ? <p className={styles.success}>{success}</p> : null}
        {loading ? <p className={styles.state}>Chargement des logements...</p> : null}

        {!loading && housing.length === 0 ? (
          <Link href="/dashboard/owner/logements/create" className={styles.emptyCard}>
            <Plus size={18} /> Ajouter un logement pour lancer le suivi de préparation.
          </Link>
        ) : null}

        {!loading && housing.length > 0 ? (
          <>
            <section className={styles.kpiGrid} aria-label="Santé du parc">
              <MetricDonut label="Logements prêts" value={`${readyCount}`} detail="Accueil possible" percent={(readyCount / housing.length) * 100} />
              <MetricDonut label="Réapprovisionnements" value={`${reorders.length}`} detail="À prévoir" percent={Math.min(100, reorders.length * 25)} />
              <MetricDonut label="Contrôles en attente" value={`${controlPendingCount}`} detail="Vérification terrain" percent={Math.min(100, controlPendingCount * 30)} />
              <MetricDonut label="Équipements" value={`${equipmentWatchCount}`} detail="À surveiller" percent={Math.min(100, equipmentWatchCount * 25)} />
            </section>

            <section className={styles.priorityLayout}>
              <article className={styles.priorityCard}>
                <span className={styles.eyebrow}>Priorité du moment</span>
                {priority ? (
                  <>
                    <h2>{getHousingLabel(priority.housing)}</h2>
                    <strong>{priority.consumable.name || "Consommable"} faible</strong>
                    <p>Niveau estimé : {priority.level} %. Action recommandée : prévoir un réapprovisionnement.</p>
                    <div className={styles.actionRow}>
                      <Link href={`/dashboard/owner/logements/${priority.housing.id}`} className={styles.primaryLink}>Voir logement</Link>
                      <Link href="/dashboard/owner/demandes" className={styles.secondaryLink}>Commander</Link>
                      <Link href="/dashboard/owner/demandes" className={styles.secondaryLink}>Demander à la conciergerie</Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h2>Parc sous contrôle</h2>
                    <strong>Aucun réassort critique détecté</strong>
                    <p>Gardez les contrôles terrain à jour pour conserver une lecture fiable.</p>
                  </>
                )}
              </article>

              <aside className={styles.financeCard}>
                <span className={styles.eyebrow}>Coût stocks</span>
                <div className={styles.financeRows}>
                  <span>Réapprovisionnements <strong>{monthlySpend} €</strong></span>
                  <span>Budget mensuel <strong>{monthlyBudget} €</strong></span>
                  <span>Consommation <strong>{Math.round((monthlySpend / monthlyBudget) * 100)} %</strong></span>
                  <span>Prévision fin de mois <strong>{forecastSpend} €</strong></span>
                </div>
              </aside>
            </section>

            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <span className={styles.eyebrow}>État des logements</span>
                <h2>Préparation opérationnelle</h2>
              </div>
              <div className={styles.housingGrid}>
                {preparedHousing.map((item) => (
                  <article key={item.housing.id} className={`${styles.housingCard} ${styles[item.status]}`}>
                    <div className={styles.cardTop}>
                      <div>
                        <h3>{getHousingLabel(item.housing)}</h3>
                        <p>{item.housing.ville || "Ville à préciser"}</p>
                      </div>
                      <span>{getStatusLabel(item.status)}</span>
                    </div>
                    <MetricDonut label="Score" value={`${item.score}%`} detail="Préparation" percent={item.score} compact />
                    <div className={styles.checkGrid}>
                      <span><CheckCircle2 size={15} /> {item.summary.consumableCount} consommable(s)</span>
                      <span><BedDouble size={15} /> {item.summary.bedCount} couchage(s)</span>
                      <span><Shirt size={15} /> {item.summary.laundryTotal} pièce(s) linge</span>
                      <span><ClipboardCheck size={15} /> {item.lastControlLabel}</span>
                    </div>
                    <p>
                      {item.lowConsumables.length > 0
                        ? `${item.lowConsumables.map((consumable) => consumable.name || "Produit").join(", ")} à réapprovisionner.`
                        : item.watchEquipments[0] || "Aucun manque important signalé."}
                    </p>
                    <div className={styles.actionRow}>
                      <Link href={`/dashboard/owner/logements/${item.housing.id}`} className={styles.primaryLink}>Voir détail</Link>
                      <Link href="/dashboard/owner/demandes" className={styles.secondaryLink}>Demander un contrôle</Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.twoColumns}>
              <article className={styles.panel}>
                <span className={styles.eyebrow}>Réapprovisionnements à prévoir</span>
                <div className={styles.tableLike}>
                  {reorders.length > 0 ? reorders.map((item) => (
                    <div key={`${item.housing.id}-${item.consumable.id}`} className={styles.tableRow}>
                      <strong>{item.consumable.name || "Produit"}</strong>
                      <span>{getHousingLabel(item.housing)}</span>
                      <span>{item.level} %</span>
                      <Link href="/dashboard/owner/demandes">Commander</Link>
                    </div>
                  )) : <p className={styles.muted}>Aucun produit sous seuil.</p>}
                </div>
              </article>

              <article className={styles.panel}>
                <span className={styles.eyebrow}>Contrôles terrain</span>
                <div className={styles.controlList}>
                  {["Cuisine contrôlée", "Salle de bain contrôlée", "Literie vérifiée", "Inventaire validé"].map((item) => (
                    <span key={item}><CheckCircle2 size={15} /> {item}</span>
                  ))}
                </div>
                <p className={styles.muted}>Dernier contrôle : {selectedPrepared?.lastControlLabel || "à planifier"} · Agent : Christa</p>
                <div className={styles.actionRow}>
                  <Link href="/dashboard/owner/demandes" className={styles.secondaryLink}>Voir rapport</Link>
                  <Link href="/dashboard/owner/documents" className={styles.secondaryLink}><FileDown size={15} /> Télécharger PDF</Link>
                </div>
              </article>
            </section>

            <section className={styles.twoColumns}>
              <article className={styles.panel}>
                <span className={styles.eyebrow}>Alertes utiles</span>
                <div className={styles.alertList}>
                  {reorders.slice(0, 3).map((item) => (
                    <span key={`alert-${item.housing.id}-${item.consumable.id}`}>
                      <AlertTriangle size={16} /> {item.consumable.name || "Produit"} inférieur au seuil minimum.
                    </span>
                  ))}
                  {equipmentWatchCount > 0 ? <span><Wrench size={16} /> Un équipement présente un signalement.</span> : null}
                  {reorders.length === 0 && equipmentWatchCount === 0 ? <span><CheckCircle2 size={16} /> Aucune alerte importante.</span> : null}
                </div>
              </article>

              <article className={styles.panel}>
                <span className={styles.eyebrow}>Historique consommations</span>
                <div className={styles.financeRows}>
                  <span>Produits d'accueil <strong>{Math.round(monthlySpend * 0.48)} €</strong></span>
                  <span>Capsules café <strong>{Math.round(monthlySpend * 0.29)} €</strong></span>
                  <span>Produits ménagers <strong>{Math.round(monthlySpend * 0.23)} €</strong></span>
                  <span>Total juin <strong>{monthlySpend} €</strong></span>
                </div>
              </article>
            </section>

            <section className={styles.quickActions}>
              <Link href="#operational-settings"><Plus size={16} /> Ajouter un produit</Link>
              <Link href="/dashboard/owner/demandes"><AlertTriangle size={16} /> Signaler un manque</Link>
              <Link href="/dashboard/owner/demandes"><ClipboardCheck size={16} /> Demander un contrôle</Link>
              <Link href="/dashboard/owner/demandes"><ShoppingCart size={16} /> Commander des consommables</Link>
              <Link href="/dashboard/owner/logements"><History size={16} /> Voir tous les logements</Link>
            </section>

            <details id="operational-settings" className={styles.settingsBlock}>
              <summary>
                <span className={styles.eyebrow}>Paramètres opérationnels</span>
                <strong>Modifier les données transmises à la conciergerie</strong>
              </summary>
              {selectedHousing ? (
                <div className={sharedStyles.stockWorkspace}>
                  <aside className={sharedStyles.stockSidebar}>
                    <p className={sharedStyles.eyebrow}>Logements</p>
                    <div className={sharedStyles.stockHousingList}>
                      {preparedHousing.map((item) => (
                        <button
                          key={item.housing.id}
                          className={`${sharedStyles.stockHousingButton} ${
                            item.housing.id === selectedHousing.id ? sharedStyles.stockHousingButtonActive : ""
                          }`}
                          type="button"
                          onClick={() => setSelectedHousingId(item.housing.id)}
                        >
                          <strong>{getHousingLabel(item.housing)}</strong>
                          <span>{item.housing.ville || "Ville non renseignée"}</span>
                          <small>{getStatusLabel(item.status)}</small>
                        </button>
                      ))}
                    </div>
                  </aside>

                  <div className={sharedStyles.stockEditor}>
                    <section className={sharedStyles.panel}>
                      <div className={sharedStyles.sectionHeading}>
                        <div>
                          <p className={sharedStyles.eyebrow}>Logement sélectionné</p>
                          <h2 className={sharedStyles.terracottaSectionTitle}>{getHousingLabel(selectedHousing)}</h2>
                        </div>
                        <div className={sharedStyles.stockMiniStats}>
                          <span><BedDouble size={15} /> {selectedSummary.bedCount} lit(s)</span>
                          <span><Shirt size={15} /> {selectedSummary.laundryTotal} pièces linge</span>
                          <span><PackageCheck size={15} /> {selectedSummary.consumableCount} consommable(s)</span>
                        </div>
                      </div>
                      <label className={sharedStyles.stockFieldFull}>
                        <span>Équipements et repères généraux</span>
                        <textarea
                          value={equipmentText}
                          onChange={(event) => setEquipmentText(event.target.value)}
                          placeholder="Wi-Fi, aspirateur, fer à repasser, serrure connectée..."
                          rows={3}
                        />
                      </label>
                    </section>

                    <section className={sharedStyles.panel}>
                      <div className={sharedStyles.sectionHeading}>
                        <div>
                          <p className={sharedStyles.eyebrow}>Couchages</p>
                          <h2 className={sharedStyles.terracottaSectionTitle}>Lits et kits de draps</h2>
                        </div>
                        <button className={sharedStyles.buttonSecondary} type="button" onClick={() => setDraftStock((current) => ({ ...current, beds: [...current.beds, createEmptyBed()] }))}>
                          <Plus size={16} /> Ajouter un lit
                        </button>
                      </div>
                      <div className={sharedStyles.stockItemList}>
                        {draftStock.beds.map((bed, index) => (
                          <article className={sharedStyles.stockItemCard} key={bed.id}>
                            <div className={sharedStyles.stockFormGrid}>
                              <label className={sharedStyles.stockField}><span>Pièce</span><input value={bed.room} onChange={(event) => updateBed(index, "room", event.target.value)} placeholder="Chambre 1" /></label>
                              <label className={sharedStyles.stockField}><span>Type de lit</span><input value={bed.type} onChange={(event) => updateBed(index, "type", event.target.value)} /></label>
                              <label className={sharedStyles.stockField}><span>Quantité</span><input min={0} type="number" value={bed.quantity} onChange={(event) => updateBed(index, "quantity", event.target.value)} /></label>
                              <label className={sharedStyles.stockField}><span>Taille matelas</span><input value={bed.mattressSize} onChange={(event) => updateBed(index, "mattressSize", event.target.value)} /></label>
                              <label className={sharedStyles.stockFieldFull}><span>Kit linge à préparer</span><input value={bed.linenKit} onChange={(event) => updateBed(index, "linenKit", event.target.value)} /></label>
                            </div>
                            <button className={sharedStyles.iconButton} type="button" aria-label="Supprimer ce lit" onClick={() => setDraftStock((current) => ({ ...current, beds: current.beds.filter((_, bedIndex) => bedIndex !== index) }))}>
                              <Trash2 size={16} />
                            </button>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className={sharedStyles.panel}>
                      <p className={sharedStyles.eyebrow}>Linge</p>
                      <div className={sharedStyles.stockFormGrid}>
                        {[
                          ["sheetSets", "Parures draps"],
                          ["duvetCovers", "Housses de couette"],
                          ["pillowcases", "Taies oreiller"],
                          ["towelSets", "Kits serviettes"],
                          ["bathMats", "Tapis de bain"],
                          ["blankets", "Plaids / couvertures"],
                        ].map(([field, label]) => (
                          <label className={sharedStyles.stockField} key={field}>
                            <span>{label}</span>
                            <input min={0} type="number" value={draftStock.laundry[field as keyof HousingStockManagement["laundry"]] as number} onChange={(event) => updateLaundry(field as keyof HousingStockManagement["laundry"], event.target.value)} />
                          </label>
                        ))}
                      </div>
                    </section>

                    <section className={sharedStyles.panel}>
                      <div className={sharedStyles.sectionHeading}>
                        <div>
                          <p className={sharedStyles.eyebrow}>Consommables</p>
                          <h2 className={sharedStyles.terracottaSectionTitle}>Réassort et seuils</h2>
                        </div>
                        <button className={sharedStyles.buttonSecondary} type="button" onClick={() => setDraftStock((current) => ({ ...current, consumables: [...current.consumables, createEmptyConsumable()] }))}>
                          <Plus size={16} /> Ajouter un consommable
                        </button>
                      </div>
                      <div className={sharedStyles.stockItemList}>
                        {draftStock.consumables.map((item, index) => (
                          <article className={sharedStyles.stockItemCard} key={item.id}>
                            <div className={sharedStyles.stockFormGrid}>
                              <label className={sharedStyles.stockField}><span>Nom</span><input value={item.name} onChange={(event) => updateConsumable(index, "name", event.target.value)} placeholder="Papier toilette" /></label>
                              <label className={sharedStyles.stockField}><span>Catégorie</span><input value={item.category} onChange={(event) => updateConsumable(index, "category", event.target.value)} /></label>
                              <label className={sharedStyles.stockField}><span>Quantité actuelle</span><input min={0} type="number" value={item.currentQty} onChange={(event) => updateConsumable(index, "currentQty", event.target.value)} /></label>
                              <label className={sharedStyles.stockField}><span>Seuil minimum</span><input min={0} type="number" value={item.minQty} onChange={(event) => updateConsumable(index, "minQty", event.target.value)} /></label>
                              <label className={sharedStyles.stockField}><span>Unité</span><input value={item.unit} onChange={(event) => updateConsumable(index, "unit", event.target.value)} /></label>
                              <label className={sharedStyles.stockField}><span>Rangement</span><input value={item.storageLocation} onChange={(event) => updateConsumable(index, "storageLocation", event.target.value)} /></label>
                            </div>
                            <button className={sharedStyles.iconButton} type="button" aria-label="Supprimer ce consommable" onClick={() => setDraftStock((current) => ({ ...current, consumables: current.consumables.filter((_, itemIndex) => itemIndex !== index) }))}>
                              <Trash2 size={16} />
                            </button>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className={sharedStyles.panel}>
                      <div className={sharedStyles.sectionHeading}>
                        <div>
                          <p className={sharedStyles.eyebrow}>Transmission concierge</p>
                          <h2 className={sharedStyles.terracottaSectionTitle}>Consignes terrain</h2>
                        </div>
                        <ClipboardList size={22} aria-hidden="true" />
                      </div>
                      <div className={sharedStyles.stockFormGrid}>
                        <label className={sharedStyles.stockFieldFull}><span>Notes équipements</span><textarea rows={3} value={draftStock.equipmentNotes} onChange={(event) => setDraftStock((current) => ({ ...current, equipmentNotes: event.target.value }))} /></label>
                        <label className={sharedStyles.stockFieldFull}><span>Rangements importants</span><textarea rows={3} value={draftStock.storageNotes} onChange={(event) => setDraftStock((current) => ({ ...current, storageNotes: event.target.value }))} /></label>
                        <label className={sharedStyles.stockFieldFull}><span>Consignes pour la conciergerie</span><textarea rows={4} value={draftStock.conciergeInstructions} onChange={(event) => setDraftStock((current) => ({ ...current, conciergeInstructions: event.target.value }))} /></label>
                      </div>
                    </section>
                  </div>
                </div>
              ) : null}
            </details>
          </>
        ) : null}
      </div>
    </DashboardSectionShell>
  );
}
