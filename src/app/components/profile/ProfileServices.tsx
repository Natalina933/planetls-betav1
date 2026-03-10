interface ProfileServicesProps {
  profileId: string;
  category: "proprietaire" | "concierge" | "artisan";
  editable?: boolean;
}

export default function ProfileServices({
  profileId,
  category,
  editable = false,
}: ProfileServicesProps) {
  return (
    <section aria-label="Services du profil">
      <h2>Services ({category})</h2>
      <p>
        Ce composant legacy a ete neutralise. Il doit etre remplace par
        `ServiceCatalogSelector` et les endpoints `api/services/*`.
      </p>
      <p>
        profileId: <code>{profileId}</code> | mode edition:{" "}
        <strong>{editable ? "actif" : "lecture"}</strong>
      </p>
    </section>
  );
}
