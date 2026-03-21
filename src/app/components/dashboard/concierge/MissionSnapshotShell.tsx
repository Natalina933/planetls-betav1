"use client";

import React from "react";

interface MissionSnapshotShellProps {
  styles: Record<string, string>;
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function MissionSnapshotShell({
  styles,
  eyebrow,
  title,
  children,
  footer,
}: MissionSnapshotShellProps) {
  return (
    <div className={styles.missionSnapshotCard}>
      <div className={styles.missionSnapshotHeader}>
        <div>
          <p className={styles.missionSnapshotEyebrow}>{eyebrow}</p>
          <h4>{title}</h4>
        </div>
      </div>

      {children}
      {footer ? <p className={styles.missionSnapshotNote}>{footer}</p> : null}
    </div>
  );
}
