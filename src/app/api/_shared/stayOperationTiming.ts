/** Existing stay planning defaults, shared by explicit assignments and awards. */
export function stayOperationTiming(schedule: { check_in_at?: string | null; check_out_at?: string | null }, need: string | null) {
  const add = (value: string, minutes: number) => new Date(new Date(value).getTime() + minutes * 60000).toISOString();
  if (need === "checkin" && schedule.check_in_at) return { start: schedule.check_in_at, end: add(schedule.check_in_at, 45) };
  if (need === "checkout" && schedule.check_out_at) return { start: schedule.check_out_at, end: add(schedule.check_out_at, 45) };
  if (need === "cleaning" && schedule.check_out_at) return { start: add(schedule.check_out_at, 60), end: add(schedule.check_out_at, 180) };
  if (need === "linen" && schedule.check_out_at) return { start: add(schedule.check_out_at, 90), end: add(schedule.check_out_at, 150) };
  if (need === "courses" && schedule.check_in_at) return { start: add(schedule.check_in_at, -180), end: schedule.check_in_at };
  return null;
}
