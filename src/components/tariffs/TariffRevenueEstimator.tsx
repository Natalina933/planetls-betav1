"use client";

import { useMemo, useState } from "react";
import styles from "./TariffRevenueEstimator.module.scss";
import { computeMissionPrice, createPricingV2FromLegacy } from "./pricingEngine";
import type { PricingV2Config, SeasonalPricingConfig } from "./types";

interface Props {
  hourlyRate: number;
  travelFee: number;
  pricing: SeasonalPricingConfig;
  pricingV2?: PricingV2Config;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const round = (value: number) => Math.round(value);

export default function TariffRevenueEstimator({
  hourlyRate,
  travelFee,
  pricing,
  pricingV2,
}: Props) {
  const [missionsPerMonth, setMissionsPerMonth] = useState(20);
  const [avgHoursPerMission, setAvgHoursPerMission] = useState(2);
  const [urgentSharePercent, setUrgentSharePercent] = useState(20);
  const [nightSharePercent, setNightSharePercent] = useState(10);
  const [weekendSharePercent, setWeekendSharePercent] = useState(25);

  const projection = useMemo(() => {
    const fixedFees = pricing.checkInFee + pricing.checkOutFee + pricing.linenKitFee;

    const effectivePricingV2: PricingV2Config = {
      ...(pricingV2 ??
        createPricingV2FromLegacy({
          hourlyRate,
          travelFee,
          seasonalPricing: pricing,
        })),
      base: {
        hourlyRate,
        travelFee,
        minimumInvoice: pricing.minimumInvoice,
      },
      globalModifiers: {
        urgentPercent: pricing.urgentPercent,
        nightPercent: pricing.nightPercent,
        weekendPercent: pricing.weekendPercent,
        highSeasonPercent: pricing.highSeasonPercent,
      },
    };

    const baseScenario = computeMissionPrice(effectivePricingV2, {
      durationHours: avgHoursPerMission,
      fixedFees,
    });
    const urgentScenario = computeMissionPrice(effectivePricingV2, {
      durationHours: avgHoursPerMission,
      fixedFees,
      isUrgent: true,
    });
    const nightScenario = computeMissionPrice(effectivePricingV2, {
      durationHours: avgHoursPerMission,
      fixedFees,
      isNight: true,
    });
    const weekendScenario = computeMissionPrice(effectivePricingV2, {
      durationHours: avgHoursPerMission,
      fixedFees,
      isWeekend: true,
    });

    const weightedMissionValue =
      baseScenario.total +
      (urgentScenario.total - baseScenario.total) * (urgentSharePercent / 100) +
      (nightScenario.total - baseScenario.total) * (nightSharePercent / 100) +
      (weekendScenario.total - baseScenario.total) * (weekendSharePercent / 100);

    const monthly = weightedMissionValue * missionsPerMonth;

    return {
      baseMission: round(baseScenario.total),
      weightedMissionValue: round(weightedMissionValue),
      monthly: round(monthly),
    };
  }, [
    avgHoursPerMission,
    hourlyRate,
    missionsPerMonth,
    nightSharePercent,
    pricing,
    pricingV2,
    travelFee,
    urgentSharePercent,
    weekendSharePercent,
  ]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <label className={styles.row}>
          <span>Missions / mois</span>
          <input
            type="number"
            min={1}
            max={250}
            value={missionsPerMonth}
            onChange={(e) => setMissionsPerMonth(clamp(Number(e.target.value || 1), 1, 250))}
          />
        </label>
        <label className={styles.row}>
          <span>Duree moyenne / mission (h)</span>
          <input
            type="number"
            min={0.5}
            max={12}
            step={0.5}
            value={avgHoursPerMission}
            onChange={(e) => setAvgHoursPerMission(clamp(Number(e.target.value || 1), 0.5, 12))}
          />
        </label>
        <label className={styles.row}>
          <span>Part urgences (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={urgentSharePercent}
            onChange={(e) => setUrgentSharePercent(clamp(Number(e.target.value || 0), 0, 100))}
          />
        </label>
        <label className={styles.row}>
          <span>Part interventions nuit (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={nightSharePercent}
            onChange={(e) => setNightSharePercent(clamp(Number(e.target.value || 0), 0, 100))}
          />
        </label>
        <label className={styles.row}>
          <span>Part week-end (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={weekendSharePercent}
            onChange={(e) => setWeekendSharePercent(clamp(Number(e.target.value || 0), 0, 100))}
          />
        </label>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Panier base mission</p>
          <p className={styles.metricValue}>{projection.baseMission} EUR</p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Panier moyen projete</p>
          <p className={styles.metricValue}>{projection.weightedMissionValue} EUR</p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>CA mensuel estime</p>
          <p className={styles.metricValue}>{projection.monthly} EUR</p>
        </div>
      </div>
    </div>
  );
}
