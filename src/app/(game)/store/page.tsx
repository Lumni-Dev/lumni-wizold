import type { Metadata } from "next";
import { StoreScreen } from "@/views/screens/store.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Wizold Store",
  description: "Pacotes de WCoins por dinheiro real para acelerar treino e equipamento.",
  path: "/store",
});

export default function StorePage() {
  return <StoreScreen />;
}
