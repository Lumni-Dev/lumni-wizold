import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { GameProvider } from "@/controllers/game.context";
import { GAME_NAME } from "@/shared/constants/game";
import "./globals.css";

const sans = Geist({ variable: "--font-sans-stack", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono-stack", subsets: ["latin"] });
const logo = Orbitron({ variable: "--font-logo-stack", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: GAME_NAME,
    template: GAME_NAME + " - %s",
  },
  description: "Jogo de navegador de lobisomem: treine, cace e sobreviva a cada noite.",
  applicationName: GAME_NAME,
  keywords: ["jogo", "navegador", "lobisomem", "rpg", GAME_NAME],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={
          sans.variable + " " + mono.variable + " " + logo.variable + " font-sans antialiased"
        }
      >
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
