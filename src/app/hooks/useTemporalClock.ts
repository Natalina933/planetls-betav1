"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { createTemporalClock, getTemporalServerSnapshot, type TemporalSchedule } from "../lib/temporalClock";

function createBrowserClock() {
  return createTemporalClock({
    now: () => Date.now(),
    setTimeout: (callback, delay) => window.setTimeout(callback, delay),
    clearTimeout: (timer) => window.clearTimeout(timer as number),
    listen(resume) {
      const onVisible = () => {
        if (document.visibilityState === "visible") resume();
      };
      window.addEventListener("focus", resume);
      window.addEventListener("pageshow", resume);
      document.addEventListener("visibilitychange", onVisible);
      return () => {
        window.removeEventListener("focus", resume);
        window.removeEventListener("pageshow", resume);
        document.removeEventListener("visibilitychange", onVisible);
      };
    },
  });
}

export function useTemporalClock(schedule: TemporalSchedule) {
  const [clock] = useState(createBrowserClock);
  const subscribe = useCallback((notify: () => void) => clock.subscribe(notify, schedule), [clock, schedule]);
  return useSyncExternalStore(subscribe, clock.getSnapshot, getTemporalServerSnapshot);
}
