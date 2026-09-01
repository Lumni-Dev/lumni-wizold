import type { Metadata } from "next";
import { TrainingScreen } from "@/views/screens/training.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Treinamento",
  description: "Treine Força, Resistência, Agilidade, Instinto e Vontade na forma de lobisomem.",
  path: "/training",
});

export default function TrainingPage() {
  return <TrainingScreen />;
}
