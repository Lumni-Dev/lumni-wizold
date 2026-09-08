import type { Metadata } from "next";
import { pool } from "@/models/repositories/server/database";
import { loadHunterSummary } from "@/models/repositories/server/roster.store";
import type { Gender } from "@/models/entities/character";
import { findGender } from "@/models/entities/character";
import { pageMetadata } from "@/shared/seo/metadata";
import { RankingProfileScreen } from "@/views/screens/ranking-profile.screen";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    const client = await pool.connect();
    try {
      const hunter = await loadHunterSummary(client, id);
      if (hunter) {
        const lineage = findGender(hunter.gender as Gender).label;
        return pageMetadata({
          title: hunter.name,
          description:
            "Public sheet of " +
            hunter.name +
            ", hunter " +
            lineage +
            " NV " +
            hunter.level +
            " in Wizold: progress, equipment, companion and position on the boards.",
          path: "/ranking/" + id,
        });
      }
    } finally {
      client.release();
    }
  } catch {
  }

  return pageMetadata({
    title: "Profile",
    description: "Public sheet of a Wizold hunter.",
    path: "/ranking/" + id,
  });
}

export default async function RankingProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RankingProfileScreen hunterId={id} />;
}
