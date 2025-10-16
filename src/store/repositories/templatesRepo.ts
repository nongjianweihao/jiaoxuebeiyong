import { db } from '../db';
import type {
  TemplateBlock,
  TrainingPlan,
  TrainingStage,
  TrainingTemplate,
  TrainingUnit,
} from '../../types';

function sanitiseTemplate(template: TrainingTemplate): TrainingTemplate {
  const { resolvedUnits, resolvedBlocks, resolvedStage, resolvedPlan, ...rest } = template;
  const unitIds = Array.isArray(rest.unitIds) ? rest.unitIds : [];
  const blocks: TemplateBlock[] = unitIds.length
    ? []
    : Array.isArray(rest.blocks)
    ? rest.blocks
    : [];
  return {
    ...rest,
    unitIds,
    blocks,
  };
}

function resolveBlocksFromUnits(
  template: TrainingTemplate,
  units: TrainingUnit[],
): TemplateBlock[] {
  if (!units.length) return Array.isArray(template.blocks) ? template.blocks : [];
  const seenIds = new Set<string>();
  return units.flatMap((unit) =>
    unit.blocks.map((block, index) => {
      const baseId = block.id ?? `${unit.id}-${index}`;
      let uniqueId = baseId;
      let counter = 1;
      while (seenIds.has(uniqueId)) {
        uniqueId = `${baseId}-${counter++}`;
      }
      seenIds.add(uniqueId);
      return {
        ...block,
        id: uniqueId,
        period: block.period ?? unit.period ?? template.period,
      };
    }),
  );
}

async function hydrateTemplate(template: TrainingTemplate): Promise<TrainingTemplate> {
  const unitIds = Array.isArray(template.unitIds) ? template.unitIds : [];
  if (!unitIds.length) {
    return {
      ...template,
      unitIds: [],
      blocks: Array.isArray(template.blocks) ? template.blocks : [],
      resolvedBlocks: Array.isArray(template.blocks) ? template.blocks : [],
      resolvedUnits: [],
    };
  }
  const [unitRecords, stage, plan] = await Promise.all([
    db.trainingUnits.bulkGet(unitIds),
    template.stageId ? db.trainingStages.get(template.stageId) : Promise.resolve(undefined),
    template.planId ? db.trainingPlans.get(template.planId) : Promise.resolve(undefined),
  ]);
  const unitLookup = new Map<string, TrainingUnit>();
  unitRecords.forEach((unit) => {
    if (unit) unitLookup.set(unit.id, unit);
  });
  const resolvedUnits = unitIds
    .map((id) => unitLookup.get(id))
    .filter((unit): unit is TrainingUnit => Boolean(unit));
  const resolvedBlocks = resolveBlocksFromUnits(template, resolvedUnits);
  return {
    ...template,
    unitIds,
    blocks: resolvedBlocks,
    resolvedBlocks,
    resolvedUnits,
    resolvedStage: stage as TrainingStage | undefined,
    resolvedPlan: plan as TrainingPlan | undefined,
  };
}

export const templatesRepo = {
  async upsert(template: TrainingTemplate) {
    const record = sanitiseTemplate(template);
    await db.templates.put(record);
  },
  async list() {
    const templates = await db.templates.toArray();
    return Promise.all(templates.map((item) => hydrateTemplate(item)));
  },
  async get(id: string) {
    const template = await db.templates.get(id);
    if (!template) return undefined;
    return hydrateTemplate(template);
  },
  async remove(id: string) {
    await db.templates.delete(id);
  },
};
