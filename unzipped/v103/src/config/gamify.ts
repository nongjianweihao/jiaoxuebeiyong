export const GAMIFY_CONSTANTS = {
  attendanceEnergy: 10,
  streakBonusThreshold: 3,
  streakBonusEnergy: 5,
  missionEnergyPerStar: 8,
  assessmentRankEnergy: 30,


  kudosEnergy: 5,
  squadMilestoneEnergy: 5,
  squadCompletionEnergy: 20,
  squadMilestoneStep: 0.1,


};

export function calculateLevel(energy: number) {
  const level = Math.floor(energy / 120) + 1;
  const levelFloor = (level - 1) * 120;
  const levelCeil = level * 120;
  const progress = levelCeil === levelFloor ? 0 : (energy - levelFloor) / (levelCeil - levelFloor);
  return { level, progress: Math.min(1, Math.max(0, progress)), nextLevelEnergy: levelCeil };
}
