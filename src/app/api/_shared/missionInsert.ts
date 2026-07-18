type SupabaseMutationError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null;

type SupabaseInsertResult<T> = {
  data: T | null;
  error: SupabaseMutationError;
};

type SupabaseInsertBuilder<T> = {
  select(columns: string): {
    single(): PromiseLike<SupabaseInsertResult<T>>;
  };
};

type SupabaseTableClient<T> = {
  insert(payload: Record<string, unknown>): SupabaseInsertBuilder<T>;
};

type SupabaseClientLike<T> = {
  from(table: "missions"): SupabaseTableClient<T>;
};

const OPTIONAL_MISSION_INSERT_COLUMNS = new Set(["description", "metadata", "title"]);

function getCompatibleMissionSelect(columns: string, removedColumns: Set<string>) {
  if (!removedColumns.has("title")) return columns;
  return columns.replace(/\btitle\b/g, "service_label");
}

function getMissingMissionColumn(error: SupabaseMutationError) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  const match = message.match(/'([^']+)'\s+column/);
  const column = match?.[1] ?? null;
  if (column && OPTIONAL_MISSION_INSERT_COLUMNS.has(column)) return column;

  const isMissingColumn =
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    message.includes("could not find") && message.includes("column");

  if (!isMissingColumn) return null;
  for (const optionalColumn of OPTIONAL_MISSION_INSERT_COLUMNS) {
    if (message.includes(optionalColumn)) return optionalColumn;
  }
  return null;
}

export async function insertMissionWithOptionalMetadata<T>(
  client: SupabaseClientLike<T>,
  payload: Record<string, unknown>,
  selectColumns: string,
  fallbackSelectColumns = selectColumns,
) {
  let nextPayload = { ...payload };
  const removedColumns = new Set<string>();

  for (let attempt = 0; attempt <= OPTIONAL_MISSION_INSERT_COLUMNS.size; attempt += 1) {
    const selectedColumns = getCompatibleMissionSelect(
      removedColumns.size > 0 ? fallbackSelectColumns : selectColumns,
      removedColumns,
    );
    const result = await client
      .from("missions")
      .insert(nextPayload)
      .select(selectedColumns)
      .single();

    const missingColumn = getMissingMissionColumn(result.error);
    if (!result.error || !missingColumn || !(missingColumn in nextPayload)) {
      return {
        ...result,
        metadataStored: !result.error && "metadata" in nextPayload,
        removedColumns: Array.from(removedColumns),
      };
    }

    nextPayload = { ...nextPayload };
    const missingValue = nextPayload[missingColumn];
    delete nextPayload[missingColumn];
    if (missingColumn === "title" && !("service_label" in nextPayload)) {
      nextPayload.service_label = missingValue;
    }
    removedColumns.add(missingColumn);
    console.warn(`[missions] ${missingColumn} column unavailable, retrying insert without it.`);
  }

  const finalAttempt = await client
    .from("missions")
    .insert(nextPayload)
    .select(getCompatibleMissionSelect(fallbackSelectColumns, removedColumns))
    .single();

  return {
    ...finalAttempt,
    metadataStored: !finalAttempt.error && "metadata" in nextPayload,
    removedColumns: Array.from(removedColumns),
  };
}
