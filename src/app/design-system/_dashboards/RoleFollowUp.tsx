"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { ArtDecoTimeline } from "@/components/ui/ArtDecoTimeline/ArtDecoTimeline";
import { Button, Card, CardBody } from "@/components/ui";
import { ArtDecoQuotes, ArtDecoSmartSearch } from "@/components/ui/ArtDecoWorkspace/ArtDecoWorkspace";
import { roleWorkspaceData } from "./roleWorkspaceData";
import { roleFollowUp } from "./roleFollowUpData";
import styles from "./RoleFollowUp.module.scss";

export function RoleFollowUp({ space }: { space: keyof typeof roleFollowUp }) {
  const data = roleFollowUp[space];
  const workspace = roleWorkspaceData[space];
  const [notice, setNotice] = useState("");
  const show = (label: string) => setNotice(`${label} — aperçu de démonstration, aucune donnée enregistrée ni aucun message envoyé.`);
  return <section className={styles.section} aria-labelledby={`${space}-followup-title`} data-role-followup={space}>
    <header className={styles.heading}><h2 id={`${space}-followup-title`}>{data.title}</h2><p>{data.lead}</p></header>
    <div className={styles.search}><ArtDecoSmartSearch scope={workspace.scope} items={workspace.results} /></div>
    <div className={styles.grid}>
      <ArtDecoTimeline id={`${space}-journey-title`} title={data.focus}
        items={data.steps.map(([when,title,detail], index) => ({ id: title, when, title, detail,
          status: ({ owner: ["Demande à préciser", "Offre à choisir", "Compte rendu attendu"], concierge: ["À confirmer", "Planifiée", "Urgente"], provider: ["Planifiée", "Planifiée", "Compte rendu attendu"], admin: ["Pièces à réunir", "À examiner", "Décision à tracer"] })[space][index],
          tone: index === 0 ? "owner" : index === 1 ? "concierge" : "artisan",
        }))}
        note={space === "concierge" || space === "provider" ? "Ordre indicatif de démonstration ; aucun itinéraire ni temps de trajet calculé." : "Parcours illustratif ; aucune validation ni réalisation confirmée."} />
      <ArtDecoQuotes title={workspace.quoteTitle} options={workspace.quotes} onAction={(quote) => show(quote.action)} />
      <Card className={styles.message}><CardBody><div className={styles.messageContent}><MessageSquareText size={26} aria-hidden="true" /><div><h3>{data.messageTitle}</h3><p className={styles.context}>{data.context}</p><p>{data.message}</p></div><Button variant="outline" onClick={() => show(data.messageAction)}>{data.messageAction}</Button></div></CardBody></Card>
    </div>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
  </section>;
}
