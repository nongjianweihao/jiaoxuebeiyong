export type GrowthTrackId = 'core' | 'support' | 'challenge';

export interface GrowthRoadmapTrack {
  id: GrowthTrackId;
  title: string;
  subtitle: string;
  targetLabel: string;
}

export interface GrowthRoadmapStageTargets {
  dan: number;
  assessment: number;
  speed30: number;
  missions: number;
  stars: number;
  badges: number;
  squadEnergy: number;
}

export interface GrowthRoadmapStage {
  id: string;
  name: string;
  icon: string;
  color: string;
  milestone: string;
  summary: string;
  focus: string;
  celebration: string;
  tracks: GrowthRoadmapTrack[];
  targets: GrowthRoadmapStageTargets;
  recommendedCycleIds: string[];
}

export const GROWTH_ROADMAP_STAGES: GrowthRoadmapStage[] = [
  {
    id: 'rookie',
    name: '新手训练营',
    icon: '🌱',
    color: '#38bdf8',
    milestone: '花样一段 · 底座打磨',
    summary: '建立勇士底层动作与节奏感，让孩子从模仿到主动掌握基础能力。',
    focus: '核心是构建节奏+体能双基线，配合每日挑战完成勇士入营。',
    celebration: '完成花样一段后，进入勇士训练场，获得「青铜勇士」公示认证。',
    tracks: [
      {
        id: 'core',
        title: '核心训练线（突破）',
        subtitle: '心肺耐力 + 节奏稳定',
        targetLabel: '3′单摇 200 次 · 测评 ≥60 分',
      },
      {
        id: 'support',
        title: '支撑训练线（分享）',
        subtitle: '建立自我驱动与训练记录习惯',
        targetLabel: '完成 6 次日常挑战 · 记录成长日志',
      },
      {
        id: 'challenge',
        title: '挑战线（荣誉）',
        subtitle: '第一次站上小组榜单',
        targetLabel: '获得 1 枚徽章 · 小队能量 30+',
      },
    ],
    targets: {
      dan: 1,
      assessment: 60,
      speed30: 90,
      missions: 6,
      stars: 12,
      badges: 1,
      squadEnergy: 30,
    },
    recommendedCycleIds: ['cycle-rookie-4w', 'cycle-foundation-6w'],
  },
  {
    id: 'warrior',
    name: '勇士训练场',
    icon: '🛡️',
    color: '#f97316',
    milestone: '花样二段 · 勇士连贯',
    summary: '从基础动作到花样连贯，强化速度与力量，完成勇士阶段的持续输出。',
    focus: '核心是把基础动作串联并稳定输出，引入专项速度挑战。',
    celebration: '勇士训练场毕业，荣登「白银勇士」榜单，具备双摇初级挑战力。',
    tracks: [
      {
        id: 'core',
        title: '核心训练线（突破）',
        subtitle: '专项速度 + 力量爆发',
        targetLabel: '30″单摇 120 次 · 测评 ≥75 分',
      },
      {
        id: 'support',
        title: '支撑训练线（分享）',
        subtitle: '小队协作 + 任务复盘',
        targetLabel: '完成 12 次挑战 · 分享 4 次课堂亮点',
      },
      {
        id: 'challenge',
        title: '挑战线（荣誉）',
        subtitle: '战队积分赛',
        targetLabel: '徽章累计 3 枚 · 小队能量 80+',
      },
    ],
    targets: {
      dan: 3,
      assessment: 75,
      speed30: 120,
      missions: 12,
      stars: 30,
      badges: 3,
      squadEnergy: 80,
    },
    recommendedCycleIds: ['cycle-warrior-6w', 'cycle-speed-4w'],
  },
  {
    id: 'elite',
    name: '精英竞技场',
    icon: '🏆',
    color: '#a855f7',
    milestone: '花样四段 · 精英竞技',
    summary: '专项训练叠加竞技策略，双摇、组合串联和舞台表现全面提升。',
    focus: '通过周期化计划冲击竞速成绩，同时优化体能与协调短板。',
    celebration: '精英竞技场晋级，成为「黄金斗士」，具备赛事稳定发挥能力。',
    tracks: [
      {
        id: 'core',
        title: '核心训练线（突破）',
        subtitle: '双摇 + 组合串联',
        targetLabel: '30″双摇 20 次 · 测评 ≥85 分',
      },
      {
        id: 'support',
        title: '支撑训练线（分享）',
        subtitle: '赛后复盘 + 数据分析',
        targetLabel: '完成 20 次挑战 · 输出 6 篇复盘',
      },
      {
        id: 'challenge',
        title: '挑战线（荣誉）',
        subtitle: '市级/省级赛事冲刺',
        targetLabel: '徽章累计 5 枚 · 小队能量 150+',
      },
    ],
    targets: {
      dan: 6,
      assessment: 85,
      speed30: 145,
      missions: 20,
      stars: 50,
      badges: 5,
      squadEnergy: 150,
    },
    recommendedCycleIds: ['cycle-elite-8w', 'cycle-freestyle-8w'],
  },
  {
    id: 'legend',
    name: '至尊决战场',
    icon: '👑',
    color: '#ef4444',
    milestone: '花样七段+ · 至尊决战',
    summary: '冲刺国家级荣誉，打造综合能力天花板，兼顾竞技成绩与团队领导力。',
    focus: '以高强度周期滚动突破，结合专项测评与团队带教。',
    celebration: '登顶至尊决战场，荣获「钻石王者」，成为勇士榜样。',
    tracks: [
      {
        id: 'core',
        title: '核心训练线（突破）',
        subtitle: '专项极限输出',
        targetLabel: '30″双摇 40 次 · 测评 ≥92 分',
      },
      {
        id: 'support',
        title: '支撑训练线（分享）',
        subtitle: '跨队分享 + 领队培养',
        targetLabel: '挑战累计 30 次 · 输出 10 次领队分享',
      },
      {
        id: 'challenge',
        title: '挑战线（荣誉）',
        subtitle: '全国赛/世界赛冲线',
        targetLabel: '徽章累计 8 枚 · 小队能量 260+',
      },
    ],
    targets: {
      dan: 9,
      assessment: 92,
      speed30: 170,
      missions: 30,
      stars: 80,
      badges: 8,
      squadEnergy: 260,
    },
    recommendedCycleIds: ['cycle-legend-8w', 'cycle-competition-6w'],
  },
];

export const GROWTH_STAGE_LOOKUP = Object.fromEntries(
  GROWTH_ROADMAP_STAGES.map((stage) => [stage.id, stage]),
);
