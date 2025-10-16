const trialStages = [
  {
    title: '青铜段位试炼',
    description: '基础体能与动作评测，完成 3 张任务卡即可挑战晋级。',
    reward: '解锁 1 枚段位徽章 + 150 能量值',
  },
  {
    title: '白银段位试炼',
    description: '加入速度与力量双任务，考验综合能力输出。',
    reward: '随机掉落 ★★★ 任务卡',
  },
  {
    title: '黄金段位试炼',
    description: '必须完成团队协作挑战，排行榜实时刷新。',
    reward: '勇士试炼场专属背景动画',
  },
];

export function TrialArenaPage() {
  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/80 p-8 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="uppercase tracking-[0.4em] text-slate-400">Warrior Trials</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">勇士试炼场</h1>
            <p className="mt-2 text-sm text-slate-500">段位挑战、评测任务、闯关排行榜，激发勇士的竞赛心。</p>
          </div>
          <button className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105">
            发起段位挑战
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {trialStages.map((stage) => (
          <div key={stage.title} className="relative overflow-hidden rounded-3xl bg-white/80 p-6 shadow-lg backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/40 via-orange-200/40 to-pink-200/40" aria-hidden="true" />
            <div className="relative space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">{stage.title}</h2>
              <p className="text-sm text-slate-600">{stage.description}</p>
              <div className="rounded-2xl bg-white/80 p-3 text-sm font-semibold text-orange-500 shadow-inner">{stage.reward}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-white/80 p-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">闯关排行榜</h2>
            <p className="text-sm text-slate-500">实时刷新勇士试炼积分与星级奖励。</p>
          </div>
          <button className="rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:scale-105">
            导出排行榜
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <LeaderboardCard
            title="个人积分榜"
            data={[
              { label: '王小远', value: '980 pts', trend: '+45' },
              { label: '李可心', value: '960 pts', trend: '+30' },
              { label: '陈一帆', value: '910 pts', trend: '+20' },
            ]}
          />
          <LeaderboardCard
            title="团队闯关榜"
            data={[
              { label: 'Jump Rangers', value: '2,400 pts', trend: '+90' },
              { label: 'Lightning Squad', value: '2,260 pts', trend: '+60' },
              { label: 'Energy Sparks', value: '2,150 pts', trend: '+50' },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function LeaderboardCard({
  title,
  data,
}: {
  title: string;
  data: Array<{ label: string; value: string; trend: string }>;
}) {
  return (
    <div className="rounded-3xl bg-slate-50/80 p-4 shadow-inner">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-3 text-sm text-slate-600">
        {data.map((item) => (
          <li key={item.label} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{item.label}</p>
              <p className="text-xs text-slate-500">本周趋势 {item.trend}</p>
            </div>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-orange-500 shadow-sm">
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
