

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { NameType, TooltipProps, ValueType } from 'recharts';

const assessmentOverviewCards = [
  {
    title: '体能测评完成率',
    value: '78%',
    delta: '+6 pts',
    description: '近 4 周滚动完成度持续提升，剩余 36 位勇士待测评。',
  },
  {
    title: '技能专项通过率',
    value: '84%',
    delta: '+9 pts',
    description: '敏捷步伐与核心稳定专项提分明显，班均通过 4.2 项。',
  },
  {
    title: '风险预警个体',
    value: '5 位',
    delta: '-2 位',
    description: '疲劳指数 > 80 的学员全部进入恢复观察通道。',
  },
];

const assessmentSchedule = [
  {
    slot: '周三 16:00',
    target: '雷霆战队 · 14 人',
    focus: '50m 冲刺 + 核心稳定',
    owner: '李晨教练',
    status: '待测评',
  },
  {
    slot: '周五 18:30',
    target: 'Lightning Squad · 12 人',
    focus: '折返跑 + 敏捷梯',
    owner: 'Jessica 教练',
    status: '场地确认',
  },
  {
    slot: '周六 09:00',
    target: 'Energy Sparks · 10 人',
    focus: '耐力折返 + 俯卧撑',
    owner: '王瑞教练',
    status: '测评中',
  },
];

const assessmentCoverageTrend = [
  { week: '第 1 周', coverage: 68, completed: 42, pending: 18 },
  { week: '第 2 周', coverage: 71, completed: 58, pending: 16 },
  { week: '第 3 周', coverage: 75, completed: 79, pending: 14 },
  { week: '第 4 周', coverage: 78, completed: 96, pending: 11 },
];

const classAssessmentStats = [
  {
    id: 'thunder',
    className: '雷霆战队',
    coverage: 92,
    power: 88,
    agility: 90,
    skillFocus: '力量模块表现突出，需加固柔韧测试频率。',
  },
  {
    id: 'lightning',
    className: 'Lightning Squad',
    coverage: 86,
    power: 82,
    agility: 88,
    skillFocus: '敏捷表现领先，冲刺恢复节奏待优化。',
  },
  {
    id: 'sparks',
    className: 'Energy Sparks',
    coverage: 81,
    power: 80,
    agility: 91,
    skillFocus: '灵敏协调强，力量专项测评需补做 2 人。',
  },
];

const assessmentRoster = [
  {
    name: '王小远',
    className: '雷霆战队',
    status: '已完成',
    lastAssessment: '2 天前 · 冲刺 7.4s',
    focus: '维持高步频，强化核心稳定练习。',
  },
  {
    name: '李可心',
    className: 'Energy Sparks',
    status: '预约中',
    lastAssessment: '待安排 · 核心专项',
    focus: '保持家庭陪练打卡，安排周五测评。',
  },
  {
    name: '陈嘉泽',
    className: 'Lightning Squad',
    status: '已完成',
    lastAssessment: '1 天前 · 折返跑 33s',
    focus: '重点巩固呼吸节奏与爆发起跑。',
  },
  {
    name: '郭婧怡',
    className: '雷霆战队',
    status: '恢复中',
    lastAssessment: '4 天前 · 心率波动',
    focus: '进行低强度恢复，周末复测柔韧度。',
  },
  {
    name: '赵宇凡',
    className: 'Energy Sparks',
    status: '已完成',
    lastAssessment: '3 天前 · 敏捷梯 28 次',
    focus: '保持灵敏练习，补做力量专项。',
  },
  {
    name: '林星禾',
    className: 'Lightning Squad',
    status: '预约中',
    lastAssessment: '待安排 · 耐力专项',
    focus: '提前发放测评动作卡片，提醒家长配合。',
  },
  {
    name: '周子言',
    className: 'Energy Sparks',
    status: '恢复中',
    lastAssessment: '6 天前 · 疲劳指数 82',
    focus: '暂停高强度训练，安排理疗师跟进。',
  },
  {
    name: '高悦然',
    className: '雷霆战队',
    status: '已完成',
    lastAssessment: '当日 · 俯卧撑 32 次',
    focus: '保持力量曲线，关注肩部柔韧。',
  },
];

