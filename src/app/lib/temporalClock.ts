export type TemporalSchedule = {
  transitions: readonly number[];
  localDay: boolean;
  localDates?: readonly number[];
};

export function temporalSchedule(transitions: readonly number[], localDay = false): TemporalSchedule {
  return { transitions: [...new Set(transitions.filter(Number.isFinite))].sort((a, b) => a - b), localDay };
}

export const ROLLING_48_HOURS = 48 * 60 * 60 * 1000;

export function planningTemporalSchedule(starts: readonly number[]) {
  return temporalSchedule(starts.flatMap((start) => [start - ROLLING_48_HOURS, start, start + 1]), true);
}

// Mission views change only on the mission's local day and the following day.
export function missionDaySchedule(starts: readonly number[]): TemporalSchedule {
  return { transitions: [], localDay: false, localDates: [...new Set(starts.filter(Number.isFinite))] };
}

export function localDayStart(now: number) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function localDayEnd(now: number) {
  const date = new Date(now);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export type TemporalEnvironment = {
  now: () => number;
  setTimeout: (callback: () => void, delay: number) => unknown;
  clearTimeout: (timer: unknown) => void;
  listen: (resume: () => void) => () => void;
};

// Zero is a hydration sentinel, never a displayed date. No mutable server singleton.
export const getTemporalServerSnapshot = () => 0;

function transitionsFor(schedule: TemporalSchedule) {
  if (!schedule.localDates?.length) return schedule.transitions;
  return [...schedule.transitions, ...schedule.localDates.flatMap((date) => [localDayStart(date), localDayEnd(date) + 1])]
    .sort((a, b) => a - b);
}

function periodKey(schedule: TemporalSchedule, now: number) {
  const passed = transitionsFor(schedule).filter((transition) => transition <= now).length;
  if (!schedule.localDay) return String(passed);
  const date = new Date(now);
  return `${passed}:${date.getFullYear()}-${date.getMonth()}-${date.getDate()}:${date.getTimezoneOffset()}`;
}

function nextTransition(schedule: TemporalSchedule, now: number) {
  const transition = transitionsFor(schedule).find((time) => time > now) ?? Infinity;
  if (!schedule.localDay) return transition;
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.min(transition, midnight.getTime());
}

export function createTemporalClock(environment: TemporalEnvironment) {
  let snapshot = 0;
  const subscriptions = new Set<{ notify: () => void; schedule: TemporalSchedule; key: string }>();
  let timer: unknown;
  let stopListening: (() => void) | undefined;

  function clearTimer() {
    if (timer !== undefined) environment.clearTimeout(timer);
    timer = undefined;
  }

  function arm(now: number) {
    clearTimer();
    let next = Infinity;
    for (const subscription of subscriptions) next = Math.min(next, nextTransition(subscription.schedule, now));
    if (Number.isFinite(next)) {
      // Browsers cap timeout delays at a signed 32-bit integer.
      timer = environment.setTimeout(refresh, Math.min(next - now, 2_147_483_647));
    }
  }

  function refresh() {
    const now = environment.now();
    let changed = false;
    for (const subscription of subscriptions) {
      const key = periodKey(subscription.schedule, now);
      if (key !== subscription.key) changed = true;
      subscription.key = key;
    }
    arm(now);
    if (changed && now !== snapshot) {
      snapshot = now;
      for (const subscription of subscriptions) subscription.notify();
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(notify: () => void, schedule: TemporalSchedule) {
      const now = environment.now();
      const subscription = { notify, schedule, key: periodKey(schedule, now) };
      subscriptions.add(subscription);
      // Subscription/data changes must evaluate new data against current real time.
      snapshot = now;
      if (!stopListening && [...subscriptions].some(({ schedule }) => schedule.localDay || schedule.transitions.length || schedule.localDates?.length)) {
        stopListening = environment.listen(refresh);
      }
      arm(now);
      for (const existing of subscriptions) {
        existing.key = periodKey(existing.schedule, now);
        existing.notify();
      }
      return () => {
        subscriptions.delete(subscription);
        if (subscriptions.size === 0) {
          clearTimer();
          stopListening?.();
          stopListening = undefined;
        } else {
          arm(environment.now());
        }
      };
    },
  };
}
