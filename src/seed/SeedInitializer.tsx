import { useEffect, useState, type ReactNode } from 'react';
import { db } from '../store/db';
import seed from './seed.json';
import library from './public_library.json';
import qualities from './training-qualities.json';
import drills from './training-drills.json';
import games from './game-library.json';
import missionCards from './missioncards.json';
import cycleTemplates from './cycle-templates.json';
import stages from './training-stages.json';
import plans from './training-plans.json';
import units from './training-units.json';
import rewardCatalog from './reward-items.json';


import { setBenchmarks, setSpeedThresholds } from '../utils/calc';
import { setPointRules } from '../utils/points';
import type {
  Benchmark,
  ClassEntity,
  GameDrill,
  LessonPackage,
  MissionCardV2,
  PaymentRecord,
  PointsRule,
  RankMove,
  SpeedRankThreshold,
  Student,
  TrainingCycleTemplate,
  TrainingPlan,
  TrainingDrill,
  TrainingGame,
  TrainingQuality,
  TrainingStage,
  TrainingUnit,
  TrainingTemplate,
  WarriorPathNode,
} from '../types';
import type { RewardItem } from '../types.gamify';

const CHINESE_NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

function buildLibraryRankMoves(): RankMove[] {
  const moves: RankMove[] = [];
  CHINESE_NUMERALS.forEach((numeral, index) => {
    const rank = index + 1;
    const key = `花样${numeral}段动作名称`;
    const list: string[] = (library as any)[key] ?? [];
    list.forEach((name: string, idx: number) => {
      moves.push({ id: `move-${rank}-${idx}`, rank, name });
    });
  });
  return moves;
}

async function ensureRankMovesFromLibrary() {
  const existing = await db.rankMoves.toArray();
  const existingKeys = new Set(existing.map((move) => `${move.rank}|${move.name}`));
  const additions = buildLibraryRankMoves().filter(
    (move) => !existingKeys.has(`${move.rank}|${move.name}`),
  );
  if (additions.length) {
    await db.rankMoves.bulkPut(additions);
  }
}

async function ensureTrainingAssets() {

  const [stageCount, planCount, unitCount, qualityCount, drillCount, gameCount, missionCount, cycleCount] =
    await Promise.all([
      db.trainingStages.count(),
      db.trainingPlans.count(),
      db.trainingUnits.count(),
      db.trainingQualities.count(),
      db.trainingDrills.count(),
      db.trainingGames.count(),
      db.missionCardsV2.count(),
      db.cycleTemplates.count(),
    ]);

  if (!stageCount) {
    await db.trainingStages.bulkPut(stages as TrainingStage[]);
  }
  if (!planCount) {
    await db.trainingPlans.bulkPut(plans as TrainingPlan[]);
  }
  if (!unitCount) {
    await db.trainingUnits.bulkPut(units as TrainingUnit[]);
  }
  if (!qualityCount) {
    await db.trainingQualities.bulkPut(qualities as TrainingQuality[]);
  }
  if (!drillCount) {
    await db.trainingDrills.bulkPut(drills as TrainingDrill[]);
  }
  if (!gameCount) {
    await db.trainingGames.bulkPut(games as TrainingGame[]);
  }
  if (!missionCount) {
    await db.missionCardsV2.bulkPut(missionCards as MissionCardV2[]);
  }
  if (!cycleCount) {
    await db.cycleTemplates.bulkPut(cycleTemplates as TrainingCycleTemplate[]);
  }


}

async function ensureRewardCatalog() {
  const existing = await db.rewardItems.count();
  if (!existing) {
    await db.rewardItems.bulkPut(rewardCatalog as RewardItem[]);
    return;
  }
  const current = await db.rewardItems.toArray();
  const stockMap = new Map(current.map((item) => [item.id, item.stock]));
  const merged = (rewardCatalog as RewardItem[]).map((item) => ({
    ...item,
    stock: item.stock ?? stockMap.get(item.id),
  }));
  await db.rewardItems.bulkPut(merged);
}

