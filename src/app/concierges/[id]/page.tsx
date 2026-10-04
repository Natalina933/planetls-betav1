import PublicConciergeProfilePage from "@/features/concierge-profile/components/PublicConciergeProfilePage";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PublicConciergeProfilePage params={params} />;
}
