"use client";
import { useEffect } from "react";

export function Shield() {
  useEffect(() => {
    const refuse = (event: Event) => event.preventDefault();
    document.addEventListener("contextmenu", refuse);
    document.addEventListener("dragstart", refuse);
    return () => {
      document.removeEventListener("contextmenu", refuse);
      document.removeEventListener("dragstart", refuse);
    };
  }, []);
  return null;
}
