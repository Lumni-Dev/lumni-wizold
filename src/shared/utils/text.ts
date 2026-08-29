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

const LINK_PATTERN =
  /(https?:\/\/|www\.)\S+|\S+\.(com|com\.br|net|org|br|io|gg|app|dev|xyz|me|co|tv|site|online|link)(\/\S*)?(\s|$)/i;

export function containsLink(value: string): boolean {
  return LINK_PATTERN.test(value);
}
