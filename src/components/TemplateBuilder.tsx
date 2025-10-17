import { useEffect, useMemo, useState } from 'react';
import type { TrainingPlan, TrainingStage, TrainingTemplate, TrainingUnit } from '../types';
import { trainingRepo } from '../store/repositories/trainingRepo';


import { GROWTH_ROADMAP_STAGES } from '../config/growthRoadmap';


interface TemplateBuilderProps {
  value: TrainingTemplate;
  onChange: (template: TrainingTemplate) => void;
}



const PERIOD_LABELS: Record<string, string> = {
  PREP: '准备期',
  SPEC: '专项准备期',
  COMP: '比赛期',
  TRANS: '恢复期',
  ALL: '通用',
};

const LOAD_LABELS: Record<string, string> = {
  light: '低负荷',
  moderate: '中等负荷',
  high: '高负荷',
};

const ABILITY_LABELS: Record<string, string> = {
  speed: '速度',
  power: '力量',
  coordination: '协调',
  agility: '灵敏',
  endurance: '耐力',
  flexibility: '柔韧',
  balance: '平衡',
  accuracy: '精准度',
  core: '核心',
};


interface SelectedUnitRow {
  key: string;
  unit: TrainingUnit | undefined;
  index: number;
}



export function TemplateBuilder({ value, onChange }: TemplateBuilderProps) {
  const [draft, setDraft] = useState<TrainingTemplate>(() => ({
    ...value,
    unitIds: Array.isArray(value.unitIds) ? value.unitIds : [],
  }));
  const [stages, setStages] = useState<TrainingStage[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [units, setUnits] = useState<TrainingUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  const growthLookup = useMemo(
    () => new Map(GROWTH_ROADMAP_STAGES.map((stage) => [stage.id, stage.name])),
    [],
  );


  useEffect(() => {
    setDraft({
      ...value,
      unitIds: Array.isArray(value.unitIds) ? value.unitIds : [],
    });
  }, [value]);

  useEffect(() => {
    setLoading(true);
    void Promise.all([trainingRepo.listStages(), trainingRepo.listPlans(), trainingRepo.listUnits()])
      .then(([stageList, planList, unitList]) => {
        setStages(stageList);
        setPlans(planList);
        setUnits(unitList);
      })
      .finally(() => setLoading(false));
  }, []);

  const emit = (next: TrainingTemplate) => {
    setDraft(next);
    onChange(next);
  };

  const stageLookup = useMemo(() => new Map(stages.map((stage) => [stage.id, stage])), [stages]);
  const planLookup = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);
  const unitLookup = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);

  const availableUnits = useMemo(() => {
    const scopedUnits = draft.stageId ? units.filter((unit) => unit.stageId === draft.stageId) : units;
    return scopedUnits.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }, [draft.stageId, units]);

  const planOptions = useMemo(() => {
    if (!draft.stageId) return plans;
    return plans.filter((plan) => plan.stageId === draft.stageId);
  }, [draft.stageId, plans]);

  const activeStage = draft.stageId ? stageLookup.get(draft.stageId) : undefined;
  const activePlan = draft.planId ? planLookup.get(draft.planId) : undefined;

  const selectedUnitRows: SelectedUnitRow[] = useMemo(() => {
    return draft.unitIds.map((unitId, index) => ({
      key: `${unitId}-${index}`,
      unit: unitLookup.get(unitId),
      index,
    }));
  }, [draft.unitIds, unitLookup]);

  const legacyBlocks = useMemo(() => {
    if (draft.unitIds.length) return [];
    return Array.isArray(value.blocks) ? value.blocks : [];
  }, [draft.unitIds.length, value.blocks]);

  const applyPlan = (plan: TrainingPlan | undefined) => {
    if (!plan) {
      emit({ ...draft, planId: undefined });
      return;
    }
    const orderedUnits = plan.weeks.flatMap((week) => week.unitIds);
    emit({
      ...draft,
      stageId: plan.stageId,
      planId: plan.id,
      unitIds: orderedUnits,
    });
  };

  const handleStageChange = (stageId: string) => {
    const nextStageId = stageId || undefined;
    const allowedUnitIds = nextStageId
      ? new Set(units.filter((unit) => unit.stageId === nextStageId).map((unit) => unit.id))
      : new Set(units.map((unit) => unit.id));
    const nextUnitIds = draft.unitIds.filter((id) => allowedUnitIds.has(id));
    const nextPlanId =
      nextStageId && draft.planId && planLookup.get(draft.planId)?.stageId === nextStageId
        ? draft.planId
        : undefined;
    emit({
      ...draft,
      stageId: nextStageId,
      planId: nextPlanId,
      unitIds: nextUnitIds,
    });
  };

  const handlePlanChange = (planId: string) => {
    const plan = planLookup.get(planId);
    applyPlan(plan);
  };

  const addUnit = (unitId: string) => {
    emit({ ...draft, unitIds: [...draft.unitIds, unitId] });
  };

  const removeUnit = (index: number) => {
    emit({
      ...draft,
      unitIds: draft.unitIds.filter((_, idx) => idx !== index),
    });
  };

  const moveUnit = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.unitIds.length) return;
    const updated = [...draft.unitIds];
    const [item] = updated.splice(index, 1);
    updated.splice(nextIndex, 0, item);
    emit({ ...draft, unitIds: updated });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        正在加载训练资产层级...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-600">阶段设置</span>
            <select
              value={draft.stageId ?? ''}
              onChange={(event) => handleStageChange(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">全部阶段（自定义）</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.icon ?? '🎯'} {stage.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-600">周期计划</span>
            <select
              value={draft.planId ?? ''}
              onChange={(event) => handlePlanChange(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">自定义编排</option>
              {planOptions.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {plan.durationWeeks} 周
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-1 text-sm">
            <span className="font-medium text-slate-600">已选单元数量</span>
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700">
              {draft.unitIds.length} 个单元
            </div>
          </div>
        </div>
        {activeStage && (
          <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-3 text-sm text-slate-600">
            <div className="flex items-center gap-2 text-brand-600">
              <span className="text-lg">{activeStage.icon ?? '🎯'}</span>
              <span className="font-semibold">{activeStage.name}</span>
            </div>
            <p className="mt-1 leading-relaxed">{activeStage.summary}</p>

            
            {activeStage.growthRoadmapStageId ? (
              <p className="mt-1 text-[11px] text-slate-500">
                对应成长路线：
                {growthLookup.get(String(activeStage.growthRoadmapStageId)) ?? activeStage.growthRoadmapStageId}
              </p>
            ) : null}
            {activeStage.heroMetric ? (
              <p className="mt-1 text-xs text-brand-600">阶段标志：{activeStage.heroMetric}</p>
            ) : null}

            {activeStage.focusAbilities?.length ? (
              <p className="mt-2 text-xs text-slate-500">
                重点能力：
                {activeStage.focusAbilities
                  .map((ability) => ABILITY_LABELS[ability] ?? ability)
                  .join('、')}
              </p>
            ) : null}

            
            {activeStage.coreTasks?.length ? (
              <p className="mt-2 text-xs text-slate-500">
                核心任务：{activeStage.coreTasks.join('、')}
              </p>
            ) : null}
            {activeStage.keyMilestones?.length ? (
              <p className="mt-1 text-[11px] text-slate-500">
                关键里程碑：{activeStage.keyMilestones.join(' → ')}
              </p>
            ) : null}
            {activeStage.cycleThemes && activeStage.cycleThemes.length ? (
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                {activeStage.cycleThemes.map((theme) => (
                  <div key={`${theme.period}-${theme.title}`} className="rounded-md border border-brand-100 bg-white/70 p-2">
                    <div className="font-semibold text-brand-600">
                      {PERIOD_LABELS[theme.period] ?? theme.period}
                      {theme.title ? ` · ${theme.title}` : ''}
                    </div>
                    <p className="mt-1 leading-relaxed">{theme.focus}</p>
                    <div className="mt-1 text-[11px] text-slate-500">
                      负荷：{LOAD_LABELS[String(theme.load)] ?? theme.load}
                    </div>
                    {theme.notes ? (
                      <p className="mt-1 text-[11px] text-amber-600">提醒：{theme.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            {activeStage.ageGuidance && activeStage.ageGuidance.length ? (
              <div className="mt-3 rounded-md border border-brand-100 bg-white/70 p-2 text-xs text-slate-600">
                <p className="font-semibold text-brand-600">年龄分层重点</p>
                <ul className="mt-1 space-y-1">
                  {activeStage.ageGuidance.map((item) => (
                    <li key={item.range} className="leading-relaxed">
                      <span className="font-semibold text-slate-700">{item.range}：</span>
                      <span>{item.priorities.join('、')}</span>
                      <span className="ml-1 text-[11px] text-slate-500">
                        负荷：{LOAD_LABELS[String(item.load)] ?? item.load}
                      </span>
                      {item.cautions && item.cautions.length ? (
                        <span className="ml-1 text-[11px] text-amber-600">
                          注意：{item.cautions.join('、')}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

          </div>
        )}
        {activePlan && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3 text-sm">
            <div className="flex items-center justify-between text-indigo-600">
              <span className="font-semibold">{activePlan.name}</span>
              <button
                type="button"
                onClick={() => applyPlan(activePlan)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                重新应用周期建议
              </button>
            </div>
            {activePlan.summary && <p className="mt-1 text-slate-600">{activePlan.summary}</p>}

            
            {activePlan.phases && activePlan.phases.length ? (
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                {activePlan.phases.map((phase) => (
                  <div key={`${phase.id}-${phase.name}`} className="space-y-1 rounded-md border border-indigo-100 bg-white/70 p-2">
                    <div className="flex items-center justify-between text-indigo-600">
                      <span className="font-semibold">
                        {PERIOD_LABELS[phase.id] ?? phase.name ?? phase.id}
                      </span>
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-600">
                        {phase.durationWeeks} 周
                      </span>
                    </div>
                    <p className="leading-relaxed">{phase.goal}</p>
                    <p className="text-[11px] text-slate-500">
                      负荷：{LOAD_LABELS[String(phase.load)] ?? phase.load}
                    </p>
                    {phase.focusPoints?.length ? (
                      <p className="text-[11px] text-slate-500">
                        重点：{phase.focusPoints.join('、')}
                      </p>
                    ) : null}
                    {phase.recommendedAges?.length ? (
                      <p className="text-[11px] text-slate-400">
                        推荐年龄：{phase.recommendedAges.join(' / ')}
                      </p>
                    ) : null}
                    {phase.monitoring ? (
                      <p className="text-[11px] text-slate-400">监测：{phase.monitoring}</p>
                    ) : null}
                    {phase.notes ? (
                      <p className="text-[11px] text-amber-600">提醒：{phase.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
              {activePlan.weeks.map((week) => (
                <div key={week.week} className="rounded-md border border-indigo-100 bg-white/70 p-2">
                  <div className="font-semibold text-indigo-600">第 {week.week} 周</div>
                  {week.theme && <p className="mt-1 text-slate-600">主题：{week.theme}</p>}
                  <ul className="mt-1 space-y-1">
                    {week.unitIds.map((unitId) => {
                      const unit = unitLookup.get(unitId);
                      return (
                        <li key={`${week.week}-${unitId}`} className="text-slate-500">
                          {unit ? unit.name : `未找到单元 ${unitId}`}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">已纳入的训练单元</h3>
          {draft.unitIds.length > 1 && (
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-red-500"
              onClick={() => emit({ ...draft, unitIds: [] })}
            >
              清空所有单元
            </button>
          )}
        </div>
        {selectedUnitRows.length ? (
          <div className="space-y-3">
            {selectedUnitRows.map(({ key, unit, index }) => (
              <div key={key} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      {index + 1}. {unit ? unit.name : '缺失的训练单元'}
                    </div>
                    {unit?.focus && <div className="text-xs text-slate-500">目标：{unit.focus}</div>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => moveUnit(index, -1)}
                      className="rounded border border-slate-200 px-2 py-1 text-slate-500 hover:bg-slate-50"
                      disabled={index === 0}
                    >
                      上移
                    </button>
                    <button
                      type="button"
                      onClick={() => moveUnit(index, 1)}
                      className="rounded border border-slate-200 px-2 py-1 text-slate-500 hover:bg-slate-50"
                      disabled={index === selectedUnitRows.length - 1}
                    >
                      下移
                    </button>
                    <button
                      type="button"
                      onClick={() => removeUnit(index)}
                      className="rounded border border-red-200 px-2 py-1 text-red-500 hover:bg-red-50"
                    >
                      移除
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedUnitId((prev) => (prev === key ? null : key))}
                      className="rounded border border-slate-200 px-2 py-1 text-slate-500 hover:bg-slate-50"
                    >
                      {expandedUnitId === key ? '收起内容' : '查看结构'}
                    </button>
                  </div>
                </div>
                {expandedUnitId === key && unit && (
                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    {unit.blocks.map((block) => (
                      <div key={block.id} className="rounded-md border border-slate-100 bg-slate-50 p-2">
                        <div className="font-semibold text-slate-700">{block.title}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">

                          
                          
                          <span>
                            周期：
                            {PERIOD_LABELS[(block.period as string) ?? 'ALL'] ?? block.period ?? '通用'}
                          </span>

                          {block.durationMin ? <span>时长：{block.durationMin} min</span> : null}
                          {block.intensity ? <span>强度：{block.intensity}</span> : null}
                          {block.stimulus ? <span>刺激：{block.stimulus}</span> : null}
                        </div>
                        {block.notes && <p className="mt-1 leading-relaxed">{block.notes}</p>}
                        {block.drillIds?.length ? (
                          <p className="mt-1">动作：{block.drillIds.join('、')}</p>
                        ) : null}
                        {block.gameIds?.length ? <p className="mt-1">游戏：{block.gameIds.join('、')}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            尚未选择训练单元，可从下方资产库中加入。
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">训练单元资产库</h3>
          <span className="text-xs text-slate-400">
            {availableUnits.length} 个单元（{draft.stageId ? '当前阶段' : '全部阶段'}）
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {availableUnits.map((unit) => (
            <div key={unit.id} className="flex h-full flex-col rounded-lg border border-slate-200 p-3">
              <div className="flex-1 space-y-2">
                <div className="text-sm font-semibold text-slate-700">{unit.name}</div>
                <p className="text-xs text-slate-500">目标：{unit.focus}</p>
                {unit.tags?.length ? (
                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-400">
                    {unit.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => addUnit(unit.id)}
                className="mt-3 rounded-lg border border-brand-200 bg-brand-50 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100"
              >
                加入模板
              </button>
            </div>
          ))}
        </div>
        {!availableUnits.length && (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
            该阶段暂未配置单元，请先在训练资产库中创建。
          </div>
        )}
      </section>

      {legacyBlocks.length > 0 && (
        <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <h3 className="font-semibold">存在旧版自定义段落</h3>
          <p>
            该任务卡尚未引用新的单元资产。建议选择上方阶段 / 周期并添加标准单元。以下为旧数据预览：
          </p>
          <div className="space-y-2 text-xs text-amber-800">
            {legacyBlocks.map((block) => (
              <div key={block.id} className="rounded border border-amber-200 bg-white/80 p-2">
                <div className="font-semibold">{block.title}</div>
                {block.notes && <p className="mt-1 whitespace-pre-wrap">{block.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
