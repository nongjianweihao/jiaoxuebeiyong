import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { trainingRepo, type TrainingLibrarySnapshot } from '../../store/repositories/trainingRepo';
import type {
  MissionBlock,
  MissionCardV2,
  CycleWeekPlan,
  TrainingCycleTemplate,
  TrainingDrill,
  TrainingGame,
  TrainingQuality,
  TrainingPlan,
  TrainingStage,
  TrainingUnit,
} from '../../types';
import type { PuzzleCardTemplate, PuzzleCategory, PuzzleTemplate } from '../../types.gamify';
import { puzzlesRepo } from '../../store/repositories/puzzlesRepo';
import { GROWTH_ROADMAP_STAGES } from '../../config/growthRoadmap';

const INTENSITY_OPTIONS = ['💧', '🌈', '⚡'] as const;
const STIMULUS_OPTIONS = ['neural', 'strength', 'metabolic', 'technical', 'psychological'] as const;
const STIMULUS_LABELS: Record<(typeof STIMULUS_OPTIONS)[number], string> = {
  neural: '神经',
  strength: '力量',
  metabolic: '代谢',
  technical: '技术',
  psychological: '心理',
};
const PERIOD_OPTIONS = ['PREP', 'SPEC', 'COMP', 'TRANS'] as const;
const PERIOD_LABELS: Record<(typeof PERIOD_OPTIONS)[number], string> = {
  PREP: '备战期',
  SPEC: '专项期',
  COMP: '比赛期',
  TRANS: '过渡期',
};
const DURATION_OPTIONS = [4, 6, 8, 10, 12] as const;
const CATEGORY_OPTIONS = [
  { value: 'jump', label: '跳绳成长' },
  { value: 'general', label: '通用体能' },
  { value: 'custom', label: '自定义' },
] as const;

const PUZZLE_CATEGORY_OPTIONS: Array<{ value: PuzzleCategory; label: string }> = [
  { value: 'poem', label: '诗词文化' },
  { value: 'motivation', label: '激励语录' },
  { value: 'emoji', label: 'Emoji 暗语' },
  { value: 'mosaic', label: '图腾拼片' },
  { value: 'story', label: '情境故事' },
  { value: 'math', label: '逻辑数锁' },
  { value: 'science', label: '科学知识' },
  { value: 'habit', label: '习惯养成' },
  { value: 'team', label: '战队徽章' },
  { value: 'image', label: '视觉海报' },
  { value: 'wisdom', label: '智慧语录' },
  { value: 'riddle', label: '解谜探险' },
];

const PUZZLE_ASSIGN_OPTIONS = [
  { value: 'class', label: '课堂主线' },
  { value: 'team', label: '战队挑战' },
  { value: 'individual', label: '个人练习' },
] as const;

const PUZZLE_SCENE_OPTIONS = [
  { value: '', label: '— 无 —' },
  { value: '课堂主线', label: '课堂主线' },
  { value: '战队挑战', label: '战队挑战' },
  { value: '个人练习', label: '个人练习' },
  { value: '混合', label: '混合' },
];

const ASSET_LABEL: Record<TrainingAssetType, string> = {
  stage: '成长阶段',
  plan: '周期资产',
  unit: '训练单元',
  quality: '能力维度',
  drill: '训练动作',
  game: '训练游戏',
  mission: '课节模板',
  cycle: '周期模板',
  puzzle: '主线谜题',
};

