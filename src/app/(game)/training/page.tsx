import type { Metadata } from "next";
import { TrainingScreen } from "@/views/screens/training.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Training",
  description: "Train Strength, Endurance, Agility, Instinct and Willpower in werewolf form.",
  path: "/training",
});

export default function TrainingPage() {
  return <TrainingScreen />;
}
