"use client";

import { useId, type CSSProperties } from "react";
import styles from "./FilterSliders.module.scss";

type SliderConfig = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  helperText?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
};

export interface FilterSlidersProps {
  radius?: SliderConfig;
  budget?: SliderConfig;
  className?: string;
  title?: string;
}

type SliderFieldProps = {
  id: string;
  config: SliderConfig;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getFormattedValue = (config: SliderConfig) => {
  if (config.formatValue) {
    return config.formatValue(config.value);
  }

  if (config.unit) {
    return `${config.value} ${config.unit}`;
  }

  return String(config.value);
};

function SliderField({ id, config }: SliderFieldProps) {
  const safeValue = clamp(config.value, config.min, config.max);
  const progress =
    config.max === config.min
      ? 0
      : ((safeValue - config.min) / (config.max - config.min)) * 100;

  const sliderStyle = {
    "--slider-progress": `${progress}%`,
  } as CSSProperties;

  return (
    <div className={styles.field}>
      <div className={styles.header}>
        <label className={styles.label} htmlFor={id}>
          {config.label}
        </label>
        <span className={styles.value}>{getFormattedValue(config)}</span>
      </div>

      <input
        id={id}
        className={styles.slider}
        type="range"
        min={config.min}
        max={config.max}
        step={config.step ?? 1}
        value={safeValue}
        disabled={config.disabled}
        onChange={(event) => config.onChange(Number(event.target.value))}
        style={sliderStyle}
      />

      <div className={styles.footer}>
        <span className={styles.boundary}>
          {config.min}
          {config.unit ? ` ${config.unit}` : ""}
        </span>
        {config.helperText ? (
          <span className={styles.helper}>{config.helperText}</span>
        ) : null}
        <span className={styles.boundary}>
          {config.max}
          {config.unit ? ` ${config.unit}` : ""}
        </span>
      </div>
    </div>
  );
}

export default function FilterSliders({
  radius,
  budget,
  className,
  title = "Filtres",
}: FilterSlidersProps) {
  const id = useId();
  const hasSliders = Boolean(radius || budget);

  if (!hasSliders) {
    return null;
  }

  return (
    <section className={`${styles.wrapper}${className ? ` ${className}` : ""}`}>
      <div className={styles.topRow}>
        <h2 className={styles.title}>{title}</h2>
      </div>

      <div className={styles.grid}>
        {radius ? <SliderField id={`${id}-radius`} config={radius} /> : null}
        {budget ? <SliderField id={`${id}-budget`} config={budget} /> : null}
      </div>
    </section>
  );
}
