export type CollaborationLifecycleRow = { status?: string | null; scope?: unknown; ends_on?: string | null };

export function lifecycleRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** D + N calendar dates in UTC, effective at 00:00Z. An agreed zero-day notice
 * takes effect at the request instant, never retroactively at midnight. */
export function terminationSchedule(requestedAt: string, noticeDays: number) {
  const effective = new Date(requestedAt);
  if (!Number.isFinite(effective.getTime()) || !Number.isInteger(noticeDays) || noticeDays < 0 || noticeDays > 3650) {
    throw new Error("Préavis ou date de demande invalide.");
  }
  if (noticeDays > 0) { effective.setUTCHours(0, 0, 0, 0); effective.setUTCDate(effective.getUTCDate() + noticeDays); }
  return { effective_at: effective.toISOString(), effective_date: effective.toISOString().slice(0, 10) };
}

export function collaborationLifecycle(row: CollaborationLifecycleRow, now = new Date()) {
  const rawTermination = lifecycleRecord(row.scope).termination_request;
  const termination = lifecycleRecord(rawTermination);
  let invalid = false, due = false;
  if (termination.schema_version === 1) {
    try {
      if (typeof termination.notice_days !== "number") throw new Error("Préavis invalide.");
      const expected = terminationSchedule(String(termination.requested_at), termination.notice_days);
      invalid = termination.effective_at !== expected.effective_at || termination.effective_date !== expected.effective_date
        || (row.ends_on != null && row.ends_on !== expected.effective_date);
      due = !invalid && now.getTime() >= new Date(expected.effective_at).getTime();
    } catch { invalid = true; }
  } else if (rawTermination != null) {
    // The sole legacy shape is the undated 03B request, upgraded explicitly by POST.
    invalid = termination.state !== "requested" || typeof termination.requested_by !== "string"
      || !Number.isFinite(Date.parse(String(termination.requested_at)))
      || termination.effective_at != null || termination.effective_date != null;
  }
  const status = due && row.status !== "cancelled" ? "ended" : row.status;
  const visibleTermination: Record<string, unknown> | null = termination.schema_version === 1
    ? { ...termination, state: due || row.status === "ended" ? "effective" : "notice" } : null;
  return { status, canCreateInterventions: status === "active" && !invalid, invalid,
    termination: visibleTermination };
}
