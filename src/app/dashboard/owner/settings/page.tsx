"use client";

import EditableUnifiedProfilePage from "@/app/components/dashboard/profile/EditableUnifiedProfilePage";

export default function OwnerSettingsPage() {
  return (
    <EditableUnifiedProfilePage
      roleLabel="Propriétaire"
      identityIntro="Les informations de cette fiche sont reprises dans vos demandes envoyées aux concierges."
      verifiedCompleteText="Votre profil est suffisamment renseigné pour rassurer les concierges contactés."
      verifiedPendingText="Ajoutez au minimum votre téléphone, votre ville et une fiche complète pour afficher un profil plus fiable."
      emptyDisplayName="Profil propriétaire"
      presentationIntro="Expliquez votre fonctionnement, le type de biens concernés et le niveau d'accompagnement attendu."
    />
  );
}
