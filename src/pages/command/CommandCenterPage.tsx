import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps, ValueType, NameType } from 'recharts';
import { EnergyBoard } from '../../components/EnergyBoard';
import type { Student } from '../../types';
import { studentsRepo } from '../../store/repositories/studentsRepo';

const kpiCards = [
  {
    label: '本月课消',
    value: '1,288 课时',
    delta: '+16% MoM',
    sub: '含常规班 / 进阶营地',
    accent: 'from-amber-400/80 via-orange-500/70 to-rose-500/70',
  },
  {
    label: '经营收入',
    value: '¥ 48,600',
    delta: '+12% MoM',
    sub: '课程 + 训练营 + 周边',
    accent: 'from-emerald-400/80 via-emerald-500/70 to-teal-500/70',
  },
  {
    label: '活跃学员',
    value: '162 人',
    delta: '+9 人',
    sub: '≥8 课时 / 月',
    accent: 'from-blue-400/80 via-indigo-500/70 to-purple-500/70',
  },
  {
    label: '现金回款率',
    value: '91%',
    delta: '+5 pts',
    sub: '含分期回款核销',
    accent: 'from-pink-400/80 via-fuchsia-500/70 to-purple-500/70',
  },
];

const monthlyCourseRhythm = [
  {
    month: '2024年1月',
    lessons: 1186,
    attendanceRate: 87,
    change: 4,
    highlight: '寒假战队营带动，周末场次满班率 96%。',
  },
  {
    month: '2024年2月',
    lessons: 1104,
    attendanceRate: 82,
    change: -6,
    highlight: '春节假期影响，营地课程贡献 320 课时。',
  },
  {
    month: '2024年3月',
    lessons: 1288,
    attendanceRate: 90,
    change: 16,
    highlight: '开学季返课高峰，家庭陪练打卡提升 12%。',
  },
];

const revenueTimeline = [
  {
    month: '2024年1月',
    total: 40400,
    course: 65,
    camp: 19,
    private: 16,
    cashflow: 5900,
  },
  {
    month: '2024年2月',
    total: 43200,
    course: 62,
    camp: 21,
    private: 17,
    cashflow: 6800,
  },
  {
    month: '2024年3月',
    total: 48600,
    course: 58,
    camp: 27,
    private: 15,
    cashflow: 9300,
  },
];

const lessonStructure = [
  { label: '体能基础课', hours: 420, share: 32, detail: '低龄勇士班，高频课消支撑稳定现金流。' },
  { label: '进阶战术课', hours: 318, share: 24, detail: '力量 + 速度双模组，报名转介绍提升 14%。' },
  { label: '营地集训', hours: 276, share: 21, detail: '营地打包附带装备组合，ARPU 较常规课高 42%。' },
  { label: '私教/专项', hours: 192, share: 15, detail: '私教续费率 88%，建议保持排班弹性。' },
  { label: '家庭陪练', hours: 82, share: 8, detail: '线上打卡任务带动能量值增长与裂变。' },
];

const studentHourDistribution = [
  {
    segment: '≥ 16 课时 / 月',
    ratio: 28,
    delta: 6,
    insight: '高粘进阶班，输出冠军故事做口碑裂变。',
    color: '#10b981',
    fill: '#10b981',
  },
  {
    segment: '12-15 课时 / 月',
    ratio: 34,
    delta: 3,
    insight: '常规班稳定区间，叠加家庭陪练作业巩固效果。',
    color: '#22d3ee',
    fill: '#22d3ee',
  },
  {
    segment: '8-11 课时 / 月',
    ratio: 22,
    delta: -5,
    insight: '存在松动迹象，需社群触达 + 教练点名激励。',
    color: '#f97316',
    fill: '#f97316',
  },
  {
    segment: '≤ 7 课时 / 月',
    ratio: 16,
    delta: -4,
    insight: '集中在新生体验阶段，安排班主任 48 小时回访。',
    color: '#ef4444',
    fill: '#ef4444',
  },
];

const funnelStages = [
  { title: '线索获取', value: 680, rate: '100%', description: '公众号、社群裂变、活动报名' },
  { title: '体验课', value: 382, rate: '56%', description: '已完成预约并到课体验' },
  { title: '正式转化', value: 198, rate: '29%', description: '签约季度/半年课包' },
  { title: '高阶留存', value: 138, rate: '20%', description: '完成二次续费或升级营地' },
];

