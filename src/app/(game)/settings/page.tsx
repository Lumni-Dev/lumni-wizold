import type { Metadata } from "next";
import { SettingsScreen } from "@/views/screens/settings.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Configurações",
  description: "Som, automação, notificações da taverna e conta do Wizold.",
  path: "/settings",
});

export default function SettingsPage() {
  return <SettingsScreen />;
}
