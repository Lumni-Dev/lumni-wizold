import type { Metadata } from "next";
import { SettingsScreen } from "@/views/screens/settings.screen";
import { privatePageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = privatePageMetadata({
  title: "Settings",
  description: "Sound, automation, tavern notifications and your Wizold account.",
  path: "/settings",
});

export default function SettingsPage() {
  return <SettingsScreen />;
}
