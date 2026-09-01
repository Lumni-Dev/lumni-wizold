import type { Metadata } from "next";
import { ForgeScreen } from "@/views/screens/forge.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Forja",
  description: "Mine fragmentos e forje peças do alforje para subir atributos.",
  path: "/forge",
});

export default function ForgePage() {
  return <ForgeScreen />;
}
