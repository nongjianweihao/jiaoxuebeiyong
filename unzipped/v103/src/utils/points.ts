import type { PointEvent, PointEventType, PointsRule } from '../types';

const defaultRules: Record<PointEventType, number> = {
  attendance: 2,
  pr: 5,
  freestyle_pass: 3,
  excellent: 2,
  challenge: 5,
};

let rulesCache: Record<PointEventType, number> = { ...defaultRules };

export const SESSION_POINT_CAP = 10;

export function setPointRules(rules: PointsRule[] | undefined) {
  if (!rules?.length) {
    rulesCache = { ...defaultRules };
    return;
  }
  const next: Record<PointEventType, number> = { ...defaultRules };
  rules.forEach((rule) => {
    next[rule.type] = rule.points;
  });
  rulesCache = next;
}

export function getPointValue(type: PointEventType): number {
  return rulesCache[type] ?? defaultRules[type] ?? 0;
}

export function buildPointsSnapshot(events: PointEvent[]) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const breakdown: Record<PointEventType, number> = {
    attendance: 0,
    pr: 0,
    freestyle_pass: 0,
    excellent: 0,
    challenge: 0,
  };
  let total = 0;
  const series = sorted.map((event) => {
    const value = Number(event.points ?? 0);
    breakdown[event.type] += value;
    total += value;
    return {
      date: event.date,
      delta: value,
      total,
    };
  });
  return { total, series, breakdown };
}
