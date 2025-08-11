"use client";
import React from "react";
import styles from "./FlippableCard.module.scss";

interface FlippableCardProps {
    title: string;
    description: string;
    quote: string;
    icon: React.ElementType | null;  // correspond à ton type icon dans services
    isFlipped: boolean;
    onToggle: () => void;
    className?: string;
}

export default function FlippableCard({
    title,
    description,
    quote,
    icon: Icon,
    isFlipped,
    onToggle,
}: FlippableCardProps) {
    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
        }
    };

    return (
        <div
            tabIndex={0}
            role="button"
            aria-pressed={isFlipped}
            className={`${styles.card} ${isFlipped ? styles.flipped : ""}`}
            onClick={onToggle}
            onKeyDown={onKeyDown}
        >
            <div className={styles.inner}>
                <div className={styles.front}>
                    <span className={styles.icon} aria-hidden="true">
                        {Icon ? <Icon className={styles.goldenIcon} /> : null}
                    </span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                </div>
                <div className={styles.back}>
                    <blockquote>{quote}</blockquote>
                </div>
            </div>
        </div>
    );
}
