import { db } from '../db';
import type {
  AbilityKey,
  ClassCyclePlan,
  ClassCycleSessionPlan,
  CycleReport,
  MissionBlock,
  MissionCardV2,
  TemplateBlock,
  TrainingCycleTemplate,
  TrainingDrill,
  TrainingGame,
  TrainingQuality,
  TrainingPlan,
  TrainingStage,
  TrainingTemplate,
  TrainingUnit,
} from '../../types';
import type { PuzzleTemplate } from '../../types.gamify';
import { puzzlesRepo } from './puzzlesRepo';
import { generateId } from './utils';

export interface TrainingLibrarySnapshot {
  stages: TrainingStage[];
  plans: TrainingPlan[];
  units: TrainingUnit[];
  qualities: TrainingQuality[];
  drills: TrainingDrill[];
  games: TrainingGame[];
  missions: MissionCardV2[];
  cycles: TrainingCycleTemplate[];
  puzzles: PuzzleTemplate[];
}

interface ImportOptions {
  replace?: boolean;
}

function ensureId<T extends { id: string }>(value: T): T {
  if (value.id && value.id.trim().length > 0) return value;
  return { ...value, id: generateId() };
}

function normaliseMissionBlocks(blocks: MissionBlock[] | undefined): MissionBlock[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((block) => ({
    ...block,
    drillIds: Array.isArray(block.drillIds) ? block.drillIds : [],
    gameIds: Array.isArray(block.gameIds) ? block.gameIds : [],
    puzzleTemplateId: block.puzzleTemplateId ? block.puzzleTemplateId : undefined,
    puzzleCardIds: Array.isArray(block.puzzleCardIds) ? block.puzzleCardIds : [],
  }));
}

function normaliseMission(mission: MissionCardV2): MissionCardV2 {
  const withId = ensureId(mission);
  return {
    ...withId,
    focusAbilities: Array.isArray(withId.focusAbilities) ? withId.focusAbilities : [],
    blocks: normaliseMissionBlocks(withId.blocks),
  };
}

function normaliseCycle(template: TrainingCycleTemplate): TrainingCycleTemplate {
  const withId = ensureId(template);
  return {
    ...withId,
    focusAbilities: Array.isArray(withId.focusAbilities) ? withId.focusAbilities : [],
    trackingMetrics: Array.isArray(withId.trackingMetrics) ? withId.trackingMetrics : [],

    
    category: withId.category ?? 'jump',
    recommendedFor: Array.isArray(withId.recommendedFor) ? withId.recommendedFor : [],

    weekPlan: Array.isArray(withId.weekPlan)
      ? withId.weekPlan.map((week) => ({
          ...week,
          missionCards: Array.isArray(week.missionCards) ? week.missionCards : [],

        
          puzzleTemplateId:
            typeof week.puzzleTemplateId === 'string' && week.puzzleTemplateId.trim().length > 0
              ? week.puzzleTemplateId
              : undefined,
          puzzleCardIds: Array.isArray(week.puzzleCardIds) ? week.puzzleCardIds : [],

        }))
      : [],
  };
}

function normaliseStage(stage: TrainingStage): TrainingStage {
  const withId = ensureId(stage);
  return {
    ...withId,
    summary: withId.summary ?? '',
    focusAbilities: Array.isArray(withId.focusAbilities) ? withId.focusAbilities : [],

    
    coreTasks: Array.isArray(withId.coreTasks) ? withId.coreTasks : [],
    keyMilestones: Array.isArray(withId.keyMilestones) ? withId.keyMilestones : [],
    ageGuidance: Array.isArray(withId.ageGuidance)
      ? withId.ageGuidance.map((item) => ({
          ...item,
          priorities: Array.isArray(item.priorities) ? item.priorities : [],
          cautions: Array.isArray(item.cautions) ? item.cautions : [],
        }))
      : [],
    cycleThemes: Array.isArray(withId.cycleThemes)
      ? withId.cycleThemes.map((item) => ({
          ...item,
        }))
      : [],

  };
}

