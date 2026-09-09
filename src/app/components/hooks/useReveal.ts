"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  disabled?: boolean;
  animation?: "fade" | "reveal-up" | "reveal-down" | "scale";
  delay?: number;
}

interface UseRevealReturn {
  ref: RefObject<HTMLDivElement | null>;
  isVisible: boolean;
  className: string;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Une entrée animée, sans masquer le HTML avant hydratation. */
export function useReveal({
  threshold = 0.1,
  rootMargin = "0px 0px -48px 0px",
  disabled = false,
  animation = "reveal-up",
  delay = 0,
}: UseRevealOptions = {}): UseRevealReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      observer?.disconnect();
      clearTimeout(timer);
    };
    const showWithoutMotion = () => {
      stop();
      setIsVisible(true);
      setAnimate(false);
    };
    const onPreferenceChange = () => {
      if (media.matches) showWithoutMotion();
    };

    if (disabled || media.matches || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      setAnimate(false);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer?.disconnect();
      timer = setTimeout(() => {
        setIsVisible(true);
        setAnimate(!media.matches);
      }, Math.min(2000, Math.max(0, delay)));
    }, { threshold, rootMargin });
    if (ref.current) observer.observe(ref.current);
    media.addEventListener("change", onPreferenceChange);
    return () => {
      stop();
      media.removeEventListener("change", onPreferenceChange);
    };
  }, [threshold, rootMargin, disabled, delay]);

  const baseClass = animation === "fade" ? "ds-fade"
    : animation === "scale" ? "ds-scale"
    : animation === "reveal-down" ? "ds-reveal ds-reveal-down" : "ds-reveal";
  return { ref, isVisible, className: !disabled && animate ? baseClass + " visible" : "" };
}

export function useSimpleReveal(): UseRevealReturn {
  return useReveal();
}

/** Cascade plafonnée à deux secondes ; délai annulé au démontage. */
export function useStaggeredReveal(index: number, delayPerItem = 100): UseRevealReturn {
  return useReveal({ delay: index * delayPerItem });
}

/** Décor seulement : déplacement borné à 48 px, une mesure par frame. */
export function useParallax(speed = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION);
    const boundedSpeed = Number.isFinite(speed) ? Math.min(1, Math.max(0, speed)) : 0;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!ref.current || media.matches) return;
      const rect = ref.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
      setOffset(-Math.min(48, boundedSpeed * progress * rect.height));
    };
    const schedule = () => {
      if (!frame && !media.matches) frame = requestAnimationFrame(measure);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
    const syncPreference = () => {
      stop();
      if (media.matches || !boundedSpeed) {
        setOffset(0);
        return;
      }
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      schedule();
    };
    media.addEventListener("change", syncPreference);
    syncPreference();
    return () => {
      stop();
      media.removeEventListener("change", syncPreference);
    };
  }, [speed]);

  return { ref, style: { transform: "translateY(" + offset + "px)" } as CSSProperties };
}

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION);
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reducedMotion;
}
