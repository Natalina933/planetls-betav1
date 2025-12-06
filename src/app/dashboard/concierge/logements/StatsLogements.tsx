"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import styles from "../../../dashboard/concierge/logements/LogementsPage.module.scss";

interface Props {
  total: number;
  prets: number;
  menages: number;
  arrivees: number;
  departs: number;
}

export default function StatsLogements({
  total,
  prets,
  menages,
  arrivees,
  departs,
}: Props) {
  const data = [
    { name: "Prêts", value: prets },
    { name: "Non prêts", value: total - prets },
  ];

  const COLORS = ["#2ECC71", "#E74C3C"];

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsLeft}>
        <h2>Statistiques du jour</h2>

        <div className={styles.statNumbers}>
          <div className={styles.statCard}>
            <span>Arrivées</span>
            <strong>{arrivees}</strong>
          </div>

          <div className={styles.statCard}>
            <span>Départs</span>
            <strong>{departs}</strong>
          </div>

          <div className={styles.statCard}>
            <span>Ménages en cours</span>
            <strong>{menages}</strong>
          </div>
        </div>
      </div>

      <div className={styles.statsRight}>
        <h3>État global</h3>

        <div className={styles.pieContainer}>
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                cornerRadius={8}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.legend}>
          <span className="dot green"></span> Prêts  
          <span className="dot red"></span> Non prêts
        </div>
      </div>
    </div>
  );
}
