import type {
  Benchmark,
  FitnessQuality,
  FitnessTestResult,
  FreestyleChallengeRecord,
  SessionRecord,
  Student,
  WarriorPathNode,
  WindowSec,
  JumpMode,
  SpeedRankThreshold,
} from '../types';

// —— Benchmarks in-memory cache —— //
let _benchmarksCache: Benchmark[] = [];
export function setBenchmarks(list: Benchmark[]) {
  _benchmarksCache = list ?? [];
}
function findBenchmark(q: FitnessQuality, age: number) {
  return _benchmarksCache.find((b) => b.quality === q && age >= b.ageMin && age <= b.ageMax);
}

// —— Speed Rank Evaluation —— //
let _speedThresholds: SpeedRankThreshold[] = [];
export function setSpeedThresholds(list: SpeedRankThreshold[]) {
  _speedThresholds = list ?? [];
}

export function evalSpeedRank(best30Single: number): number {
  // fallback thresholds if not loaded
  const fallback = [60, 70, 80, 100, 110, 120, 150, 160, 170];
  const thresholds = _speedThresholds
    .filter((t) => t.windowSec === 30 && t.mode === 'single')
    .sort((a, b) => a.rank - b.rank);
  if (!thresholds.length) {
    let rank = 0;
    fallback.forEach((min, idx) => {
      if (best30Single >= min) rank = idx + 1;
    });
    return rank;
  }
  let achieved = 0;
  thresholds.forEach((row) => {
    if (best30Single >= row.minReps) achieved = Math.max(achieved, row.rank);
  });
  return achieved; // 0..9
}

export function maybeUpgradeRank(student: Student, best30Single: number) {
  const newRank = evalSpeedRank(best30Single);
  if (newRank > (student.currentRank || 0)) {
    student.currentRank = newRank;
  }
  return student.currentRank || 0;
}

export function buildSpeedRankTrajectory(
  sessions: SessionRecord[],
  studentId: string,
  options?: { mode?: JumpMode; window?: WindowSec },
): Array<{ date: string; score: number }> {
  if (!studentId) return [];
  const mode = options?.mode ?? 'single';
  const window = options?.window ?? 30;

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let best = 0;
  const trajectory: Array<{ date: string; score: number }> = [];

  sorted.forEach((session) => {
    const records = session.speed.filter(
      (record) =>
        record.studentId === studentId &&
        record.mode === mode &&
        record.window === window,
    );
    if (!records.length) return;

    const sessionBest = records.reduce((max, record) => Math.max(max, record.reps), 0);
    best = Math.max(best, sessionBest);
    const rank = evalSpeedRank(best);
    trajectory.push({ date: session.date, score: rank });
  });

  return trajectory;
}

// —— Freestyle pass points (simplified) —— //
export function freestylePassPoints(moveName: string, rank: number): number {
  if (!moveName) return 0;
  const base = 1;
  const bonus = Math.max(0, rank - 1) * 0.5; // scalable reward
  return base + bonus;
}

// —— Normalize by benchmark to 0..100 around percentiles —— //
export function normalizeByBenchmark(
  value: number,
  quality: FitnessQuality,
  age: number,
  unit: 'count' | 'cm' | 's' | 'grade' = 'count',
): { score: number; ref?: Benchmark } {
  const b = findBenchmark(quality, age);
  if (!b) return { score: Math.max(0, Math.min(100, value)), ref: undefined };
  let score = 0;
  if (value <= b.p25) {
    score = (value / b.p25) * 60;
  } else if (value <= b.p50) {
    score = 60 + 15 * ((value - b.p25) / (b.p50 - b.p25));
  } else if (value <= b.p75) {
    score = 75 + 15 * ((value - b.p50) / (b.p75 - b.p50));
  } else {
    score = 90 + 10 * ((value - b.p75) / Math.max(1, b.p75));
  }
  return { score: Math.max(0, Math.min(100, score)), ref: b };
}

interface NormalizeOptions {
  benchmarks: Benchmark[];
  student?: Student;
}

