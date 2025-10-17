import { forwardRef, useMemo } from 'react';

const DEFAULT_COACH_COMMENTS = [
  '今天状态很好，动作连贯流畅！',
  '勇士们配合默契，势头正旺！',
  '节奏紧凑，保持这股冲劲！',
  '表现很稳，继续冲刺新目标！',
];

export interface ClassShareCardProps {
  className: string;
  weekLabel?: string | null;
  sessionDate: string;
  missionName?: string;
  coachName?: string;
  tags?: string[];
  presentCount: number;
  totalCount: number;
  averageStars: number | null;
  highlights: string[];
  starLeaders: Array<{ name: string; stars: number; comment?: string }>;
  badges?: string[];
  coachComment?: string | null;
}

const formatDisplayDate = (iso: string) => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '日期待定';
  }
  return parsed
    .toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\./g, '/');
};

export const ClassShareCard = forwardRef<HTMLDivElement, ClassShareCardProps>(
  (
    {
      className,
      missionName,
      coachName,
      weekLabel,
      sessionDate,
      tags,
      presentCount,
      totalCount,
      averageStars,
      highlights,
      starLeaders,
      badges,
      coachComment,
    },
    ref,
  ) => {
    const displayDate = formatDisplayDate(sessionDate);
    const avgLabel =
      typeof averageStars === 'number' && Number.isFinite(averageStars)
        ? averageStars.toFixed(1)
        : '-';
    const headerTags = (tags ?? []).filter(Boolean).slice(0, 2);
    const highlightItems = (highlights.length ? highlights : ['课堂亮点生成中…']).slice(0, 3);
    const starItems = (starLeaders.length
      ? starLeaders
      : [{ name: '敬请期待', stars: 0 }]
    ).slice(0, 3);
    const badgeItems = (badges ?? []).filter(Boolean).slice(0, 3);
    const trimmedComment = (coachComment ?? '').trim();
    const commentText = useMemo(() => {
      const base = trimmedComment
        || DEFAULT_COACH_COMMENTS[Math.floor(Math.random() * DEFAULT_COACH_COMMENTS.length)];
      return base.slice(0, 24);
    }, [trimmedComment]);

    return (
      <div
        ref={ref}
        className="w-[360px] overflow-hidden rounded-[24px] bg-slate-900 text-slate-100 shadow-2xl"
      >
        <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-6 py-5 text-white">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-white/80">课后分享卡</p>
          <h3 className="mt-2 text-2xl font-black">{className || '勇士课堂'}</h3>
          <p className="mt-1 text-xs text-white/80">
            {weekLabel ? `${weekLabel}｜` : ''}
            {displayDate}
            {headerTags.length ? `｜${headerTags.join(' × ')}` : ''}
          </p>
          {missionName ? (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium text-white">
              🎯 今日主题：{missionName}
            </p>
          ) : null}
        </header>

        <section className="px-6 pb-6 pt-5">
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-2xl bg-white/8 p-3 backdrop-blur">
              <p className="text-[10px] tracking-[0.3em] text-slate-300">出勤</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {presentCount}
                <span className="text-sm text-slate-300">/{totalCount}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/8 p-3 backdrop-blur">
              <p className="text-[10px] tracking-[0.3em] text-slate-300">平均星级</p>
              <p className="mt-1 text-xl font-semibold text-white">{avgLabel}</p>
            </div>
            <div className="rounded-2xl bg-white/8 p-3 backdrop-blur">
              <p className="text-[10px] tracking-[0.3em] text-slate-300">教练</p>
              <p className="mt-1 text-xs font-semibold text-emerald-300">{coachName || '待设置'}</p>
            </div>
          </div>

          <section className="mt-5 rounded-2xl bg-white/5 p-4 shadow-inner">
            <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">今日亮点</h4>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-100">
              {highlightItems.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-2">
                  <span className="mt-[2px] text-sky-200">✨</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl bg-white/5 p-4 shadow-inner">
            <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">勇士之星</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-100">
              {starItems.map((item, index) => {
                const rawValue = Number.isFinite(item.stars) ? Number(item.stars) : 0;
                const starCount = Math.min(5, Math.max(1, Math.round(rawValue || 0)));
                const starLabel = Number.isFinite(rawValue) ? rawValue.toFixed(1) : '-';
                return (
                  <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-[11px] text-amber-200">{'⭐'.repeat(starCount)} {starLabel}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {badgeItems.length ? (
            <section className="mt-4 rounded-2xl bg-white/5 p-4 shadow-inner">
              <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-200">今日徽章</h4>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                {badgeItems.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-400/20 to-fuchsia-400/30 px-3 py-1 font-semibold text-fuchsia-100"
                  >
                    🎖 {badge}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-4 rounded-2xl bg-white/5 p-4 shadow-inner">
            <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">教练评语</h4>
            <p className="mt-2 text-sm font-medium text-slate-100">{commentText}</p>
          </section>
        </section>

        <footer className="flex items-center justify-between gap-3 bg-slate-950/70 px-6 py-4 text-[10px] text-slate-300">
          <div className="flex items-center gap-2">
            <img
              src="https://pic1.imgdb.cn/item/689c291858cb8da5c8205636.png"
              alt="品牌Logo"
              className="h-8 w-8 rounded-full border border-white/20 object-contain"
            />
            <div>
              <p className="font-semibold text-white">扫码查看成长曲线</p>
              <p className="text-[10px] text-slate-400">关注公众号了解更多课程</p>
            </div>
          </div>
          <img
            src="https://pic1.imgdb.cn/item/689c29ca58cb8da5c8205753.png"
            alt="课程二维码"
            className="h-12 w-12 rounded-lg border border-white/10 object-contain"
          />
        </footer>
      </div>
    );
  },
);

ClassShareCard.displayName = 'ClassShareCard';