const revenueMix = [
  { label: '课程包', value: 52, highlight: 'bg-amber-400' },
  { label: '训练营', value: 27, highlight: 'bg-sky-400' },
  { label: '私教/专项', value: 15, highlight: 'bg-violet-400' },
  { label: '装备周边', value: 6, highlight: 'bg-emerald-400' },
];

const executionStats = [
  {
    title: '课程执行率',
    value: '94%',
    detail: '周三 17:00 班级缺课率回落至 6%，推送提醒效果显著。',
    accent: 'bg-emerald-100 text-emerald-600',
  },
  {
    title: '教练利用率',
    value: '86%',
    detail: '李教练饱和度 108%，需调度周末下午班次。',
    accent: 'bg-blue-100 text-blue-600',
  },
  {
    title: '场地利用率',
    value: '71%',
    detail: '周二/周四 20:00 时段空置，策划成人体验营。',
    accent: 'bg-amber-100 text-amber-600',
  },
];

const growthDimensions = [
  { label: '自信表现', score: 4.6, trend: '+0.4', color: 'bg-rose-400' },
  { label: '积极投入', score: 4.3, trend: '+0.2', color: 'bg-orange-400' },
  { label: '团队协作', score: 4.1, trend: '+0.3', color: 'bg-sky-400' },
  { label: '力量爆发', score: 4.5, trend: '+0.5', color: 'bg-violet-400' },
  { label: '灵敏速度', score: 4.2, trend: '+0.1', color: 'bg-emerald-400' },
];

const focusList = [
  {
    name: '刘梓涵',
    grade: '勇士 Lv.3',
    issue: '最近 2 节课缺勤，训练热身完成度 60%',
    action: '本周安排班主任家访电话',
  },
  {
    name: '张奕辰',
    grade: '勇士 Lv.2',
    issue: '爆发力维度连续 3 周下降',
    action: '建议加入力量专项 + 家庭配速作业',
  },
  {
    name: '王子墨',
    grade: '勇士 Lv.4',
    issue: '课堂表现积极但转介绍转化低',
    action: '邀约家长参与冠军分享会',
  },
];

const actionItems = [
  {
    title: '社群运营',
    detail: '以「春季体能冲刺营」为主题开展 7 天打卡，目标 200 个线索。',
    owner: '运营组',
  },
  {
    title: '课程产品',
    detail: '优化速度训练模块动作库，新增「梯子步」和「折返冲刺」教学视频。',
    owner: '教研组',
  },
  {
    title: '家长服务',
    detail: '对 20 位核心家长开启「成长陪伴官」计划，输出专属成长报告。',
    owner: '客户成功',
  },
];

