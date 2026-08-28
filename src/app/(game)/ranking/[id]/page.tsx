import type { Metadata } from "next";
import { RIVALS } from "@/models/data/rivals";
import { RankingProfileScreen } from "@/views/screens/ranking-profile.screen";

export const metadata: Metadata = { title: "Perfil" };

export function generateStaticParams() {
  return RIVALS.map((rival) => ({ id: rival.id }));
}

export default async function RankingProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RankingProfileScreen hunterId={id} />;
}
