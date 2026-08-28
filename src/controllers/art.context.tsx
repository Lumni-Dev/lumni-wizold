"use client";

import { createContext, useContext, type ReactNode } from "react";
import { EMPTY_ART, type ArtManifest } from "@/models/entities/art";

const ArtContext = createContext<ArtManifest>(EMPTY_ART);

export function ArtProvider({
  manifest,
  children,
}: {
  manifest: ArtManifest;
  children: ReactNode;
}) {
  return <ArtContext.Provider value={manifest}>{children}</ArtContext.Provider>;
}

export function useArt(): ArtManifest {
  return useContext(ArtContext);
}