const fitnessHighlights = [
  {
    title: '综合体能指数',
    value: 86,
    change: 3.2,
    description: '较上月提升 3.2 分，高于同龄运动员平均水平 12%。',
    trend: [80, 81, 83, 86],
  },
  {
    title: '技能熟练度',
    value: 4.3,
    change: 0.4,
    description: '动作规范评分持续攀升，专项技巧完成度突破 85%。',
    trend: [3.5, 3.7, 3.9, 4.3],
  },
  {
    title: '耐力指数',
    value: 82,
    change: 2.8,
    description: '60 秒波比跳与折返跑平均完成度稳定增长。',
    trend: [74, 76, 79, 82],
  },
];

const classFitnessMatrix = [
  {
    id: 'thunder',
    className: '雷霆战队',
    speed: 88,
    strength: 90,
    endurance: 84,
    agility: 86,
    highlight: '力量维度较上月 +6 pts，来源于周三力量加餐。',
    color: '#6366f1',
  },
  {
    id: 'lightning',
    className: 'Lightning Squad',
    speed: 86,
    strength: 82,
    endurance: 88,
    agility: 84,
    highlight: '耐力表现领跑，长距离跑步训练执行到位。',
    color: '#22d3ee',
  },
  {
    id: 'sparks',
    className: 'Energy Sparks',
    speed: 81,
    strength: 84,
    endurance: 79,
    agility: 83,
    highlight: '灵敏协调优势明显，建议补充力量模块。',
    color: '#f97316',
  },
];

const skillAssessments = [
  {
    skill: '敏捷步伐',
    passRate: 82,
    bestClass: 'Lightning Squad',
    trend: 4,
    insight: '梯子步 + 折返跑组合训练贡献主要增量。',
  },
  {
    skill: '力量爆发',
    passRate: 78,
    bestClass: '雷霆战队',
    trend: 6,
    insight: '杠铃推举 + 核心抗阻强化了力量输出。',
  },
  {
    skill: '核心稳定',
    passRate: 74,
    bestClass: 'Energy Sparks',
    trend: 3,
    insight: '平板支撑延时训练让核心稳定性稳步提升。',
  },
  {
    skill: '速度耐力',
    passRate: 69,
    bestClass: '雷霆战队',
    trend: 5,
    insight: '4x200m 分组接力与家庭打卡结合成效显著。',

  },
];

const studentProgress = [
  {
    name: '王小远',
    improvement: 12,
    focus: '50m 冲刺成绩从 8.2s 提升至 7.4s，步频练习成效显著。',
  },
  {
    name: '李可心',
    improvement: 9,
    focus: '核心稳定性评分上升 0.6，家庭陪练坚持 18 天。',
  },
  {
    name: '陈一帆',
    improvement: 7,
    focus: '立定跳远提升 18cm，力量与爆发力训练协同完成。',
  },
];

const riskAlerts = [
  {
    title: '柔韧性预警',
    detail: 'Sit-and-reach 平均得分 7.8，低于俱乐部目标 8.5。建议安排专项拉伸营。',
    level: 'bg-amber-50 text-amber-600',
  },
  {
    title: '心肺耐力关注',
    detail: 'SR60 疲劳指数连续 2 周上升，注意控制负荷与恢复周期。',
    level: 'bg-rose-50 text-rose-600',
  },
];

const fitnessDimensions = [
  { key: 'speed', label: '速度' },
  { key: 'strength', label: '力量' },
  { key: 'endurance', label: '耐力' },
  { key: 'agility', label: '灵敏' },
] as const;

