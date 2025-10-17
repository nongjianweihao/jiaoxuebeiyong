


import { useCallback, useEffect, useMemo, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { trainingRepo } from '../../store/repositories/trainingRepo';
import { puzzlesRepo } from '../../store/repositories/puzzlesRepo';


import { TrainingLibraryManager, type TrainingAssetType } from '../../components/training/TrainingLibraryManager';
import { MissionShowcase } from '../../components/training/MissionShowcase';


import type {
  AbilityKey,
  MissionCardV2,
  TrainingCycleTemplate,
  TrainingDrill,
  TrainingGame,
  TrainingPlan,
  TrainingQuality,
  TrainingStage,
  TrainingUnit,
} from '../../types';
import type { PuzzleCategory, PuzzleTemplate } from '../../types.gamify';



const INTENSITY_META = {
  '⚡': { label: '高强度', badge: 'bg-rose-100 text-rose-600' },
  '🌈': { label: '中等', badge: 'bg-violet-100 text-violet-600' },
  '💧': { label: '恢复', badge: 'bg-sky-100 text-sky-600' },
} as const;

const STIMULUS_LABEL: Record<string, string> = {
  neural: '神经',
  strength: '力量',
  metabolic: '代谢',
  technical: '技术',
  psychological: '心理',
};
const PERIOD_LABEL: Record<string, string> = {
  PREP: '备战期',
  SPEC: '专项期',
  COMP: '比赛期',
  TRANS: '过渡期',
  ALL: '全阶段',
};

const abilityOrder: AbilityKey[] = ['speed', 'power', 'coordination', 'agility', 'endurance', 'flexibility'];


const PUZZLE_CATEGORY_META: Record<PuzzleCategory, { label: string; accent: string; description: string }> = {
  poem: { label: '诗词文化', accent: 'from-amber-400 to-orange-500', description: '分句拼读，适合语文拓展与低年级课堂。' },
  motivation: { label: '激励语录', accent: 'from-pink-400 to-rose-500', description: '成长语句逐条解锁，强化坚持和复盘。' },
  emoji: { label: 'Emoji 暗语', accent: 'from-purple-400 to-fuchsia-500', description: '符号猜词，适合7-12岁调动节奏。' },
  mosaic: { label: '图腾拼片', accent: 'from-sky-400 to-cyan-500', description: '能量碎片点亮图腾，适合团队协作。' },
  story: { label: '情境故事', accent: 'from-indigo-400 to-blue-500', description: '章节剧情推进，营造课堂主线感。' },
  math: { label: '逻辑数锁', accent: 'from-emerald-400 to-teal-500', description: '等式线索与体能练习结合。' },
  science: { label: '科学知识', accent: 'from-lime-400 to-green-500', description: '身体百科与动作意识同步。' },
  habit: { label: '习惯养成', accent: 'from-slate-400 to-gray-500', description: '热身、整理和安全提示逐步解锁。' },
  team: { label: '战队徽章', accent: 'from-orange-400 to-red-500', description: '组队点亮徽章，驱动多人协作。' },
  image: { label: '视觉海报', accent: 'from-cyan-400 to-sky-500', description: '课堂海报逐步显现，提升仪式感。' },
  wisdom: { label: '智慧语录', accent: 'from-rose-400 to-pink-500', description: '金句翻牌，帮助学员构建自我激励语言。' },
  riddle: { label: '解谜探险', accent: 'from-indigo-400 to-violet-500', description: '线索推理闯关，训练观察力与团队协作。' },
};

const DIFFICULTY_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Lv.1',
  2: 'Lv.2',
  3: 'Lv.3',
  4: 'Lv.4',
  5: 'Lv.5',
};


const cycleMeta = {
  'cycle-speed-4w': {
    stageKey: 'foundation',
    stageLabel: '神经速度 · 启动期',
    accent: 'from-sky-400 to-cyan-500',
    summary: '4周构建节奏感与神经反应，强化 SR30 / SR60 基础。',
    coachNotes: '适用于基础速度薄弱或赛季前准备期，强调低容量高质量的神经激活。',
  },
  'cycle-freestyle-8w': {
    stageKey: 'skill',
    stageLabel: '协调花样 · 成长期',
    accent: 'from-violet-400 to-fuchsia-500',
    summary: '8周串联协调、节奏与组合输出，强化双摇与花样衔接。',
    coachNotes: '适合比赛衔接期或自由绳组队训练，兼顾爆发与创造力。',
  },
  'cycle-exam-12w': {
    stageKey: 'exam',
    stageLabel: '中考体能 · 峰值期',
    accent: 'from-amber-400 to-orange-500',
    summary: '12周周期化推进速度、耐力与力量，指向中考体能达标。',
    coachNotes: '配合学校体育测试或年度体能评估，突出 SR60 / 立定跳远 / 仰卧起坐。',
  },
} as const;

