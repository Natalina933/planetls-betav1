"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleHelp,
  Edit3,
  MonitorSmartphone,
  Quote,
  RotateCcw,
  Smartphone,
  Target,
} from "lucide-react";
import AvatarUpload from "@/app/components/ui/AvatarUpload/AvatarUpload";
import { Button } from "@/components/ui/Button";
import type { PersonaStatus, ProductPersona } from "./personas";
import styles from "./page.module.scss";

function StatusIcon({ status }: { status: PersonaStatus }) {
  if (status === "Validé") return <CheckCircle2 size={15} aria-hidden="true" />;
  if (status === "À valider") return <CircleHelp size={15} aria-hidden="true" />;
  return <Target size={15} aria-hidden="true" />;
}

async function optimizeAvatar(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxSize = 512;
  const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.84);
}

type PersonaCardProps = {
  persona: ProductPersona;
  index: number;
  onEdit: (persona: ProductPersona) => void;
  onRestore: (id: string) => void;
  onUpdate: (persona: ProductPersona) => void;
};

export function PersonaCard({ persona, index, onEdit, onRestore, onUpdate }: PersonaCardProps) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [scale, setScale] = useState(persona.avatarScale ?? 1);
  const [offsetX, setOffsetX] = useState(persona.avatarOffsetX ?? 0);
  const [offsetY, setOffsetY] = useState(persona.avatarOffsetY ?? 0);
  const [rotation, setRotation] = useState(persona.avatarRotation ?? 0);

  const statusClass =
    persona.status === "Validé"
      ? styles.statusValidated
      : persona.status === "À valider"
        ? styles.statusPending
        : styles.statusHypothesis;

  useEffect(() => {
    setScale(persona.avatarScale ?? 1);
    setOffsetX(persona.avatarOffsetX ?? 0);
    setOffsetY(persona.avatarOffsetY ?? 0);
    setRotation(persona.avatarRotation ?? 0);
  }, [persona.avatarOffsetX, persona.avatarOffsetY, persona.avatarRotation, persona.avatarScale]);

  const saveAvatar = async () => {
    const image = avatarFile ? await optimizeAvatar(avatarFile) : persona.image;
    onUpdate({
      ...persona,
      image,
      avatarScale: scale,
      avatarOffsetX: offsetX,
      avatarOffsetY: offsetY,
      avatarRotation: rotation,
    });
    setAvatarFile(null);
  };

  const removeAvatar = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
    onUpdate({
      ...persona,
      image: "/default-profile.png",
      avatarScale: 1,
      avatarOffsetX: 0,
      avatarOffsetY: 0,
      avatarRotation: 0,
    });
  };

  return (
    <article className={styles.personaCard} id={persona.id}>
      <header className={styles.cardHeader}>
        <div className={styles.personaAvatar}>
          <AvatarUpload
            value={avatarFile}
            existingUrl={persona.image}
            existingScale={persona.avatarScale}
            existingOffsetX={persona.avatarOffsetX}
            existingOffsetY={persona.avatarOffsetY}
            existingRotation={persona.avatarRotation}
            alt={`Portrait illustratif de ${persona.name}`}
            size="large"
            onChange={setAvatarFile}
            onScaleChange={setScale}
            onOffsetChange={(x, y) => {
              setOffsetX(x);
              setOffsetY(y);
            }}
            onRotationChange={setRotation}
            onSave={saveAvatar}
            onRemove={removeAvatar}
          />
        </div>

        <div className={styles.identity}>
          <span>Persona {String(index + 1).padStart(2, "0")}</span>
          <h2>{persona.name}</h2>
          <p>
            {persona.role} · {persona.segment}
          </p>
        </div>

        <span className={`${styles.status} ${statusClass}`}>
          <StatusIcon status={persona.status} /> {persona.status}
        </span>
      </header>

      <div className={styles.cardActions}>
        <Button size="sm" variant="paper" onClick={() => onEdit(persona)}>
          <Edit3 size={15} /> Modifier
        </Button>
        <Button size="sm" variant="outline" onClick={() => onRestore(persona.id)}>
          <RotateCcw size={15} /> Restaurer
        </Button>
      </div>

      <p className={styles.context}>{persona.context}</p>

      <blockquote>
        <Quote size={18} aria-hidden="true" /> {persona.quote}
      </blockquote>

      <div className={styles.quickFacts}>
        <span>
          {persona.primaryDevice === "Mobile" ? (
            <Smartphone size={15} aria-hidden="true" />
          ) : (
            <MonitorSmartphone size={15} aria-hidden="true" />
          )}{" "}
          {persona.primaryDevice}
        </span>
        <span>
          <Target size={15} aria-hidden="true" /> Niveau numérique : {persona.digitalLevel}
        </span>
      </div>

      <div className={styles.detailGrid}>
        <section>
          <h3>Objectifs</h3>
          <ul>{persona.goals.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section>
          <h3>Frustrations</h3>
          <ul>{persona.frustrations.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section>
          <h3>Fonctionnalités prioritaires</h3>
          <ul>{persona.priorityFeatures.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section>
          <h3>Critères de confiance</h3>
          <ul>{persona.trustSignals.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      </div>

      <section className={styles.firstValue}>
        <span>Première valeur attendue</span>
        <strong>{persona.firstValue}</strong>
      </section>

      <section className={styles.journey}>
        <h3>Parcours principal</h3>
        <ol>
          {persona.mainJourney.map((step, stepIndex) => (
            <li key={step}>
              <span>{stepIndex + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <footer>
        <strong>Source de validation</strong>
        <span>{persona.validationSource}</span>
      </footer>
    </article>
  );
}
