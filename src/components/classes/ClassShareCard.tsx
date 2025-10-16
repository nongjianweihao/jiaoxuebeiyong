import { forwardRef } from 'react';

export interface ClassShareCardProps {
  className: string;
  coachName?: string;
  missionName?: string;
  sessionDate: string;
  presentCount: number;
  totalCount: number;
  averageStars: number | null;
  energyLeader?: { name: string; energy: number } | null;
  highlights: string[];
  focusTags: string[];
  starLeaders: Array<{ name: string; stars: number; comment?: string }>;
  absentNames: string[];
}

const formatDisplayDate = (iso: string) => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '日期待定';
  }
  return parsed.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
};

export const ClassShareCard = forwardRef<HTMLDivElement, ClassShareCardProps>(
  (
    {
      className,
      coachName,
      missionName,
      sessionDate,
      presentCount,
      totalCount,
      averageStars,
      energyLeader,
      highlights,
      focusTags,
      starLeaders,
      absentNames,
    },
    ref,
  ) => {
    const displayDate = formatDisplayDate(sessionDate);
    const avgLabel = typeof averageStars === 'number' && Number.isFinite(averageStars)
      ? averageStars.toFixed(1)
      : '-';
    const energyLabel = energyLeader ? `${energyLeader.name} · ${energyLeader.energy}` : '待结算';

    return (
      <div
        ref={ref}
        className="w-[360px] rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-slate-100 shadow-2xl"
      >
        <header className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
          <span>课后速报</span>
          <span>{displayDate}</span>
        </header>
        <h3 className="mt-3 text-2xl font-bold">{className || '勇士课堂'}</h3>
        <p className="mt-1 text-xs text-slate-400">
          主教练：{coachName || '待设置'}
          {missionName ? ` · 今日主题：${missionName}` : null}
        </p>

        <section className="mt-5 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[10px] tracking-[0.3em] text-slate-300">出勤</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {presentCount}
              <span className="text-sm text-slate-300">/{totalCount}</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[10px] tracking-[0.3em] text-slate-300">星级</p>
            <p className="mt-1 text-xl font-semibold text-white">{avgLabel}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[10px] tracking-[0.3em] text-slate-300">能量王</p>
            <p className="mt-1 text-xs font-semibold text-emerald-300">{energyLabel}</p>
          </div>
        </section>

        <section className="mt-5 rounded-2xl bg-white/5 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-300">今日亮点</h4>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-200">
            {(highlights.length ? highlights : ['课堂亮点生成中…']).map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-start gap-2">
                <span className="mt-[2px] text-pink-300">★</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl bg-white/5 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">勇士之星</h4>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-200">
            {(starLeaders.length ? starLeaders : [{ name: '敬请期待', stars: 0 }]).map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-3">
                <span className="font-semibold text-white">{item.name}</span>
                <span className="text-[10px] text-amber-200">⭐ {item.stars}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl bg-white/5 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">课后提醒</h4>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-200">
            {(focusTags.length ? focusTags : ['保持拉伸，注意恢复']).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="rounded-full bg-sky-500/10 px-2 py-1 text-[10px] font-semibold text-sky-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>

        {absentNames.length ? (
          <footer className="mt-5 text-[10px] text-slate-400">
            未到：{absentNames.join('、')}
          </footer>
        ) : (
          <footer className="mt-5 text-[10px] text-emerald-300">全员到齐，继续加油！</footer>
        )}
      </div>
    );
  },
);

ClassShareCard.displayName = 'ClassShareCard';
