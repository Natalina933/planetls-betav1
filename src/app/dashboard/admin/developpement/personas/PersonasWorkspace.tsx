"use client";

import { useCallback, useState } from "react";
import { RotateCcw, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DevelopmentSectionNav } from "@/components/development/DevelopmentSectionNav";
import { PersonaCard } from "./PersonaCard";
import { PersonaEditorModal } from "./PersonaEditorModal";
import { usePersonasStorage } from "./usePersonasStorage";
import type { ProductPersona } from "./personas";
import styles from "./page.module.scss";

export function PersonasWorkspace({ initialPersonas }: { initialPersonas: ProductPersona[] }) {
  const { personas, storageReady, savePersona, restorePersona, restoreAll } = usePersonasStorage(initialPersonas);
  const [editedPersona, setEditedPersona] = useState<ProductPersona | null>(null);
  const closeEditor = useCallback(() => setEditedPersona(null), []);
  const saveAndClose = useCallback((persona: ProductPersona) => { savePersona(persona); setEditedPersona(null); }, [savePersona]);
  const validatedCount = personas.filter((persona) => persona.status === "Validé").length;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.topline}><span className={styles.eyebrow}><UsersRound size={17} aria-hidden="true" /> Référentiel produit</span><DevelopmentSectionNav active="personas" /></div>
        <div className={styles.heroContent}>
          <div><h1>Personas PlanetLS</h1><p>Les profils de référence qui guident les parcours, les priorités produit et les décisions d’expérience utilisateur.</p></div>
          <div className={styles.summary}><article><strong>{personas.length}</strong><span>personas documentés</span></article><article><strong>{validatedCount}</strong><span>validés par l’usage</span></article><article><strong>{personas.length - validatedCount}</strong><span>à confronter au terrain</span></article></div>
        </div>
        <aside className={styles.governance}>
          <ShieldCheck size={20} aria-hidden="true" />
          <p><strong>Édition locale.</strong> Tes précisions sont sauvegardées dans ce navigateur. Les valeurs initiales du projet restent restaurables à tout moment.</p>
          <Button size="sm" variant="outline" onClick={restoreAll} disabled={!storageReady}><RotateCcw size={15} /> Tout restaurer</Button>
        </aside>
      </header>

      <section className={styles.personaGrid} aria-label="Personas produit PlanetLS">
        {personas.map((persona, index) => <PersonaCard key={persona.id} persona={persona} index={index} onEdit={setEditedPersona} onRestore={restorePersona} onUpdate={savePersona} />)}
      </section>

      {editedPersona ? <PersonaEditorModal key={editedPersona.id} persona={editedPersona} onClose={closeEditor} onSave={saveAndClose} /> : null}
    </main>
  );
}