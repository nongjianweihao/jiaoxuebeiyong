import {
  ASSESSMENT_METRICS,
  ASSESSMENT_STANDARDS,
  BMI_STANDARDS,
  GROWTH_STAGES,
  HEIGHT_STANDARDS,
  LEVEL_TITLES,
  ROPE_SPEED_STANDARD,
  type AssessmentMetricDefinition,
  type GenderKey,
} from '../config/assessment';
import { BRANDING } from '../config/branding';
import type {
  FitnessQuality,
  FitnessTestResult,
  RankMove,
  SessionRecord,
  Student,
} from '../types';

export interface AssessmentInputs {
  height?: number;
  weight?: number;
  run50m?: number;
  sitAndReach?: number;
  longJump?: number;
  sitUps?: number;
  pullUps?: number;
  pushUps?: number;
  vitalCapacity?: number;
  ropeEndurance?: number;
  ropeSkipSpeed?: number;
}



const ASSESSMENT_INPUT_KEYS: Array<keyof AssessmentInputs> = [
  'height',
  'weight',
  'run50m',
  'sitAndReach',
  'longJump',
  'sitUps',
  'pullUps',
  'pushUps',
  'vitalCapacity',
  'ropeEndurance',
  'ropeSkipSpeed',
];



export interface MetricScore {
  id: keyof AssessmentInputs | 'bmi';
  label: string;
  unit?: string;
  value: number | null;
  score: number;
  rating: string;
  description?: string;
}

export interface FreestyleProgressRow {
  rank: number;
  mastered: number;
  total: number;
}

export interface WarriorAssessmentReport {
  student: Student | null;
  date: string;
  age?: number;
  gender: GenderKey;
  inputs: AssessmentInputs;
  metrics: Record<string, MetricScore>;
  bodyScores: { height?: MetricScore; bmi?: MetricScore };
  scores: Record<string, MetricScore>;
  totalScore: number;
  level: { title: string; index: number };
  highestDan: number;
  growthStageIndex: number;
  honorTitle: string;
  radar: Record<FitnessQuality, number>;
  categories: Array<{ title: string; items: Record<string, MetricScore> }>;
  sortedScores: Array<[string, MetricScore]>;
  freestyle: FreestyleProgressRow[];
  progressBars: Array<{ title: string; percentage: number }>;
  coachComment?: string;
  advice: string;
}

const SCORE_WEIGHTS: Record<string, number> = {
  速度灵敏: 0.1,
  柔韧素质: 0.1,
  爆发力量: 0.1,
  力量耐力: 0.15,
  上肢力量: 0.1,
  肺活量: 0.1,
  跳绳耐力: 0.2,
  跳绳速度: 0.15,
};

function resolveGender(student?: Student | null): GenderKey {
  if (student?.gender === 'F') return 'female';
  return 'male';
}

function daysBetween(a: Date, b: Date) {
  const diff = a.getTime() - b.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function calcAge(student?: Student | null, reference?: string) {
  if (!student?.birth) return undefined;
  const birth = new Date(student.birth);
  const ref = reference ? new Date(reference) : new Date();
  return Math.max(4, Math.floor(daysBetween(ref, birth) / 365));
}

function interpolate(value: number, table: Array<[number, number]>, higherIsBetter: boolean) {
  if (!Number.isFinite(value)) return 0;
  const sorted = [...table].sort((a, b) => (higherIsBetter ? a[0] - b[0] : b[0] - a[0]));
  if (higherIsBetter) {
    if (value <= sorted[0][0]) return Math.max(0, sorted[0][1] ?? 0);
    if (value >= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1] ?? 100;
  } else {
    if (value >= sorted[0][0]) return Math.max(0, sorted[0][1] ?? 0);
    if (value <= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1] ?? 100;
  }
  for (let i = 1; i < sorted.length; i += 1) {
    const [x0, y0] = sorted[i - 1];
    const [x1, y1] = sorted[i];
    if (higherIsBetter) {
      if (value >= x0 && value <= x1) {
        const ratio = (value - x0) / (x1 - x0 || 1);
        return y0 + ratio * (y1 - y0);
      }
    } else if (value <= x0 && value >= x1) {
      const ratio = (value - x0) / (x1 - x0 || 1);
      return y0 + ratio * (y1 - y0);
    }
  }
  return 0;
}

function ratingFromScore(score: number | null) {
  if (!score && score !== 0) return '未测试';
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 60) return '及格';
  if (score > 0) return '待提高';
  return '未测试';
}

