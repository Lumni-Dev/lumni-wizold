import type { Metadata } from "next";
import { RankingProfileScreen } from "@/views/screens/ranking-profile.screen";

export const metadata: Metadata = { title: "Perfil" };

export default async function RankingProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RankingProfileScreen hunterId={id} />;
}
