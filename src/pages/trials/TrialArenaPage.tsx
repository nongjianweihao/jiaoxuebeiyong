const fitnessHighlights = [
  {
    title: '综合体能指数',
    value: '86',
    change: '+3.2',
    description: '较上月提升 3.2 分，高于同龄运动员平均水平 12%。',
  },
  {
    title: '技能熟练度',
    value: '4.3 / 5',
    change: '+0.4',
    description: '动作规范评分持续攀升，专项技巧完成度突破 85%。',
  },
  {
    title: '耐力指数',
    value: '82',
    change: '+2.8',
    description: '60 秒波比跳与折返跑平均完成度稳定增长。',
  },
];

const classFitnessMatrix = [
  {
    className: '雷霆战队',
    speed: 88,
    strength: 90,
    endurance: 84,
    agility: 86,
    highlight: '力量维度较上月 +6 pts，来源于周三力量加餐。',
  },
  {
    className: 'Lightning Squad',
    speed: 86,
    strength: 82,
    endurance: 88,
    agility: 84,
    highlight: '耐力表现领跑，长距离跑步训练执行到位。',
  },
  {
    className: 'Energy Sparks',
    speed: 81,
    strength: 84,
    endurance: 79,
    agility: 83,
    highlight: '灵敏协调优势明显，建议补充力量模块。',
  },
];

const skillAssessments = [
  {
    skill: '敏捷步伐',
    passRate: '82%',
    bestClass: 'Lightning Squad',
    trend: '+4%',
    insight: '梯子步 + 折返跑组合训练贡献主要增量。',
  },
  {
    skill: '力量爆发',
    passRate: '78%',
    bestClass: '雷霆战队',
    trend: '+6%',
    insight: '杠铃推举 + 核心抗阻强化了力量输出。',
  },
  {
    skill: '核心稳定',
    passRate: '74%',
    bestClass: 'Energy Sparks',
    trend: '+3%',
    insight: '平板支撑延时训练让核心稳定性稳步提升。',
  },
  {
    skill: '速度耐力',
    passRate: '69%',
    bestClass: '雷霆战队',
    trend: '+5%',
    insight: '4x200m 分组接力与家庭打卡结合成效显著。',
  },
];

const studentProgress = [
  {
    name: '王小远',
    improvement: '+12%',
    focus: '50m 冲刺成绩从 8.2s 提升至 7.4s，步频练习成效显著。',
  },
  {
    name: '李可心',
    improvement: '+9%',
    focus: '核心稳定性评分上升 0.6，家庭陪练坚持 18 天。',
  },
  {
    name: '陈一帆',
    improvement: '+7%',
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

export function TrialArenaPage() {
  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/85 p-8 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="uppercase tracking-[0.4em] text-slate-400">Warrior Performance Lab</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">勇士试炼场 · 体能测评塔</h1>
            <p className="mt-2 text-sm text-slate-500">
              聚焦学员体能、技能、耐力与爆发力的综合测评，输出班级对比、技能热力、个体突破与风险预警。
            </p>
          </div>
          <div className="flex flex-col gap-3 text-xs text-slate-500">
            <span className="self-start rounded-full bg-indigo-50 px-4 py-2 text-indigo-500">周期：最近 4 周测评</span>
            <button className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105">
              导出体能战报
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {fitnessHighlights.map((item) => (
          <article key={item.title} className="rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">{item.change}</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.description}</p>
          </article>
        ))}
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
          <div className="space-y-4">
            {classFitnessMatrix.map((row) => (
              <article key={row.className} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.className}</p>
                    <p className="text-xs text-slate-500">{row.highlight}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs text-slate-500">
                    <MetricBadge label="速度" value={row.speed} accent="bg-sky-100 text-sky-600" />
                    <MetricBadge label="力量" value={row.strength} accent="bg-rose-100 text-rose-600" />
                    <MetricBadge label="耐力" value={row.endurance} accent="bg-emerald-100 text-emerald-600" />
                    <MetricBadge label="灵敏" value={row.agility} accent="bg-violet-100 text-violet-600" />
                  </div>
                </div>
              </article>
            ))}
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
          <div className="grid gap-4 md:grid-cols-2">
            {skillAssessments.map((skill) => (
              <article key={skill.skill} className="rounded-2xl bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{skill.skill}</p>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-500">{skill.trend}</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">{skill.passRate}</p>
                <p className="mt-2 text-xs text-slate-500">领先班级 · {skill.bestClass}</p>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">{skill.insight}</p>
              </article>
            ))}
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
          <ul className="space-y-3">
            {studentProgress.map((student) => (
              <li key={student.name} className="rounded-2xl bg-emerald-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">{student.name}</p>
                    <p className="text-xs text-emerald-500">成长幅度 {student.improvement}</p>
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

function MetricBadge({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className={`rounded-xl px-3 py-2 font-semibold ${accent}`}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{value}</p>
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
