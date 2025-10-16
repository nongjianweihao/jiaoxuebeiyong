const kpiCards = [
  {
    label: '本月营收总额',
    value: '¥ 46,000',
    delta: '+18% MoM',
    sub: '含课程、营地、周边',
    accent: 'from-amber-400/80 via-orange-500/70 to-rose-500/70',
  },
  {
    label: '续费率',
    value: '72%',
    delta: '+6 pts',
    sub: '近30天到期续费',
    accent: 'from-emerald-400/80 via-emerald-500/70 to-teal-500/70',
  },
  {
    label: '人均客单价',
    value: '¥ 3,200',
    delta: '+12% MoM',
    sub: '含训练包与衍生品',
    accent: 'from-blue-400/80 via-indigo-500/70 to-purple-500/70',
  },
  {
    label: '毛利率',
    value: '33%',
    delta: '+3 pts',
    sub: '扣除场地/教练成本',
    accent: 'from-pink-400/80 via-fuchsia-500/70 to-purple-500/70',
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
  { label: '训练营', value: 28, highlight: 'bg-sky-400' },
  { label: '装备周边', value: 12, highlight: 'bg-emerald-400' },
  { label: '私教/专项', value: 8, highlight: 'bg-violet-400' },
];

const executionStats = [
  {
    title: '课程执行率',
    value: '92%',
    detail: '缺课主要集中在周三 17:00 班级，建议加推提醒',
    accent: 'bg-emerald-100 text-emerald-600',
  },
  {
    title: '教练利用率',
    value: '84%',
    detail: '李教练饱和度 110%，需调度周末下午班次',
    accent: 'bg-blue-100 text-blue-600',
  },
  {
    title: '场地利用率',
    value: '68%',
    detail: '周二/周四 20:00 时段空置，可策划成人体验营',
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
  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_60%)]" aria-hidden="true" />
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
          <div className="space-y-4">
            {growthDimensions.map((dim) => (
              <div key={dim.label} className="rounded-2xl bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{dim.label}</p>
                  <span className="text-sm font-bold text-slate-900">{dim.score.toFixed(1)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-500">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-500">趋势 {dim.trend}</span>
                  <span className="text-slate-400">目标 ≥ 4.0</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full ${dim.color}`} style={{ width: `${(dim.score / 5) * 100}%` }} />
                </div>
              </div>
            ))}
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
