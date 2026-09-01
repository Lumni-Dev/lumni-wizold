import type { Metadata } from "next";
import { RankingScreen } from "@/views/screens/ranking.screen";
import { pageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Ranking",
  description:
    "Quadros ao vivo do Wizold: nível, caçadas, arena, atributos, mascote e posição de cada caçador.",
  path: "/ranking",
});

export default function RankingPage() {
  return <RankingScreen />;
}
