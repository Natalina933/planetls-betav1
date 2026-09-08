"use client";

import { Suspense } from "react";
import EditableUnifiedProfilePage from "@/app/components/dashboard/profile/EditableUnifiedProfilePage";
import { ProviderDocumentsPanel } from "./ProviderDocumentsPanel";

function ProviderSettingsContent() {
  return (
    <>
      <EditableUnifiedProfilePage
        roleLabel="Artisan partenaire"
        identityIntro="Cette fiche présente votre activité aux clients, aux propriétaires et à vos futurs contacts. Plus elle est complète, plus vous inspirerez confiance."
        verifiedCompleteText="Votre fiche artisan est complète et vérifiée. Vous apparaissez désormais dans les recherches et pouvez recevoir des missions."
        verifiedPendingText="Complétez votre profil (métiers, zone d'intervention, disponibilités) pour être visible par les clients."
        emptyDisplayName="Artisan"
        presentationIntro="Décrivez vos spécialités, vos années d'expérience, vos certifications et la manière dont vous réalisez vos interventions."
        preferCompanyName
        requireCompanyForVerified
        showProfessionalDetails
      />
      <ProviderDocumentsPanel />
    </>
  );
}

export default function ProviderSettingsPage() {
  return (
    <Suspense fallback={<section className="dashboard-grid"><p>Chargement du profil...</p></section>}>
      <ProviderSettingsContent />
    </Suspense>
  );
}
