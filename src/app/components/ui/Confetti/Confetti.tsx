// app/components/ui/Confetti.tsx
import React from "react";
// import Confetti from "react-confetti"; // Si package dispo

export default function Confetti() {
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: 2000
    }}>
      {/* Placez ici votre animation CSS ou utilisez un package externe */}
      <div style={{
        width: "100%", height: "100%",
        background: "repeating-linear-gradient(45deg, #FFD700 0 10px, #f2c200 10px 20px)",
        opacity: 0.3
      }} />
    </div>
  );
}
