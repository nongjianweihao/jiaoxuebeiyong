import classNames from 'classnames';
import type { ReactNode } from 'react';

export type MissionTypeKey = 'speed' | 'strength' | 'stamina' | 'coordination' | 'team' | 'mystery';

export interface MissionCardData {
  missionId: string;
  missionName: string;
  missionType: MissionTypeKey;
  starLevel: number;
  description: string;
  trainingFocus: string;
  energySystem: string;
  recommendedFor: string;
  skillSet?: string;
}

const missionTypeMeta: Record<MissionTypeKey, { icon: string; title: string; gradient: string; accent: string }> = {
  speed: {
    icon: '⚡',
    title: '极速挑战卡',
    gradient: 'from-yellow-200 via-orange-200 to-orange-300',
    accent: 'text-orange-500',
  },
  strength: {
    icon: '💪',
    title: '力量挑战卡',
    gradient: 'from-red-200 via-pink-200 to-rose-200',
    accent: 'text-rose-500',
  },
  stamina: {
    icon: '🔋',
    title: '耐力挑战卡',
    gradient: 'from-teal-200 via-emerald-200 to-green-200',
    accent: 'text-emerald-500',
  },
  coordination: {
    icon: '🎭',
    title: '花样挑战卡',
    gradient: 'from-indigo-200 via-violet-200 to-purple-200',
    accent: 'text-violet-500',
  },
  team: {
    icon: '🤝',
    title: '团队任务卡',
    gradient: 'from-blue-200 via-sky-200 to-cyan-200',
    accent: 'text-sky-500',
  },
  mystery: {
    icon: '🎁',
    title: '神秘任务卡',
    gradient: 'from-slate-200 via-purple-200 to-pink-200',
    accent: 'text-fuchsia-500',
  },
};

const aiRecommendedMissions: MissionCardData[] = [
  {
    missionId: 'mission-speed-01',
    missionName: '极速反应挑战',
    missionType: 'speed',
    starLevel: 3,
    description: '30 秒内完成多段折返冲刺，强化反应速度。',
    trainingFocus: '反应冲刺 / 敏捷折返',
    energySystem: '磷酸原系统',
    recommendedFor: 'Speed 等级 2-3 学员',
    skillSet: '敏捷启程套组',
  },
  {
    missionId: 'mission-strength-04',
    missionName: '力量爆发训练',
    missionType: 'strength',
    starLevel: 4,
    description: '壶铃推举结合深蹲跳，提升下肢爆发力。',
    trainingFocus: '深蹲跳 / 壶铃推举',
    energySystem: '糖酵解系统',
    recommendedFor: 'Strength 等级 3 学员',
    skillSet: '爆发力连击套组',
  },
  {
    missionId: 'mission-stamina-02',
    missionName: '耐力循环挑战',
    missionType: 'stamina',
    starLevel: 5,
    description: '波比跳 + 循环跑组合，锻炼全程耐力与心肺。',
    trainingFocus: '循环跑 / 波比间歇',
    energySystem: '有氧系统',
    recommendedFor: 'Stamina 等级 4-5 学员',
    skillSet: '长程耐力套组',
  },
];

const missionSets: Array<{
  skillSet: string;
  missions: MissionCardData[];
}> = [
  {
    skillSet: 'Speed 极速连锁',
    missions: [aiRecommendedMissions[0]],
  },
  {
    skillSet: 'Strength 力量爆发',
    missions: [aiRecommendedMissions[1]],
  },
  {
    skillSet: 'Stamina 无尽耐力',
    missions: [aiRecommendedMissions[2]],
  },
];

export function MissionShowcase({ className, footer }: { className?: string; footer?: ReactNode }) {
  return (
    <section className={classNames('space-y-10', className)}>
      <header className="rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="uppercase tracking-[0.4em] text-white/70">AI Mission</p>
            <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">AI挑战任务卡库</h2>
            <p className="mt-4 max-w-2xl text-base text-white/80">
              结合成长数据与能量反馈，为每位勇士推荐最合适的挑战。完成任务即可获取能量值、星星与勋章动画，让训练像闯关一样充满期待。
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 rounded-2xl bg-white/10 p-6 text-sm backdrop-blur">
            <span className="text-xs uppercase tracking-[0.3em] text-white/70">今日进度</span>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-black">78%</div>
              <div className="space-y-1 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-300" />完成任务 14
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-yellow-300" />待闯关 4
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-pink-300" />AI 推荐 6
                </div>
              </div>
            </div>
            <button className="mt-2 w-full rounded-xl bg-white/90 py-2 text-center text-sm font-semibold text-purple-600 shadow-md transition hover:bg-white">
              查看成长路线图
            </button>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">AI 推荐挑战</h3>
            <p className="text-sm text-slate-500">根据勇士体能表现实时生成的任务卡</p>
          </div>
          <button className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:scale-105">
            一键领取全部奖励
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {aiRecommendedMissions.map((mission) => (
            <MissionCard key={mission.missionId} mission={mission} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">能力套组连锁</h3>
        <p className="text-sm text-slate-500">完成前置任务卡即可解锁下一张挑战，持续提升成长能量</p>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {missionSets.map((set) => (
            <div key={set.skillSet} className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-white/0" aria-hidden="true" />
              <div className="relative space-y-4">
                <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Skill Set</div>
                <h4 className="text-xl font-bold text-slate-900">{set.skillSet}</h4>
                <div className="space-y-3">
                  {set.missions.map((mission) => (
                    <div key={mission.missionId} className="rounded-2xl bg-slate-50/80 p-4 shadow-inner">
                      <p className="text-sm font-medium text-slate-600">{missionTypeMeta[mission.missionType].title}</p>
                      <p className="text-base font-semibold text-slate-900">{mission.missionName}</p>
                      <p className="mt-1 text-xs text-slate-500">完成后解锁下一张任务卡</p>
                    </div>
                  ))}
                </div>
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg">
                  预览成长路线
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {footer && <div>{footer}</div>}
    </section>
  );
}

function MissionCard({ mission }: { mission: MissionCardData }) {
  const meta = missionTypeMeta[mission.missionType];

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white/90 p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
      <div
        className={classNames(
          'absolute inset-x-0 top-0 h-32 rounded-t-3xl opacity-70 blur-xl transition group-hover:opacity-90',
          `bg-gradient-to-r ${meta.gradient}`,
        )}
        aria-hidden="true"
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between">
          <span className="text-4xl" role="img" aria-label={meta.title}>
            {meta.icon}
          </span>
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {mission.missionId}
          </span>
        </div>
        <div className="mt-4 space-y-1">
          <p className={classNames('text-sm font-semibold uppercase tracking-[0.3em]', meta.accent)}>Mission</p>
          <h4 className="text-xl font-bold text-slate-900">{mission.missionName}</h4>
          <p className="text-sm text-slate-600">{mission.description}</p>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-600">
          <InfoRow label="训练焦点" value={mission.trainingFocus} />
          <InfoRow label="能量系统" value={mission.energySystem} />
          <InfoRow label="适合勇士" value={mission.recommendedFor} />
          {mission.skillSet && <InfoRow label="能力套组" value={mission.skillSet} />}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-lg text-yellow-400">
            {Array.from({ length: mission.starLevel }).map((_, index) => (
              <span key={`${mission.missionId}-star-${index}`}>⭐</span>
            ))}
          </div>
          <button className="rounded-full bg-slate-900/90 px-4 py-1 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900">
            开始挑战
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="text-right text-slate-500">{value}</span>
    </div>
  );
}
