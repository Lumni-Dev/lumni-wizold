import type { Metadata } from "next";
import { GameProvider } from "@/controllers/game.context";
import { rootMetadata } from "@/shared/seo/metadata";
import { Shield } from "@/views/layout/shield";
import { UpdateGate } from "@/views/components/update-gate";
import { Geist_Mono, Inter, Orbitron } from "next/font/google";
import "./globals.css";

const sans = Inter({ variable: "--font-sans-stack", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono-stack", subsets: ["latin"] });
const logo = Orbitron({ variable: "--font-logo-stack", subsets: ["latin"] });

export const metadata: Metadata = rootMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={
          sans.variable + " " + mono.variable + " " + logo.variable + " font-sans antialiased"
        }
      >
        <Shield />
        <GameProvider>
          <UpdateGate />
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
