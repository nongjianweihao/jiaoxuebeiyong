import type { GrowthProjectionState } from '../utils/growthProjection';

interface GrowthProjectionPanelProps {
  projection: GrowthProjectionState;
}

const TREE_CANOPY_CLASS: Record<string, string> = {
  seed: 'from-emerald-200 via-emerald-100 to-emerald-50',
  sprout: 'from-emerald-300 via-emerald-200 to-emerald-100',
  sapling: 'from-emerald-400 via-emerald-300 to-emerald-100',
  bloom: 'from-emerald-500 via-cyan-300 to-emerald-200',
  fruit: 'from-emerald-400 via-amber-200 to-emerald-100',
  grove: 'from-emerald-600 via-emerald-400 to-emerald-200',
};

const HERO_AURA_CLASS: Record<string, string> = {
  novice: 'from-slate-300 via-slate-200 to-white',
  bronze: 'from-amber-300 via-orange-200 to-yellow-100',
  silver: 'from-slate-200 via-sky-200 to-white',
  gold: 'from-amber-300 via-yellow-200 to-amber-100',
  diamond: 'from-cyan-300 via-purple-200 to-indigo-100',
  legend: 'from-purple-400 via-indigo-300 to-amber-200',
};

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/50">
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-emerald-400"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
      />
    </div>
  );
}

function TreeVisual({ stageId }: { stageId: string }) {
  return (
    <div className="relative h-40 w-40">
      <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="absolute inset-x-6 bottom-4 h-8 rounded-full bg-amber-900/20 blur" />
      <div className="absolute inset-x-1/2 bottom-4 h-16 w-8 -translate-x-1/2 rounded-full bg-amber-500 shadow-lg shadow-amber-500/30" />
      <div
        className={`absolute inset-x-0 top-0 h-32 rounded-full bg-gradient-to-br shadow-lg shadow-emerald-500/30 ${TREE_CANOPY_CLASS[stageId] ?? TREE_CANOPY_CLASS.seed}`}
      />
      <div className="absolute inset-x-10 top-4 h-28 rounded-full bg-white/10 blur" />
    </div>
  );
}

function HeroVisual({ stageId }: { stageId: string }) {
  return (
    <div className="relative h-40 w-40">
      <div className="absolute inset-0 animate-pulse rounded-full bg-amber-200/20 blur-3xl" />
      <div
        className={`absolute inset-3 rounded-3xl bg-gradient-to-br shadow-lg shadow-purple-400/30 ${HERO_AURA_CLASS[stageId] ?? HERO_AURA_CLASS.novice}`}
      />
      <div className="absolute inset-6 rounded-3xl border border-white/30 backdrop-blur-sm" />
      <div className="absolute left-1/2 top-6 h-12 w-12 -translate-x-1/2 rounded-full bg-white/40" />
      <div className="absolute left-1/2 top-12 h-14 w-16 -translate-x-1/2 rounded-3xl bg-white/70" />
      <div className="absolute left-1/2 top-24 h-12 w-24 -translate-x-1/2 rounded-3xl bg-white/60" />
      <div className="absolute left-1/2 bottom-6 h-10 w-28 -translate-x-1/2 rounded-full bg-white/40" />
    </div>
  );
}

export function GrowthProjectionPanel({ projection }: GrowthProjectionPanelProps) {
  const { tree, hero, synergy, score, energy } = projection;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 shadow-sm">
      <div className="pointer-events-none absolute -left-10 top-10 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="relative z-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-500">成长共振图谱</p>
            <h2 className="text-2xl font-semibold text-slate-900">树与勇士双生系统</h2>
          </div>
          <div className="rounded-full border border-emerald-200/60 bg-white/80 px-4 py-2 text-xs font-semibold text-emerald-600 shadow-sm">
            {synergy.title}
          </div>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          {synergy.description}
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-inner">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">成长之树</span>
                <h3 className="text-xl font-semibold text-slate-900">
                  {tree.current.icon} {tree.current.label}
                </h3>
                <p className="text-sm text-slate-600">{tree.current.headline}</p>
              </div>
              <TreeVisual stageId={tree.current.id} />
            </div>
            <p className="mt-4 text-xs text-slate-500">{tree.current.description}</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-emerald-700">
                <span>累计积分 {score}</span>
                {tree.next ? <span>距 {tree.next.label} 还差 {tree.toNext} 分</span> : <span>森林传承已开启</span>}
              </div>
              <ProgressBar progress={tree.progress} />
              {tree.next ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-600">
                  下一阶段 · {tree.next.icon} {tree.next.label}：{tree.next.headline}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-600">
                  已抵达最高阶段，树正在带动战队成为森林。
                </div>
              )}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-inner">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">勇士能量</span>
                <h3 className="text-xl font-semibold text-slate-900">
                  {hero.current.icon} {hero.current.label}
                </h3>
                <p className="text-sm text-slate-600">{hero.current.headline}</p>
              </div>
              <HeroVisual stageId={hero.current.id} />
            </div>
            <p className="mt-4 text-xs text-slate-500">{hero.current.description}</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-amber-600">
                <span>累计能量 ⚡{energy}</span>
                {hero.next ? <span>距 {hero.next.label} 还差 {hero.toNext} ⚡</span> : <span>王者之魂已觉醒</span>}
              </div>
              <ProgressBar progress={hero.progress} />
              {hero.next ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-600">
                  下一阶段 · {hero.next.icon} {hero.next.label}：{hero.next.headline}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-600">
                  已达成王者身份，能量正反哺整片森林。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
