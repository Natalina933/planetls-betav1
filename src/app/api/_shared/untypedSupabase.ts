type LooseSupabaseError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

// Supabase generated types are missing several tables in this project. Keep the
// permissive row shape centralized while preserving the query-builder surface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabaseData = any;

type LooseSupabaseResult<T = LooseSupabaseData> = {
  data: T | null;
  error: LooseSupabaseError | null;
  count?: number | null;
  status?: number;
  statusText?: string;
};

export type LooseSupabaseQuery<T = LooseSupabaseData> = PromiseLike<LooseSupabaseResult<T>> & {
  select: (columns?: string, options?: Record<string, unknown>) => LooseSupabaseQuery<T>;
  insert: (values: unknown, options?: Record<string, unknown>) => LooseSupabaseQuery<T>;
  update: (values: Record<string, unknown>, options?: Record<string, unknown>) => LooseSupabaseQuery<T>;
  upsert: (values: unknown, options?: Record<string, unknown>) => LooseSupabaseQuery<T>;
  delete: (options?: Record<string, unknown>) => LooseSupabaseQuery<T>;
  eq: (column: string, value: unknown) => LooseSupabaseQuery<T>;
  neq: (column: string, value: unknown) => LooseSupabaseQuery<T>;
  gt: (column: string, value: unknown) => LooseSupabaseQuery<T>;
  gte: (column: string, value: unknown) => LooseSupabaseQuery<T>;
  lt: (column: string, value: unknown) => LooseSupabaseQuery<T>;
  lte: (column: string, value: unknown) => LooseSupabaseQuery<T>;
  in: (column: string, values: readonly unknown[]) => LooseSupabaseQuery<T>;
  is: (column: string, value: unknown) => LooseSupabaseQuery<T>;
  or: (filters: string, options?: Record<string, unknown>) => LooseSupabaseQuery<T>;
  contains: (column: string, value: unknown) => LooseSupabaseQuery<T>;
  order: (column: string, options?: Record<string, unknown>) => LooseSupabaseQuery<T>;
  limit: (count: number) => LooseSupabaseQuery<T>;
  range: (from: number, to: number) => LooseSupabaseQuery<T>;
  maybeSingle: <Row = T>() => Promise<LooseSupabaseResult<Row>>;
  single: <Row = T>() => Promise<LooseSupabaseResult<Row>>;
};

export type LooseSupabaseClient = {
  from: (table: string) => LooseSupabaseQuery;
};

export function asLooseSupabaseClient(client: unknown): LooseSupabaseClient {
  return client as LooseSupabaseClient;
}