function calcBodyMetrics(inputs: AssessmentInputs, gender: GenderKey, age?: number) {
  const height = inputs.height ?? null;
  const weight = inputs.weight ?? null;
  const bmi = height && weight ? Number((weight / ((height / 100) ** 2)).toFixed(1)) : null;

  const heightStd = age ? HEIGHT_STANDARDS[gender]?.[age] : undefined;
  let heightDesc = '正常';
  let heightScore = 85;
  if (height && heightStd) {
    if (height < heightStd * 0.95) {
      heightDesc = '偏矮';
      heightScore = 65;
    } else if (height > heightStd * 1.05) {
      heightDesc = '偏高';
      heightScore = 95;
    } else {
      heightScore = 85;
    }
  }

  let bmiDesc = '正常';
  let bmiScore = 85;
  if (bmi && age) {
    const band = BMI_STANDARDS[gender]?.[age];
    if (band) {
      if (bmi < band[0]) {
        bmiDesc = '偏瘦';
        bmiScore = 65;
      } else if (bmi >= band[1] && bmi < band[2]) {
        bmiDesc = '超重';
        bmiScore = 65;
      } else if (bmi >= band[2]) {
        bmiDesc = '肥胖';
        bmiScore = 40;
      } else {
        bmiScore = 85;
      }
    }
  }

  const heightMetric: MetricScore | undefined = height !== null
    ? {
        id: 'height',
        label: '身高',
        unit: 'cm',
        value: height,
        score: heightScore,
        rating: ratingFromScore(heightScore),
        description: heightDesc,
      }
    : undefined;

  const bmiMetric: MetricScore | undefined = bmi !== null
    ? {
        id: 'bmi',
        label: 'BMI',
        unit: '',
        value: bmi,
        score: bmiScore,
        rating: ratingFromScore(bmiScore),
        description: bmiDesc,
      }
    : undefined;

  return { heightMetric, bmiMetric };
}

function computeMetricScore(
  id: keyof AssessmentInputs,
  definition: AssessmentMetricDefinition,
  gender: GenderKey,
  value: number | undefined,
): MetricScore {
  const raw = value ?? null;
  let score = 0;
  if (raw !== null) {
    if (id === 'ropeSkipSpeed') {
      score = interpolate(raw, ROPE_SPEED_STANDARD, true);
    } else {
      const standard = ASSESSMENT_STANDARDS[id];
      if (standard) {
        const table = standard[gender];
        score = interpolate(raw, table, standard.higherIsBetter);
      }
    }
  }
  score = Math.round(Math.min(100, Math.max(0, score)));
  return {
    id,
    label: definition.label,
    unit: definition.unit,
    value: raw,
    score,
    rating: ratingFromScore(raw === null ? null : score),
  };
}

function determineStrengthValue(inputs: AssessmentInputs, gender: GenderKey, age?: number) {
  if (gender === 'male' && (age ?? 0) >= 13 && inputs.pullUps) {
    return { id: 'pullUps' as const, value: inputs.pullUps };
  }
  if (inputs.sitUps) {
    return { id: 'sitUps' as const, value: inputs.sitUps };
  }
  if (inputs.pullUps) {
    return { id: 'pullUps' as const, value: inputs.pullUps };
  }
  return { id: 'sitUps' as const, value: undefined };
}

function buildScores(inputs: AssessmentInputs, gender: GenderKey, age?: number) {
  const definitions = Object.fromEntries(ASSESSMENT_METRICS.map((item) => [item.id, item])) as Record<
    keyof AssessmentInputs,
    AssessmentMetricDefinition
  >;
  const result: Record<string, MetricScore> = {};

  const strength = determineStrengthValue(inputs, gender, age);
  const mapping: Array<[string, keyof AssessmentInputs]> = [
    ['速度灵敏', 'run50m'],
    ['柔韧素质', 'sitAndReach'],
    ['爆发力量', 'longJump'],
    ['力量耐力', strength.id],
    ['上肢力量', 'pushUps'],
    ['肺活量', 'vitalCapacity'],
    ['跳绳耐力', 'ropeEndurance'],
    ['跳绳速度', 'ropeSkipSpeed'],
  ];

  mapping.forEach(([key, metricId]) => {
    const def = definitions[metricId];
    const score = computeMetricScore(metricId, def, gender, inputs[metricId]);
    result[key] = score;
  });

  return { result, strengthMetric: strength.id };
}

