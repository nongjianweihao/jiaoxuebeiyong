import { HERO_STAGES, TREE_STAGES, type HeroStageDefinition, type TreeStageDefinition } from '../config/growthProjection';

export interface GrowthStageState<Stage extends TreeStageDefinition | HeroStageDefinition> {
  current: Stage;
  next?: Stage;
  progress: number;
  toNext: number;
  index: number;
}

export interface GrowthSynergyState {
  level: number;
  title: string;
  description: string;
}

export interface GrowthProjectionState {
  score: number;
  energy: number;
  tree: GrowthStageState<TreeStageDefinition>;
  hero: GrowthStageState<HeroStageDefinition>;
  synergy: GrowthSynergyState;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolveTreeStage(score: number): GrowthStageState<TreeStageDefinition> {
  let index = TREE_STAGES.findIndex((stage, idx) => {
    const next = TREE_STAGES[idx + 1];
    if (!next) return score >= stage.minScore;
    return score >= stage.minScore && score < next.minScore;
  });
  if (index === -1) index = TREE_STAGES.length - 1;
  const current = TREE_STAGES[index];
  const next = TREE_STAGES[index + 1];
  const span = next ? next.minScore - current.minScore : 1;
  const progress = next ? clamp((score - current.minScore) / span, 0, 1) : 1;
  const toNext = next ? Math.max(0, next.minScore - score) : 0;
  return { current, next, progress, toNext, index };
}

function resolveHeroStage(energy: number): GrowthStageState<HeroStageDefinition> {
  let index = HERO_STAGES.findIndex((stage, idx) => {
    const next = HERO_STAGES[idx + 1];
    if (!next) return energy >= stage.minEnergy;
    return energy >= stage.minEnergy && energy < next.minEnergy;
  });
  if (index === -1) index = HERO_STAGES.length - 1;
  const current = HERO_STAGES[index];
  const next = HERO_STAGES[index + 1];
  const span = next ? next.minEnergy - current.minEnergy : 1;
  const progress = next ? clamp((energy - current.minEnergy) / span, 0, 1) : 1;
  const toNext = next ? Math.max(0, next.minEnergy - energy) : 0;
  return { current, next, progress, toNext, index };
}

const SYNERGY_LEVELS: Array<{
  minTreeIndex: number;
  minHeroIndex: number;
  title: string;
  description: string;
}> = [
  {
    minTreeIndex: 0,
    minHeroIndex: 0,
    title: '双生觉醒',
    description: '树与勇士刚刚同步，成长投影启动。',
  },
  {
    minTreeIndex: 2,
    minHeroIndex: 2,
    title: '节奏共鸣',
    description: '树木枝叶舒展，勇士护盾成型，训练节奏稳定。',
  },
  {
    minTreeIndex: 3,
    minHeroIndex: 3,
    title: '能量联动',
    description: '开花与坐骑觉醒互相激活，勇士进入竞技冲刺。',
  },
  {
    minTreeIndex: 4,
    minHeroIndex: 4,
    title: '森林圣约',
    description: '果实化作能量，钻石勇士肩负战队荣耀。',
  },
  {
    minTreeIndex: 5,
    minHeroIndex: 5,
    title: '王者回响',
    description: '森林化作传承之森，王者勇士引导下一代。',
  },
];

function resolveSynergy(treeIndex: number, heroIndex: number): GrowthSynergyState {
  let matched = SYNERGY_LEVELS[0];
  let level = 0;
  SYNERGY_LEVELS.forEach((entry, idx) => {
    if (treeIndex >= entry.minTreeIndex && heroIndex >= entry.minHeroIndex) {
      matched = entry;
      level = idx;
    }
  });
  return { ...matched, level };
}

export function evaluateGrowthProjection(score: number, energy: number): GrowthProjectionState {
  const tree = resolveTreeStage(score);
  const hero = resolveHeroStage(energy);
  const synergy = resolveSynergy(tree.index, hero.index);
  return { score, energy, tree, hero, synergy };
}
