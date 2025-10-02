"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./AvatarPreview.module.scss";

interface AvatarPreviewProps {
  file: File;
  onChange: (file: File | null) => void;
}

export default function AvatarPreview({ file, onChange }: AvatarPreviewProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

      setPosition((prev) => ({
        x: Math.min(100, Math.max(0, prev.x + dx)),
        y: Math.min(100, Math.max(0, prev.y + dy)),
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper} ref={containerRef}>
        <Image
          src={URL.createObjectURL(file)}
          alt="Avatar utilisateur"
          width={200}
          height={200}
          className={styles.avatarImg}
          style={{
            objectFit: "cover",
            objectPosition: `${position.x}% ${position.y}%`,
            transform: `scale(${scale})`,
          }}
        />

        <div
          className={styles.controlBubble}
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
          onMouseDown={handleMouseDown}
        />
      </div>

      <div className={styles.sidebar}>
        <label>
          Zoom :
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
        </label>
        <button type="button" className={styles.removeButton} onClick={() => onChange(null)}>
          Supprimer
        </button>
      </div>
    </div>
  );
}
