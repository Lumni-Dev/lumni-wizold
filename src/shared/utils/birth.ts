export interface BirthDate {
  day: string;
  month: string;
  year: string;
}

export const EMPTY_BIRTH: BirthDate = { day: "", month: "", year: "" };

function parsed(birth: BirthDate): Date | null {
  const day = Number(birth.day);
  const month = Number(birth.month);
  const year = Number(birth.year);
  if (!day || !month || !year || birth.year.length !== 4) return null;

  const date = new Date(year, month - 1, day);
  const real =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return real ? date : null;
}

export function isRealBirth(birth: BirthDate): boolean {
  return parsed(birth) !== null;
}

export function ageOf(birth: BirthDate, today = new Date()): number | null {
  const date = parsed(birth);
  if (!date) return null;

  let age = today.getFullYear() - date.getFullYear();
  const monthGap = today.getMonth() - date.getMonth();
  if (monthGap < 0 || (monthGap === 0 && today.getDate() < date.getDate())) age -= 1;

  return age;
}
