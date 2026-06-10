import MissionDetailClient from "@/app/dashboard/missions/MissionDetailClient";

export default async function ConciergeMissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MissionDetailClient missionId={id} persona="concierge" />;
}