function normalisePlan(plan: TrainingPlan): TrainingPlan {
  const withId = ensureId(plan);
  return {
    ...withId,
    focusAbilities: Array.isArray(withId.focusAbilities) ? withId.focusAbilities : [],
    weeks: Array.isArray(withId.weeks)
      ? withId.weeks.map((week) => ({
          ...week,
          unitIds: Array.isArray(week.unitIds) ? week.unitIds : [],
          focusAbilities: Array.isArray(week.focusAbilities) ? week.focusAbilities : [],
        }))
      : [],

    
    phases: Array.isArray(withId.phases)
      ? withId.phases.map((phase) => ({
          ...phase,
          focusPoints: Array.isArray(phase.focusPoints) ? phase.focusPoints : [],
          recommendedAges: Array.isArray(phase.recommendedAges) ? phase.recommendedAges : [],
        }))
      : [],

        
  };
}

function normaliseUnit(unit: TrainingUnit): TrainingUnit {
  const withId = ensureId(unit);
  return {
    ...withId,
    tags: Array.isArray(withId.tags) ? withId.tags : [],
    blocks: normaliseMissionBlocks(withId.blocks),
  };
}

function normaliseDrill(drill: TrainingDrill): TrainingDrill {
  const withId = ensureId(drill);
  return {
    ...withId,
    primaryAbilities: Array.isArray(withId.primaryAbilities) ? withId.primaryAbilities : [],
    secondaryAbilities: Array.isArray(withId.secondaryAbilities) ? withId.secondaryAbilities : [],
    equipment: Array.isArray(withId.equipment) ? withId.equipment : withId.equipment ?? [],
  };
}

function normaliseGame(game: TrainingGame): TrainingGame {
  const withId = ensureId(game);
  return {
    ...withId,
    focusAbilities: Array.isArray(withId.focusAbilities) ? withId.focusAbilities : [],
    equipment: Array.isArray(withId.equipment) ? withId.equipment : withId.equipment ?? [],
  };
}

function normaliseQuality(quality: TrainingQuality): TrainingQuality {
  return ensureId(quality);
}

interface AssignCyclePlanPayload {
  classId: string;
  templateId: string;
  startDate: string;
}


function addDays(base: Date, days: number) {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
}

