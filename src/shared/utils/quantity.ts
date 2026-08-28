export function isValidQuantity(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}
