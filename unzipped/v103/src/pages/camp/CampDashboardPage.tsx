const warriorStats = [
  { label: '今日签到', value: '28 / 30', description: '勇士按时抵达训练营', accent: 'from-green-400 to-emerald-500' },
  { label: '能量条均值', value: '82%', description: '连续打卡提升基础能量', accent: 'from-sky-400 to-indigo-500' },
  { label: '积分池', value: '3,420', description: '本周闯关累计积分', accent: 'from-purple-400 to-pink-500' },
];

const growthHighlights = [
  {
    title: '勇士晨练激活',
    detail: '极速小队 12 位勇士完成反应挑战，解锁双倍能量奖励。',
    tag: '极速',
  },
  {
    title: '团队协作加成',
    detail: '战队任务「同步节奏接力」完成率达 95%，新增团队荣誉徽章 3 枚。',
    tag: '战队',
  },
  {
    title: '智能推送提醒',
    detail: '智能任务助手推荐 6 项任务卡，覆盖力量与耐力关键能力。',
    tag: '智能',
  },
];

export function CampDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/80 p-8 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="uppercase tracking-[0.4em] text-slate-400">勇士训练营</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">勇士训练营成长面板</h1>
            <p className="mt-2 text-sm text-slate-500">
              追踪签到、出勤、能量条状态，让每一天的成长都能被看见。
            </p>
          </div>
          <button className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105">
            生成勇士成长报告
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {warriorStats.map((item) => (
          <div key={item.label} className="relative overflow-hidden rounded-3xl bg-white/70 p-6 shadow-lg backdrop-blur">
            <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-20`} aria-hidden="true" />
            <div className="relative flex h-full flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{item.label}</span>
              <span className="mt-3 text-3xl font-bold text-slate-900">{item.value}</span>
              <span className="mt-auto text-sm text-slate-600">{item.description}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-3xl bg-white/70 p-6 shadow-lg backdrop-blur lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">成长脉冲</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">实时刷新</span>
          </div>
          <ul className="space-y-4">
            {growthHighlights.map((highlight) => (
              <li key={highlight.title} className="rounded-2xl bg-slate-50/80 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">{highlight.title}</h3>
                  <span className="rounded-full bg-gradient-to-r from-purple-400 to-pink-500 px-2 py-1 text-xs font-semibold text-white">
                    {highlight.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{highlight.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 rounded-3xl bg-white/70 p-6 shadow-lg backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900">能量条排行榜</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <ProgressRow label="王小远" value={92} energy="极速" />
            <ProgressRow label="李可心" value={88} energy="力量" />
            <ProgressRow label="陈一帆" value={85} energy="耐力" />
            <ProgressRow label="赵晨曦" value={81} energy="协调" />
          </div>
        </div>
      </section>
    </div>
  );
}

function ProgressRow({ label, value, energy }: { label: string; value: number; energy: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">主力能量：{energy}</p>
    </div>
  );
}
