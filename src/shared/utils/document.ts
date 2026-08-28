export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean);
  const tail = digits.slice(9, 11);

  return parts.join(".") + (tail ? "-" + tail : "");
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const checkDigit = (upTo: number): number => {
    let sum = 0;
    for (let index = 0; index < upTo; index += 1) {
      sum += Number(digits[index]) * (upTo + 1 - index);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10]);
}

export function isFullName(value: string): boolean {
  const parts = value.trim().split(/\s+/);
  return parts.length >= 2 && parts.every((part) => part.length >= 2);
}