function aggregateRadar(scores: Record<string, MetricScore>): Record<FitnessQuality, number> {
  const radar: Partial<Record<FitnessQuality, number>> = {};

  const average = (...keys: string[]) => {
    const values = keys
      .map((key) => scores[key]?.score ?? null)
      .filter((value): value is number => Number.isFinite(value));
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  };

  radar.speed = average('速度灵敏', '跳绳速度');
  radar.flexibility = average('柔韧素质');
  radar.power = average('爆发力量', '上肢力量');
  radar.core = average('力量耐力');
  radar.endurance = average('跳绳耐力', '肺活量');
  radar.coordination = average('速度灵敏');
  radar.agility = average('速度灵敏');

  return radar as Record<FitnessQuality, number>;
}

function calcTotalScore(scores: Record<string, MetricScore>) {
  let total = 0;
  let weightSum = 0;
  Object.entries(SCORE_WEIGHTS).forEach(([key, weight]) => {
    const score = scores[key]?.score ?? 0;
    if (score > 0) {
      total += score * weight;
      weightSum += weight;
    }
  });
  if (weightSum === 0) return 0;
  return Number((total / weightSum).toFixed(1));
}

function resolveLevel(totalScore: number) {
  let current = LEVEL_TITLES[0];
  LEVEL_TITLES.forEach((level) => {
    if (totalScore >= level.threshold) {
      current = level;
    }
  });
  return current;
}

function computeFreestyleProgress(
  sessions: SessionRecord[],
  rankMoves: RankMove[],
  studentId: string,
): { rows: FreestyleProgressRow[]; highestDan: number } {
  const moveById = new Map(rankMoves.map((move) => [move.id, move]));
  const masteredByRank = new Map<number, Set<string>>();
  const totalByRank = new Map<number, number>();
  rankMoves.forEach((move) => {
    totalByRank.set(move.rank, (totalByRank.get(move.rank) ?? 0) + 1);
  });

  sessions.forEach((session) => {
    session.freestyle
      .filter((record) => record.studentId === studentId && record.passed)
      .forEach((record) => {
        const meta = moveById.get(record.moveId);
        if (!meta) return;
        const set = masteredByRank.get(meta.rank) ?? new Set<string>();
        set.add(record.moveId);
        masteredByRank.set(meta.rank, set);
      });
  });

  const rows: FreestyleProgressRow[] = [];
  let highestDan = 0;
  totalByRank.forEach((total, rank) => {
    const mastered = masteredByRank.get(rank)?.size ?? 0;
    rows.push({ rank, mastered, total });
    if (mastered >= total && total > 0) {
      highestDan = Math.max(highestDan, rank);
    }
  });

  rows.sort((a, b) => a.rank - b.rank);

  return { rows, highestDan };
}

function growthStageFromDan(highestDan: number) {
  if (highestDan >= 8) return 3;
  if (highestDan >= 4) return 2;
  if (highestDan >= 2) return 1;
  return 0;
}

function buildProgressBars(scores: Record<string, MetricScore>) {
  const groups: Array<{ title: string; keys: string[] }> = [
    { title: '速度与反应', keys: ['速度灵敏', '跳绳速度'] },
    { title: '力量与核心', keys: ['力量耐力', '上肢力量'] },
    { title: '体能耐力', keys: ['跳绳耐力', '肺活量'] },
    { title: '柔韧与协调', keys: ['柔韧素质'] },
  ];
  return groups.map(({ title, keys }) => {
    const values = keys
      .map((key) => scores[key]?.score ?? null)
      .filter((score): score is number => Number.isFinite(score));
    const percentage = values.length
      ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
      : 0;
    return { title, percentage };
  });
}

