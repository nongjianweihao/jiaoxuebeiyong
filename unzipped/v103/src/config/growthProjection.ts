export type TreeStageId =
  | 'seed'
  | 'sprout'
  | 'sapling'
  | 'bloom'
  | 'fruit'
  | 'grove';

export type HeroStageId =
  | 'novice'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'diamond'
  | 'legend';

export interface TreeStageDefinition {
  id: TreeStageId;
  label: string;
  minScore: number;
  headline: string;
  description: string;
  gradient: string;
  aura: string;
  icon: string;
}

export interface HeroStageDefinition {
  id: HeroStageId;
  label: string;
  minEnergy: number;
  headline: string;
  description: string;
  gradient: string;
  aura: string;
  icon: string;
}

export const TREE_STAGES: TreeStageDefinition[] = [
  {
    id: 'seed',
    label: '种子苏醒',
    minScore: 0,
    headline: '勇气发芽',
    description: '刚刚加入冒险营，每一次签到都在唤醒种子。',
    gradient: 'from-emerald-200 via-emerald-100 to-white',
    aura: 'bg-emerald-200/40',
    icon: '🌱',
  },
  {
    id: 'sprout',
    label: '幼苗破土',
    minScore: 10,
    headline: '节奏建立',
    description: '节奏逐渐稳定，小树开始吸收阳光。',
    gradient: 'from-emerald-300 via-emerald-100 to-white',
    aura: 'bg-emerald-300/30',
    icon: '🌿',
  },
  {
    id: 'sapling',
    label: '小树成形',
    minScore: 100,
    headline: '枝叶舒展',
    description: '连续完成训练，小树干逐渐挺拔。',
    gradient: 'from-emerald-400 via-emerald-200 to-white',
    aura: 'bg-emerald-400/30',
    icon: '🌳',
  },
  {
    id: 'bloom',
    label: '能量绽放',
    minScore: 500,
    headline: '光影穿梭',
    description: '坚持让树进入开花期，森林的能量正在汇聚。',
    gradient: 'from-emerald-500 via-cyan-200 to-white',
    aura: 'bg-cyan-300/40',
    icon: '🌸',
  },
  {
    id: 'fruit',
    label: '荣誉结果',
    minScore: 1000,
    headline: '果实闪耀',
    description: '果实成熟化为能量球，滋养勇士的下一次突破。',
    gradient: 'from-amber-300 via-emerald-200 to-white',
    aura: 'bg-amber-200/40',
    icon: '🍎',
  },
  {
    id: 'grove',
    label: '勇士之森',
    minScore: 2000,
    headline: '森林共鸣',
    description: '树化作森林，成为战队的精神灯塔。',
    gradient: 'from-emerald-600 via-emerald-300 to-white',
    aura: 'bg-emerald-500/30',
    icon: '🌲',
  },
];

export const HERO_STAGES: HeroStageDefinition[] = [
  {
    id: 'novice',
    label: '木剑学徒',
    minEnergy: 0,
    headline: '初次拔剑',
    description: '刚觉醒的小勇士，正在学习战斗节奏。',
    gradient: 'from-slate-200 via-slate-100 to-white',
    aura: 'bg-slate-300/40',
    icon: '🗡️',
  },
  {
    id: 'bronze',
    label: '青铜勇士',
    minEnergy: 100,
    headline: '披风猎猎',
    description: '能量驱动披风飘动，进入勇士训练场。',
    gradient: 'from-amber-200 via-orange-100 to-white',
    aura: 'bg-amber-300/40',
    icon: '🛡️',
  },
  {
    id: 'silver',
    label: '白银守护',
    minEnergy: 300,
    headline: '护盾成型',
    description: '勇士掌握防御技巧，能量光盾环绕。',
    gradient: 'from-slate-200 via-sky-100 to-white',
    aura: 'bg-sky-200/40',
    icon: '⚔️',
  },
  {
    id: 'gold',
    label: '黄金骑士',
    minEnergy: 600,
    headline: '坐骑觉醒',
    description: '坐骑苏醒，竞技场的战鼓已经响起。',
    gradient: 'from-amber-300 via-yellow-100 to-white',
    aura: 'bg-amber-400/40',
    icon: '🐎',
  },
  {
    id: 'diamond',
    label: '钻石圣骑',
    minEnergy: 1000,
    headline: '圣光护体',
    description: '圣光环绕，带队参赛成为班级核心。',
    gradient: 'from-cyan-300 via-purple-200 to-white',
    aura: 'bg-cyan-300/40',
    icon: '💎',
  },
  {
    id: 'legend',
    label: '王者之魂',
    minEnergy: 2000,
    headline: '王者觉醒',
    description: '披风发光，肩负传承使命，化身助教。',
    gradient: 'from-purple-400 via-indigo-200 to-white',
    aura: 'bg-purple-400/40',
    icon: '👑',
  },
];
