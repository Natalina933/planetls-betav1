"use client";
import React from "react";
import clsx from "clsx";
import styles from "./FlippableCard.module.scss";

interface FlippableCardProps {
    title: string;
    description: string;
    quote: string;
    icon: React.ElementType | null;
    isFlipped: boolean;
    onToggle: () => void;
    sizeClass?: string;
}

export default function FlippableCard({
    title,
    description,
    quote,
    icon: Icon,
    isFlipped,
    onToggle,
    sizeClass,
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
            className={clsx(styles.card, styles[sizeClass || ""], {
                [styles.flipped]: isFlipped,
            })}
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
                    <blockquote className={styles.quote}>{quote}</blockquote>
                </div>
            </div>
        </div>
    );
}
