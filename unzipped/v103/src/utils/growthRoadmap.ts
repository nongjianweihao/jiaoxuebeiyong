import { GROWTH_ROADMAP_STAGES, type GrowthRoadmapStage } from '../config/growthRoadmap';
import type { TrainingCycleTemplate } from '../types';

export interface TrackProgressView {
  id: string;
  title: string;
  subtitle: string;
  targetLabel: string;
  progress: number;
  currentLabel: string;
}

export interface StageProgressView {
  stage: GrowthRoadmapStage;
  overallProgress: number;
  trackProgress: TrackProgressView[];
  recommendedCycles: Array<{
    id: string;
    name: string;
    summary?: string;
    durationWeeks: number;
    goal: string;
    icon?: string;
  }>;
}

export interface StudentRoadmapState {
  activeStageIndex: number;
  activeStageId: string;
  normalizedProgress: number;
  stages: StageProgressView[];
}

interface BuildRoadmapOptions {
  growthStageIndex?: number;
  growthStageId?: string;
  highestDan?: number;
  assessmentScore?: number;
  best30Single?: number;
  missionsCompleted: number;
  totalMissionStars: number;
  totalMissionEnergy: number;
  badgesCount: number;
  squadEnergyTotal: number;
  cycleTemplates: TrainingCycleTemplate[];
}

function ratio(value: number, target: number) {
  if (!Number.isFinite(target) || target <= 0) return 0;
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(1, value / target);
}

function average(values: number[]) {
  if (!values.length) return 0;
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value?: number, suffix = '') {
  if (!Number.isFinite(value) || value === undefined) return '--';
  return `${Math.round(value)}${suffix}`;
}

export function buildStudentRoadmapState({
  growthStageIndex,
  growthStageId,
  highestDan = 0,
  assessmentScore,
  best30Single,
  missionsCompleted,
  totalMissionStars,
  totalMissionEnergy,
  badgesCount,
  squadEnergyTotal,
  cycleTemplates,
}: BuildRoadmapOptions): StudentRoadmapState {
  const stages = GROWTH_ROADMAP_STAGES.map((stage) => {
    const targets = stage.targets;
    const coreProgress = average([
      ratio(assessmentScore ?? 0, targets.assessment),
      ratio(best30Single ?? 0, targets.speed30),
      ratio(highestDan ?? 0, targets.dan),
    ]);
    const supportProgress = average([
      ratio(missionsCompleted, targets.missions),
      ratio(totalMissionStars, targets.stars),
    ]);
    const challengeProgress = average([
      ratio(badgesCount, targets.badges),
      ratio(squadEnergyTotal, targets.squadEnergy),
      ratio(totalMissionEnergy, targets.squadEnergy * 3),
    ]);

    const overallProgress = Math.min(1, average([coreProgress, supportProgress, challengeProgress]));

    const trackProgress: TrackProgressView[] = [
      {
        id: 'core',
        title: stage.tracks[0]?.title ?? '核心训练线',
        subtitle: stage.tracks[0]?.subtitle ?? '',
        targetLabel: stage.tracks[0]?.targetLabel ?? '',
        progress: coreProgress,
        currentLabel: [`测评 ${formatNumber(assessmentScore, '分')}`, `30″单摇 ${formatNumber(best30Single, '次')}`, `花样段位 ${formatNumber(highestDan, '段')}`]
          .filter((text) => !text.includes('--'))
          .join(' · '),
      },
      {
        id: 'support',
        title: stage.tracks[1]?.title ?? '支撑训练线',
        subtitle: stage.tracks[1]?.subtitle ?? '',
        targetLabel: stage.tracks[1]?.targetLabel ?? '',
        progress: supportProgress,
        currentLabel: [
          `挑战 ${missionsCompleted} 次`,
          `⭐ ${Math.round(totalMissionStars)}`,
          totalMissionEnergy ? `能量 ${Math.round(totalMissionEnergy)}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      },
      {
        id: 'challenge',
        title: stage.tracks[2]?.title ?? '挑战线',
        subtitle: stage.tracks[2]?.subtitle ?? '',
        targetLabel: stage.tracks[2]?.targetLabel ?? '',
        progress: challengeProgress,
        currentLabel: [`徽章 ${badgesCount} 枚`, `小队能量 ${Math.round(squadEnergyTotal)}`]
          .filter(Boolean)
          .join(' · '),
      },
    ];

    const recommendedCycles = stage.recommendedCycleIds
      .map((cycleId) => cycleTemplates.find((cycle) => cycle.id === cycleId))
      .filter((value): value is TrainingCycleTemplate => Boolean(value))
      .map((cycle) => ({
        id: cycle.id,
        name: cycle.name,
        summary: cycle.summary,
        durationWeeks: cycle.durationWeeks,
        goal: cycle.goal,
        icon: cycle.icon,
      }));

    return {
      stage,
      overallProgress,
      trackProgress,
      recommendedCycles,
    };
  });

  const sanitizedIndex =
    typeof growthStageIndex === 'number' && Number.isFinite(growthStageIndex)
      ? Math.min(Math.max(Math.round(growthStageIndex), 0), stages.length - 1)
      : null;

  const specifiedStageIndex =
    growthStageId !== undefined
      ? stages.findIndex((stage) => stage.stage.id === growthStageId)
      : -1;

  let activeStageIndex: number;

  if (specifiedStageIndex >= 0) {
    activeStageIndex = specifiedStageIndex;
  } else if (sanitizedIndex !== null) {
    activeStageIndex = sanitizedIndex;
  } else {
    const threshold = 0.8;
    const inferredIndex = stages.findIndex((stage, index) => {
      if (index === stages.length - 1) return true;
      return stage.overallProgress < threshold;
    });
    activeStageIndex = inferredIndex === -1 ? stages.length - 1 : inferredIndex;
  }

  const currentStageProgress = stages[activeStageIndex]?.overallProgress ?? 0;
  const normalizedProgress = stages.length > 1
    ? Math.min(1, (activeStageIndex + currentStageProgress) / (stages.length - 1))
    : currentStageProgress;

  return {
    activeStageIndex,
    activeStageId: stages[activeStageIndex]?.stage.id ?? stages[0]?.stage.id ?? '',
    normalizedProgress,
    stages,
  };
}
