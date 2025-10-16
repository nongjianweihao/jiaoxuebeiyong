import { db } from '../db';
import { generateId } from './utils';
import { AwardEngine } from '../../gamify/awardEngine';
import { GAMIFY_CONSTANTS } from '../../config/gamify';
import type {
  Squad,
  SquadChallenge,
  SquadProgressLog,
} from '../../types.gamify';

export interface CreateSquadInput {
  name: string;
  memberIds: string[];
  classId?: string;
  seasonCode?: string;
}

export interface CreateChallengeInput {
  squadId: string;
  title: string;
  target: number;
  unit: SquadChallenge['unit'];
  startDate: string;
  endDate: string;
}

export interface ProgressLogInput {
  challengeId: string;
  value: number;
  by: SquadProgressLog['by'];
  createdBy: string;
  refSessionId?: string;
  note?: string;
}

export const squadsRepo = {
  async listByClass(classId: string) {
    return db.squads.where('classId').equals(classId).toArray();
  },

  async listAll() {
    return db.squads.toArray();
  },

  async listChallenges() {
    return db.squadChallenges.toArray();
  },

  async listChallengesByClass(classId: string) {
    const squads = await this.listByClass(classId);
    const squadIds = squads.map((squad) => squad.id);
    if (squadIds.length === 0) return [];
    return db.squadChallenges.where('squadId').anyOf(squadIds).toArray();
  },

  async listProgressLogs(challengeId: string) {
    return db.squadProgress.where('challengeId').equals(challengeId).toArray();
  },

  async createSquad(input: CreateSquadInput) {
    const id = generateId();
    const now = new Date().toISOString();
    const record: Squad = {
      id,
      name: input.name,
      memberIds: input.memberIds,
      classId: input.classId,
      seasonCode: input.seasonCode,
      createdAt: now,
      updatedAt: now,
    };
    await db.squads.add(record);
    return record;
  },

  async updateSquad(id: string, patch: Partial<Squad>) {
    await db.squads.update(id, { ...patch, updatedAt: new Date().toISOString() });
  },

  async createChallenge(input: CreateChallengeInput) {
    const id = generateId();
    const challenge: SquadChallenge = {
      id,
      squadId: input.squadId,
      title: input.title,
      target: Math.max(0, input.target),
      unit: input.unit,
      startDate: input.startDate,
      endDate: input.endDate,
      progress: 0,
      status: 'ongoing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      milestoneLevel: 0,
    };
    await db.squadChallenges.add(challenge);
    return challenge;
  },

  async addProgress(input: ProgressLogInput) {
    if (input.value <= 0) return null;
    const challenge = await db.squadChallenges.get(input.challengeId);
    if (!challenge) return null;
    const squad = await db.squads.get(challenge.squadId);
    if (!squad) return null;

    const now = new Date().toISOString();
    const log: SquadProgressLog = {
      squadId: challenge.squadId,
      challengeId: challenge.id,
      value: input.value,
      by: input.by,
      refSessionId: input.refSessionId,
      note: input.note,
      createdBy: input.createdBy,
      createdAt: now,
    };
    await db.squadProgress.add(log);

    const previousProgress = challenge.progress;
    const updatedProgress = previousProgress + input.value;
    const patch: Partial<SquadChallenge> = {
      progress: updatedProgress,
      updatedAt: now,
    };
    const rewards: Array<{ type: 'milestone' | 'completion'; milestone?: number }> = [];

    const target = challenge.target || 0;
    if (target > 0) {
      const step = GAMIFY_CONSTANTS.squadMilestoneStep;
      const prevLevel = challenge.milestoneLevel ?? 0;
      const nextLevel = Math.min(
        10,
        Math.floor((updatedProgress / target) / step),
      );
      if (nextLevel > prevLevel) {
        for (let level = prevLevel + 1; level <= nextLevel; level += 1) {
          rewards.push({ type: 'milestone', milestone: level });
        }
        patch.milestoneLevel = nextLevel;
      }
      if (updatedProgress >= target && challenge.status !== 'done') {
        rewards.push({ type: 'completion' });
        patch.status = 'done';
      }
    }

    await db.squadChallenges.update(challenge.id, patch);

    const memberIds = squad.memberIds ?? [];
    await Promise.all(
      memberIds.map(async (studentId) => {
        for (const reward of rewards) {
          const source =
            reward.type === 'milestone' ? 'squad_milestone' : 'squad_completion';
          const refId =
            reward.type === 'milestone'
              ? `${challenge.id}:milestone:${reward.milestone}`
              : `${challenge.id}:completion`;
          const energy =
            reward.type === 'milestone'
              ? GAMIFY_CONSTANTS.squadMilestoneEnergy
              : GAMIFY_CONSTANTS.squadCompletionEnergy;
          await AwardEngine.grantEnergy(studentId, energy, source, refId, {
            squadId: squad.id,
            challengeId: challenge.id,
            milestone: reward.milestone,
          });
        }
      }),
    );

    return { ...challenge, ...patch, progress: updatedProgress };
  },

  async listForStudent(studentId: string) {
    const squads = await db.squads.toArray();
    return squads.filter((squad) => squad.memberIds.includes(studentId));
  },
};
