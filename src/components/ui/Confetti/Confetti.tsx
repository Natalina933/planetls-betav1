// src/app/components/ui/Confetti/Confetti.tsx
"use client";

import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

/**
 * Effet confettis dorés et élégants 🎉
 * Plus dense, plus long, avec un fade-out fluide.
 */
export default function ConfettiWrapper() {
  const { width, height } = useWindowSize();
  const [opacity, setOpacity] = useState(1);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Fade-out plus lent et disparition après 4 secondes
    const fadeTimer = setTimeout(() => setOpacity(0), 3800);
    const hideTimer = setTimeout(() => setVisible(false), 4500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 3000,
        pointerEvents: "none",
        transition: "opacity 1.2s ease-out",
        opacity,
      }}
    >
      <Confetti
        width={width}
        height={height}
        numberOfPieces={800} // 🎉 plus de confettis
        gravity={0.25} // chute douce et réaliste
        wind={0.02}
        colors={[
          "#FFD700", // or pur
          "#FFEA70", // doré clair
          "#FFF8DC", // crème
          "#F5DEB3", // champagne
          "#E6BE8A", // bronze clair
        ]}
        tweenDuration={9000} // durée d’animation prolongée
        recycle={false}
      />
    </div>
  );
}
