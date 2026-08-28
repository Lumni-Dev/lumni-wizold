import type { Metadata } from "next";
import { ForgeScreen } from "@/views/screens/forge.screen";

export const metadata: Metadata = { title: "Forja" };

export default function ForgePage() {
  return <ForgeScreen />;
}
