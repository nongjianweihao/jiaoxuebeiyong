import { db } from '../db';
import { energyLogsRepo } from './energyLogsRepo';
import type { StudentExchange, RewardExchangeStatus, RewardItem } from '../../types.gamify';
import type { PointEvent } from '../../types';
import { buildPointsSnapshot } from '../../utils/points';

export interface StudentRewardBalance {
  scoreBalance: number;
  totalScoreEarned: number;
  totalScoreSpent: number;
  energyBalance: number;
  totalEnergySpent: number;
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  exchange?: StudentExchange;
  reward?: RewardItem | null;
  balance?: StudentRewardBalance;
}

function calculateBalance(
  events: PointEvent[],
  exchanges: StudentExchange[],
  studentEnergy: number | undefined,
): StudentRewardBalance {
  const { total } = buildPointsSnapshot(events);
  const totalScoreSpent = exchanges.reduce((sum, entry) => sum + (entry.costScore ?? 0), 0);
  const totalEnergySpent = exchanges.reduce((sum, entry) => sum + (entry.costEnergy ?? 0), 0);
  return {
    scoreBalance: total - totalScoreSpent,
    totalScoreEarned: total,
    totalScoreSpent,
    energyBalance: studentEnergy ?? 0,
    totalEnergySpent,
  };
}

export const rewardExchangesRepo = {
  async listByStudent(studentId: string) {
    return db.studentExchanges.where('studentId').equals(studentId).toArray();
  },

  async listRecent(studentId: string, limit = 10) {
    const all = await this.listByStudent(studentId);
    return all
      .slice()
      .sort((a, b) => b.redeemedAt - a.redeemedAt)
      .slice(0, limit);
  },

  async updateStatus(id: string, status: RewardExchangeStatus, note?: string) {
    await db.studentExchanges.update(id, { status, note });
  },

  async getBalance(studentId: string): Promise<StudentRewardBalance> {
    const [events, exchanges, student] = await Promise.all([
      db.pointEvents.where('studentId').equals(studentId).toArray(),
      db.studentExchanges.where('studentId').equals(studentId).toArray(),
      db.students.get(studentId),
    ]);
    return calculateBalance(events, exchanges, student?.energy);
  },

  async redeem(studentId: string, rewardId: string): Promise<RedeemResult> {
    const [student, reward] = await Promise.all([
      db.students.get(studentId),
      db.rewardItems.get(rewardId),
    ]);

    if (!student) {
      return { ok: false, message: '未找到勇士档案' };
    }
    if (!reward || reward.visible === false) {
      return { ok: false, message: '奖励未开放或已下架' };
    }

    const balanceBefore = await this.getBalance(studentId);
    if (balanceBefore.scoreBalance < reward.costScore) {
      return { ok: false, message: '积分不足，继续完成挑战即可获得积分' };
    }
    if (reward.costEnergy && balanceBefore.energyBalance < reward.costEnergy) {
      return { ok: false, message: '能量不足，请先参与课堂或战队挑战累积能量' };
    }
    if (reward.stock !== undefined && reward.stock <= 0) {
      return { ok: false, message: '该奖励库存不足，等待教练补货' };
    }

    const now = Date.now();

    try {
      const result = await db.transaction(
        'rw',
        db.rewardItems,
        db.studentExchanges,
        db.students,
        db.energyLogs,
        db.pointEvents,
        async () => {
          const [latestReward, latestStudent, events, exchanges] = await Promise.all([
            db.rewardItems.get(rewardId),
            db.students.get(studentId),
            db.pointEvents.where('studentId').equals(studentId).toArray(),
            db.studentExchanges.where('studentId').equals(studentId).toArray(),
          ]);

          if (!latestReward || latestReward.visible === false) {
            throw new Error('奖励未开放或已下架');
          }
          if (latestReward.stock !== undefined && latestReward.stock <= 0) {
            throw new Error('该奖励库存不足，等待教练补货');
          }

          const latestBalance = calculateBalance(events, exchanges, latestStudent?.energy);
          if (latestBalance.scoreBalance < latestReward.costScore) {
            throw new Error('积分不足，继续完成挑战即可获得积分');
          }
          if (latestReward.costEnergy && latestBalance.energyBalance < latestReward.costEnergy) {
            throw new Error('能量不足，请先参与课堂或战队挑战累积能量');
          }

          const exchange: StudentExchange = {
            id: crypto.randomUUID(),
            studentId,
            rewardId,
            costScore: latestReward.costScore,
            costEnergy: latestReward.costEnergy,
            redeemedAt: now,
            status: 'pending',
          };

          await db.studentExchanges.put(exchange);

          if (latestReward.stock !== undefined) {
            await db.rewardItems.update(rewardId, {
              stock: Math.max(0, (latestReward.stock ?? 0) - 1),
            });
          }

          let nextEnergy = latestBalance.energyBalance;
          if (latestReward.costEnergy) {
            nextEnergy = latestBalance.energyBalance - latestReward.costEnergy;
            await db.students.update(studentId, { energy: nextEnergy });
            await energyLogsRepo.record({
              studentId,
              source: 'market_redeem',
              refId: rewardId,
              delta: -latestReward.costEnergy,
              createdAt: new Date(now).toISOString(),
              metadata: { rewardName: latestReward.name },
            });
          }

          const balanceAfter = calculateBalance(events, [...exchanges, exchange], nextEnergy);
          return { exchange, reward: latestReward, balance: balanceAfter };
        },
      );

      return { ok: true, message: '兑换申请已提交', ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : '兑换失败，请稍后再试';
      return { ok: false, message };
    }
  },
};
