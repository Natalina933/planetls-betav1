"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./AvatarCrop.module.scss";

interface AvatarCropProps {
    value: File | null;
    onChange: (file: File | null) => void;
}

export default function AvatarCrop({ value, onChange }: AvatarCropProps) {
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

    const handleMouseUp = () => {
        setIsDragging(false);
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

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragStart]);

    if (!value) return null;

    return (
        <div className={styles.avatarContainer} ref={containerRef}>
            <Image
                src={URL.createObjectURL(value)}
                alt="Avatar utilisateur"
                width={200}
                height={200}
                style={{
                    objectFit: "cover",
                    objectPosition: `${position.x}% ${position.y}%`,
                    transform: `scale(${scale})`,
                }}
                className={styles.avatarImg}
            />

            {/* Bulle dorée */}
            <div
                className={styles.controlBubble}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                onMouseDown={handleMouseDown}
            />

            {/* Barre de zoom */}
            <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className={styles.zoomSlider}
            />

            {/* Bouton supprimer */}
            <button
                type="button"
                className={styles.removeButton}
                onClick={() => onChange(null)}
            >
                Supprimer
            </button>
        </div>
    );
}
