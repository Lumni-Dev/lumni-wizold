import type { Metadata } from "next";
import { TrainingScreen } from "@/views/screens/training.screen";

export const metadata: Metadata = { title: "Treinamento" };

export default function TrainingPage() {
  return <TrainingScreen />;
}
