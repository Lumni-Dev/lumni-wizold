import type { Metadata } from "next";
import { LoginScreen } from "@/views/screens/login.screen";
import { pageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Entrar",
  description: "Enter with Google and begin your werewolf chronicle in Wizold.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginScreen />;
}
