import type { Metadata } from "next";
import { LoginScreen } from "@/views/screens/login.screen";
import { pageMetadata } from "@/shared/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Entrar",
  description: "Entre com Google e comece sua crônica de lobisomem no Wizold.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginScreen />;
}
