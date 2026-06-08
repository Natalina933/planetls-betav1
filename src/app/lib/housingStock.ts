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

export type HousingStockManagement = {
  beds: HousingStockBed[];
  consumables: HousingStockConsumable[];
  laundry: HousingStockLaundry;
  equipmentNotes: string;
  storageNotes: string;
  conciergeInstructions: string;
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

export function createStockItemId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
      Boolean(stock.equipmentNotes || stock.storageNotes || stock.conciergeInstructions),
  };
}
