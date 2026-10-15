import PublicConciergeProfilePage from "@/features/concierge-profile/components/PublicConciergeProfilePage";
import { publicConciergeReturnPath } from "@/features/owner-concierges/lib/geography";

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const query = await searchParams;
  return <PublicConciergeProfilePage params={params} publicReturnTo={query.returnTo ? publicConciergeReturnPath(query.returnTo) : undefined} />;
}