function summarizeCategories(
  scores: Record<string, MetricScore>,
  bodyScores: { height?: MetricScore; bmi?: MetricScore },
): Array<{ title: string; items: Record<string, MetricScore> }> {
  return [
    {
      title: '身体形态',
      items: {
        身高: bodyScores.height ?? {
          id: 'height',
          label: '身高',
          value: null,
          score: 0,
          rating: '未测试',
        },
        BMI: bodyScores.bmi ?? {
          id: 'bmi',
          label: 'BMI',
          value: null,
          score: 0,
          rating: '未测试',
        },
        肺活量: scores['肺活量'],
      },
    },
    {
      title: '力量与核心',
      items: {
        力量耐力: scores['力量耐力'],
        上肢力量: scores['上肢力量'],
      },
    },
    {
      title: '速度与爆发力',
      items: {
        速度灵敏: scores['速度灵敏'],
        爆发力量: scores['爆发力量'],
      },
    },
    {
      title: '跳绳专项',
      items: {
        跳绳耐力: scores['跳绳耐力'],
        跳绳速度: scores['跳绳速度'],
      },
    },
  ];
}

function buildAdvice(report: WarriorAssessmentReport) {
  const name = report.student?.name ?? '勇士';
  const sorted = report.sortedScores;
  const strongest = sorted[sorted.length - 1];
  const weakest = sorted[0];
  const base = `亲爱的 ${name}，你矫健的身影是训练场上最美的风景！每一次跳跃，都记录着你的汗水与成长。`;
  const strengthText = strongest
    ? `本次测评，你的「${strongest[0]}」表现超棒（${strongest[1].rating} - ${strongest[1].score}分）！`
    : '';
  const weakText = weakest && weakest[1].score < 80
    ? `我们发现「${weakest[0]}」是下一个待解锁的超能力，建议加强针对性训练。`
    : '你已没有明显短板，继续保持，未来可期！';
  const coachComment = report.coachComment
    ? `教练寄语：“${report.coachComment}”`
    : '';
  return [base, strengthText, weakText, coachComment].filter(Boolean).join(' ');
}

export function calculateWarriorAssessmentReport({
  student,
  result,
  sessions,
  rankMoves,
}: {
  student: Student | null;
  result: FitnessTestResult;
  sessions: SessionRecord[];
  rankMoves: RankMove[];
}): WarriorAssessmentReport {
  const gender = resolveGender(student);
  const age = calcAge(student, result.date);
  const inputs: AssessmentInputs = {};
  result.items.forEach((item) => {

    if (ASSESSMENT_INPUT_KEYS.includes(item.itemId as keyof AssessmentInputs)) {

      (inputs as any)[item.itemId] = item.value;
    }
  });

  const { heightMetric, bmiMetric } = calcBodyMetrics(inputs, gender, age);
  const { result: scoreMap } = buildScores(inputs, gender, age);
  const radar = aggregateRadar(scoreMap);
  const totalScore = calcTotalScore(scoreMap);
  const level = resolveLevel(totalScore);

  const freestyle = student
    ? computeFreestyleProgress(sessions, rankMoves, student.id)
    : { rows: [], highestDan: 0 };
  const growthStageIndex = growthStageFromDan(freestyle.highestDan);
  const honorTitle = GROWTH_STAGES[growthStageIndex]?.honor ?? GROWTH_STAGES[0].honor;
  const sortedScores = Object.entries(scoreMap).sort((a, b) => a[1].score - b[1].score);

  const categories = summarizeCategories(scoreMap, { height: heightMetric, bmi: bmiMetric });
  const progressBars = buildProgressBars(scoreMap);

  const report: WarriorAssessmentReport = {
    student,
    date: result.date,
    age,
    gender,
    inputs,
    metrics: scoreMap as unknown as Record<string, MetricScore>,
    bodyScores: { height: heightMetric, bmi: bmiMetric },
    scores: scoreMap,
    totalScore,
    level,
    highestDan: freestyle.highestDan,
    growthStageIndex,
    honorTitle,
    radar,
    categories,
    sortedScores,
    freestyle: freestyle.rows,
    progressBars,
    coachComment: result.coachComment,
    advice: '',
  };

  report.advice = buildAdvice(report);
  return report;
}

export function buildGraduationStatus(score: number) {
  if (score >= 90) return '综合评定：完美毕业！';
  if (score >= 80) return '综合评定：优秀学员';
  if (score >= 60) return '综合评定：稳步提升';
  return '综合评定：潜力新星';
}

export function getBranding() {
  return BRANDING;
}
