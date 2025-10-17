import { db } from '../store/db';
import { templatesRepo } from '../store/repositories/templatesRepo';
import type { RecommendedMission } from '../types.gamify';

const qualityToMissionType: Record<string, string> = {
  speed: 'speed',
  power: 'strength',
  endurance: 'stamina',
  coordination: 'coordination',
  agility: 'speed',
  balance: 'coordination',
  flexibility: 'coordination',
  core: 'stamina',
  accuracy: 'coordination',
};

export async function recommendMissionsFor(studentId: string, limit = 3): Promise<RecommendedMission[]> {
  const assessments = await db.fitnessTests.where({ studentId }).toArray();
  let weakest: string | null = null;
  let weakestScore = Number.POSITIVE_INFINITY;
  assessments.forEach((assessment) => {
    const radar = assessment.radar ?? {};
    Object.entries(radar).forEach(([quality, score]) => {
      if (typeof score !== 'number') return;
      if (score < weakestScore) {
        weakestScore = score;
        weakest = quality;
      }
    });
  });

  const focusQuality = weakest ?? 'speed';
  const missionType = qualityToMissionType[focusQuality] ?? 'speed';

  const templates = await templatesRepo.list();
  const matched = templates
    .filter((template) =>
      template.blocks.some((block) =>
        (block.qualities ?? []).some((quality) => qualityToMissionType[quality] === missionType),
      ),
    )
    .slice(0, limit)
    .map((template) => ({ missionId: template.id, name: template.name, type: missionType }));

  if (matched.length) return matched;

  return templates.slice(0, limit).map((template) => ({ missionId: template.id, name: template.name, type: missionType }));
}
