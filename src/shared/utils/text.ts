export function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}

export function sanitizeName(value: string, maximum: number): string {
  return capitalize(value.replace(/[^\p{L}\p{M}\p{N}]/gu, "").slice(0, maximum));
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