function splitList(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[，,、\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export type TrainingAssetType =
  | 'stage'
  | 'plan'
  | 'unit'
  | 'quality'
  | 'drill'
  | 'game'
  | 'mission'
  | 'cycle'
  | 'puzzle';

type AssetType = TrainingAssetType;

interface ManagerProps {
  open: boolean;
  onClose: (changed: boolean) => void;
  initialTab?: TrainingAssetType;
  initialCreateType?: TrainingAssetType | null;
}

interface EditState<T> {
  type: TrainingAssetType;
  record: T | null;
}

const blankStage: TrainingStage = {
  id: '',
  name: '',
  summary: '',
  icon: '🎯',
  color: '#2563eb',
  focusAbilities: [],

  
  coreTasks: [],
  keyMilestones: [],
  ageGuidance: [],
  cycleThemes: [],

};

const blankPlan: TrainingPlan = {
  id: '',
  stageId: '',
  name: '',
  durationWeeks: 4,
  summary: '',
  focusAbilities: [],
  weeks: [],

  
  phases: [],

};

const blankUnit: TrainingUnit = {
  id: '',
  stageId: '',
  name: '',
  focus: '',
  durationMin: 30,
  tags: [],
  period: 'ALL',
  blocks: [],
};

const blankQuality: TrainingQuality = {
  id: '',
  name: '',
  description: '',
  color: '#38bdf8',
  icon: '⚡',
};

const blankDrill: TrainingDrill = {
  id: '',
  name: '',
  type: 'drill',
  primaryAbilities: [],
  secondaryAbilities: [],
  stimulusType: 'technical',
  intensity: '🌈',
  durationMin: 10,
};

const blankGame: TrainingGame = {
  id: '',
  name: '',
  goal: '',
  focusAbilities: [],
  stimulusType: 'psychological',
  intensity: '🌈',
  groupSize: '全班',
  durationMin: 10,
  rules: '',
};

const blankMission: MissionCardV2 = {
  id: '',
  name: '',
  phase: 'PREP',
  durationMin: 30,
  focusAbilities: [],
  blocks: [],
};

const blankCycle: TrainingCycleTemplate = {
  id: '',
  name: '',
  goal: '',
  durationWeeks: 4,
  focusAbilities: [],
  weekPlan: [],
  trackingMetrics: [],
  stageId: undefined,
  summary: '',
  category: 'jump',
  recommendedFor: [],
};

const blankPuzzle: PuzzleTemplate = {
  id: '',
  name: '',
  code: undefined,
  tags: [],
  totalCards: 0,
  totalEnergy: 0,
  category: 'poem',
  description: '',
  assignedTo: 'class',
  difficulty: 3,
  recommendedScene: undefined,
  recommendedAges: '',
  focusAbilities: [],
  cards: [],
  continueAcrossSessions: true,
};

interface StageFormProps {
  value: TrainingStage;
  onChange: (value: TrainingStage) => void;
  stages: TrainingStage[];
}

function StageForm({ value, onChange, stages }: StageFormProps) {

  
  const [ageGuidanceText, setAgeGuidanceText] = useState(
    () => JSON.stringify(value.ageGuidance ?? [], null, 2),
  );
  const [cycleThemesText, setCycleThemesText] = useState(
    () => JSON.stringify(value.cycleThemes ?? [], null, 2),
  );

  useEffect(() => {
    setAgeGuidanceText(JSON.stringify(value.ageGuidance ?? [], null, 2));
  }, [value.ageGuidance]);

  useEffect(() => {
    setCycleThemesText(JSON.stringify(value.cycleThemes ?? [], null, 2));
  }, [value.cycleThemes]);


  return (
    <div className="grid gap-3 text-sm">
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">阶段名称</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">阶段图标</span>
        <input
          value={value.icon ?? ''}
          onChange={(event) => onChange({ ...value, icon: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">主题色</span>
        <input
          value={value.color ?? ''}
          onChange={(event) => onChange({ ...value, color: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">阶段摘要</span>
        <textarea
          value={value.summary ?? ''}
          onChange={(event) => onChange({ ...value, summary: event.target.value })}
          className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">

        
        <span className="text-xs font-semibold text-slate-500">阶段标志（如达成标准）</span>
        <input
          value={value.heroMetric ?? ''}
          onChange={(event) => onChange({ ...value, heroMetric: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">

        <span className="text-xs font-semibold text-slate-500">重点能力（用逗号分隔）</span>
        <input
          value={(value.focusAbilities ?? []).join(', ')}
          onChange={(event) => onChange({ ...value, focusAbilities: splitList(event.target.value) as any })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">

        
        <span className="text-xs font-semibold text-slate-500">核心任务（用逗号分隔）</span>
        <input
          value={(value.coreTasks ?? []).join(', ')}
          onChange={(event) => onChange({ ...value, coreTasks: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">关键里程碑（顺序排列，用逗号分隔）</span>
        <input
          value={(value.keyMilestones ?? []).join(', ')}
          onChange={(event) => onChange({ ...value, keyMilestones: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">成长路线映射 ID（rookie/warrior/elite/legend，对应新秀/勇士/精英/传奇）</span>
        <input
          value={value.growthRoadmapStageId ?? ''}
          onChange={(event) => onChange({ ...value, growthRoadmapStageId: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">年龄分层 JSON</span>
        <textarea
          value={ageGuidanceText}
          onChange={(event) => {
            const next = event.target.value;
            setAgeGuidanceText(next);
            try {
              const parsed = JSON.parse(next || '[]');
              if (Array.isArray(parsed)) {
                onChange({ ...value, ageGuidance: parsed as TrainingStage['ageGuidance'] });
              }
            } catch {
              // 忽略解析错误，等待用户修正
            }
          }}
          className="h-32 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs"
          placeholder='[ { "range": "6-8 岁", "priorities": ["节奏", "协调"], "load": "轻负荷" } ]'
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">周期主题 JSON（准备/专项/比赛/恢复）</span>
        <textarea
          value={cycleThemesText}
          onChange={(event) => {
            const next = event.target.value;
            setCycleThemesText(next);
            try {
              const parsed = JSON.parse(next || '[]');
              if (Array.isArray(parsed)) {
                onChange({ ...value, cycleThemes: parsed as TrainingStage['cycleThemes'] });
              }
            } catch {
              // 忽略解析错误，等待用户修正
            }
          }}
          className="h-32 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs"
          placeholder='[ { "period": "PREP", "title": "准备期", "focus": "节奏激活", "load": "轻负荷" } ]'
        />
      </label>
      <label className="space-y-1">

        <span className="text-xs font-semibold text-slate-500">推荐下一阶段</span>
        <select
          value={value.recommendedNextStageId ?? ''}
          onChange={(event) =>
            onChange({ ...value, recommendedNextStageId: event.target.value || undefined })
          }
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="">— 无 —</option>
          {stages
            .filter((stage) => stage.id !== value.id)
            .map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}

interface PlanFormProps {
  value: TrainingPlan;
  onChange: (value: TrainingPlan) => void;
  stages: TrainingStage[];
  weeksJson: string;
  onWeeksChange: (value: string) => void;

  
  phasesJson: string;
  onPhasesChange: (value: string) => void;
}

function PlanForm({
  value,
  onChange,
  stages,
  weeksJson,
  onWeeksChange,
  phasesJson,
  onPhasesChange,
}: PlanFormProps) {

  return (
    <div className="grid gap-3 text-sm">
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">所属阶段</span>
        <select
          value={value.stageId ?? ''}
          onChange={(event) => onChange({ ...value, stageId: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="">— 请选择阶段 —</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">周期名称</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">周期周数</span>
        <input
          type="number"
          min={1}
          value={value.durationWeeks}
          onChange={(event) => onChange({ ...value, durationWeeks: Number(event.target.value) || 0 })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">周期摘要</span>
        <textarea
          value={value.summary ?? ''}
          onChange={(event) => onChange({ ...value, summary: event.target.value })}
          className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">重点能力（逗号分隔）</span>
        <input
          value={(value.focusAbilities ?? []).join(', ')}
          onChange={(event) => onChange({ ...value, focusAbilities: splitList(event.target.value) as any })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">周次安排 JSON</span>
        <textarea
          value={weeksJson}
          onChange={(event) => onWeeksChange(event.target.value)}
          className="h-32 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
          placeholder='[ { "week": 1, "unitIds": ["unit-001"], "theme": "激活" } ]'
        />
      </label>

      
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">阶段结构 JSON（准备/专项/比赛/恢复）</span>
        <textarea
          value={phasesJson}
          onChange={(event) => onPhasesChange(event.target.value)}
          className="h-32 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
          placeholder='[ { "id": "PREP", "name": "准备期", "durationWeeks": 2, "goal": "激活节奏", "load": "轻负荷", "focusPoints": ["节奏感", "体态"], "recommendedAges": ["6-8 岁"] } ]'
        />
      </label>

    </div>
  );
}

interface UnitFormProps {
  value: TrainingUnit;
  onChange: (value: TrainingUnit) => void;
  stages: TrainingStage[];
  blocksJson: string;
  onBlocksChange: (value: string) => void;
}

function UnitForm({ value, onChange, stages, blocksJson, onBlocksChange }: UnitFormProps) {
  return (
    <div className="grid gap-3 text-sm">
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">所属阶段</span>
        <select
          value={value.stageId ?? ''}
          onChange={(event) => onChange({ ...value, stageId: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="">— 请选择阶段 —</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">单元名称</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">目标聚焦</span>
        <input
          value={value.focus}
          onChange={(event) => onChange({ ...value, focus: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">适用周期</span>
          <select
            value={value.period ?? 'ALL'}
            onChange={(event) => onChange({ ...value, period: event.target.value as any })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="ALL">通用</option>
            <option value="PREP">准备期</option>
            <option value="SPEC">专项准备期</option>
            <option value="COMP">比赛期</option>

            
            <option value="TRANS">恢复期</option>

          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">建议时长（分钟）</span>
          <input
            type="number"
            min={0}
            value={value.durationMin ?? 0}
            onChange={(event) => onChange({ ...value, durationMin: Number(event.target.value) || 0 })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">标签（逗号分隔）</span>
        <input
          value={(value.tags ?? []).join(', ')}
          onChange={(event) => onChange({ ...value, tags: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">单元简介</span>
        <textarea
          value={value.summary ?? ''}
          onChange={(event) => onChange({ ...value, summary: event.target.value })}
          className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">环节结构 JSON</span>
        <textarea
          value={blocksJson}
          onChange={(event) => onBlocksChange(event.target.value)}
          className="h-36 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
          placeholder='[ { "id": "block-1", "title": "热身", "period": "PREP", "drillIds": [] } ]'
        />
      </label>
    </div>
  );
}

interface QualityFormProps {
  value: TrainingQuality;
  onChange: (value: TrainingQuality) => void;
}

function QualityForm({ value, onChange }: QualityFormProps) {
  return (
    <div className="grid gap-3 text-sm">
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">名称</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">图标</span>
        <input
          value={value.icon}
          onChange={(event) => onChange({ ...value, icon: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">颜色</span>
        <input
          value={value.color}
          onChange={(event) => onChange({ ...value, color: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">描述</span>
        <textarea
          value={value.description ?? ''}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
    </div>
  );
}

interface DrillFormProps {
  value: TrainingDrill;
  onChange: (value: TrainingDrill) => void;
}

function DrillForm({ value, onChange }: DrillFormProps) {
  return (
    <div className="grid gap-3 text-sm">
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">名称</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">时长 (分钟)</span>
          <input
            type="number"
            value={value.durationMin}
            onChange={(event) => onChange({ ...value, durationMin: Number(event.target.value) })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">强度</span>
          <select
            value={value.intensity}
            onChange={(event) => onChange({ ...value, intensity: event.target.value as typeof INTENSITY_OPTIONS[number] })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {INTENSITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">刺激类型</span>
        <select
          value={value.stimulusType}
          onChange={(event) => onChange({ ...value, stimulusType: event.target.value as typeof STIMULUS_OPTIONS[number] })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          {STIMULUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {STIMULUS_LABELS[option]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">核心能力标签</span>
        <input
          value={value.primaryAbilities.join(', ')}
          onChange={(event) => onChange({ ...value, primaryAbilities: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
        <p className="text-[11px] text-slate-400">逗号分隔，例如：极速(speed)、爆发力(power)</p>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">辅助能力</span>
        <input
          value={value.secondaryAbilities?.join(', ') ?? ''}
          onChange={(event) => onChange({ ...value, secondaryAbilities: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">器材</span>
        <input
          value={value.equipment?.join(', ') ?? ''}
          onChange={(event) => onChange({ ...value, equipment: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">教练提示</span>
        <textarea
          value={value.coachTips ?? ''}
          onChange={(event) => onChange({ ...value, coachTips: event.target.value })}
          className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
    </div>
  );
}

interface GameFormProps {
  value: TrainingGame;
  onChange: (value: TrainingGame) => void;
}

function GameForm({ value, onChange }: GameFormProps) {
  return (
    <div className="grid gap-3 text-sm">
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">名称</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">时长 (分钟)</span>
          <input
            type="number"
            value={value.durationMin}
            onChange={(event) => onChange({ ...value, durationMin: Number(event.target.value) })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">小组形式</span>
          <select
            value={value.groupSize}
            onChange={(event) => onChange({ ...value, groupSize: event.target.value as TrainingGame['groupSize'] })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="1v1">1v1</option>
            <option value="3v3">3v3</option>
            <option value="全班">全班</option>
          </select>
        </label>
      </div>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">目标</span>
        <textarea
          value={value.goal}
          onChange={(event) => onChange({ ...value, goal: event.target.value })}
          className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">能力标签</span>
        <input
          value={value.focusAbilities.join(', ')}
          onChange={(event) => onChange({ ...value, focusAbilities: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">刺激类型</span>
        <select
          value={value.stimulusType}
          onChange={(event) => onChange({ ...value, stimulusType: event.target.value as typeof STIMULUS_OPTIONS[number] })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          {STIMULUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {STIMULUS_LABELS[option]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">器材</span>
        <input
          value={value.equipment?.join(', ') ?? ''}
          onChange={(event) => onChange({ ...value, equipment: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">规则</span>
        <textarea
          value={value.rules}
          onChange={(event) => onChange({ ...value, rules: event.target.value })}
          className="h-32 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">教练提示</span>
        <textarea
          value={value.coachTips ?? ''}
          onChange={(event) => onChange({ ...value, coachTips: event.target.value })}
          className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
    </div>
  );
}

interface MissionFormProps {
  value: MissionCardV2;
  blocks: MissionBlock[];
  onChange: (value: MissionCardV2) => void;
  onBlocksChange: (value: MissionBlock[]) => void;
  drills: TrainingDrill[];
  games: TrainingGame[];
  puzzles: PuzzleTemplate[];
}

function MissionForm({ value, blocks, onChange, onBlocksChange, drills, games, puzzles }: MissionFormProps) {
  const drillLookup = useMemo(() => new Map(drills.map((item) => [item.id, item])), [drills]);
  const gameLookup = useMemo(() => new Map(games.map((item) => [item.id, item])), [games]);
  const puzzleLookup = useMemo(() => new Map(puzzles.map((item) => [item.id, item])), [puzzles]);

  const setBlock = useCallback(
    (index: number, next: Partial<MissionBlock>) => {
      onBlocksChange(
        blocks.map((block, idx) =>
          idx === index
            ? {
                ...block,
                ...next,
              }
            : block,
        ),
      );
    },
    [blocks, onBlocksChange],
  );

  const handleAddBlock = useCallback(() => {
    onBlocksChange([
      ...blocks,
      {
        title: '新环节',
        stimulus: 'neural',
        intensity: '🌈',
        drillIds: [],
        gameIds: [],
      },
    ]);
  }, [blocks, onBlocksChange]);

  const handleRemoveBlock = useCallback(
    (index: number) => {
      onBlocksChange(blocks.filter((_, idx) => idx !== index));
    },
    [blocks, onBlocksChange],
  );

  const handleMoveBlock = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= blocks.length) return;
      const draft = [...blocks];
      const temp = draft[index];
      draft[index] = draft[target];
      draft[target] = temp;
      onBlocksChange(draft);
    },
    [blocks, onBlocksChange],
  );

  const extractSelectedValues = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    return Array.from(event.target.selectedOptions).map((option) => option.value);
  }, []);

  return (
    <div className="grid gap-3 text-sm">
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">名称</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">阶段</span>
          <select
            value={value.phase}
            onChange={(event) => onChange({ ...value, phase: event.target.value as typeof PERIOD_OPTIONS[number] })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PERIOD_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">时长 (分钟)</span>
          <input
            type="number"
            value={value.durationMin}
            onChange={(event) => onChange({ ...value, durationMin: Number(event.target.value) })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">聚焦能力</span>
        <input
          value={value.focusAbilities.join(', ')}
          onChange={(event) => onChange({ ...value, focusAbilities: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">环节安排</span>
          <button
            type="button"
            onClick={handleAddBlock}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            新增环节
          </button>
        </div>
        {blocks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            暂未添加环节，可从动作库或游戏库中选择内容并配置主线谜题。
          </p>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, index) => {
              const drillIds = Array.isArray(block.drillIds) ? block.drillIds : [];
              const gameIds = Array.isArray(block.gameIds) ? block.gameIds : [];
              const puzzleTemplateId = block.puzzleTemplateId ?? '';
              const puzzleCards = Array.isArray(block.puzzleCardIds) ? block.puzzleCardIds : [];
              const puzzle = puzzleTemplateId ? puzzleLookup.get(puzzleTemplateId) : undefined;

              return (
                <div key={index} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">环节 {index + 1}</p>
                      <p className="text-[11px] text-slate-400">配置课堂流程、关联动作 / 游戏与谜题卡牌。</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(index, -1)}
                        className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
                      >
                        上移
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(index, 1)}
                        className="rounded-full border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100"
                      >
                        下移
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(index)}
                        className="rounded-full border border-rose-200 px-2 py-1 text-[11px] text-rose-500 hover:bg-rose-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">环节标题</span>
                      <input
                        value={block.title}
                        onChange={(event) => setBlock(index, { title: event.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2"
                        placeholder="例如：热身 / 敏捷闯关"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">刺激类型</span>
                      <select
                        value={block.stimulus}
                        onChange={(event) => setBlock(index, { stimulus: event.target.value as typeof STIMULUS_OPTIONS[number] })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2"
                      >
                        {STIMULUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {STIMULUS_LABELS[option]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">强度等级</span>
                      <select
                        value={block.intensity}
                        onChange={(event) => setBlock(index, { intensity: event.target.value as typeof INTENSITY_OPTIONS[number] })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2"
                      >
                        {INTENSITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">关联训练动作</span>
                      <select
                        multiple
                        value={drillIds}
                        onChange={(event) => setBlock(index, { drillIds: extractSelectedValues(event) })}
                        className="h-28 w-full rounded-lg border border-slate-200 px-3 py-2"
                      >
                        {drills.map((drill) => (
                          <option key={drill.id} value={drill.id}>
                            {drill.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400">按住 Ctrl / Command 键可多选动作。</p>
                      <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
                        {drillIds.length === 0 ? (
                          <span className="text-slate-400">尚未选择动作</span>
                        ) : (
                          drillIds.map((id) => (
                            <span key={id} className="rounded-full bg-slate-100 px-2 py-0.5">
                              {drillLookup.get(id)?.name ?? id}
                            </span>
                          ))
                        )}
                      </div>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">关联训练游戏</span>
                      <select
                        multiple
                        value={gameIds}
                        onChange={(event) => setBlock(index, { gameIds: extractSelectedValues(event) })}
                        className="h-28 w-full rounded-lg border border-slate-200 px-3 py-2"
                      >
                        {games.map((game) => (
                          <option key={game.id} value={game.id}>
                            {game.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400">可搭配趣味游戏增强课堂氛围。</p>
                      <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
                        {gameIds.length === 0 ? (
                          <span className="text-slate-400">尚未选择游戏</span>
                        ) : (
                          gameIds.map((id) => (
                            <span key={id} className="rounded-full bg-slate-100 px-2 py-0.5">
                              {gameLookup.get(id)?.name ?? id}
                            </span>
                          ))
                        )}
                      </div>
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">主线谜题（可选）</span>
                      <select
                        value={puzzleTemplateId}
                        onChange={(event) => {
                          const templateId = event.target.value;
                          if (!templateId) {
                            setBlock(index, { puzzleTemplateId: undefined, puzzleCardIds: [] });
                            return;
                          }
                          const template = puzzleLookup.get(templateId);
                          setBlock(index, {
                            puzzleTemplateId: templateId,
                            puzzleCardIds: template ? template.cards.map((card) => card.id) : [],
                          });
                        }}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <option value="">— 不绑定 —</option>
                        {puzzles.map((puzzle) => (
                          <option key={puzzle.id} value={puzzle.id}>
                            {puzzle.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {puzzle && (
                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-slate-500">选择谜题卡牌</span>
                        <select
                          multiple
                          value={puzzleCards}
                          onChange={(event) => setBlock(index, { puzzleCardIds: extractSelectedValues(event) })}
                          className="h-28 w-full rounded-lg border border-slate-200 px-3 py-2"
                        >
                          {puzzle.cards.map((card) => (
                            <option key={card.id} value={card.id}>
                              {card.title ?? card.id}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400">按需选择卡牌，未选择时默认全部。</p>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface CycleFormProps {
  value: TrainingCycleTemplate;
  weekPlanJson: string;
  onChange: (value: TrainingCycleTemplate) => void;
  onWeekPlanChange: (value: string) => void;
  trackingText: string;
  onTrackingChange: (value: string) => void;
  missions: MissionCardV2[];
  puzzles: PuzzleTemplate[];
}

function CycleForm({
  value,
  weekPlanJson,
  onChange,
  onWeekPlanChange,
  trackingText,
  onTrackingChange,
  missions,
  puzzles,
}: CycleFormProps) {
  const { list: weekPlanList, error: weekPlanError } = useMemo(() => {
    try {
      const parsed = JSON.parse(weekPlanJson || '[]');
      const list = Array.isArray(parsed) ? (parsed as CycleWeekPlan[]) : [];
      return { list, error: null as string | null };
    } catch (err) {
      return { list: [] as CycleWeekPlan[], error: err instanceof Error ? err.message : '解析周计划失败' };
    }
  }, [weekPlanJson]);

  const missionLookup = useMemo(() => {
    const map = new Map<string, MissionCardV2>();
    missions.forEach((mission) => map.set(mission.id, mission));
    return map;
  }, [missions]);

  const puzzleLookup = useMemo(() => {
    const map = new Map<string, PuzzleTemplate>();
    puzzles.forEach((puzzle) => map.set(puzzle.id, puzzle));
    return map;
  }, [puzzles]);

  const persistWeekPlan = (next: CycleWeekPlan[]) => {
    const serialised = JSON.stringify(next, null, 2);
    onWeekPlanChange(serialised);
    onChange({ ...value, weekPlan: next });
  };

  function handleWeekFieldChange<K extends keyof CycleWeekPlan>(
    index: number,
    key: K,
    nextValue: CycleWeekPlan[K],
  ) {
    const draft = weekPlanList.map((item, idx) =>
      idx === index
        ? {
            ...item,
            [key]: nextValue,
          }
        : item,
    );
    persistWeekPlan(draft);
  }

  const handleMissionAdd = (index: number, missionId: string) => {
    if (!missionId) return;
    const draft = weekPlanList.map((item, idx) => {
      if (idx !== index) return item;
      const current = Array.isArray(item.missionCards) ? item.missionCards : [];
      if (current.includes(missionId)) return item;
      return {
        ...item,
        missionCards: [...current, missionId],
      };
    });
    persistWeekPlan(draft);
  };

  const handleMissionRemove = (index: number, missionId: string) => {
    const draft = weekPlanList.map((item, idx) => {
      if (idx !== index) return item;
      const current = Array.isArray(item.missionCards) ? item.missionCards : [];
      return {
        ...item,
        missionCards: current.filter((id) => id !== missionId),
      };
    });
    persistWeekPlan(draft);
  };

  const handlePuzzleTemplateChange = (index: number, templateId: string | undefined) => {
    const puzzle = templateId ? puzzleLookup.get(templateId) : null;
    const nextCardIds = puzzle ? puzzle.cards.map((card) => card.id) : undefined;
    const draft = weekPlanList.map((item, idx) =>
      idx === index
        ? {
            ...item,
            puzzleTemplateId: templateId || undefined,
            puzzleCardIds: templateId ? nextCardIds : undefined,
          }
        : item,
    );
    persistWeekPlan(draft);
  };

  const toggleCardId = (index: number, cardId: string) => {
    const week = weekPlanList[index];
    if (!week) return;
    const current = Array.isArray(week.puzzleCardIds) ? week.puzzleCardIds : [];
    const next = current.includes(cardId)
      ? current.filter((id) => id !== cardId)
      : [...current, cardId];
    const draft = weekPlanList.map((item, idx) =>
      idx === index
        ? {
            ...item,
            puzzleCardIds: next,
          }
        : item,
    );
    persistWeekPlan(draft);
  };

  const handleToggleAllCards = (index: number) => {
    const week = weekPlanList[index];
    if (!week?.puzzleTemplateId) return;
    const puzzle = puzzleLookup.get(week.puzzleTemplateId);
    if (!puzzle) return;
    const current = Array.isArray(week.puzzleCardIds) ? week.puzzleCardIds : [];
    const allSelected = current.length === puzzle.cards.length;
    const next = allSelected ? [] : puzzle.cards.map((card) => card.id);
    const draft = weekPlanList.map((item, idx) =>
      idx === index
        ? {
            ...item,
            puzzleCardIds: next,
          }
        : item,
    );
    persistWeekPlan(draft);
  };

  const handleAddWeek = () => {
    const inferredWeek = weekPlanList.length ? Math.max(...weekPlanList.map((item) => Number(item.week) || 0)) + 1 : 1;
    const next: CycleWeekPlan[] = [
      ...weekPlanList,
      {
        week: inferredWeek,
        focus: '',
        missionCards: [],
      },
    ];
    persistWeekPlan(next);
  };

  const handleRemoveWeek = (index: number) => {
    const next = weekPlanList.filter((_, idx) => idx !== index);
    persistWeekPlan(next);
  };

  const handleWeekPlanTextChange = (next: string) => {
    onWeekPlanChange(next);
    try {
      const parsed = JSON.parse(next || '[]');
      if (Array.isArray(parsed)) {
        onChange({ ...value, weekPlan: parsed as CycleWeekPlan[] });
      }
    } catch (err) {
      // Ignore parse errors while typing; the preview UI will handle invalid JSON states.
    }
  };

  return (
    <div className="grid gap-3 text-sm">
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">名称</span>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">目标</span>
        <textarea
          value={value.goal}
          onChange={(event) => onChange({ ...value, goal: event.target.value })}
          className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">周期</span>
          <select
            value={value.durationWeeks}
            onChange={(event) => onChange({ ...value, durationWeeks: Number(event.target.value) as typeof DURATION_OPTIONS[number] })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} 周
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">阶段标签</span>
          <select
            value={value.stageId ?? ''}
            onChange={(event) => onChange({ ...value, stageId: event.target.value || undefined })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">未指定</option>
            {GROWTH_ROADMAP_STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">分类</span>
        <select
          value={value.category ?? 'jump'}
          onChange={(event) => onChange({ ...value, category: event.target.value as typeof CATEGORY_OPTIONS[number]['value'] })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">摘要/亮点</span>
        <textarea
          value={value.summary ?? ''}
          onChange={(event) => onChange({ ...value, summary: event.target.value })}
          className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">图标</span>
        <input
          value={value.icon ?? ''}
          onChange={(event) => onChange({ ...value, icon: event.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">聚焦能力</span>
        <input
          value={value.focusAbilities.join(', ')}
          onChange={(event) => onChange({ ...value, focusAbilities: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">适用对象</span>
        <input
          value={(value.recommendedFor ?? []).join(', ')}
          onChange={(event) => onChange({ ...value, recommendedFor: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">周计划结构</span>
          <button
            type="button"
            onClick={handleAddWeek}
            className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
          >
            新增周
          </button>
        </div>
        {weekPlanError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-600">
            无法解析周计划 JSON：{weekPlanError}
          </p>
        ) : null}
        <div className="space-y-3">
          {weekPlanList.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-400">
              暂无周计划，点击「新增周」开始配置课节模板与主线谜题。
            </div>
          ) : (
            weekPlanList.map((week, index) => {
              const template = week.puzzleTemplateId ? puzzleLookup.get(week.puzzleTemplateId) : null;
              return (
                <div key={`${week.week}-${index}`} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <label className="flex items-center gap-2">
                        <span className="text-slate-500">周次</span>
                        <input
                          type="number"
                          className="w-20 rounded-md border border-slate-300 px-2 py-1"
                          value={week.week ?? index + 1}
                          onChange={(event) => handleWeekFieldChange(index, 'week', Number(event.target.value) || 1)}
                        />
                      </label>
                      <label className="flex min-w-[180px] flex-1 items-center gap-2">
                        <span className="text-slate-500">主题</span>
                        <input
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1"
                          value={week.focus ?? ''}
                          onChange={(event) => handleWeekFieldChange(index, 'focus', event.target.value)}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWeek(index)}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      移除本周
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">课节模板安排</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {(week.missionCards ?? []).map((missionId) => {
                        const mission = missionLookup.get(missionId);
                        return (
                          <span
                            key={missionId}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600"
                          >
                            {mission?.name ?? missionId}
                            <button
                              type="button"
                              className="text-slate-400 hover:text-rose-500"
                              onClick={() => handleMissionRemove(index, missionId)}
                              aria-label="移除课节模板"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                      <select
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-600"
                        value=""
                        onChange={(event) => {
                          handleMissionAdd(index, event.target.value);
                          event.currentTarget.value = '';
                        }}
                      >
                        <option value="">添加课节模板</option>
                        {missions.map((mission) => (
                          <option
                            key={mission.id}
                            value={mission.id}
                            disabled={(week.missionCards ?? []).includes(mission.id)}
                          >
                            {mission.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">主线谜题</p>
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                      value={week.puzzleTemplateId ?? ''}
                      onChange={(event) => handlePuzzleTemplateChange(index, event.target.value || undefined)}
                    >
                      <option value="">未绑定</option>
                      {puzzles.map((puzzle) => (
                        <option key={puzzle.id} value={puzzle.id}>
                          {puzzle.name} · {puzzle.totalCards} 张
                        </option>
                      ))}
                    </select>
                    {week.puzzleTemplateId ? (
                      <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        {template ? (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-600">
                                难度等级 {template.difficulty ?? 3}
                              </span>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                                总能量 {template.totalEnergy ?? template.cards.reduce((sum, card) => sum + (card.reward?.energy ?? 0), 0)}⚡
                              </span>
                              {template.recommendedScene ? (
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-600">
                                  推荐：{template.recommendedScene}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {template.cards.map((card) => {
                                const active = (week.puzzleCardIds ?? []).includes(card.id);
                                return (
                                  <button
                                    key={card.id}
                                    type="button"
                                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                                      active ? 'bg-brand-100 text-brand-600' : 'bg-white text-slate-500 shadow-sm'
                                    }`}
                                    onClick={() => toggleCardId(index, card.id)}
                                  >
                                    {card.title}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>
                                已选 {week.puzzleCardIds?.length ?? template.cards.length}/{template.cards.length} 张
                              </span>
                              <button
                                type="button"
                                className="text-brand-500 hover:underline"
                                onClick={() => handleToggleAllCards(index)}
                              >
                                {week.puzzleCardIds && week.puzzleCardIds.length === template.cards.length ? '清空选择' : '全选卡牌'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-[11px] text-slate-500">未找到对应的谜题模板，请检查谜题 ID。</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        未绑定主线谜题时，将沿用课节模板或课堂默认设置。
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <details className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-[11px] text-slate-500">
          <summary className="cursor-pointer font-semibold text-slate-600">高级 · 直接编辑 JSON</summary>
          <textarea
            value={weekPlanJson}
            onChange={(event) => handleWeekPlanTextChange(event.target.value)}
            className="mt-2 h-48 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px]"
          />
          <p className="mt-1 text-[10px] text-slate-400">
            例：[{'{'}"week":1,"focus":"激活","missionCards":["mc-speed-ignite"],"puzzleTemplateId":"quest-poem","puzzleCardIds":["c1"]{'}'}]
          </p>
        </details>
      </div>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">追踪指标</span>
        <input
          value={trackingText}
          onChange={(event) => onTrackingChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
    </div>
  );
}

interface PuzzleFormProps {
  value: PuzzleTemplate;
  cardsJson: string;
  onChange: (value: PuzzleTemplate) => void;
  onCardsJsonChange: (value: string) => void;
}

function PuzzleForm({ value, cardsJson, onChange, onCardsJsonChange }: PuzzleFormProps) {
  const fallbackStats = useMemo(() => {
    const cards = Array.isArray(value.cards) ? (value.cards as PuzzleCardTemplate[]) : [];
    const energy = cards.reduce((sum, card) => sum + (card.reward?.energy ?? 0), 0);
    return { count: cards.length, energy };
  }, [value.cards]);

  const cardPreview = useMemo(() => {
    try {
      const parsed = JSON.parse(cardsJson || '[]');
      if (!Array.isArray(parsed)) {
        return { ...fallbackStats, valid: false };
      }
      const cards = parsed as PuzzleCardTemplate[];
      const energy = cards.reduce((sum, card) => sum + (card.reward?.energy ?? 0), 0);
      return { count: cards.length, energy, valid: true };
    } catch {
      return { ...fallbackStats, valid: false };
    }
  }, [cardsJson, fallbackStats]);

  return (
    <div className="grid gap-3 text-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">名称</span>
          <input
            value={value.name}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">编号（可选）</span>
          <input
            value={value.code ?? ''}
            onChange={(event) => onChange({ ...value, code: event.target.value || undefined })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">分类</span>
          <select
            value={value.category}
            onChange={(event) => onChange({ ...value, category: event.target.value as PuzzleCategory })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {PUZZLE_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">难度</span>
          <select
            value={value.difficulty ?? 3}
            onChange={(event) =>
              onChange({ ...value, difficulty: Number(event.target.value) as 1 | 2 | 3 | 4 | 5 })
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                等级 {level}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">使用范围</span>
          <select
            value={value.assignedTo ?? 'class'}
            onChange={(event) =>
              onChange({ ...value, assignedTo: event.target.value as PuzzleTemplate['assignedTo'] })
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {PUZZLE_ASSIGN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={Boolean(value.continueAcrossSessions)}
          onChange={(event) => onChange({ ...value, continueAcrossSessions: event.target.checked })}
        />
        允许跨课堂延续（continueAcrossSessions）
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">简介</span>
        <textarea
          value={value.description ?? ''}
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          className="h-24 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">推荐场景</span>
          <select
            value={value.recommendedScene ?? ''}
            onChange={(event) =>
              onChange({ ...value, recommendedScene: event.target.value || undefined })
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {PUZZLE_SCENE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-500">适龄建议</span>
          <input
            value={value.recommendedAges ?? ''}
            onChange={(event) => onChange({ ...value, recommendedAges: event.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">聚焦能力标签</span>
        <input
          value={(value.focusAbilities ?? []).join(', ')}
          onChange={(event) => onChange({ ...value, focusAbilities: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">标签</span>
        <input
          value={(value.tags ?? []).join(', ')}
          onChange={(event) => onChange({ ...value, tags: splitList(event.target.value) })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">卡牌 JSON</span>
        <textarea
          value={cardsJson}
          onChange={(event) => onCardsJsonChange(event.target.value)}
          className="h-48 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs"
        />
        <p className="text-[11px] text-slate-400">
          提供 PuzzleCardTemplate 数组，包含 id / title / type / reward 等字段。
        </p>
        <p className={`text-[11px] ${cardPreview.valid ? 'text-emerald-600' : 'text-amber-600'}`}>
          当前解析：{cardPreview.count} 张卡牌 · 预计 {cardPreview.energy} ⚡
          {!cardPreview.valid && '（JSON 解析失败时将无法保存，请检查格式）'}
        </p>
      </label>
    </div>
  );
}

export function TrainingLibraryManager({ open, onClose, initialTab = 'drill', initialCreateType = null }: ManagerProps) {
  const [snapshot, setSnapshot] = useState<TrainingLibrarySnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TrainingAssetType>(initialTab);
  const [editState, setEditState] = useState<EditState<any> | null>(null);
  const [dirty, setDirty] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [importText, setImportText] = useState('');
  const [importReplace, setImportReplace] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missionBlocks, setMissionBlocks] = useState<MissionBlock[]>([]);
  const [weekPlanJson, setWeekPlanJson] = useState('[]');
  const [planWeeksJson, setPlanWeeksJson] = useState('[]');

  
  const [planPhasesJson, setPlanPhasesJson] = useState('[]');

  const [unitBlocksJson, setUnitBlocksJson] = useState('[]');
  const [trackingText, setTrackingText] = useState('');
  const [initialEditHandled, setInitialEditHandled] = useState(false);
  const [puzzleCardsJson, setPuzzleCardsJson] = useState('[]');

  const [textMode, setTextMode] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [textSaving, setTextSaving] = useState(false);

  const puzzles = snapshot?.puzzles ?? [];


  const startEditing = useCallback(
    (type: TrainingAssetType, record?: any) => {
      setError(null);


      setTextMode(false);
      setTextContent('');
      setPuzzleCardsJson('[]');
      setPlanWeeksJson('[]');


      setPlanPhasesJson('[]');

      setUnitBlocksJson('[]');
      setMissionBlocks([]);

      if (type === 'stage') {
        const item = record ? { ...record } : { ...blankStage };
        setEditState({ type, record: item });
      } else if (type === 'plan') {
        const item = record ? { ...record } : { ...blankPlan };
        setEditState({ type, record: item });
        setPlanWeeksJson(JSON.stringify(item.weeks ?? [], null, 2));

        
        setPlanPhasesJson(JSON.stringify(item.phases ?? [], null, 2));

      } else if (type === 'unit') {
        const item = record ? { ...record } : { ...blankUnit };
        setEditState({ type, record: item });
        setUnitBlocksJson(JSON.stringify(item.blocks ?? [], null, 2));
      } else if (type === 'quality') {
        setEditState({ type, record: record ? { ...record } : { ...blankQuality } });
      } else if (type === 'drill') {
        setEditState({ type, record: record ? { ...record } : { ...blankDrill } });
      } else if (type === 'game') {
        setEditState({ type, record: record ? { ...record } : { ...blankGame } });
      } else if (type === 'mission') {
        const item = record ? { ...record } : { ...blankMission };
        const blocks = Array.isArray(item.blocks) ? item.blocks.map((block) => ({ ...block })) : [];
        item.blocks = blocks;
        setEditState({ type, record: item });
        setMissionBlocks(blocks);
      } else if (type === 'cycle') {
        const item = record ? { ...record } : { ...blankCycle };
        setEditState({ type, record: item });
        setWeekPlanJson(JSON.stringify(item.weekPlan ?? [], null, 2));
        setTrackingText((item.trackingMetrics ?? []).join(', '));
      } else if (type === 'puzzle') {
        const item = record ? { ...record } : { ...blankPuzzle };
        setEditState({ type, record: item });
        setPuzzleCardsJson(JSON.stringify(item.cards ?? [], null, 2));
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    setActiveTab(initialTab ?? 'drill');
    setInitialEditHandled(false);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    setInitialEditHandled(false);
  }, [open, initialCreateType]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await trainingRepo.exportLibrary();
        if (!cancelled) {
          setSnapshot(data);
          setDirty(false);
          setEditState(null);
          setImportMode(false);
          setError(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!snapshot) return;
    if (!initialCreateType) return;
    if (initialEditHandled) return;
    startEditing(initialCreateType);
    setInitialEditHandled(true);
  }, [open, snapshot, initialCreateType, initialEditHandled, startEditing]);

  const listForTab = useMemo(() => {
    if (!snapshot) return [];
    switch (activeTab) {
      case 'stage':
        return snapshot.stages ?? [];
      case 'plan':
        return snapshot.plans ?? [];
      case 'unit':
        return snapshot.units ?? [];
      case 'quality':
        return snapshot.qualities;
      case 'drill':
        return snapshot.drills;
      case 'game':
        return snapshot.games;
      case 'mission':
        return snapshot.missions;
      case 'cycle':
        return snapshot.cycles;
      case 'puzzle':
        return snapshot.puzzles ?? [];
      default:
        return [];
    }
  }, [snapshot, activeTab]);

  const serializedList = useMemo(() => JSON.stringify(listForTab ?? [], null, 2), [listForTab]);

  useEffect(() => {
    if (!textMode) return;
    setTextContent(serializedList);
  }, [textMode, serializedList]);

  const handleToggleTextMode = () => {
    setError(null);
    if (!textMode) {
      setEditState(null);
      setTextContent(serializedList);
    }
    setTextMode((prev) => !prev);
  };

  if (!open) return null;

  const handleClose = () => {
    setTextMode(false);
    setTextContent('');
    onClose(dirty);
  };


  
  
  const handleTextCancel = () => {
    setTextMode(false);
    setTextContent('');
    setTextSaving(false);
  };


  async function handleSave() {
    if (!editState) return;
    setError(null);
    try {
      if (editState.type === 'stage') {
        await trainingRepo.saveStage(editState.record as TrainingStage);
      } else if (editState.type === 'plan') {
        const plan = editState.record as TrainingPlan;
        try {
          const parsed = JSON.parse(planWeeksJson || '[]');
          if (!Array.isArray(parsed)) {
            throw new Error('周期周次需为数组');
          }
          plan.weeks = parsed as TrainingPlan['weeks'];
        } catch (error) {
          throw new Error('周次 JSON 解析失败，请检查格式');
        }

        
        try {
          const parsedPhases = JSON.parse(planPhasesJson || '[]');
          if (Array.isArray(parsedPhases)) {
            plan.phases = parsedPhases as TrainingPlan['phases'];
          } else {
            throw new Error();
          }
        } catch (error) {
          throw new Error('阶段结构 JSON 解析失败，请检查格式');
        }

        await trainingRepo.savePlan(plan);
      } else if (editState.type === 'unit') {
        const unit = editState.record as TrainingUnit;
        try {
          const parsed = JSON.parse(unitBlocksJson || '[]');
          if (!Array.isArray(parsed)) {
            throw new Error('单元环节需为数组');
          }
          unit.blocks = parsed as TrainingUnit['blocks'];
        } catch (error) {
          throw new Error('单元环节 JSON 解析失败，请检查格式');
        }
        await trainingRepo.saveUnit(unit);
      } else if (editState.type === 'quality') {
        await trainingRepo.saveQuality(editState.record as TrainingQuality);
      } else if (editState.type === 'drill') {
        await trainingRepo.saveDrill(editState.record as TrainingDrill);
      } else if (editState.type === 'game') {
        await trainingRepo.saveGame(editState.record as TrainingGame);
      } else if (editState.type === 'mission') {
        const mission = editState.record as MissionCardV2;
        mission.blocks = missionBlocks.map((block) => ({
          ...block,
          drillIds: Array.isArray(block.drillIds) ? block.drillIds : [],
          gameIds: Array.isArray(block.gameIds) ? block.gameIds : [],
          puzzleTemplateId:
            typeof block.puzzleTemplateId === 'string' && block.puzzleTemplateId.trim().length > 0
              ? block.puzzleTemplateId
              : undefined,
          puzzleCardIds: Array.isArray(block.puzzleCardIds) ? block.puzzleCardIds : [],
        }));
        await trainingRepo.saveMissionCard(mission);
      } else if (editState.type === 'cycle') {
        const cycle = editState.record as TrainingCycleTemplate;
        cycle.weekPlan = JSON.parse(weekPlanJson || '[]');
        cycle.trackingMetrics = splitList(trackingText);
        await trainingRepo.saveCycleTemplate(cycle);
      } else if (editState.type === 'puzzle') {
        const puzzle = { ...(editState.record as PuzzleTemplate) };
        let cards: PuzzleCardTemplate[];
        try {
          const parsed = JSON.parse(puzzleCardsJson || '[]');
          if (!Array.isArray(parsed)) {
            throw new Error('谜题卡牌 JSON 需为数组');
          }
          cards = parsed as PuzzleCardTemplate[];
        } catch (error) {
          throw new Error('谜题卡牌 JSON 解析失败，请检查格式');
        }
        puzzle.cards = cards;
        await puzzlesRepo.saveTemplate(puzzle);
      }
      const data = await trainingRepo.exportLibrary();
      setSnapshot(data);
      setEditState(null);
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请检查表单');
    }
  }

  async function handleDelete(type: AssetType, record: { id: string }) {
    if (!record?.id) return;
    if (!window.confirm('确认删除该训练资产？')) return;
    try {
      if (type === 'stage') {
        await trainingRepo.deleteStage(record.id);
      } else if (type === 'plan') {
        await trainingRepo.deletePlan(record.id);
      } else if (type === 'unit') {
        await trainingRepo.deleteUnit(record.id);
      } else if (type === 'quality') {
        await trainingRepo.deleteQuality(record.id);
      } else if (type === 'drill') {
        await trainingRepo.deleteDrill(record.id);
      } else if (type === 'game') {
        await trainingRepo.deleteGame(record.id);
      } else if (type === 'mission') {
        await trainingRepo.deleteMissionCard(record.id);
      } else if (type === 'cycle') {
        await trainingRepo.deleteCycleTemplate(record.id);
      } else if (type === 'puzzle') {
        await puzzlesRepo.deleteTemplate(record.id);
      }
      const data = await trainingRepo.exportLibrary();
      setSnapshot(data);
      setEditState(null);
      setDirty(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  async function handleTextSave() {
    setError(null);
    try {
      const parsed = JSON.parse(textContent);
      if (!Array.isArray(parsed)) {
        throw new Error('文本模式需提供数组数据');
      }
      setTextSaving(true);
      await trainingRepo.replaceAssets(activeTab, parsed);
      const fresh = await trainingRepo.exportLibrary();
      setSnapshot(fresh);
      setDirty(true);
      setTextMode(false);
      setTextContent('');
      setEditState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请检查文本内容');
    } finally {
      setTextSaving(false);
    }
  }

  async function handleExport() {
    const data = await trainingRepo.exportLibrary();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `training-library-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    setError(null);
    try {
      const data = JSON.parse(importText) as Partial<TrainingLibrarySnapshot>;
      await trainingRepo.importLibrary(data, { replace: importReplace });
      const fresh = await trainingRepo.exportLibrary();
      setSnapshot(fresh);
      setDirty(true);
      setImportMode(false);
      setImportText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败，请检查 JSON 格式');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900/40 backdrop-blur">
      <div className="h-full w-full max-w-4xl overflow-y-auto bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">训练资产库管理</h2>
            <p className="text-xs text-slate-500">
              支持导入导出与增删改查，维护主线谜题、训练资产与周期模板的统一结构。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportMode((prev) => !prev)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              {importMode ? '取消导入' : '导入 JSON'}
            </button>
            <button
              onClick={handleExport}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              导出 JSON
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
            >
              完成
            </button>
          </div>
        </header>

        {importMode && (
          <div className="space-y-3 border-b border-slate-200 bg-slate-50/70 px-6 py-4">
            <p className="text-sm font-semibold text-slate-700">导入训练库 JSON</p>
            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              className="h-48 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
              placeholder="粘贴导出的 JSON 内容"
            />
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={importReplace}
                onChange={(event) => setImportReplace(event.target.checked)}
              />
              导入前清空原有资产（替换模式）
            </label>
            <button
              onClick={handleImport}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              确认导入
            </button>
          </div>
        )}

        {error && (
          <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-xs text-rose-600">{error}</div>
        )}

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr,1fr]">
          <div>
            <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as AssetType)}>
              <Tabs.List className="flex flex-wrap gap-2">
                <Tabs.Trigger
                  value="stage"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  成长阶段
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="plan"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  周期资产
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="unit"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  训练单元
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="quality"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  能力维度
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="drill"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  动作库
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="game"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  游戏库
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="mission"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  课节模板
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="cycle"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  周期模板
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="puzzle"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  主线谜题
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEditing(activeTab)}
                  disabled={textMode}
                  className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  新增{ASSET_LABEL[activeTab] ?? ''}
                </button>
                <button
                  onClick={handleToggleTextMode}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {textMode ? '退出文本模式' : '文本模式'}
                </button>
              </div>
              {textMode ? (
                <div className="space-y-2">
                  <textarea
                    value={textContent}
                    onChange={(event) => setTextContent(event.target.value)}
                    className="h-[360px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    贴入或编辑当前 {ASSET_LABEL[activeTab] ?? '资产'} 列表的 JSON 数组。阶段 / 周期 / 单元请遵循 Stage →
                    Plan → Unit 结构：Stage 包含 id、name、summary、focusAbilities；Plan 需指定 stageId 与 weeks
                   （每周 unitIds 对应单元）；Unit 的 blocks 字段支持 stimulus / intensity / period / durationMin 等元
                    数据。其余资产也可包含 puzzleTemplateId / puzzleCardIds 字段以绑定谜题。
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleTextCancel}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => void handleTextSave()}
                      disabled={textSaving}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {textSaving ? '保存中…' : '保存文本'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  {loading ? (
                    <div className="p-6 text-center text-xs text-slate-400">加载中...</div>
                  ) : listForTab.length ? (
                    <ul className="divide-y divide-slate-100 text-sm text-slate-600">
                      {listForTab.map((item: any) => (
                        <li key={item.id} className="flex items-center justify-between px-3 py-2">
                          <div className="truncate pr-3">
                            <p className="font-semibold text-slate-700">{item.name ?? item.title ?? item.id}</p>
                            <p className="text-xs text-slate-400">ID: {item.id}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditing(activeTab, item)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => void handleDelete(activeTab, item)}
                              className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              删除
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">暂无数据</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {editState ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editState.record?.id ? '编辑' : '新增'}
                  {ASSET_LABEL[activeTab]}
                </h3>
                {activeTab === 'stage' && (
                  <StageForm
                    value={editState.record as TrainingStage}
                    onChange={(value) => setEditState({ ...editState, record: value })}
                    stages={snapshot?.stages ?? []}
                  />
                )}
                {activeTab === 'plan' && (
                  <PlanForm
                    value={editState.record as TrainingPlan}
                    onChange={(value) => setEditState({ ...editState, record: value })}
                    stages={snapshot?.stages ?? []}
                    weeksJson={planWeeksJson}
                    onWeeksChange={setPlanWeeksJson}

                    
                    phasesJson={planPhasesJson}
                    onPhasesChange={setPlanPhasesJson}

                  />
                )}
                {activeTab === 'unit' && (
                  <UnitForm
                    value={editState.record as TrainingUnit}
                    onChange={(value) => setEditState({ ...editState, record: value })}
                    stages={snapshot?.stages ?? []}
                    blocksJson={unitBlocksJson}
                    onBlocksChange={setUnitBlocksJson}
                  />
                )}
                {activeTab === 'quality' && (
                  <QualityForm
                    value={editState.record as TrainingQuality}
                    onChange={(value) => setEditState({ ...editState, record: value })}
                  />
                )}
                {activeTab === 'drill' && (
                  <DrillForm
                    value={editState.record as TrainingDrill}
                    onChange={(value) => setEditState({ ...editState, record: value })}
                  />
                )}
                {activeTab === 'game' && (
                  <GameForm
                    value={editState.record as TrainingGame}
                    onChange={(value) => setEditState({ ...editState, record: value })}
                  />
                )}
                {activeTab === 'mission' && (
                  <MissionForm
                    value={editState.record as MissionCardV2}
                    onChange={(value) => setEditState({ ...editState, record: value })}
                    blocks={missionBlocks}
                    onBlocksChange={setMissionBlocks}
                    drills={snapshot?.drills ?? []}
                    games={snapshot?.games ?? []}
                    puzzles={puzzles}
                  />
                )}
                {activeTab === 'cycle' && (
                  <CycleForm
                    value={editState.record as TrainingCycleTemplate}
                    weekPlanJson={weekPlanJson}
                    onChange={(value) => setEditState({ ...editState, record: value })}
                    onWeekPlanChange={setWeekPlanJson}
                    trackingText={trackingText}
                    onTrackingChange={setTrackingText}
                    missions={snapshot?.missions ?? []}
                    puzzles={puzzles}
                  />
                )}
                {activeTab === 'puzzle' && (
                  <PuzzleForm
                    value={editState.record as PuzzleTemplate}
                    cardsJson={puzzleCardsJson}
                    onChange={(value) => setEditState({ ...editState, record: value })}
                    onCardsJsonChange={setPuzzleCardsJson}
                  />
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditState(null)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    取消
                  </button>
                  {editState.record?.id && (
                    <button
                      onClick={() => void handleDelete(editState.type, editState.record)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      删除
                    </button>
                  )}
                  <button
                    onClick={() => void handleSave()}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                选择左侧资产进行编辑
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
