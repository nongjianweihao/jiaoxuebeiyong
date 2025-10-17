import { HEIGHT_PERCENTILES, type HeightPercentileEntry } from '../config/heightPercentiles';

type Gender = 'M' | 'F';

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function interpolate(entryA: HeightPercentileEntry, entryB: HeightPercentileEntry, age: number) {
  if (entryA.age === entryB.age) {
    return {
      p3: entryA.p3,
      p50: entryA.p50,
      p97: entryA.p97,
    };
  }
  const ratio = (age - entryA.age) / (entryB.age - entryA.age);
  return {
    p3: entryA.p3 + (entryB.p3 - entryA.p3) * ratio,
    p50: entryA.p50 + (entryB.p50 - entryA.p50) * ratio,
    p97: entryA.p97 + (entryB.p97 - entryA.p97) * ratio,
  };
}

export function calculateAgeInYears(birthIso: string, referenceIso: string): number | null {
  const birth = new Date(birthIso);
  const reference = new Date(referenceIso);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(reference.getTime())) {
    return null;
  }
  return (reference.getTime() - birth.getTime()) / MS_PER_YEAR;
}

export function getHeightStandardRange(gender: Gender) {
  const table = HEIGHT_PERCENTILES[gender];
  const first = table[0];
  const last = table[table.length - 1];
  return { minAge: first.age, maxAge: last.age };
}

export function getHeightPercentilesForAge(gender: Gender, ageYears: number) {
  const table = HEIGHT_PERCENTILES[gender];
  if (!table.length) return null;
  const clampedAge = clamp(ageYears, table[0].age, table[table.length - 1].age);
  for (let index = 0; index < table.length - 1; index += 1) {
    const current = table[index];
    const next = table[index + 1];
    if (clampedAge === current.age) {
      return { p3: current.p3, p50: current.p50, p97: current.p97 };
    }
    if (clampedAge > current.age && clampedAge < next.age) {
      return interpolate(current, next, clampedAge);
    }
  }
  const last = table[table.length - 1];
  if (clampedAge >= last.age) {
    return { p3: last.p3, p50: last.p50, p97: last.p97 };
  }
  const first = table[0];
  return { p3: first.p3, p50: first.p50, p97: first.p97 };
}

export function estimateHeightPercentile(
  gender: Gender,
  ageYears: number,
  heightCm: number,
): number | null {
  const percentiles = getHeightPercentilesForAge(gender, ageYears);
  if (!percentiles) return null;
  const { p3, p50, p97 } = percentiles;
  if (heightCm <= p3) {
    if (p3 <= 0) return 1;
    const ratio = heightCm / p3;
    return clamp(Math.round(ratio * 3), 1, 3);
  }
  if (heightCm >= p97) {
    const span = p97 - p50 || 1;
    const ratio = (heightCm - p97) / span;
    return clamp(Math.round(97 + ratio * 3), 97, 99);
  }
  if (heightCm <= p50) {
    const span = p50 - p3 || 1;
    const ratio = (heightCm - p3) / span;
    return clamp(Math.round(3 + ratio * (50 - 3)), 3, 50);
  }
  const span = p97 - p50 || 1;
  const ratio = (heightCm - p50) / span;
  return clamp(Math.round(50 + ratio * (97 - 50)), 50, 97);
}

function ageToDateIso(birthIso: string, ageYears: number) {
  const birth = new Date(birthIso);
  if (Number.isNaN(birth.getTime())) return null;
  const months = Math.round(ageYears * 12);
  const date = new Date(birth);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

export function buildHeightPercentileCurve(
  gender: Gender,
  birthIso: string,
  minAge: number,
  maxAge: number,
  step = 0.5,
) {
  if (minAge > maxAge) return [];
  const { minAge: standardMin, maxAge: standardMax } = getHeightStandardRange(gender);
  const startAge = clamp(minAge, standardMin, standardMax);
  const endAge = clamp(maxAge, standardMin, standardMax);
  const result: Array<{ date: string; p3: number; p50: number; p97: number }> = [];
  for (let age = startAge; age <= endAge + 1e-6; age += step) {
    const percentiles = getHeightPercentilesForAge(gender, age);
    const date = ageToDateIso(birthIso, age);
    if (!percentiles || !date) continue;
    result.push({ date, ...percentiles });
  }
  return result;
}
