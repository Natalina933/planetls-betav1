import Link from "next/link";
import PricingGridManager from "@/app/components/dashboard/concierge/PricingGridManager/PricingGridManager";
import OfferInfoCard from "@/app/components/dashboard/concierge/offers/OfferInfoCard";
import styles from "./page.module.scss";

interface PageProps {
  searchParams?:
    | {
        packageId?: string | string[];
        packageName?: string | string[];
      }
    | Promise<{
        packageId?: string | string[];
        packageName?: string | string[];
      }>;
}

const pickFirst = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default async function ConciergePricingPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (searchParams && "then" in searchParams
    ? await searchParams
    : searchParams) ?? {};
  const packageId = pickFirst(resolvedSearchParams.packageId);
  const packageName = pickFirst(resolvedSearchParams.packageName);

  return (
    <section className={`dashboard-grid ${styles.page}`}>
      <div className={styles.hero}>
        <span className={styles.eyebrow}>Tarification concierge</span>

        <div className={styles.heroTop}>
          <div className={styles.heroCopy}>
            <h1 className={styles.title}>Grille tarifaire</h1>
            <p className={styles.text}>
              {packageId
                ? `Création ou ajustement d'un tarif lié au pack ${packageName ?? packageId}.`
                : "Définissez ici vos prix, forfaits et durées. Les packs structurent l'offre, la grille tarifaire fixe le montant réellement appliqué."}
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/dashboard/concierge/services-packages" className={styles.link}>
              Voir mes packs
            </Link>
            <Link href="/dashboard/concierge/profile?tab=tarifs" className={styles.link}>
              Retour à ma conciergerie
            </Link>
          </div>
        </div>
      </div>

      <OfferInfoCard title={packageId ? "Contexte pack" : "Rôle de cette page"}>
        {packageId ? (
          <p className={styles.text}>
            Les tarifs créés ici peuvent être rattachés directement au pack{" "}
            <strong>{packageName ?? packageId}</strong>, puis retirés au besoin avec l&apos;action
            <strong> Délier</strong> dans le tableau.
          </p>
        ) : (
          <p className={styles.text}>
            `Services & disponibilités` définit ce que vous proposez. `Grille tarifaire`
            définit combien vous facturez selon le service, le type de bien, la surface et la
            durée. Les packs, eux, ne font qu&apos;assembler ces éléments dans une offre prête à
            vendre.
          </p>
        )}
      </OfferInfoCard>

      <div className={styles.workspace}>
        <PricingGridManager linkedPackageId={packageId} linkedPackageName={packageName} />
      </div>
    </section>
  );
}
