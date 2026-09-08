"use client";

import { useEffect, useRef, useState, RefObject } from "react";

/**
 * Hook pour gérer les animations de reveal au scroll
 * Utilise IntersectionObserver pour détecter quand un élément entre dans le viewport
 * Respecte prefers-reduced-motion automatiquement
 * 
 * @param options - Options de configuration
 * @param options.threshold - Seuil d'intersection (0.0 à 1.0)
 * @param options.rootMargin - Marge supplémentaire autour du viewport
 * @param options.disabled - Désactive l'observation (utile pour reduced motion)
 * @param options.animation - Type d'animation à appliquer
 * @returns RefObject et état de visibilité
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, isVisible } = useReveal({ threshold: 0.1 });
 *   return <div ref={ref} className={isVisible ? 'visible' : ''}>Content</div>;
 * }
 * ```
 */

interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  disabled?: boolean;
  animation?: "fade" | "reveal-up" | "reveal-down" | "scale";
}

interface UseRevealReturn {
  ref: RefObject<HTMLDivElement>;
  isVisible: boolean;
  className: string;
}

const DEFAULT_OPTIONS: Required<Omit<UseRevealOptions, "disabled" | "animation">> = {
  threshold: 0.1,
  rootMargin: "0px 0px -48px 0px",
};

export function useReveal(options: UseRevealOptions = {}): UseRevealReturn {
  const { threshold, rootMargin, disabled, animation = "reveal-up" } = options;
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect de prefers-reduced-motion
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        setIsVisible(true);
        return;
      }
    }

    if (disabled) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: threshold ?? DEFAULT_OPTIONS.threshold,
        rootMargin: rootMargin ?? DEFAULT_OPTIONS.rootMargin,
      }
    );

    const current = ref.current;
    if (current) {
      observer.observe(current);
      return () => observer.unobserve(current);
    }

    return undefined;
  }, [threshold, rootMargin, disabled]);

  // Génère la classe en fonction de l'animation
  const getAnimationClass = () => {
    if (!isVisible) {
      switch (animation) {
        case "fade":
          return "ds-fade";
        case "reveal-down":
          return "ds-reveal ds-reveal-down";
        case "scale":
          return "ds-scale";
        case "reveal-up":
        default:
          return "ds-reveal";
      }
    }
    return "";
  };

  const className = getAnimationClass();

  return { ref, isVisible, className };
}

/**
 * Hook simplifié pour reveal sans configuration
 * @returns RefObject et état de visibilité
 */
export function useSimpleReveal(): UseRevealReturn {
  return useReveal();
}

/**
 * Hook pour reveal avec délai (animation en cascade)
 * @param index - Index de l'élément pour calculer le délai
 * @param delayPerItem - Délai entre chaque élément en ms
 * @returns RefObject et état de visibilité
 */
export function useStaggeredReveal(
  index: number,
  delayPerItem: number = 100
): UseRevealReturn {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect de prefers-reduced-motion
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        setIsVisible(true);
        return;
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Applique un délai basé sur l'index
          const timeout = setTimeout(() => {
            setIsVisible(true);
          }, index * delayPerItem);
          
          observer.unobserve(entry.target);
          return () => clearTimeout(timeout);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -48px 0px",
      }
    );

    const current = ref.current;
    if (current) {
      observer.observe(current);
      return () => observer.unobserve(current);
    }

    return undefined;
  }, [index, delayPerItem]);

  const className = isVisible ? "" : "ds-reveal";

  return { ref, isVisible, className };
}

/**
 * Hook pour parallax léger
 * @param speed - Vitesse du parallax (0.0 à 1.0)
 * @returns Style à appliquer à l'élément
 */
export function useParallax(speed: number = 0.1) {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementTop = rect.top + window.scrollY;
      const elementHeight = rect.height;
      
      // Position relative dans le viewport
      const relativePosition = (window.scrollY - elementTop + viewportHeight) / (elementHeight + viewportHeight);
      
      // Calcul de l'offset avec vitesse
      const newOffset = -speed * relativePosition * elementHeight;
      setOffset(newOffset);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return {
    ref,
    style: {
      transform: `translateY(${offset}px)`,
      willChange: "transform",
      transition: `transform ${var(--ds-motion-slow)} ${var(--ds-ease-premium)}`,
    } as React.CSSProperties,
  };
}

/**
 * Hook pour vérifier si reduced motion est activé
 * @returns Boolean indiquant si reduced motion est activé
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);
      
      const handler = () => setReducedMotion(mediaQuery.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  return reducedMotion;
}
