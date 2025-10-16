const roadmapSteps = [
  {
    title: '制定成长路线图',
    description: '从任务卡库拖拽组合 Speed、Strength、Stamina 等能力模块。',
  },
  {
    title: '匹配勇士阶段',
    description: '选择学员阶段，系统自动推荐适配星级任务。',
  },
  {
    title: '发布今日挑战',
    description: '一键推送到勇士训练营，记录完成情况与即时反馈。',
  },
];

const aiTips = [
  'AI Mission 推荐 6 张任务卡，优先覆盖勇士短板能力。',
  'Strength 能力套组达成率 78%，建议追加力量挑战卡。',
  'Stamina 训练完成后，可安排团队协作任务巩固节奏。',
];

export function CoachCommandPage() {
  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/80 p-8 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="uppercase tracking-[0.4em] text-slate-400">Coach Mission Desk</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">教练作战台</h1>
            <p className="mt-2 text-sm text-slate-500">编排课程、分配任务卡、查看 AI 推荐与成长反馈。</p>
          </div>
          <button className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105">
            新建成长路线图
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 rounded-3xl bg-white/70 p-6 shadow-lg backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900">路线图指挥流程</h2>
          <ol className="space-y-4 text-sm text-slate-600">
            {roadmapSteps.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-2xl bg-slate-50/80 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-base font-semibold text-slate-900">{step.title}</p>
                  <p className="mt-1">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-4 rounded-3xl bg-white/70 p-6 shadow-lg backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900">AI 挑战推荐</h2>
          <ul className="space-y-3 text-sm text-slate-600">
            {aiTips.map((tip) => (
              <li key={tip} className="rounded-2xl bg-gradient-to-r from-indigo-100 to-purple-100 p-4 text-slate-700">
                {tip}
              </li>
            ))}
          </ul>
          <button className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105">
            一键分配任务卡
          </button>
        </div>
      </section>
    </div>
  );
}
