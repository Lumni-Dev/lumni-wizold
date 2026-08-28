import type { Metadata } from "next";
import { RankingScreen } from "@/views/screens/ranking.screen";

export const metadata: Metadata = { title: "Ranking" };

export default function RankingPage() {
  return <RankingScreen />;
}
