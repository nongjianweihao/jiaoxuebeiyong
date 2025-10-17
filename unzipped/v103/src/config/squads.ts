import type { KudosBadge } from '../types.gamify';

export const DEFAULT_KUDOS_BADGES: KudosBadge[] = [
  '最有毅力',
  '最佳队友',
  '最快进步',
  '最佳表现',
  '能量助攻',
];

export const SQUAD_EVALUATION_DIMENSIONS = [
  '挑战完成率',
  '累计能量',
  '互评热度',
] as const;

export const SQUAD_LEADERBOARD_WINDOWS = {
  weeklyDays: 7,
  monthlyDays: 30,
};
