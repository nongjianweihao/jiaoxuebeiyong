export interface FreestyleReward {
  points: number;
  energy: number;
}

// 可按需调整不同段位的积分与能量奖励。
export const FREESTYLE_RANK_REWARDS: Record<number, FreestyleReward> = {
  1: { points: 4, energy: 12 },
  2: { points: 5, energy: 14 },
  3: { points: 6, energy: 16 },
  4: { points: 7, energy: 18 },
  5: { points: 8, energy: 20 },
  6: { points: 10, energy: 24 },
  7: { points: 12, energy: 28 },
  8: { points: 14, energy: 32 },
  9: { points: 16, energy: 36 },
};

export function getFreestyleReward(rank: number): FreestyleReward {
  const fallbackPoints = Math.max(3, 3 + (rank - 1) * 2);
  const fallbackEnergy = Math.max(8, 10 + (rank - 1) * 4);
  const reward = FREESTYLE_RANK_REWARDS[rank];
  return reward
    ? { points: reward.points, energy: reward.energy }
    : { points: fallbackPoints, energy: fallbackEnergy };
}

export function sumFreestyleRewards(ranks: number[]): FreestyleReward {
  return ranks.reduce<FreestyleReward>(
    (acc, rank) => {
      const reward = getFreestyleReward(rank);
      return {
        points: acc.points + reward.points,
        energy: acc.energy + reward.energy,
      };
    },
    { points: 0, energy: 0 },
  );
}