async function bootstrap() {
  const count = await db.students.count();
  const hydrateCaches = async () => {
    const [benchmarks, thresholds, rules] = await Promise.all([
      db.benchmarks.toArray(),
      db.speedRankThresholds.toArray(),
      db.pointsRules.toArray(),
    ]);
    setBenchmarks(benchmarks as Benchmark[]);
    setSpeedThresholds(thresholds as SpeedRankThreshold[]);
    setPointRules(rules as PointsRule[]);
  };
  if (count > 0) {
    await ensureRankMovesFromLibrary();
    await ensureTrainingAssets();
    await ensureRewardCatalog();
    await hydrateCaches();
    return;
  }

  await db.transaction(
    'rw',
    [
      db.students,
      db.classes,
      db.templates,
      db.lessonPackages,
      db.payments,
      db.benchmarks,
      db.rankMoves,
      db.warriorNodes,
      db.gameDrills,
      db.speedRankThresholds,
      db.pointsRules,
      db.trainingStages,
      db.trainingPlans,
      db.trainingUnits,
      db.trainingQualities,
      db.trainingDrills,
      db.trainingGames,
      db.missionCardsV2,
      db.cycleTemplates,
      db.rewardItems,
      db.studentExchanges,
    ],
    async () => {
    // Core entities
    await db.students.bulkPut((seed.students as Student[]).map(s => ({ ...s, gender: s.gender as any })));
    await db.classes.bulkPut(seed.classes as ClassEntity[]);
    if (seed.templates) await db.templates.bulkPut((seed.templates as TrainingTemplate[]).map(t => ({ ...t, period: t.period as any })));
    await ensureChallengeTemplates();
    if ((seed as any).lessonPackages) await db.lessonPackages.bulkPut((seed as any).lessonPackages as LessonPackage[]);
    if ((seed as any).paymentRecords) await db.payments.bulkPut((seed as any).paymentRecords as PaymentRecord[]);

    if (seed.benchmarks) {
      const normalized = (seed.benchmarks as any[]).map((b, idx) => ({
        id: b.id || `bm-${idx}`,
        quality: b.quality,
        ageMin: b.ageMin,
        ageMax: b.ageMax,
        gender: b.gender,
        unit: b.unit,
        p25: b.p25,
        p50: b.p50,
        p75: b.p75,
        min: b.min ?? 0,
        max: b.max ?? Math.max(b.p75 * 1.5, b.p75 + 10),
      }));
      await db.benchmarks.bulkPut(normalized as Benchmark[]);
    }

    // Speed thresholds
    const rawThresholds = (library as any).speed_rank_thresholds as Array<{ rank: number; windowSec: number; mode: string; minReps: number; }>; 
    if (rawThresholds?.length) {
      const thresholds: SpeedRankThreshold[] = rawThresholds.map((t) => ({
        id: `spd-${t.rank}-${t.windowSec}-${t.mode}`,
        rank: t.rank,
        windowSec: t.windowSec,
        mode: t.mode as any,
        minReps: t.minReps,
      }));
      await db.speedRankThresholds.bulkPut(thresholds);
      setSpeedThresholds(thresholds);
    }

    // Rank moves
    const rankMoveCollections = buildLibraryRankMoves();
    if (rankMoveCollections.length) {
      await db.rankMoves.bulkPut(rankMoveCollections);
    }

    if ((seed as any).warriorPath) await db.warriorNodes.bulkPut((seed as any).warriorPath as WarriorPathNode[]);
    if ((seed as any).gameDrills) await db.gameDrills.bulkPut(((seed as any).gameDrills as GameDrill[]).map(g => ({...g} as any)));
    await db.trainingStages.bulkPut(stages as TrainingStage[]);
    await db.trainingPlans.bulkPut(plans as TrainingPlan[]);
    await db.trainingUnits.bulkPut(units as TrainingUnit[]);
    await db.trainingQualities.bulkPut(qualities as TrainingQuality[]);
    await db.trainingDrills.bulkPut(drills as TrainingDrill[]);
    await db.trainingGames.bulkPut(games as TrainingGame[]);
    await db.missionCardsV2.bulkPut(missionCards as MissionCardV2[]);
    await db.cycleTemplates.bulkPut(cycleTemplates as TrainingCycleTemplate[]);
    await db.rewardItems.bulkPut(rewardCatalog as RewardItem[]);
      const rawRules = (seed as any).points_rules ?? null;
      const pointsRules: PointsRule[] = rawRules
        ? Object.entries(rawRules).map(([type, value]) => ({
            type: type as PointsRule['type'],
            points: Number(value),
          })) as PointsRule[]
        : [
            { type: 'attendance', points: 2 },
            { type: 'pr', points: 5 },
            { type: 'freestyle_pass', points: 3 },
            { type: 'excellent', points: 2 },
          ];
      await db.pointsRules.bulkPut(pointsRules);
      setPointRules(pointsRules);
    },
  );

  // hydrate caches
  await hydrateCaches();
}

export function SeedInitializer({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    bootstrap()
      .catch((error) => {
        console.error('Seed bootstrap failed', error);
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        正在载入本地数据...
      </div>
    );
  }

  return <>{children}</>;
}
