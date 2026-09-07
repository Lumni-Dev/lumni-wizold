import type { Metadata } from "next";
import { RankingScreen } from "@/views/screens/ranking.screen";
import { pageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Ranking",
  description:
    "Live boards of Wizold: level, hunts, arena, attributes, companion and each hunter's position.",
  path: "/ranking",
});

export default function RankingPage() {
  return <RankingScreen />;
}