export function TrialArenaPage() {
  const [rosterExpanded, setRosterExpanded] = useState(false);
  const rosterDisplayLimit = 5;
  const coverageChartData = useMemo(() => assessmentCoverageTrend, []);
  const coverageSummary = useMemo(
    () => assessmentCoverageTrend[assessmentCoverageTrend.length - 1] ?? { week: '', coverage: 0, completed: 0, pending: 0 },
    [],
  );
  const coverageLift = coverageSummary.coverage - (assessmentCoverageTrend[0]?.coverage ?? 0);
  const classAssessmentMap = useMemo(() => {
    const map = new Map<string, (typeof classAssessmentStats)[number]>();
    classAssessmentStats.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, []);
  const rosterStats = useMemo(() => {
    return assessmentRoster.reduce(
      (acc, item) => {
        if (item.status === '已完成') acc.completed += 1;
        if (item.status === '预约中') acc.scheduled += 1;
        if (item.status === '恢复中') acc.recovery += 1;
        return acc;
      },
      { completed: 0, scheduled: 0, recovery: 0 },
    );
  }, []);
  const hasMoreRoster = assessmentRoster.length > rosterDisplayLimit;
  const visibleRoster = useMemo(
    () =>
      rosterExpanded
        ? assessmentRoster
        : assessmentRoster.slice(0, rosterDisplayLimit),
    [rosterExpanded],
  );
  const classRadarData = useMemo(() => {
    return fitnessDimensions.map((dimension) => {
      const row: Record<string, string | number> = { dimension: dimension.label };
      classFitnessMatrix.forEach((item) => {
        row[item.id] = item[dimension.key as keyof typeof item] as number;
      });
      return row;
    });
  }, []);

  const skillBarData = useMemo(
    () =>
      skillAssessments.map((item) => ({
        技能: item.skill,
        通过率: item.passRate,
        trend: item.trend,
        bestClass: item.bestClass,
        insight: item.insight,
      })),
    [],
  );

  const progressChartData = useMemo(
    () =>
      studentProgress.map((item) => ({
        name: item.name,
        提升幅度: item.improvement,
        focus: item.focus,
      })),
    [],
  );

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/85 p-8 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="uppercase tracking-[0.4em] text-slate-400">Warrior Performance Lab</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">勇士试炼场 · 体能测评塔</h1>
            <p className="mt-2 text-sm text-slate-500">
              聚焦学员体能、技能、耐力与爆发力的综合测评，提供班级完成度、专项通过率与个人风险的实时诊断入口。
            </p>
          </div>
          <div className="flex flex-col gap-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-4 py-2 text-indigo-500">周期：最近 4 周测评</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">覆盖 3 个班级 · 160 位勇士</span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <button className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-2 font-semibold text-white shadow-md transition hover:scale-105">
                发起体能测评
              </button>
              <button className="rounded-xl border border-dashed border-indigo-200 px-5 py-2 text-indigo-500 transition hover:border-indigo-300">
                下载测评模板
              </button>
              <button className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 font-semibold text-white shadow-md transition hover:scale-105">
                导出体能战报
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">体能测评全景</h2>
              <p className="text-sm text-slate-500">覆盖率、技能通过与风险预警，指导测评优先级与训练动作。</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-500">最新数据 · 自动同步</span>
          </header>
          <div className="grid gap-4 md:grid-cols-3">
            {assessmentOverviewCards.map((card) => (
              <article key={card.title} className="space-y-3 rounded-2xl border border-slate-100 bg-white/80 p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold tracking-[0.3em] uppercase text-slate-400">{card.title}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-500">{card.delta}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs leading-relaxed text-slate-500">{card.description}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)]">
            <div className="h-64 rounded-2xl bg-white/60 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={coverageChartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="coverageGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#94a3b8" tickLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" tickLine={false} tickFormatter={(value) => `${value}%`} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8"
                    tickLine={false}
                    tickFormatter={(value) => `${value}人`}
                  />
                  <Tooltip content={<CoverageTooltip />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="coverage"
                    stroke="#0ea5e9"
                    fill="url(#coverageGradient)"
                    strokeWidth={3}
                    name="覆盖率"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="completed"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1' }}
                    name="已测人数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sky-600">
                累计覆盖 {coverageSummary.coverage}%
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">
                已完成 {coverageSummary.completed} 人
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-600">
                待测 {coverageSummary.pending} 人
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
                较首周 {coverageLift >= 0 ? `+${coverageLift}` : coverageLift} pts
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">本周测评排期</h3>
            <ul className="mt-3 space-y-3 text-xs text-slate-600">
              {assessmentSchedule.map((item) => (
                <li key={item.slot} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                    <span>{item.slot}</span>
                    <span className="text-indigo-500">{item.target}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-500">
                      {item.focus}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                      负责人 · {item.owner}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">测评学员清单</h2>
              <p className="text-sm text-slate-500">折叠查看测评进度，优先跟进预约与恢复中的学员。</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
              已测 {rosterStats.completed} · 预约 {rosterStats.scheduled} · 恢复 {rosterStats.recovery}
            </span>
          </header>
          <div className="space-y-3 text-xs text-slate-600">
            {visibleRoster.map((student) => (
              <article key={student.name} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.className}</p>
                  </div>
                  <StatusBadge status={student.status} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{student.lastAssessment}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{student.focus}</p>
              </article>
            ))}
          </div>
          {hasMoreRoster ? (
            <button
              type="button"
              className="w-full rounded-2xl border border-dashed border-indigo-200 bg-white/80 py-2.5 text-xs font-semibold text-indigo-500 transition hover:border-indigo-300 hover:text-indigo-600"
              onClick={() => setRosterExpanded((value) => !value)}
            >
              {rosterExpanded ? '收起学员清单' : `展开全部 ${assessmentRoster.length} 位学员`}
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {fitnessHighlights.map((item) => {
          const sparklineData = item.trend.map((value, index) => ({ step: index + 1, value }));
          const changeLabel = item.change >= 0 ? `+${item.change}` : item.change.toString();

          return (
            <article key={item.title} className="space-y-4 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">{changeLabel}</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{formatHighlightValue(item.title, item.value)}</p>
              <div className="h-20 rounded-2xl bg-slate-50/60 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="step" hide />
                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip content={<HighlightTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.7fr,1fr]">
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">班级体能对比矩阵</h2>
              <p className="text-sm text-slate-500">速度、力量、耐力、灵敏 4 维评分，发现班级优势与短板。</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">评分基于 500+ 测评样本</span>
          </header>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)]">
            <div className="h-80 rounded-2xl bg-white/60 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={classRadarData} outerRadius="70%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="dimension" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[70, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<ClassRadarTooltip />} />
                  {classFitnessMatrix.map((cls) => (
                    <Radar
                      key={cls.id}
                      name={cls.className}
                      dataKey={cls.id}
                      stroke={cls.color}
                      fill={cls.color}
                      fillOpacity={0.25}
                    />
                  ))}
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => classFitnessMatrix.find((cls) => cls.id === value)?.className ?? value}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3 text-xs text-slate-600">
              {classFitnessMatrix.map((row) => {
                const assessmentInfo = classAssessmentMap.get(row.id);
                return (
                  <li key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                        {row.className}
                      </span>
                      <span>综合均分 {Math.round((row.speed + row.strength + row.endurance + row.agility) / 4)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-500">
                        覆盖 {assessmentInfo?.coverage ?? '-'}%
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-500">
                        力量 {assessmentInfo?.power ?? '-'} · 灵敏 {assessmentInfo?.agility ?? '-'}
                      </span>
                    </div>
                    <p className="mt-2 leading-relaxed">{row.highlight}</p>
                    <p className="mt-2 text-[11px] text-slate-500">专项洞察：{assessmentInfo?.skillFocus ?? '待同步测评记录'}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">风险与恢复提示</h2>
              <p className="text-sm text-slate-500">从疲劳指数、柔韧与心肺数据中自动识别预警。</p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">即时提醒</span>
          </header>
          <div className="space-y-3 text-xs">
            {riskAlerts.map((alert) => (
              <div key={alert.title} className={`rounded-2xl p-4 ${alert.level}`}>
                <p className="text-sm font-semibold">{alert.title}</p>
                <p className="mt-2 leading-relaxed">{alert.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="grid gap-6 2xl:grid-cols-[1.4fr,1fr]">
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">技能维度热力追踪</h2>
              <p className="text-sm text-slate-500">技能通过率 + 趋势，识别重点提升模块，安排针对性训练。</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-500">近 6 次测评均值</span>
          </header>

          
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)]">
            <div className="h-80 rounded-2xl bg-white/60 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillBarData} margin={{ top: 10, right: 24, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="技能" stroke="#94a3b8" tickLine={false} />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value}%`} tickLine={false} />
                  <Tooltip content={<SkillTooltip />} />
                  <Bar dataKey="通过率" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3 text-xs text-slate-600">
              {skillAssessments.map((skill) => (
                <li key={skill.skill} className="rounded-2xl bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>{skill.skill}</span>
                    <span>{skill.passRate}% 通过率</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">领先班级 · {skill.bestClass}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{skill.insight}</p>
                  <p className="mt-2 text-[11px] text-emerald-500">趋势 {skill.trend > 0 ? `+${skill.trend}` : skill.trend}%</p>
                </li>
              ))}
            </ul>

          </div>
        </div>

        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">个人突破档案</h2>
              <p className="text-sm text-slate-500">聚焦近 4 周体能提升最快的勇士，及时表彰激励。</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Top 3</span>
          </header>

          
          <div className="grid gap-4">
            <div className="h-64 rounded-2xl bg-white/60 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressChartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} />
                  <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value}%`} tickLine={false} />
                  <Tooltip content={<ProgressTooltip />} />
                  <Bar dataKey="提升幅度" fill="#34d399" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3">
              {studentProgress.map((student) => (
                <li key={student.name} className="rounded-2xl bg-emerald-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">{student.name}</p>
                      <p className="text-xs text-emerald-500">成长幅度 +{student.improvement}%</p>
                    </div>
                    <button className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-600">
                      查看测评
                    </button>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-emerald-600">{student.focus}</p>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">测评结论与训练建议</h2>
            <p className="text-sm text-slate-500">将数据转化为训练与家校联动动作，助力勇士持续进阶。</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">每周自动生成</span>
        </header>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <SuggestionCard
            title="班级训练建议"
            details="雷霆战队加大柔韧模块，Lightning Squad 延长冲刺恢复时长，Energy Sparks 补齐力量循环。"
          />
          <SuggestionCard
            title="个体关怀"
            details="识别 6 位心率恢复偏慢学员，安排专业物理治疗师介入 + 家庭放松方案。"
          />
          <SuggestionCard
            title="家长沟通重点"
            details="输出体能进阶报告模板，突出成长曲线、训练打卡与在家延伸练习建议。"
          />
        </div>
      </section>
    </div>
  );
}


function StatusBadge({ status }: { status: string }) {
  const { className, label } = getStatusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case '已完成':
      return { className: 'bg-emerald-50 text-emerald-600', label: '已完成' };
    case '预约中':
      return { className: 'bg-indigo-50 text-indigo-500', label: '预约中' };
    case '恢复中':
      return { className: 'bg-amber-50 text-amber-600', label: '恢复中' };
    case '待测评':
      return { className: 'bg-slate-100 text-slate-600', label: '待测评' };
    case '场地确认':
      return { className: 'bg-sky-50 text-sky-600', label: '场地确认' };
    case '测评中':
      return { className: 'bg-rose-50 text-rose-500', label: '测评中' };
    default:
      return { className: 'bg-slate-100 text-slate-600', label: status };
  }
}

function formatHighlightValue(title: string, value: number) {
  if (title.includes('技能熟练度')) {
    return `${value.toFixed(1)} / 5`;
  }
  return value.toFixed(0);
}

function CoverageTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as { week: string; coverage: number; completed: number; pending: number };

  return (
    <div className="rounded-2xl border border-sky-200 bg-white/95 p-3 text-xs text-slate-600 shadow">
      <p className="text-sm font-semibold text-slate-800">{point.week}</p>
      <p className="mt-1 text-indigo-500">覆盖率 {point.coverage}%</p>
      <p className="mt-1">已测 {point.completed} 人 · 待测 {point.pending} 人</p>
    </div>
  );
}

function HighlightTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as { step: number; value: number };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white/95 p-2 text-xs text-slate-600 shadow">
      <p className="font-semibold text-slate-700">第 {point.step} 周</p>
      <p className="mt-1 text-sm font-bold text-indigo-500">{point.value.toFixed(1)}</p>
    </div>
  );
}

function ClassRadarTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-600 shadow">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <ul className="mt-2 space-y-1">
        {payload.map((entry) => {
          const classInfo = classFitnessMatrix.find((item) => item.id === entry.name);
          const score = Number(entry.value ?? 0);
          return (
            <li key={entry.name as string} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {classInfo?.className ?? entry.name}
              </span>
              <span className="font-semibold text-slate-700">{score.toFixed(0)} 分</span>
            </li>
          );
        })}
      </ul>

    </div>
  );
}


              
function SkillTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0]?.payload as {
    技能: string;
    通过率: number;
    trend: number;
    bestClass: string;
    insight: string;
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white/95 p-3 text-xs text-slate-600 shadow">
      <p className="text-sm font-semibold text-slate-800">{dataPoint.技能}</p>
      <p className="mt-1">通过率 {dataPoint.通过率}%</p>
      <p className="mt-1 text-emerald-500">趋势 {dataPoint.trend > 0 ? `+${dataPoint.trend}` : dataPoint.trend}%</p>
      <p className="mt-2 leading-relaxed text-slate-500">领先班级 · {dataPoint.bestClass}</p>
    </div>
  );
}

function ProgressTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0]?.payload as { name: string; 提升幅度: number; focus: string };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white/95 p-3 text-xs text-emerald-700 shadow">
      <p className="text-sm font-semibold">{dataPoint.name}</p>
      <p className="mt-1">提升幅度 +{dataPoint.提升幅度}%</p>
      <p className="mt-2 leading-relaxed text-emerald-600/80">{dataPoint.focus}</p>
    </div>
  );
}


function SuggestionCard({ title, details }: { title: string; details: string }) {
  return (
    <article className="rounded-2xl bg-slate-50/80 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{details}</p>
      <button className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-500">
        查看动作拆解
        <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}
