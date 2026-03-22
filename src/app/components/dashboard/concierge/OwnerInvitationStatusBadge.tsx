"use client";

import styles from "./LogementWorkspace.module.scss";
import {
  OWNER_INVITATION_STATUS_META,
  type OwnerInvitationStatus,
} from "@/types/ownerInvitations";

function toneClassName(tone: "neutral" | "info" | "success" | "warning" | "danger") {
  switch (tone) {
    case "success":
      return styles.statusSuccess;
    case "info":
      return styles.statusInfo;
    case "warning":
      return styles.statusWarning;
    case "danger":
      return styles.statusDanger;
    default:
      return styles.statusNeutral;
  }
}

export default function OwnerInvitationStatusBadge({
  status,
}: {
  status: OwnerInvitationStatus;
}) {
  const meta = OWNER_INVITATION_STATUS_META[status];

  return <span className={`${styles.statusBadge} ${toneClassName(meta.tone)}`}>{meta.label}</span>;
}
