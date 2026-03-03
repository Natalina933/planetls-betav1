"use client";

import EditableUnifiedProfilePage from "@/app/components/dashboard/profile/EditableUnifiedProfilePage";

export default function ProviderSettingsPage() {
  return (
    <EditableUnifiedProfilePage
      roleLabel="Provider partenaire"
      identityIntro="Cette fiche présente votre activité aux clients, aux owners et à vos futurs contacts."
      verifiedCompleteText="Votre fiche provider est suffisamment complète pour inspirer confiance."
      verifiedPendingText="Renseignez votre structure, votre téléphone et votre localisation pour renforcer votre crédibilité."
      emptyDisplayName="Provider"
      presentationIntro="Expliquez votre spécialité, vos types d’interventions et la manière dont vous accompagnez vos clients."
      preferCompanyName
      requireCompanyForVerified
    />
  );
}