const stageOrder: Array<{ key: string; title: string; description: string }> = [
  {
    key: 'foundation',
    title: '基础神经期（4W）',
    description: '神经激活 + 节奏塑形，建立速度基础与跳跃经济性。',
  },
  {
    key: 'skill',
    title: '专项协调期（8W）',
    description: '花样掌控 + 爆发切换，打造组合能力与表现力。',
  },
  {
    key: 'exam',
    title: '体能峰值期（12W）',
    description: '速度耐力 + 力量体能，冲刺中考与综合表现。',
  },
];


export function TrainingLibraryPage() {
  const [stages, setStages] = useState<TrainingStage[]>([]);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [units, setUnits] = useState<TrainingUnit[]>([]);
  const [qualities, setQualities] = useState<TrainingQuality[]>([]);
  const [drills, setDrills] = useState<TrainingDrill[]>([]);
  const [games, setGames] = useState<TrainingGame[]>([]);
  const [missions, setMissions] = useState<MissionCardV2[]>([]);
  const [cycles, setCycles] = useState<TrainingCycleTemplate[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState<TrainingAssetType>('drill');
  const [managerCreateType, setManagerCreateType] = useState<TrainingAssetType | null>(null);
  const [puzzles, setPuzzles] = useState<PuzzleTemplate[]>([]);
  const [puzzleCategory, setPuzzleCategory] = useState<'all' | PuzzleCategory>('all');
  const [puzzleDifficulty, setPuzzleDifficulty] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
  const [puzzleSearch, setPuzzleSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'drills');


  const handleTabChange = (next: string) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'drills') {
      params.delete('tab');
    } else {
      params.set('tab', next);
    }
    setSearchParams(params);
  };

  const handleCopyPuzzleId = async (puzzle: PuzzleTemplate) => {
    const text = puzzle.id;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        window.alert(`已复制「${puzzle.name}」的谜题 ID，可在课程模板中绑定使用。`);
        return;
      }
    } catch (error) {
      console.warn('复制谜题ID失败，使用备用提示。', error);
    }
    window.prompt('复制以下谜题 ID', text);
  };

  const loadAssets = useCallback(async () => {
    const [stageList, planList, unitList, qualityList, drillList, gameList, missionList, cycleList, puzzleList] =
      await Promise.all([
        trainingRepo.listStages(),
        trainingRepo.listPlans(),
        trainingRepo.listUnits(),
        trainingRepo.listQualities(),
        trainingRepo.listDrills(),
        trainingRepo.listGames(),
        trainingRepo.listMissionCards(),
        trainingRepo.listCycleTemplates(),
        puzzlesRepo.listTemplates(),
      ]);
    setStages(stageList);
    setPlans(planList);
    setUnits(unitList);
    setQualities(qualityList);
    setDrills(drillList);
    setGames(gameList);
    setMissions(missionList);
    setCycles(cycleList);
    setPuzzles(puzzleList);
  }, []);

  

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    const current = searchParams.get('tab') ?? 'drills';
    if (current !== tab) {
      setTab(current);
    }
  }, [searchParams, tab]);

  const puzzleCategoryCounts = useMemo(() => {
    const counts = new Map<PuzzleCategory, number>();
    puzzles.forEach((puzzle) => {
      counts.set(puzzle.category, (counts.get(puzzle.category) ?? 0) + 1);
    });
    return counts;
  }, [puzzles]);

  const filteredPuzzles = useMemo(() => {
    const keyword = puzzleSearch.trim().toLowerCase();
    return puzzles.filter((puzzle) => {
      if (puzzleCategory !== 'all' && puzzle.category !== puzzleCategory) {
        return false;
      }
      if (puzzleDifficulty !== 'all' && (puzzle.difficulty ?? 3) !== puzzleDifficulty) {
        return false;
      }
      if (keyword) {
        const haystack = [
          puzzle.name,
          puzzle.description ?? '',
          puzzle.tags?.join(' ') ?? '',
          puzzle.focusAbilities?.join(' ') ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keyword)) {
          return false;
        }
      }
      return true;
    });
  }, [puzzles, puzzleCategory, puzzleDifficulty, puzzleSearch]);

  const sortedPuzzles = useMemo(() => {
    return [...filteredPuzzles].sort((a, b) => {
      const diffCompare = (a.difficulty ?? 3) - (b.difficulty ?? 3);
      if (diffCompare !== 0) return diffCompare;
      return a.name.localeCompare(b.name, 'zh-Hans');
    });
  }, [filteredPuzzles]);

  const activeCategoryMeta = puzzleCategory === 'all' ? null : PUZZLE_CATEGORY_META[puzzleCategory];

  const qualityLookup = useMemo(() => {
    const map: Record<string, TrainingQuality> = {};
    qualities.forEach((quality) => {
      map[quality.id] = quality;
    });
    return map;
  }, [qualities]);

  const stageLookup = useMemo(() => {
    const map = new Map<string, TrainingStage>();
    stages.forEach((stage) => {
      map.set(stage.id, stage);
    });
    return map;
  }, [stages]);

  const planLookup = useMemo(() => {
    const map = new Map<string, TrainingPlan[]>();
    plans.forEach((plan) => {
      if (!map.has(plan.stageId)) {
        map.set(plan.stageId, []);
      }
      map.get(plan.stageId)!.push(plan);
    });
    return map;
  }, [plans]);

  const unitLookup = useMemo(() => {
    const map: Record<string, TrainingUnit> = {};
    units.forEach((unit) => {
      map[unit.id] = unit;
    });
    return map;
  }, [units]);

  const drillLookup = useMemo(() => {
    const map: Record<string, TrainingDrill> = {};
    drills.forEach((drill) => {
      map[drill.id] = drill;
    });
    return map;
  }, [drills]);

  const gameLookup = useMemo(() => {
    const map: Record<string, TrainingGame> = {};
    games.forEach((game) => {
      map[game.id] = game;
    });
    return map;
  }, [games]);


  const missionLookup = useMemo(() => {
    const map: Record<string, MissionCardV2> = {};
    missions.forEach((mission) => {
      map[mission.id] = mission;
    });
    return map;
  }, [missions]);

  const stageBuckets = useMemo(() => {
    const assignedCycleIds = new Set<string>();
    const stageBasedBuckets = stages
      .map((stage) => {
        const relatedCycles = cycles.filter((cycle) => cycle.stageId === stage.id);
        relatedCycles.forEach((cycle) => assignedCycleIds.add(cycle.id));
        return {
          key: stage.id,
          title: `${stage.icon ?? '🎯'} ${stage.name}`,
          description: stage.summary || '聚焦能力与周期主题，快速了解阶段定位。',
          stage,
          cycles: relatedCycles,
        };
      })
      .filter((bucket) => bucket.cycles.length > 0);

    const remainingCycles = cycles.filter((cycle) => !assignedCycleIds.has(cycle.id));
    if (remainingCycles.length === 0) {
      return stageBasedBuckets;
    }

    const fallbackGrouped = new Map<string, TrainingCycleTemplate[]>();
    remainingCycles.forEach((cycle) => {
      const meta = cycleMeta[cycle.id as keyof typeof cycleMeta];
      const key = meta?.stageKey ?? 'other';
      if (!fallbackGrouped.has(key)) {
        fallbackGrouped.set(key, []);
      }
      fallbackGrouped.get(key)!.push(cycle);
    });

    const fallbackBuckets = stageOrder
      .map((stage) => {
        const bucketCycles = fallbackGrouped.get(stage.key) ?? [];
        if (bucketCycles.length === 0) return null;
        return {
          key: stage.key,
          title: stage.title,
          description: stage.description,
          stage: undefined,
          cycles: bucketCycles,
        };
      })
      .filter((bucket): bucket is {
        key: string;
        title: string;
        description: string;
        stage: TrainingStage | undefined;
        cycles: TrainingCycleTemplate[];
      } => bucket !== null);

    const otherCycles = fallbackGrouped.get('other') ?? [];
    if (otherCycles.length > 0) {
      fallbackBuckets.push({
        key: 'other',
        title: '综合阶段',
        description: '尚未绑定成长阶段的课程模板。',
        stage: undefined,
        cycles: otherCycles,
      });
    }

    return [...stageBasedBuckets, ...fallbackBuckets];
  }, [cycles, stages]);

  const openManager = (tab: TrainingAssetType, createNew: boolean) => {
    setManagerTab(tab);
    setManagerCreateType(createNew ? tab : null);
    setManagerOpen(true);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">勇士训练资产库</h1>
        <p className="text-sm text-slate-500">六大素质 × 动作 × 游戏 × 课节模板 × 周期模板，构建完整的勇士绳能表现体系。</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => openManager('stage', false)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            🧭 管理阶段
          </button>

          <button
            type="button"
            onClick={() => openManager('drill', false)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            📦 管理资产库
          </button>

          <button
            type="button"
            onClick={() => openManager('cycle', false)}
            className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-white px-3 py-1 font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50"
          >
            ✏️ 管理课程模板
          </button>
          <button
            type="button"
            onClick={() => openManager('cycle', true)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            ➕ 新建课程模板
          </button>
          <button
            type="button"
            onClick={() => openManager('puzzle', false)}
            className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white px-3 py-1 font-semibold text-violet-600 shadow-sm transition hover:bg-violet-50"
          >
            🧩 管理谜题库
          </button>
          <Link
            to="/templates"
            className="inline-flex items-center gap-1 rounded-full border border-fuchsia-200 bg-white px-3 py-1 font-semibold text-fuchsia-600 shadow-sm transition hover:bg-fuchsia-50"
          >
            🃏 管理挑战卡
          </Link>



        </div>
      </header>


      <Tabs.Root value={tab} onValueChange={handleTabChange} className="space-y-6">
        <Tabs.List className="flex flex-wrap gap-3 rounded-2xl bg-white/80 p-2 shadow">
          <Tabs.Trigger value="stages" className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            成长阶段
          </Tabs.Trigger>
          <Tabs.Trigger value="drills" className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            动作库
          </Tabs.Trigger>
          <Tabs.Trigger value="games" className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            游戏库
          </Tabs.Trigger>
          <Tabs.Trigger value="missions" className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            课节模板
          </Tabs.Trigger>
          <Tabs.Trigger value="cycles" className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            周期模板
          </Tabs.Trigger>
          <Tabs.Trigger value="puzzles" className="rounded-xl px-4 py-2 text-sm font-semibold data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            主线谜题
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="stages">
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">成长阶段蓝图</h2>
              <p className="text-sm text-slate-500">概览阶段定位、重点能力与周期化主题，帮助教练快速匹配适龄训练方案。</p>
            </div>
            {stages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                暂未配置成长阶段，请在「管理阶段」中完善阶段档案。
              </div>
            ) : (
              <div className="space-y-6">
                {stages.map((stage) => {
                  const focusAbilities = Array.isArray(stage.focusAbilities) ? stage.focusAbilities : [];
                  const coreTasks = Array.isArray(stage.coreTasks) ? stage.coreTasks : [];
                  const keyMilestones = Array.isArray(stage.keyMilestones) ? stage.keyMilestones : [];
                  const ageGuidance = Array.isArray(stage.ageGuidance) ? stage.ageGuidance : [];
                  const cycleThemes = Array.isArray(stage.cycleThemes) ? stage.cycleThemes : [];
                  const stagePlans = planLookup.get(stage.id) ?? [];
                  const nextStage = stage.recommendedNextStageId
                    ? stageLookup.get(stage.recommendedNextStageId)
                    : undefined;
                  return (
                    <article
                      key={stage.id}
                      className="space-y-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl text-white shadow"
                            style={{ background: stage.color ?? '#2563eb' }}
                          >
                            {stage.icon ?? '🎯'}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold text-slate-900">{stage.name}</h3>
                            {stage.summary ? (
                              <p className="text-sm text-slate-500">{stage.summary}</p>
                            ) : (
                              <p className="text-sm text-slate-400">尚未填写阶段摘要。</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {stage.heroMetric && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              阶段标志：{stage.heroMetric}
                            </span>
                          )}
                          {nextStage && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              推荐进阶：{nextStage.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {focusAbilities.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {focusAbilities.map((ability) => {
                            const meta = qualityLookup[ability];
                            return (
                              <span
                                key={`${stage.id}-${ability}`}
                                className="rounded-full border px-2 py-0.5 font-semibold"
                                style={{
                                  borderColor: meta?.color ?? '#cbd5f5',
                                  color: meta?.color ?? '#475569',
                                }}
                              >
                                {meta?.icon ?? '🏋️'} {meta?.name ?? ability}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {coreTasks.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-500">核心任务</p>
                          <ul className="grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                            {coreTasks.map((task, index) => (
                              <li key={`${stage.id}-task-${index}`} className="flex items-start gap-2">
                                <span className="mt-0.5 text-[10px] font-semibold text-slate-400">•</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {keyMilestones.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-500">关键里程碑</p>
                          <ol className="flex flex-col gap-2 text-xs text-slate-600 md:flex-row md:flex-wrap">
                            {keyMilestones.map((milestone, index) => (
                              <li
                                key={`${stage.id}-milestone-${index}`}
                                className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 shadow-sm"
                              >
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                  #{index + 1}
                                </span>
                                <span className="flex-1">{milestone}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {ageGuidance.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-500">适龄指导</p>
                          <div className="grid gap-3 text-xs text-slate-600 md:grid-cols-2">
                            {ageGuidance.map((guide, index) => (
                              <div
                                key={`${stage.id}-age-${index}`}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-3 shadow-inner"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-slate-800">{guide.range}</span>
                                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
                                    负荷：{guide.load}
                                  </span>
                                </div>
                                {guide.priorities?.length ? (
                                  <p className="mt-2 text-[11px] text-slate-500">
                                    优先：{guide.priorities.join('、')}
                                  </p>
                                ) : null}
                                {guide.cautions?.length ? (
                                  <p className="mt-1 text-[11px] text-rose-500">
                                    注意：{guide.cautions.join('、')}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {cycleThemes.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-500">周期主题（期化节奏）</p>
                          <div className="grid gap-3 text-xs text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                            {cycleThemes.map((theme, index) => (
                              <div
                                key={`${stage.id}-theme-${theme.period}-${index}`}
                                className="rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-slate-800">{theme.title}</span>
                                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                  {PERIOD_LABEL[theme.period] ?? theme.period}
                                </span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">{theme.focus}</p>
                                <span className="mt-2 inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                  负荷：{theme.load}
                                </span>
                                {theme.notes && (
                                  <p className="mt-1 text-[11px] text-slate-400">{theme.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {stagePlans.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-slate-500">阶段周期计划</p>
                          <div className="space-y-4">
                            {stagePlans.map((plan) => {
                              const phaseList = Array.isArray(plan.phases) ? plan.phases : [];
                              const weekList = Array.isArray(plan.weeks) ? plan.weeks : [];
                              const planFocusAbilities = Array.isArray(plan.focusAbilities)
                                ? plan.focusAbilities
                                : [];
                              return (
                                <div
                                  key={plan.id}
                                  className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                                >
                                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="space-y-1">
                                      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                                        周期 {plan.durationWeeks} 周
                                      </p>
                                      <h4 className="text-lg font-semibold text-slate-900">{plan.name}</h4>
                                      {plan.summary && (
                                        <p className="text-xs text-slate-500">{plan.summary}</p>
                                      )}
                                    </div>
                                    {planFocusAbilities.length > 0 && (
                                      <div className="flex flex-wrap justify-end gap-2 text-[11px]">
                                        {planFocusAbilities.map((ability) => {
                                          const meta = qualityLookup[ability];
                                          return (
                                            <span
                                              key={`${plan.id}-ability-${ability}`}
                                              className="rounded-full border px-2 py-0.5"
                                              style={{
                                                borderColor: meta?.color ?? '#cbd5f5',
                                                color: meta?.color ?? '#475569',
                                              }}
                                            >
                                              {meta?.icon ?? '🏋️'} {meta?.name ?? ability}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {phaseList.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold text-slate-500">阶段结构</p>
                                      <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                                        {phaseList.map((phase) => {
                                          const focusPoints = Array.isArray(phase.focusPoints) ? phase.focusPoints : [];
                                          return (
                                            <div
                                              key={`${plan.id}-phase-${phase.id}`}
                                              className="space-y-2 rounded-xl border border-dashed border-slate-200 bg-white/80 p-3"
                                            >
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-semibold text-slate-800">{phase.name}</span>
                                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                                {phase.durationWeeks} 周
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">{phase.goal}</p>
                                            <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
                                              <span className="rounded bg-slate-100 px-2 py-0.5">负荷：{phase.load}</span>
                                              {focusPoints.map((point) => (
                                                <span
                                                  key={`${plan.id}-phase-${phase.id}-${point}`}
                                                  className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-600"
                                                >
                                                  {point}
                                                </span>
                                              ))}
                                            </div>
                                            {phase.recommendedAges?.length ? (
                                              <p className="text-[11px] text-slate-400">
                                                适龄：{phase.recommendedAges.join('、')}
                                              </p>
                                            ) : null}
                                            {phase.notes && (
                                              <p className="text-[11px] text-slate-400">{phase.notes}</p>
                                            )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {weekList.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold text-slate-500">周次安排</p>
                                      <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                                        {weekList.map((week) => (
                                          <div
                                            key={`${plan.id}-week-${week.week}`}
                                            className="space-y-2 rounded-xl bg-slate-50 p-3 shadow-inner"
                                          >
                                            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                                              <span>第 {week.week} 周</span>
                                              {week.theme && (
                                                <span className="text-[11px] text-slate-400">{week.theme}</span>
                                              )}
                                            </div>
                                            {week.focusAbilities?.length ? (
                                              <div className="flex flex-wrap gap-1">
                                                {week.focusAbilities.map((ability) => {
                                                  const meta = qualityLookup[ability];
                                                  return (
                                                    <span
                                                      key={`${plan.id}-week-${week.week}-${ability}`}
                                                      className="rounded-full border px-2 py-0.5"
                                                      style={{
                                                        borderColor: meta?.color ?? '#cbd5f5',
                                                        color: meta?.color ?? '#475569',
                                                      }}
                                                    >
                                                      {meta?.icon ?? '🏋️'} {meta?.name ?? ability}
                                                    </span>
                                                  );
                                                })}
                                              </div>
                                            ) : null}
                                            {week.unitIds?.length ? (
                                              <div className="flex flex-wrap gap-2">
                                                {week.unitIds.map((unitId) => (
                                                  <span
                                                    key={`${plan.id}-week-${week.week}-${unitId}`}
                                                    className="rounded-full bg-white px-2 py-0.5 shadow-sm"
                                                  >
                                                    {unitLookup[unitId]?.name ?? unitId}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : null}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </Tabs.Content>

        <Tabs.Content value="drills">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">训练动作库</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {drills.map((drill) => {
                const intensity = INTENSITY_META[drill.intensity] ?? INTENSITY_META['🌈'];
                const primaryAbilities = Array.isArray(drill.primaryAbilities) ? drill.primaryAbilities : [];
                const secondaryAbilities = Array.isArray(drill.secondaryAbilities) ? drill.secondaryAbilities : [];
                return (
                  <article key={drill.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800">{drill.name}</h3>
                        <p className="text-xs text-slate-500">{drill.durationMin} 分钟 · {STIMULUS_LABEL[drill.stimulusType]}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${intensity.badge}`}>
                        {drill.intensity} {intensity.label}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {primaryAbilities.map((ability) => {
                        const meta = qualityLookup[ability];
                        return (
                          <span
                            key={`${drill.id}-${ability}-primary`}
                            className="rounded-full border px-2 py-0.5 font-semibold"
                            style={{ borderColor: meta?.color ?? '#cbd5f5', color: meta?.color ?? '#475569' }}
                          >
                            {meta?.icon ?? '🏋️'} 主·{meta?.name ?? ability}
                          </span>
                        );
                      })}
                      {secondaryAbilities.map((ability) => {
                        const meta = qualityLookup[ability];
                        return (
                          <span
                            key={`${drill.id}-${ability}-secondary`}
                            className="rounded-full border px-2 py-0.5"
                            style={{ borderColor: meta?.color ?? '#cbd5f5', color: meta?.color ?? '#475569' }}
                          >
                            辅·{meta?.name ?? ability}
                          </span>
                        );
                      })}
                    </div>
                    {drill.equipment && drill.equipment.length > 0 && (
                      <p className="mt-3 text-xs text-slate-500">器材：{drill.equipment.join('、')}</p>
                    )}
                    {drill.coachTips && (
                      <p className="mt-2 text-xs text-slate-600">教练提示：{drill.coachTips}</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </Tabs.Content>

        <Tabs.Content value="games">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">训练游戏库</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {games.map((game) => {
                const intensity = INTENSITY_META[game.intensity] ?? INTENSITY_META['🌈'];
                const focusAbilities = Array.isArray(game.focusAbilities) ? game.focusAbilities : [];
                return (
                  <article key={game.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800">{game.name}</h3>
                        <p className="text-xs text-slate-500">{game.durationMin} 分钟 · {game.groupSize}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${intensity.badge}`}>
                        {game.intensity} {intensity.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">目标：{game.goal}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {focusAbilities.map((ability) => {
                        const meta = qualityLookup[ability];
                        return (
                          <span
                            key={`${game.id}-${ability}`}
                            className="rounded-full border px-2 py-0.5"
                            style={{ borderColor: meta?.color ?? '#cbd5f5', color: meta?.color ?? '#475569' }}
                          >
                            {meta?.icon ?? '🏋️'} {meta?.name ?? ability}
                          </span>
                        );
                      })}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                        {STIMULUS_LABEL[game.stimulusType]}
                      </span>
                    </div>
                    {game.rules && <p className="mt-2 text-xs text-slate-500">规则：{game.rules}</p>}
                    {game.coachTips && <p className="mt-1 text-xs text-slate-500">提示：{game.coachTips}</p>}
                    {game.variations && <p className="mt-1 text-xs text-slate-400">变式：{game.variations}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        </Tabs.Content>

        <Tabs.Content value="missions">
          <MissionShowcase
            footer={
              <section className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-slate-900">课节模板结构清单</h3>
                  <p className="text-sm text-slate-500">对照阶段资产，快速查看动作与游戏引用情况，便于微调课节节奏。</p>
                </div>
                {missions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    暂无课节模板结构，请在课节模板工坊中创建。
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {missions.map((mission) => {
                      const missionFocusAbilities = Array.isArray(mission.focusAbilities) ? mission.focusAbilities : [];
                      const missionBlocks = Array.isArray(mission.blocks) ? mission.blocks : [];
                      return (
                        <article key={mission.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <header className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-slate-400">阶段：{PERIOD_LABEL[mission.phase] ?? mission.phase}</p>
                            <h4 className="text-base font-semibold text-slate-800">{mission.name}</h4>
                            <p className="text-xs text-slate-500">时长 {mission.durationMin} 分钟</p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-1">
                            {missionFocusAbilities.map((ability) => {
                              const meta = qualityLookup[ability];
                              return (
                                <span
                                  key={`${mission.id}-${ability}`}
                                  className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                                  style={{ borderColor: meta?.color ?? '#cbd5f5', color: meta?.color ?? '#475569' }}
                                >
                                  {meta?.icon ?? '🏋️'} {meta?.name ?? ability}
                                </span>
                              );
                            })}
                          </div>
                        </header>
                        <ol className="mt-4 space-y-3 text-sm">
                          {missionBlocks.map((block, index) => {
                            const intensity = INTENSITY_META[block.intensity] ?? INTENSITY_META['🌈'];
                            return (
                              <li key={`${mission.id}-${block.title}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-700">{block.title}</span>
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${intensity.badge}`}>
                                    {block.intensity} {intensity.label}
                                  </span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                    {STIMULUS_LABEL[block.stimulus] ?? block.stimulus}
                                  </span>
                                  {block.drillIds?.map((id) => (
                                    <span key={`${mission.id}-drill-${id}`} className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-600">
                                      动作·{drillLookup[id]?.name ?? id}
                                    </span>
                                  ))}
                                  {block.gameIds?.map((id) => (
                                    <span key={`${mission.id}-game-${id}`} className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-600">
                                      游戏·{gameLookup[id]?.name ?? id}
                                    </span>
                                  ))}
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </article>
                      );
                    })}
                  </div>
                )}
              </section>
            }
          />
        </Tabs.Content>

        <Tabs.Content value="cycles">

          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">周期模板库</h2>
              <p className="text-sm text-slate-500">分阶段规划速度、协调与体能峰值，直接引用即可生成班级周期。</p>
            </div>
            <div className="space-y-10">
              {stageBuckets.map((bucket) => (
                <div key={bucket.key} className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">所属阶段</p>
                    <h3 className="text-xl font-semibold text-slate-900">{bucket.title}</h3>
                    <p className="text-sm text-slate-500">{bucket.description}</p>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    {bucket.cycles.map((cycle) => {
                      const meta = cycleMeta[cycle.id as keyof typeof cycleMeta];
                      const cycleFocusAbilities = Array.isArray(cycle.focusAbilities) ? cycle.focusAbilities : [];
                      const weekPlan = Array.isArray(cycle.weekPlan) ? cycle.weekPlan : [];
                      const stageInfo = cycle.stageId ? stageLookup.get(cycle.stageId) : undefined;
                      const cycleLabel = stageInfo
                        ? `${stageInfo.icon ?? '🎯'} ${stageInfo.name}`
                        : meta?.stageLabel ?? '综合训练';
                      const trackingLabel = cycle.trackingMetrics?.length
                        ? cycle.trackingMetrics.join('、')
                        : '未配置指标';
                      const summaryText = cycle.summary || stageInfo?.summary || meta?.summary || cycle.goal;
                      const accentClass = stageInfo?.color
                        ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white shadow'
                        : `inline-flex items-center rounded-full bg-gradient-to-r ${meta?.accent ?? 'from-slate-200 to-slate-300'} px-3 py-1 text-xs font-semibold text-white`;
                      const accentStyle = stageInfo?.color ? { background: stageInfo.color } : undefined;
                      return (
                        <article
                          key={cycle.id}
                          className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
                        >
                          <div>
                            <span className={accentClass} style={accentStyle}>
                              {cycleLabel}
                            </span>
                            <h4 className="mt-3 text-lg font-semibold text-slate-900">{cycle.name}</h4>
                            <p className="text-sm text-slate-500">{summaryText}</p>
                            <p className="text-xs text-slate-400">周期 {cycle.durationWeeks} 周 · 追踪 {trackingLabel}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                            {cycleFocusAbilities.map((ability) => {
                              const metaQuality = qualityLookup[ability];
                              return (
                                <span
                                  key={`${cycle.id}-${ability}`}
                                  className="rounded-full border px-2 py-0.5"
                                  style={{
                                    borderColor: metaQuality?.color ?? '#cbd5f5',
                                    color: metaQuality?.color ?? '#475569',
                                  }}
                                >
                                  {metaQuality?.icon ?? '🏋️'} {metaQuality?.name ?? ability}
                                </span>
                              );
                            })}
                          </div>
                          <div className="space-y-3">
                            {weekPlan.map((week) => {
                              const missionCardIds = Array.isArray(week.missionCards) ? week.missionCards : [];
                              return (
                                <div
                                  key={`${cycle.id}-week-${week.week}`}
                                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                                >
                                  <div className="flex items-start justify-between text-sm">
                                    <div>
                                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">第 {week.week} 周</p>
                                      <p className="font-semibold text-slate-800">{week.focus}</p>
                                    </div>
                                    <div className="text-right text-xs text-slate-500">
                                      {missionCardIds
                                        .map((missionId) => missionLookup[missionId]?.durationMin ?? 0)
                                        .reduce((total, value) => total + value, 0) || '--'}
                                      分钟总量
                                    </div>
                                  </div>
                                  <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                                    {missionCardIds.map((missionId) => {
                                      const mission = missionLookup[missionId];
                                      if (!mission) {
                                        return (
                                          <div
                                            key={`${cycle.id}-${week.week}-${missionId}`}
                                            className="rounded-xl bg-white/70 p-3 text-slate-400"
                                          >
                                            课节模板 {missionId}
                                          </div>
                                        );
                                      }
                                      const focusAbilities = Array.isArray(mission.focusAbilities)
                                        ? mission.focusAbilities
                                        : [];
                                      const blocks = Array.isArray(mission.blocks) ? mission.blocks : [];
                                      return (
                                        <div
                                          key={`${cycle.id}-${week.week}-${missionId}`}
                                          className="space-y-2 rounded-xl bg-white/80 p-3 shadow-sm"
                                        >
                                          <p className="text-sm font-semibold text-slate-800">{mission.name}</p>
                                          <div className="flex flex-wrap gap-2">
                                            {focusAbilities.map((ability) => {
                                              const metaQuality = qualityLookup[ability];
                                              return (
                                                <span
                                                  key={`${mission.id}-${ability}`}
                                                  className="rounded-full border px-2 py-0.5"
                                                  style={{
                                                    borderColor: metaQuality?.color ?? '#cbd5f5',
                                                    color: metaQuality?.color ?? '#475569',
                                                  }}
                                                >
                                                  {metaQuality?.icon ?? '🏋️'} {metaQuality?.name ?? ability}
                                                </span>
                                              );
                                            })}
                                          </div>
                                          <p className="text-[11px] text-slate-500">
                                            {blocks
                                              .map((block) => `${block.title} · ${STIMULUS_LABEL[block.stimulus]}`)
                                              .join(' / ')}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-xs text-slate-500">{meta?.coachNotes ?? cycle.goal}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>

              ))}
            </div>
          </section>
        </Tabs.Content>
        <Tabs.Content value="puzzles">
          <section className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-800">课堂主线谜题库</h2>
                <p className="text-sm text-slate-500">
                  已内置 {puzzles.length} 套 FlipQuest 主线谜题，可用于课程模板、战队挑战与个人任务的翻牌激励。
                </p>
                {activeCategoryMeta && (
                  <p className="text-xs text-slate-400">当前分类：{activeCategoryMeta.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-3 text-sm lg:flex-row lg:items-center">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPuzzleCategory('all')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      puzzleCategory === 'all'
                        ? 'bg-brand-500 text-white shadow'
                        : 'bg-white text-slate-600 shadow border border-slate-200'
                    }`}
                  >
                    全部
                    <span className="ml-1 text-[10px] text-slate-400">{puzzles.length}</span>
                  </button>
                  {Object.entries(PUZZLE_CATEGORY_META).map(([key, meta]) => {
                    const typed = key as PuzzleCategory;
                    const count = puzzleCategoryCounts.get(typed) ?? 0;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPuzzleCategory(typed)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          puzzleCategory === typed
                            ? 'bg-gradient-to-r text-white shadow ' + meta.accent
                            : 'bg-white text-slate-600 shadow border border-slate-200'
                        }`}
                      >
                        {meta.label}
                        <span className="ml-1 text-[10px] opacity-70">{count}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1">
                    <span className="text-xs text-slate-500">难度</span>
                    <select
                      value={puzzleDifficulty === 'all' ? 'all' : String(puzzleDifficulty)}
                      onChange={(event) => {
                        const value = event.target.value;
                        setPuzzleDifficulty(value === 'all' ? 'all' : (Number(value) as 1 | 2 | 3 | 4 | 5));
                      }}
                      className="bg-transparent text-sm outline-none"
                    >
                      <option value="all">全部</option>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <option key={level} value={level}>
                          {DIFFICULTY_LABEL[level as 1 | 2 | 3 | 4 | 5]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1">
                    <span className="text-xs text-slate-500">搜索</span>
                    <input
                      value={puzzleSearch}
                      onChange={(event) => setPuzzleSearch(event.target.value)}
                      placeholder="关键词/标签"
                      className="w-36 bg-transparent text-sm outline-none"
                    />
                  </label>
                </div>
              </div>
            </div>

            {sortedPuzzles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                暂无匹配的谜题，请调整筛选条件。
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sortedPuzzles.map((puzzle) => {
                  const meta = PUZZLE_CATEGORY_META[puzzle.category];
                  const cards = Array.isArray(puzzle.cards) ? puzzle.cards : [];
                  const totalEnergy = puzzle.totalEnergy ?? cards.reduce((sum, card) => sum + (card.reward?.energy ?? 0), 0);
                  const difficultyLevel = (puzzle.difficulty ?? 3) as 1 | 2 | 3 | 4 | 5;
                  return (
                    <article key={puzzle.id} className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">{puzzle.name}</h3>
                            {puzzle.description && <p className="mt-1 text-xs text-slate-500">{puzzle.description}</p>}
                          </div>
                          <span className={`rounded-full bg-gradient-to-r ${meta.accent} px-3 py-1 text-xs font-semibold text-white shadow`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="grid gap-2 text-xs text-slate-600">
                          <div className="flex items-center justify-between">
                            <span>卡牌数量</span>
                            <span className="font-semibold text-slate-800">{(puzzle.totalCards ?? cards.length) || '--'} 张</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>能量总值</span>
                            <span className="font-semibold text-emerald-600">{totalEnergy} ⚡</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>难度等级</span>
                            <span className="font-semibold text-slate-800">{DIFFICULTY_LABEL[difficultyLevel]}</span>
                          </div>
                          {puzzle.recommendedScene && (
                            <div className="flex items-center justify-between">
                              <span>推荐场景</span>
                              <span className="font-medium text-slate-700">{puzzle.recommendedScene}</span>
                            </div>
                          )}
                          {puzzle.recommendedAges && (
                            <div className="flex items-center justify-between">
                              <span>适龄建议</span>
                              <span className="font-medium text-slate-700">{puzzle.recommendedAges}</span>
                            </div>
                          )}
                          {puzzle.focusAbilities?.length ? (
                            <div>
                              <span className="text-slate-500">聚焦能力：</span>
                              <span className="font-medium text-slate-700">{puzzle.focusAbilities.join('、')}</span>
                            </div>
                          ) : null}
                          {puzzle.tags?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {puzzle.tags.map((tag) => (
                                <span key={`${puzzle.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Link
                          to={`/training-library/puzzles/${puzzle.id}`}
                          className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-600"
                        >
                          预览谜题
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyPuzzleId(puzzle)}
                          className="rounded-lg border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                        >
                          复制ID
                        </button>

                        

                        <button
                          type="button"
                          onClick={() => openManager('cycle', false)}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-100"
                        >
                          打开课程模板
                        </button>

                        

                        <span className="text-[11px] text-slate-400">
                          在课程模板的挑战段中勾选此 ID，对应环节即可翻牌领奖励。
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </Tabs.Content>
      </Tabs.Root>

      {managerOpen && (
        <TrainingLibraryManager
          open={managerOpen}
          initialTab={managerTab}
          initialCreateType={managerCreateType}
          onClose={(changed) => {
            setManagerOpen(false);
            setManagerCreateType(null);
            if (changed) void loadAssets();
          }}
        />
      )}

    </div>
  );
}
