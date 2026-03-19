// hooks/useAutoOpen.ts
import { useEffect, useRef } from "react";

export function useAutoOpen(callback: () => void, delay = 120000, scrollY = 600) {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRef.current) return;

    const timer = setTimeout(() => {
      callback();
      hasTriggeredRef.current = true;
    }, delay);

    const handleScroll = () => {
      if (!hasTriggeredRef.current && window.scrollY > scrollY) {
        callback();
        hasTriggeredRef.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [callback, delay, scrollY]);
}
