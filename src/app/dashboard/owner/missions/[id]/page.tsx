import MissionDetailClient from "@/app/dashboard/missions/MissionDetailClient";

export default async function OwnerMissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MissionDetailClient missionId={id} persona="owner" />;
}