export function CommandCenterPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const revenueChartData = useMemo(
    () =>
      revenueTimeline.map((item) => ({
        month: item.month,
        total: item.total,
        课程包: Math.round((item.course / 100) * item.total),
        训练营: Math.round((item.camp / 100) * item.total),
        私教专项: Math.round((item.private / 100) * item.total),
      })),
    [],
  );

  const lessonStructureChartData = useMemo(
    () =>
      lessonStructure.map((item) => ({
        name: item.label,
        hours: item.hours,
        share: item.share,
      })),
    [],
  );

  const growthRadarData = useMemo(
    () =>
      growthDimensions.map((dim) => ({
        dimension: dim.label,
        得分: dim.score,
      })),
    [],
  );

  useEffect(() => {
    let active = true;

    async function loadStudents() {
      try {
        setLoadingStudents(true);
        const list = await studentsRepo.list();
        if (active) {
          setStudents(list);
        }
      } catch (error) {
        console.error('加载学员列表失败', error);
      } finally {
        if (active) {
          setLoadingStudents(false);
        }
      }
    }

    void loadStudents();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-8 text-white shadow-xl">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_60%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.5em] text-slate-300/80">Growth Command Tower</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">成长指挥塔</h1>
            <p className="max-w-xl text-sm text-slate-200/90">
              聚合营收、转化、训练执行与学员成长数据，为运营决策提供一站式驾驶舱视角。
              重点指标均已对接实时看板，可一键导出策略建议。
            </p>
          </div>
          <div className="flex flex-col gap-3 text-xs font-medium text-slate-200">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
              <span className="text-slate-100/80">观察周期</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-white">本月</span>
              <span className="rounded-full px-3 py-1 text-slate-200/60">本季度</span>
            </div>
            <button className="flex items-center justify-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:scale-105">
              导出经营战报
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <article
            key={card.label}
            className="relative overflow-hidden rounded-3xl bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-20`} aria-hidden="true" />
            <div className="relative space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <div className="flex items-center gap-2 text-xs text-emerald-500">
                <span>{card.delta}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-500">策略达成</span>
              </div>
              <p className="text-[13px] text-slate-500">{card.sub}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">多月课消节奏</h2>
              <p className="text-sm text-slate-500">滚动观测课时消耗、到课率与增长亮点，预警淡旺季节奏。</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-500">自动拉取近 90 天</span>
          </header>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)]">
            <div className="h-72 rounded-2xl bg-white/60 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyCourseRhythm} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="lessonsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb923c" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <YAxis yAxisId="right" orientation="right" hide domain={[70, 100]} />
                  <Tooltip content={<CourseRhythmTooltip />} />
                  <Area
                    type="monotone"
                    yAxisId="left"
                    dataKey="lessons"
                    stroke="#f97316"
                    fill="url(#lessonsGradient)"
                    strokeWidth={3}
                    name="课时"
                  />
                  <Line
                    type="monotone"
                    yAxisId="right"
                    dataKey="attendanceRate"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1' }}
                    name="到课率"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3 text-xs text-slate-600">
              {monthlyCourseRhythm
                .slice()
                .reverse()
                .map((item) => (
                  <li key={item.month} className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-amber-600">
                      <span>{item.month}</span>
                      <span>
                        {item.lessons.toLocaleString()} 课时 · 到课率 {item.attendanceRate}% · MoM {item.change > 0 ? `+${item.change}` : item.change}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-amber-600/80">{item.highlight}</p>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">收入走势追踪</h2>
              <p className="text-sm text-slate-500">同步分品类贡献与 ARPU 表现，便于即时调价与打包策略。</p>
            </div>
            <span className="text-xs text-slate-400">单位：人民币</span>
          </header>
          <div className="h-72 rounded-2xl bg-white/60 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 10, right: 24, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<RevenueTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="课程包" stackId="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="训练营" stackId="revenue" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="私教专项" stackId="revenue" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2 text-xs text-slate-500">
            {revenueTimeline.map((item) => (
              <li key={item.month} className="flex items-center justify-between rounded-xl bg-slate-50/80 px-3 py-2">
                <span className="font-semibold text-slate-700">{item.month}</span>
                <span className="text-indigo-500 font-semibold">¥ {item.total.toLocaleString()}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-600">现金流入 ¥ {item.cashflow.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">课时结构与人群洞察</h2>
              <p className="text-sm text-slate-500">锁定不同课程形态的课时占比，辅助排班与产品组合。</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">更新于本周例会</span>
          </header>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)]">
            <div className="h-72 rounded-2xl bg-white/60 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lessonStructureChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 24, left: 30, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip content={<LessonTooltip />} />
                  <Bar dataKey="hours" fill="#22d3ee" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3 text-xs text-slate-600">
              {lessonStructure.map((item) => (
                <li key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>{item.label}</span>
                    <span>{item.share}% 占比</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed">{item.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">学员课时分布</h2>
              <p className="text-sm text-slate-500">识别高粘人群与预警梯队，指导班主任行动。</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-500">162 位勇士</span>
          </header>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)]">
            <div className="h-72 rounded-2xl bg-white/60 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="25%"
                  outerRadius="100%"
                  data={studentHourDistribution}
                  startAngle={180}
                  endAngle={-180}
                >
                  <PolarAngleAxis dataKey="segment" type="category" tick={false} />
                  <RadialBar
                    minAngle={12}
                    clockWise
                    dataKey="ratio"
                    background
                    cornerRadius={18}
                    label={{ position: 'insideStart', fill: '#fff', formatter: (value: number) => `${value}%` }}
                  />
                  <Tooltip content={<HourTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3 text-xs text-slate-600">
              {studentHourDistribution.map((item) => (
                <li key={item.segment} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between text-sm font-semibold" style={{ color: item.color }}>
                    <span>{item.segment}</span>
                    <span>{item.ratio}%</span>
                  </div>
                  <p className="mt-2 leading-relaxed text-emerald-700/80">{item.insight}</p>
                  <p className="mt-2 text-[11px] text-emerald-500/80">环比 {item.delta > 0 ? `+${item.delta}` : item.delta} pts</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.4fr,1fr]">
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">班级能量荣誉榜</h2>
              <p className="text-sm text-slate-500">集中展示能量、积分、荣誉点亮状态，支持一键展开全量勇士。</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-500">自动同步游戏化系统</span>
          </header>
          {loadingStudents ? (
            <div className="rounded-3xl border border-dashed border-amber-200 bg-white/60 p-6 text-center text-xs text-amber-500">
              正在汇总班级勇士数据…
            </div>
          ) : (
            <EnergyBoard students={students} maxCollapsedEntries={6} />
          )}
        </div>

        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">续费与待转指标</h2>
              <p className="text-sm text-slate-500">锁定到期窗口与潜在转介绍，搭配能量榜快速行动。</p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">重点关注</span>
          </header>
          <ul className="space-y-4 text-xs text-slate-600">
            <li className="rounded-2xl bg-rose-50/70 p-4 text-rose-600">
              <p className="font-semibold">10 日内到期 · 12 位</p>
              <p className="mt-1 leading-relaxed">同步班主任 + 运营顾问，输出成长战报 + 升级方案。</p>
            </li>
            <li className="rounded-2xl bg-indigo-50/70 p-4 text-indigo-600">
              <p className="font-semibold">待激活推荐 · 8 个家庭</p>
              <p className="mt-1 leading-relaxed">能量榜前 10 勇士加推「冠军同行」礼包，引导转介绍。</p>
            </li>
            <li className="rounded-2xl bg-emerald-50/70 p-4 text-emerald-600">
              <p className="font-semibold">体验课回访 · 5 组</p>
              <p className="mt-1 leading-relaxed">结合课时分布低段人群，安排 48 小时内二次触达。</p>
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr,1.2fr]">
        <div className="space-y-6 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">增长漏斗与转化诊断</h2>
              <p className="text-sm text-slate-500">跟踪从线索到高阶留存的每一个环节，快速定位流失点。</p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-500">实时同步</span>
          </header>
          <div className="grid gap-4 lg:grid-cols-4">
            {funnelStages.map((stage, index) => (
              <div key={stage.title} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{stage.title}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{stage.value}</p>
                <p className="text-xs text-slate-500">转化率 {stage.rate}</p>
                <p className="mt-2 text-[13px] text-slate-500">{stage.description}</p>
                {index < funnelStages.length - 1 && <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-indigo-200 to-indigo-500" />}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">营收结构</h2>
            <span className="text-xs text-slate-400">结构越清晰，策略越精准</span>
          </header>
          <div className="space-y-4">
            {revenueMix.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full ${item.highlight}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-indigo-50/80 p-4 text-xs text-indigo-500">
            <p className="font-semibold text-indigo-600">策略建议</p>
            <p className="mt-1 leading-relaxed text-indigo-500">
              加强「训练营 + 装备」组合销售，提升客单价 8%；同步规划周边联名，拉动高利润结构。
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr,1fr]">
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">运营执行雷达</h2>
              <p className="text-sm text-slate-500">课程执行、教练与场地资源实时监控。</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-500">本周</span>
          </header>
          <div className="space-y-4">
            {executionStats.map((item) => (
              <div key={item.title} className="rounded-2xl bg-slate-50/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.accent}`}>{item.value}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">学员成长维度</h2>
              <p className="text-sm text-slate-500">课堂表现模型汇总近 4 周均分。</p>
            </div>
            <span className="text-xs text-slate-400">自动更新</span>
          </header>
          <div className="grid gap-4">
            <div className="h-72 rounded-2xl bg-white/60 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={growthRadarData} outerRadius="70%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="dimension" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Radar
                    name="得分"
                    dataKey="得分"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.35}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 text-xs text-slate-600">
              {growthDimensions.map((dim) => (
                <li key={dim.label} className="rounded-2xl bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>{dim.label}</span>
                    <span>{dim.score.toFixed(1)}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed">近 4 周趋势 {dim.trend}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full ${dim.color}`} style={{ width: `${(dim.score / 5) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">高优先级关注</h2>
              <p className="text-sm text-slate-500">结合缺勤、维度下降、家长反馈自动生成。</p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-500">共 3 位</span>
          </header>
          <ul className="space-y-4">
            {focusList.map((item) => (
              <li key={item.name} className="rounded-2xl bg-rose-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-rose-600">{item.name}</p>
                    <p className="text-xs text-rose-400">{item.grade}</p>
                  </div>
                  <button className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-rose-600">
                    查看档案
                  </button>
                </div>
                <p className="mt-3 text-xs text-rose-500">{item.issue}</p>
                <p className="mt-2 text-xs font-medium text-rose-400">行动：{item.action}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">运营动作看板</h2>
              <p className="text-sm text-slate-500">战略拆解到执行动作，自动跟踪责任人。</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">本周需要推进</span>
          </header>
          <ul className="space-y-4">
            {actionItems.map((action) => (
              <li key={action.title} className="rounded-2xl bg-slate-50/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                  <span className="text-xs font-semibold text-indigo-500">负责人 · {action.owner}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{action.detail}</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-500">提醒</span>
                  <span>进度将同步到日报与周会纪要</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">关键洞察</h2>
              <p className="text-sm text-slate-500">聚合系统自动生成的运营提醒。</p>
            </div>
            <span className="text-xs text-slate-400">更新于 5 分钟前</span>
          </header>
          <ul className="space-y-3 text-xs text-slate-600">
            <li className="rounded-2xl bg-emerald-50/70 p-4 text-emerald-600">
              <p className="font-semibold">高潜课程包</p>
              <p className="mt-1 leading-relaxed">
                周末下午时段留存率 78%，建议加推家庭亲子共训，满足家长陪伴需求。
              </p>
            </li>
            <li className="rounded-2xl bg-amber-50/70 p-4 text-amber-600">
              <p className="font-semibold">教练排班提醒</p>
              <p className="mt-1 leading-relaxed">
                李教练承担 3 条新体验课线索，建议安排助教，避免体验质量波动。
              </p>
            </li>
            <li className="rounded-2xl bg-rose-50/70 p-4 text-rose-600">
              <p className="font-semibold">续费关注</p>
              <p className="mt-1 leading-relaxed">
                8 位家长套餐将在 10 日内到期，建议提前输出成长周报 + 定制续费方案。
              </p>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function CourseRhythmTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0]?.payload as (typeof monthlyCourseRhythm)[number];

  return (
    <div className="rounded-2xl border border-amber-200 bg-white/90 p-3 text-xs text-slate-600 shadow-lg">
      <p className="text-sm font-semibold text-amber-600">{dataPoint.month}</p>
      <p className="mt-1">课时 {dataPoint.lessons.toLocaleString()} · 到课率 {dataPoint.attendanceRate}%</p>
      <p className="mt-1">环比 {dataPoint.change > 0 ? `+${dataPoint.change}` : dataPoint.change}%</p>
      <p className="mt-2 leading-relaxed text-amber-500/80">{dataPoint.highlight}</p>
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const total = (payload[0]?.payload as { total: number }).total;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-600 shadow-lg">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <ul className="mt-2 space-y-1">
        {payload.map((entry) => {
          const value = Number(entry.value ?? 0);
          const share = total ? Math.round((value / total) * 100) : 0;
          return (
            <li key={entry.name as string} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-semibold text-slate-700">¥ {value.toLocaleString()} · {share}%</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-slate-400">总收入 ¥ {total.toLocaleString()}</p>
    </div>
  );
}

function LessonTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0]?.payload as { name: string; hours: number; share: number };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-600 shadow">
      <p className="text-sm font-semibold text-slate-800">{dataPoint.name}</p>
      <p className="mt-1">课时 {dataPoint.hours.toLocaleString()} · 占比 {dataPoint.share}%</p>
    </div>
  );
}

function HourTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0]?.payload as (typeof studentHourDistribution)[number];

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white/95 p-3 text-xs text-emerald-700 shadow">
      <p className="text-sm font-semibold" style={{ color: dataPoint.color }}>
        {dataPoint.segment}
      </p>
      <p className="mt-1">占比 {dataPoint.ratio}%</p>
      <p className="mt-1">环比 {dataPoint.delta > 0 ? `+${dataPoint.delta}` : dataPoint.delta} pts</p>
      <p className="mt-2 leading-relaxed text-emerald-600/80">{dataPoint.insight}</p>
    </div>
  );
}