export function normalizeScore(
  value: number,
  quality: FitnessQuality,
  { benchmarks, student }: NormalizeOptions,
): number {
  if (!Number.isFinite(value)) return 0;
  const age = student?.birth
    ? Math.max(4, Math.floor((Date.now() - new Date(student.birth).getTime()) / (365 * 24 * 3600 * 1000)))
    : undefined;
  const group = benchmarks.find((item) => {
    if (item.quality !== quality) return false;
    if (age && (age < item.ageMin || age > item.ageMax)) return false;
    if (student?.gender && item.gender && student.gender !== item.gender) return false;
    return true;
  });
  const min = group?.min ?? 0;
  const max = group?.max ?? 100;
  if (max === min) return 0;
  return Math.max(0, Math.min(100, Math.round(((value - min) / (max - min)) * 100)));
}

export function buildSpeedSeries(
  sessions: SessionRecord[],
  mode: JumpMode,
  window: WindowSec,
  studentId?: string,
): Array<{ date: string; score: number }> {
  return sessions
    .flatMap((session) =>
      session.speed
        .filter((record) =>
          record.mode === mode &&
          record.window === window &&
          (!studentId || record.studentId === studentId),
        )
        .map((record) => ({ date: session.date, score: record.reps })),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function buildFreestyleProgress(
  sessions: SessionRecord[],
  nodes: WarriorPathNode[],
  studentId?: string,
  rankMoveLookup?: Record<string, { rank: number; name: string }>,
): Array<{ date: string; score: number }> {
  let cumulative = 0;
  const progress: Array<{ date: string; score: number }> = [];
  const nodesByMove = new Map<string, WarriorPathNode[]>();
  nodes.forEach((node) => {
    node.moveIds?.forEach((moveId) => {
      const list = nodesByMove.get(moveId) ?? [];
      list.push(node);
      nodesByMove.set(moveId, list);
    });
  });

  sessions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((session) => {
      const awarded = new Set<string>();
      const points = session.freestyle.reduce((sum, record) => {
        if (!record.passed) return sum;
        if (studentId && record.studentId !== studentId) return sum;
        const relatedNodes = nodesByMove.get(record.moveId) ?? [];
        let subtotal = 0;
        relatedNodes.forEach((node) => {
          if (awarded.has(node.id)) return;
          awarded.add(node.id);
          subtotal += node.points;
        });
        if (subtotal === 0 && rankMoveLookup) {
          const meta = rankMoveLookup[record.moveId];
          if (meta) subtotal += freestylePassPoints(meta.name, meta.rank);
        }
        return sum + subtotal;
      }, 0);
      cumulative += points;
      progress.push({ date: session.date, score: cumulative });
    });
  return progress;
}

export function buildRankTrajectory(
  sessions: SessionRecord[],
  studentId: string,
  rankMoveLookup: Record<string, { rank: number }>,
): Array<{ date: string; score: number }> {
  if (!studentId) return [];

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  let currentRank = 0;
  const trajectory: Array<{ date: string; score: number }> = [];

  sortedSessions.forEach((session) => {
    let highestThisSession = 0;
    let hasRecord = false;
    session.freestyle.forEach((record) => {
      if (record.studentId !== studentId) return;
      if (!record.passed) return;
      hasRecord = true;
      const meta = rankMoveLookup[record.moveId];
      if (!meta?.rank) return;
      highestThisSession = Math.max(highestThisSession, meta.rank);
    });

    if (highestThisSession > 0) {
      currentRank = Math.max(currentRank, highestThisSession);
    }

    if (hasRecord || currentRank > 0) {
      trajectory.push({ date: session.date, score: currentRank });
    }
  });

  return trajectory;
}

export function mergeFreestyleRecords(
  current: FreestyleChallengeRecord[],
  incoming: FreestyleChallengeRecord[],
): FreestyleChallengeRecord[] {
  const map = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((record) => {
    map.set(record.id, record);
  });
  return Array.from(map.values());
}

export function latestRadar(results: FitnessTestResult[]) {
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.radar;
}
