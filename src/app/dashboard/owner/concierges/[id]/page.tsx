import PublicConciergeProfilePage from "@/features/concierge-profile/components/PublicConciergeProfilePage";
import { ownerSearchReturnPath } from "@/features/owner-concierges/lib/geography";

export default async function OwnerConciergeProfilePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const query = await searchParams;
  return <PublicConciergeProfilePage params={params} ownerReturnTo={ownerSearchReturnPath(query.returnTo)} />;
}
