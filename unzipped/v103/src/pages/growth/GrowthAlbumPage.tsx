const growthMilestones = [
  {
    title: '极速等级提升',
    detail: '张星语从极速等级2升至等级3，连续完成 5 张极速挑战卡。',
    reward: '获得「闪电勇士」勋章',
  },
  {
    title: '力量套组满星',
    detail: '林浩然完成力量套组所有任务卡，累积 15 颗星星。',
    reward: '解锁「能量巨石」动画',
  },
  {
    title: '团队荣誉徽章',
    detail: '跳跃游侠小队完成团队任务卡 8/8。',
    reward: '新增团队徽章「协奏之心」',
  },
];

export function GrowthAlbumPage() {
  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/80 p-8 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="uppercase tracking-[0.4em] text-slate-400">成长纪事</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">勇士成长册</h1>
            <p className="mt-2 text-sm text-slate-500">任务完成、星级晋升、勋章收集，一册记录全部精彩瞬间。</p>
          </div>
          <button className="rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105">
            导出成长纪念册
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {growthMilestones.map((milestone) => (
          <div key={milestone.title} className="relative overflow-hidden rounded-3xl bg-white/80 p-6 shadow-lg backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-200/40 via-pink-200/40 to-orange-200/40" aria-hidden="true" />
            <div className="relative space-y-3">
              <h2 className="text-xl font-semibold text-slate-900">{milestone.title}</h2>
              <p className="text-sm text-slate-600">{milestone.detail}</p>
              <div className="rounded-2xl bg-white/80 p-3 text-sm font-semibold text-pink-500 shadow-inner">
                {milestone.reward}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-white/80 p-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">成长路线图预览</h2>
            <p className="text-sm text-slate-500">任务卡完成轨迹自动生成可视化路线。</p>
          </div>
          <button className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:scale-105">
            查看完整路线
          </button>
        </div>
        <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-3">
          <RoadmapStep index={1} title="AI 推荐" detail="根据成长数据推送任务卡" />
          <RoadmapStep index={2} title="任务完成" detail="记录完成时间与能量反馈" />
          <RoadmapStep index={3} title="勋章动画" detail="星星飞入成长册，勋章闪烁" />
        </div>
      </section>
    </div>
  );
}

function RoadmapStep({ index, title, detail }: { index: number; title: string; detail: string }) {
  return (
    <div className="rounded-3xl bg-slate-50/80 p-4 shadow-inner">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-semibold text-white">
        {index}
      </span>
      <h3 className="mt-3 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  );
}
