export type HousingStockBed = {
  id: string;
  room: string;
  type: string;
  quantity: number;
  mattressSize: string;
  linenKit: string;
  notes: string;
};

export type HousingStockConsumable = {
  id: string;
  name: string;
  category: string;
  currentQty: number;
  minQty: number;
  unit: string;
  storageLocation: string;
  notes: string;
};

export type HousingStockLaundry = {
  sheetSets: number;
  duvetCovers: number;
  pillowcases: number;
  towelSets: number;
  bathMats: number;
  blankets: number;
  storageLocation: string;
  notes: string;
};

export type HousingPurchaseStatus =
  | 'reported'
  | 'awaiting_contract_check'
  | 'awaiting_owner_approval'
  | 'product_selected'
  | 'ordered'
  | 'delivered'
  | 'installed'
  | 'cancelled';

export type HousingPurchaseContractRule = 'unknown' | 'included' | 'coordination_only' | 'extra_quote';

export type HousingPurchaseNeed = {
  id: string;
  itemName: string;
  widthCm: number | null;
  heightCm: number | null;
  quantity: number;
  room: string;
  reason: string;
  photoUrl: string;
  productUrl: string;
  estimatedBudget: number | null;
  deadline: string;
  deliveryDestination: 'housing' | 'concierge' | 'owner';
  contractRule: HousingPurchaseContractRule;
  approvalLimit: number | null;
  status: HousingPurchaseStatus;
  reportedBy: string;
  ownerDecisionNote: string;
  invoiceUrl: string;
  installationPhotoUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type HousingStockManagement = {
  beds: HousingStockBed[];
  consumables: HousingStockConsumable[];
  laundry: HousingStockLaundry;
  equipmentNotes: string;
  storageNotes: string;
  conciergeInstructions: string;
  purchaseNeeds: HousingPurchaseNeed[];
  lastUpdatedAt: string | null;
};

export const EMPTY_LAUNDRY_STOCK: HousingStockLaundry = {
  sheetSets: 0,
  duvetCovers: 0,
  pillowcases: 0,
  towelSets: 0,
  bathMats: 0,
  blankets: 0,
  storageLocation: "",
  notes: "",
};

export const EMPTY_HOUSING_STOCK_MANAGEMENT: HousingStockManagement = {
  beds: [],
  consumables: [],
  laundry: EMPTY_LAUNDRY_STOCK,
  equipmentNotes: "",
  storageNotes: "",
  conciergeInstructions: "",
  purchaseNeeds: [],
  lastUpdatedAt: null,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

const PURCHASE_STATUSES = new Set<HousingPurchaseStatus>([
  'reported', 'awaiting_contract_check', 'awaiting_owner_approval', 'product_selected',
  'ordered', 'delivered', 'installed', 'cancelled',
]);
const CONTRACT_RULES = new Set<HousingPurchaseContractRule>([
  'unknown', 'included', 'coordination_only', 'extra_quote',
]);

export function createStockItemId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateHousingPurchaseNeed(need: HousingPurchaseNeed): string | null {
  if (need.itemName.trim().length < 2) return 'Article obligatoire.';
  if (!Number.isFinite(need.quantity) || need.quantity < 1) return 'Quantité invalide.';
  const orderStarted = ['ordered', 'delivered', 'installed'].includes(need.status);
  if (orderStarted && need.contractRule === 'unknown') {
    return 'Le contrat doit être vérifié avant de commander.';
  }
  if (
    orderStarted &&
    need.estimatedBudget !== null &&
    need.approvalLimit !== null &&
    need.estimatedBudget > need.approvalLimit
  ) {
    return 'Le budget dépasse le plafond autorisé : accord propriétaire requis.';
  }
  if (need.status === 'installed' && !need.installationPhotoUrl.trim()) {
    return 'Une photo après installation est requise pour terminer le besoin.';
  }
  return null;
}

export function normalizeHousingStockManagement(value: unknown): HousingStockManagement {
  const record = asRecord(value);
  const laundry = asRecord(record.laundry);

  return {
    beds: Array.isArray(record.beds)
      ? record.beds.map((item, index) => {
          const bed = asRecord(item);
          return {
            id: cleanString(bed.id) || `bed-${index}`,
            room: cleanString(bed.room),
            type: cleanString(bed.type),
            quantity: toNumber(bed.quantity),
            mattressSize: cleanString(bed.mattressSize ?? bed.mattress_size),
            linenKit: cleanString(bed.linenKit ?? bed.linen_kit),
            notes: cleanString(bed.notes),
          };
        })
      : [],
    consumables: Array.isArray(record.consumables)
      ? record.consumables.map((item, index) => {
          const consumable = asRecord(item);
          return {
            id: cleanString(consumable.id) || `consumable-${index}`,
            name: cleanString(consumable.name),
            category: cleanString(consumable.category),
            currentQty: toNumber(consumable.currentQty ?? consumable.current_qty),
            minQty: toNumber(consumable.minQty ?? consumable.min_qty),
            unit: cleanString(consumable.unit),
            storageLocation: cleanString(consumable.storageLocation ?? consumable.storage_location),
            notes: cleanString(consumable.notes),
          };
        })
      : [],
    laundry: {
      sheetSets: toNumber(laundry.sheetSets ?? laundry.sheet_sets),
      duvetCovers: toNumber(laundry.duvetCovers ?? laundry.duvet_covers),
      pillowcases: toNumber(laundry.pillowcases),
      towelSets: toNumber(laundry.towelSets ?? laundry.towel_sets),
      bathMats: toNumber(laundry.bathMats ?? laundry.bath_mats),
      blankets: toNumber(laundry.blankets),
      storageLocation: cleanString(laundry.storageLocation ?? laundry.storage_location),
      notes: cleanString(laundry.notes),
    },
    equipmentNotes: cleanString(record.equipmentNotes ?? record.equipment_notes),
    storageNotes: cleanString(record.storageNotes ?? record.storage_notes),
    conciergeInstructions: cleanString(record.conciergeInstructions ?? record.concierge_instructions),
    purchaseNeeds: Array.isArray(record.purchaseNeeds ?? record.purchase_needs)
      ? ((record.purchaseNeeds ?? record.purchase_needs) as unknown[]).map((item, index) => {
          const need = asRecord(item);
          const status = cleanString(need.status) as HousingPurchaseStatus;
          const contractRule = cleanString(need.contractRule ?? need.contract_rule) as HousingPurchaseContractRule;
          const destination = cleanString(need.deliveryDestination ?? need.delivery_destination);
          return {
            id: cleanString(need.id) || `purchase-${index}`,
            itemName: cleanString(need.itemName ?? need.item_name),
            widthCm: toNullableNumber(need.widthCm ?? need.width_cm),
            heightCm: toNullableNumber(need.heightCm ?? need.height_cm),
            quantity: Math.max(1, toNumber(need.quantity)),
            room: cleanString(need.room),
            reason: cleanString(need.reason),
            photoUrl: cleanString(need.photoUrl ?? need.photo_url),
            productUrl: cleanString(need.productUrl ?? need.product_url),
            estimatedBudget: toNullableNumber(need.estimatedBudget ?? need.estimated_budget),
            deadline: cleanString(need.deadline),
            deliveryDestination: destination === 'concierge' || destination === 'owner' ? destination : 'housing',
            contractRule: CONTRACT_RULES.has(contractRule) ? contractRule : 'unknown',
            approvalLimit: toNullableNumber(need.approvalLimit ?? need.approval_limit),
            status: PURCHASE_STATUSES.has(status) ? status : 'reported',
            reportedBy: cleanString(need.reportedBy ?? need.reported_by),
            ownerDecisionNote: cleanString(need.ownerDecisionNote ?? need.owner_decision_note),
            invoiceUrl: cleanString(need.invoiceUrl ?? need.invoice_url),
            installationPhotoUrl: cleanString(need.installationPhotoUrl ?? need.installation_photo_url),
            createdAt: cleanString(need.createdAt ?? need.created_at) || new Date(0).toISOString(),
            updatedAt: cleanString(need.updatedAt ?? need.updated_at) || new Date(0).toISOString(),
          };
        })
      : [],
    lastUpdatedAt: cleanString(record.lastUpdatedAt ?? record.last_updated_at) || null,
  };
}

export function getHousingStockSummary(stock: HousingStockManagement) {
  const bedCount = stock.beds.reduce((total, bed) => total + bed.quantity, 0);
  const consumableCount = stock.consumables.length;
  const lowConsumableCount = stock.consumables.filter(
    (item) => item.minQty > 0 && item.currentQty <= item.minQty,
  ).length;
  const laundryTotal =
    stock.laundry.sheetSets +
    stock.laundry.duvetCovers +
    stock.laundry.pillowcases +
    stock.laundry.towelSets +
    stock.laundry.bathMats +
    stock.laundry.blankets;

  return {
    bedCount,
    consumableCount,
    lowConsumableCount,
    laundryTotal,
    isStarted:
      bedCount > 0 ||
      consumableCount > 0 ||
      laundryTotal > 0 ||
      stock.purchaseNeeds.length > 0 ||
      Boolean(stock.equipmentNotes || stock.storageNotes || stock.conciergeInstructions),
  };
}
