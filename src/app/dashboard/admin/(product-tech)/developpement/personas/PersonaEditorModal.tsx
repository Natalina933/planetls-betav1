"use client";

import { useEffect, useRef, useState } from "react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { focusFirstModalElement, trapFocusInModal } from "@/app/dashboard/owner/modalAccessibility";
import type { PersonaStatus, ProductPersona } from "./personas";
import styles from "./page.module.scss";

type ListField = "goals" | "frustrations" | "priorityFeatures" | "mainJourney" | "trustSignals";
type PersonaDraft = Omit<ProductPersona, ListField> & Record<ListField, string>;

function toDraft(persona: ProductPersona): PersonaDraft {
  return {
    ...persona,
    goals: persona.goals.join("\n"),
    frustrations: persona.frustrations.join("\n"),
    priorityFeatures: persona.priorityFeatures.join("\n"),
    mainJourney: persona.mainJourney.join("\n"),
    trustSignals: persona.trustSignals.join("\n"),
  };
}

function fromDraft(draft: PersonaDraft): ProductPersona {
  const split = (value: string) =>
    value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    ...draft,
    goals: split(draft.goals),
    frustrations: split(draft.frustrations),
    priorityFeatures: split(draft.priorityFeatures),
    mainJourney: split(draft.mainJourney),
    trustSignals: split(draft.trustSignals),
  };
}

type PersonaEditorModalProps = {
  persona: ProductPersona;
  onClose: () => void;
  onSave: (persona: ProductPersona) => void;
};

export function PersonaEditorModal({ persona, onClose, onSave }: PersonaEditorModalProps) {
  const [draft, setDraft] = useState(() => toDraft(persona));
  const modalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusFirstModalElement(modalRef.current);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      trapFocusInModal(event, modalRef.current);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const update = <K extends keyof PersonaDraft>(field: K, value: PersonaDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const save = () => onSave(fromDraft(draft));

  return (
    <div
      className={styles.modalOverlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={modalRef}
        className={styles.editorModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-editor-title"
        tabIndex={-1}
      >
        <header>
          <div>
            <span>Édition du persona</span>
            <h2 id="persona-editor-title">{draft.name}</h2>
          </div>
          <Button
            variant="ghost"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer l’éditeur"
          >
            <X size={20} />
          </Button>
        </header>

        <div className={styles.formGrid}>
          <Input label="Nom fictif" value={draft.name} onChange={(event) => update("name", event.target.value)} />
          <Input label="Rôle" value={draft.role} onChange={(event) => update("role", event.target.value)} />
          <Input label="Segment" value={draft.segment} onChange={(event) => update("segment", event.target.value)} />
          <Input label="Photo dans public" value={draft.image} onChange={(event) => update("image", event.target.value)} />

          <Select label="Statut" value={draft.status} onChange={(event) => update("status", event.target.value as PersonaStatus)}>
            <option>Hypothèse</option>
            <option>À valider</option>
            <option>Validé</option>
          </Select>

          <Select
            label="Niveau numérique"
            value={draft.digitalLevel}
            onChange={(event) => update("digitalLevel", event.target.value as PersonaDraft["digitalLevel"])}
          >
            <option>Débutant</option>
            <option>Intermédiaire</option>
            <option>Avancé</option>
          </Select>

          <Select
            label="Appareil principal"
            value={draft.primaryDevice}
            onChange={(event) => update("primaryDevice", event.target.value as PersonaDraft["primaryDevice"])}
          >
            <option>Mobile</option>
            <option>Ordinateur</option>
            <option>Mobile et ordinateur</option>
          </Select>

          <div className={styles.spanTwo}>
            <Textarea label="Contexte" value={draft.context} onChange={(event) => update("context", event.target.value)} />
          </div>
          <div className={styles.spanTwo}>
            <Textarea label="Citation" value={draft.quote} onChange={(event) => update("quote", event.target.value)} />
          </div>
          <div className={styles.spanTwo}>
            <Textarea
              label="Première valeur attendue"
              value={draft.firstValue}
              onChange={(event) => update("firstValue", event.target.value)}
            />
          </div>

          <Textarea label="Objectifs — un par ligne" value={draft.goals} onChange={(event) => update("goals", event.target.value)} />
          <Textarea label="Frustrations — une par ligne" value={draft.frustrations} onChange={(event) => update("frustrations", event.target.value)} />
          <Textarea
            label="Fonctionnalités — une par ligne"
            value={draft.priorityFeatures}
            onChange={(event) => update("priorityFeatures", event.target.value)}
          />
          <Textarea
            label="Critères de confiance — un par ligne"
            value={draft.trustSignals}
            onChange={(event) => update("trustSignals", event.target.value)}
          />

          <div className={styles.spanTwo}>
            <Textarea label="Parcours — une étape par ligne" value={draft.mainJourney} onChange={(event) => update("mainJourney", event.target.value)} />
          </div>
          <div className={styles.spanTwo}>
            <Textarea
              label="Source de validation"
              value={draft.validationSource}
              onChange={(event) => update("validationSource", event.target.value)}
            />
          </div>
        </div>

        <footer>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button className={styles.saveButton} onClick={save} disabled={!draft.name.trim() || !draft.role.trim()}>
            <Save size={16} /> Enregistrer
          </Button>
        </footer>
      </section>
    </div>
  );
}