function toIsoString(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

function computeSessionDate(startDate: Date, week: number, index: number): string {
  const dayOffset = (week - 1) * 7 + index * 2;
  return toIsoString(addDays(startDate, dayOffset));
}

function computeProgress(plan: ClassCyclePlan) {
  const total = plan.sessions.length || 1;
  const completed = plan.sessions.filter((session) => session.status === 'completed').length;
  return completed / total;
}

function computeCurrentWeek(plan: ClassCyclePlan) {
  const completedWeeks = plan.sessions
    .filter((session) => session.status === 'completed')
    .map((session) => session.week);
  const maxWeek = completedWeeks.length ? Math.max(...completedWeeks) : 1;
  return Math.max(1, Math.min(plan.durationWeeks, maxWeek));
}



async function generateCycleReports(plan: ClassCyclePlan) {
  const classEntity = await db.classes.get(plan.classId);
  if (!classEntity) return;
  const students = await db.students.bulkGet(classEntity.studentIds);
  await db.cycleReports.where({ planId: plan.id }).delete();
  const planEnd = plan.sessions.reduce((latest, session) => {
    const date = new Date(session.actualDate ?? session.plannedDate);
    return date > latest ? date : latest;
  }, addDays(new Date(plan.startDate), plan.durationWeeks * 7));

  const reports: CycleReport[] = [];
  for (const student of students) {
    if (!student) continue;
    const results = await db.fitnessTests.where({ studentId: student.id }).sortBy('date');
    const before = results
      .filter((result) => new Date(result.date) <= new Date(plan.startDate))
      .pop();
    const after = results
      .filter((result) => new Date(result.date) >= addDays(new Date(plan.startDate), plan.durationWeeks * 7 - 7))
      .shift() ?? results[results.length - 1];

    const abilityBefore: Partial<Record<AbilityKey, number>> = {};
    const abilityAfter: Partial<Record<AbilityKey, number>> = {};
    (['speed', 'power', 'coordination', 'agility', 'endurance', 'flexibility'] as AbilityKey[]).forEach((key) => {
      abilityBefore[key] = before?.radar?.[key] ?? undefined;
      abilityAfter[key] = after?.radar?.[key] ?? undefined;
    });

    const lookupMetric = (result: typeof results[number] | undefined, metricId: string) =>
      result?.items.find((item) => item.itemId === metricId)?.value ?? undefined;

    const sr30Before = lookupMetric(before, 'sr30') ?? lookupMetric(before, 'ropeSkipSpeed');
    const sr60Before = lookupMetric(before, 'sr60');
    const du30Before = lookupMetric(before, 'du30');
    const sr30After = lookupMetric(after, 'sr30') ?? lookupMetric(after, 'ropeSkipSpeed');
    const sr60After = lookupMetric(after, 'sr60');
    const du30After = lookupMetric(after, 'du30');

    const computeSRI = (sr30?: number, sr60?: number, du30?: number) => {
      if (!sr30 && !sr60 && !du30) return undefined;
      const weighted = (sr30 ?? 0) * 0.4 + (sr60 ?? 0) * 0.4 + (du30 ?? 0) * 0.2;
      const baseline = 100;
      return Math.round(((weighted / baseline) * 100) * 10) / 10;
    };

    const sriBefore = computeSRI(sr30Before, sr60Before, du30Before);
    const sriAfter = computeSRI(sr30After, sr60After, du30After);

    const deltas: Array<{ ability: AbilityKey; before?: number; after?: number }> = plan.focusAbilities.map(
      (ability) => ({ ability, before: abilityBefore[ability], after: abilityAfter[ability] }),
    );
    const improvements = deltas
      .filter((row) => typeof row.after === 'number' && typeof row.before === 'number')
      .map((row) => ({ ability: row.ability, delta: (row.after ?? 0) - (row.before ?? 0) }))
      .sort((a, b) => b.delta - a.delta);

    const highlights: string[] = [];
    if (improvements.length) {
      const top = improvements[0];
      highlights.push(`${student.name} 的 ${top.ability.toUpperCase()} 提升 ${top.delta.toFixed(1)} 分`);
    }
    if (sriAfter && sriBefore) {
      const diff = Math.round((sriAfter - sriBefore) * 10) / 10;
      if (diff >= 0.1) highlights.push(`专项速度指数提升 ${diff.toFixed(1)}%`);
    }

    const suggestions: string[] = [];
    if (improvements.length) {
      const weakest = improvements[improvements.length - 1];
      suggestions.push(`下周期建议加强 ${weakest.ability.toUpperCase()} 训练`);
    } else {
      suggestions.push('保持训练节奏，增加专项测评频率');
    }

    reports.push({
      id: generateId(),
      planId: plan.id,
      cycleId: plan.cycleId,
      studentId: student.id,
      classId: plan.classId,
      cycleName: plan.cycleName,
      generatedAt: new Date().toISOString(),
      startDate: plan.startDate,
      endDate: toIsoString(planEnd),
      abilityBefore,
      abilityAfter,
      sriBefore,
      sriAfter,
      highlights,
      suggestions,
    });
  }

  if (reports.length) {
    await db.cycleReports.bulkPut(reports);
  }
}

export const trainingRepo = {

  async exportLibrary(): Promise<TrainingLibrarySnapshot> {
    const [stages, plans, units, qualities, drills, games, missions, cycles, puzzles] = await Promise.all([
      db.trainingStages.toArray(),
      db.trainingPlans.toArray(),
      db.trainingUnits.toArray(),
      db.trainingQualities.toArray(),
      db.trainingDrills.toArray(),
      db.trainingGames.toArray(),
      db.missionCardsV2.toArray(),
      db.cycleTemplates.toArray(),
      puzzlesRepo.listTemplates(),
    ]);
    return {
      stages,
      plans,
      units,
      qualities,
      drills,
      games,
      missions,
      cycles,
      puzzles,
    };
  },

  async importLibrary(snapshot: Partial<TrainingLibrarySnapshot>, options: ImportOptions = {}): Promise<void> {
    const { replace = false } = options;
    await db.transaction(
      'rw',
      db.trainingStages,
      db.trainingPlans,
      db.trainingUnits,
      db.trainingQualities,
      db.trainingDrills,
      db.trainingGames,
      db.missionCardsV2,
      db.cycleTemplates,
      async () => {
        if (replace) {
          await Promise.all([
            db.trainingStages.clear(),
            db.trainingPlans.clear(),
            db.trainingUnits.clear(),
            db.trainingQualities.clear(),
            db.trainingDrills.clear(),
            db.trainingGames.clear(),
            db.missionCardsV2.clear(),
            db.cycleTemplates.clear(),
          ]);
        }

        if (snapshot.stages?.length) {
          await db.trainingStages.bulkPut(snapshot.stages.map(normaliseStage));
        }
        if (snapshot.plans?.length) {
          await db.trainingPlans.bulkPut(snapshot.plans.map(normalisePlan));
        }
        if (snapshot.units?.length) {
          await db.trainingUnits.bulkPut(snapshot.units.map(normaliseUnit));
        }
        if (snapshot.qualities?.length) {
          await db.trainingQualities.bulkPut(snapshot.qualities.map(normaliseQuality));
        }
        if (snapshot.drills?.length) {
          await db.trainingDrills.bulkPut(snapshot.drills.map(normaliseDrill));
        }
        if (snapshot.games?.length) {
          await db.trainingGames.bulkPut(snapshot.games.map(normaliseGame));
        }
        if (snapshot.missions?.length) {
          await db.missionCardsV2.bulkPut(snapshot.missions.map(normaliseMission));
        }
        if (snapshot.cycles?.length) {
          await db.cycleTemplates.bulkPut(snapshot.cycles.map(normaliseCycle));
        }
      },
    );
    await puzzlesRepo.importTemplates(snapshot.puzzles ?? [], { replace });
  },

  async saveQuality(quality: TrainingQuality): Promise<void> {
    const record = normaliseQuality(quality);
    await db.trainingQualities.put(record);
  },

  async deleteQuality(id: string): Promise<void> {
    await db.trainingQualities.delete(id);
  },

  async saveDrill(drill: TrainingDrill): Promise<void> {
    const record = normaliseDrill(drill);
    await db.trainingDrills.put(record);
  },

  async deleteDrill(id: string): Promise<void> {
    await db.trainingDrills.delete(id);
  },

  async saveGame(game: TrainingGame): Promise<void> {
    const record = normaliseGame(game);
    await db.trainingGames.put(record);
  },

  async deleteGame(id: string): Promise<void> {
    await db.trainingGames.delete(id);
  },

  async saveStage(stage: TrainingStage): Promise<void> {
    const record = normaliseStage(stage);
    await db.trainingStages.put(record);
  },

  async deleteStage(id: string): Promise<void> {
    await db.trainingStages.delete(id);
  },

  async savePlan(plan: TrainingPlan): Promise<void> {
    const record = normalisePlan(plan);
    await db.trainingPlans.put(record);
  },

  async deletePlan(id: string): Promise<void> {
    await db.trainingPlans.delete(id);
  },

  async saveUnit(unit: TrainingUnit): Promise<void> {
    const record = normaliseUnit(unit);
    await db.trainingUnits.put(record);
  },

  async deleteUnit(id: string): Promise<void> {
    await db.trainingUnits.delete(id);
  },

  async saveMissionCard(mission: MissionCardV2): Promise<void> {
    const record = normaliseMission(mission);
    await db.missionCardsV2.put(record);
  },

  async deleteMissionCard(id: string): Promise<void> {
    await db.missionCardsV2.delete(id);
  },

  async saveCycleTemplate(template: TrainingCycleTemplate): Promise<void> {
    const record = normaliseCycle(template);
    await db.cycleTemplates.put(record);
  },

  async deleteCycleTemplate(id: string): Promise<void> {
    await db.cycleTemplates.delete(id);
  },


  
  async replaceAssets(
    type: 'stage' | 'plan' | 'unit' | 'quality' | 'drill' | 'game' | 'mission' | 'cycle' | 'puzzle',
    items: any[],
  ): Promise<void> {
    const list = Array.isArray(items) ? items : [];
    if (type === 'quality') {
      await db.transaction('rw', db.trainingQualities, async () => {
        await db.trainingQualities.clear();
        if (list.length) {
          await db.trainingQualities.bulkPut(list.map(normaliseQuality));
        }
      });
      return;
    }
    if (type === 'drill') {
      await db.transaction('rw', db.trainingDrills, async () => {
        await db.trainingDrills.clear();
        if (list.length) {
          await db.trainingDrills.bulkPut(list.map(normaliseDrill));
        }
      });
      return;
    }
    if (type === 'game') {
      await db.transaction('rw', db.trainingGames, async () => {
        await db.trainingGames.clear();
        if (list.length) {
          await db.trainingGames.bulkPut(list.map(normaliseGame));
        }
      });
      return;
    }
    if (type === 'stage') {
      await db.transaction('rw', db.trainingStages, async () => {
        await db.trainingStages.clear();
        if (list.length) {
          await db.trainingStages.bulkPut(list.map(normaliseStage));
        }
      });
      return;
    }
    if (type === 'plan') {
      await db.transaction('rw', db.trainingPlans, async () => {
        await db.trainingPlans.clear();
        if (list.length) {
          await db.trainingPlans.bulkPut(list.map(normalisePlan));
        }
      });
      return;
    }
    if (type === 'unit') {
      await db.transaction('rw', db.trainingUnits, async () => {
        await db.trainingUnits.clear();
        if (list.length) {
          await db.trainingUnits.bulkPut(list.map(normaliseUnit));
        }
      });
      return;
    }
    if (type === 'mission') {
      await db.transaction('rw', db.missionCardsV2, async () => {
        await db.missionCardsV2.clear();
        if (list.length) {
          await db.missionCardsV2.bulkPut(list.map(normaliseMission));
        }
      });
      return;
    }
    if (type === 'puzzle') {
      await puzzlesRepo.replaceTemplates(list as PuzzleTemplate[]);
      return;
    }
    await db.transaction('rw', db.cycleTemplates, async () => {
      await db.cycleTemplates.clear();
      if (list.length) {
        await db.cycleTemplates.bulkPut(list.map(normaliseCycle));
      }
    });
  },
  async listStages(): Promise<TrainingStage[]> {
    return db.trainingStages.toArray();
  },
  async listPlans(): Promise<TrainingPlan[]> {
    return db.trainingPlans.toArray();
  },
  async listUnits(): Promise<TrainingUnit[]> {
    return db.trainingUnits.toArray();
  },
  async getStage(id: string): Promise<TrainingStage | undefined> {
    return db.trainingStages.get(id);
  },
  async getPlan(id: string): Promise<TrainingPlan | undefined> {
    return db.trainingPlans.get(id);
  },
  async getUnit(id: string): Promise<TrainingUnit | undefined> {
    return db.trainingUnits.get(id);
  },

  async listQualities(): Promise<TrainingQuality[]> {
    return db.trainingQualities.toArray();
  },
  async listDrills(): Promise<TrainingDrill[]> {
    return db.trainingDrills.toArray();
  },
  async listGames(): Promise<TrainingGame[]> {
    return db.trainingGames.toArray();
  },
  async listMissionCards(): Promise<MissionCardV2[]> {
    return db.missionCardsV2.toArray();
  },
  async listCycleTemplates(): Promise<TrainingCycleTemplate[]> {
    return db.cycleTemplates.toArray();
  },


  async getMissionCard(id: string): Promise<MissionCardV2 | undefined> {
    return db.missionCardsV2.get(id);
  },
  async getCycleTemplate(id: string): Promise<TrainingCycleTemplate | undefined> {
    return db.cycleTemplates.get(id);
  },
  async getActivePlan(classId: string): Promise<ClassCyclePlan | undefined> {
    const plans = await db.classCyclePlans.where({ classId }).toArray();
    return plans.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
  },
  async assignPlan({ classId, templateId, startDate }: AssignCyclePlanPayload): Promise<ClassCyclePlan> {
    const template = await db.cycleTemplates.get(templateId);
    if (!template) {
      throw new Error('未找到指定的周期模板');
    }
    const base = new Date(startDate);
    const sessions: ClassCycleSessionPlan[] = [];
    template.weekPlan.forEach((weekPlan) => {
      weekPlan.missionCards.forEach((missionCardId, index) => {
        sessions.push({
          id: generateId(),
          week: weekPlan.week,
          missionCardId,
          plannedDate: computeSessionDate(base, weekPlan.week, index),
          status: 'planned',
        });
      });
    });

    const plan: ClassCyclePlan = {
      id: generateId(),
      classId,
      cycleId: template.id,
      cycleName: template.name,
      goal: template.goal,
      durationWeeks: template.durationWeeks,
      startDate: toIsoString(base),
      currentWeek: 1,
      progress: sessions.length ? 0 : 1,
      focusAbilities: template.focusAbilities,
      trackingMetrics: template.trackingMetrics,
      sessions,
    };
    await db.classCyclePlans.put(plan);
    return plan;
  },
  async upsertPlan(plan: ClassCyclePlan) {
    await db.classCyclePlans.put(plan);
  },
  async markSessionCompleted(planId: string, sessionId: string, actualDate: string) {
    const plan = await db.classCyclePlans.get(planId);
    if (!plan) return;
    const session = plan.sessions.find((item) => item.id === sessionId);
    if (!session) {
      // 兼容旧数据：若仅存missionCardId则回退到匹配未完成的同卡片课程
      const fallback = plan.sessions.find(
        (item) => item.missionCardId === sessionId && item.status !== 'completed',
      );
      if (!fallback) return;
      fallback.status = 'completed';
      fallback.actualDate = actualDate;
      plan.progress = computeProgress(plan);
      plan.currentWeek = computeCurrentWeek(plan);
      if (plan.progress >= 1 && !plan.completedAt) {
        plan.completedAt = actualDate;
        await generateCycleReports(plan);
        plan.cycleReportGeneratedAt = new Date().toISOString();
      }
      await db.classCyclePlans.put(plan);
      return;
    }
    session.status = 'completed';
    session.actualDate = actualDate;
    plan.progress = computeProgress(plan);
    plan.currentWeek = computeCurrentWeek(plan);
    if (plan.progress >= 1 && !plan.completedAt) {
      plan.completedAt = actualDate;
      await generateCycleReports(plan);
      plan.cycleReportGeneratedAt = new Date().toISOString();
    }
    await db.classCyclePlans.put(plan);
  },
  async listCycleReportsByStudent(studentId: string): Promise<CycleReport[]> {
    return db.cycleReports.where({ studentId }).sortBy('generatedAt');
  },
};
