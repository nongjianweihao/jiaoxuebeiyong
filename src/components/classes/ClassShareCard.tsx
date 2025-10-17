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
  focusTags?: string[];
  starLeaders: Array<{ name: string; stars: number; comment?: string }>;
  energyLeader?: { name: string; energy: number } | null;
  absentNames?: string[];
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
      focusTags,
      starLeaders,
      energyLeader,
      absentNames,
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
    const highlightItems = highlights.length ? highlights : ['课堂亮点生成中…'];
    const focusItems = (focusTags ?? []).filter(Boolean);
    const starItems = starLeaders.length
      ? starLeaders
      : [{ name: '敬请期待', stars: 0 }];
    const allAbsent = absentNames?.filter(Boolean) ?? [];
    const trimmedComment = (coachComment ?? '').trim();
    const commentText = useMemo(() => {
      const base =
        trimmedComment
        || DEFAULT_COACH_COMMENTS[Math.floor(Math.random() * DEFAULT_COACH_COMMENTS.length)];
      const topStars = starItems
        .filter((item) => item.name && item.name !== '敬请期待')
        .slice(0, 2)
        .map((item) => {
          const value = Number.isFinite(item.stars) ? Number(item.stars).toFixed(1) : '';
          return value ? `${item.name} ${value}⭐` : item.name;
        });
      const focus = focusItems[0];
      const highlight = highlightItems[0];

      const followUps: string[] = [];
      if (topStars.length) {
        followUps.push(`重点表扬 ${topStars.join('、')}`);
      }
      if (focus) {
        followUps.push(`下堂课继续巩固「${focus}」`);
      } else if (highlight) {
        followUps.push(`保持课堂亮点「${highlight}」`);
      }

      if (!followUps.length) {
        return base;
      }
      const normalized = base.replace(/[。！？\s]+$/, '');
      return `${normalized}。${followUps.join('，')}。`;
    }, [trimmedComment, starItems, focusItems, highlightItems]);

    const reminderItems = useMemo(() => {
      const items: string[] = [];
      const focusList = focusItems.slice(0, 3);
      if (focusList.length) {
        focusList.forEach((item) => {
          items.push(`围绕「${item}」安排家庭巩固或练习`);
        });
      }
      if (highlightItems.length) {
        items.push(`和孩子聊聊课堂亮点「${highlightItems[0]}」，强化积极体验`);
      }
      if (energyLeader) {
        items.push(`表扬 ${energyLeader.name} 的能量表现，让全队都被看见`);
      }
      if (!items.length) {
        items.push('今日课程已记录，保持练习与作息节奏。');
      }
      return items;
    }, [energyLeader, focusItems, highlightItems]);

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
            <div className="rounded-2xl bg-white/10 p-3 text-white backdrop-blur">
              <p className="text-[10px] tracking-[0.3em] text-slate-300">出勤</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {presentCount}
                <span className="text-sm text-slate-300">/{totalCount}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-white backdrop-blur">
              <p className="text-[10px] tracking-[0.3em] text-slate-300">平均星级</p>
              <p className="mt-1 text-xl font-semibold text-white">{avgLabel}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-white backdrop-blur">
              <p className="text-[10px] tracking-[0.3em] text-slate-300">能量王</p>
              <p className="mt-1 text-xs font-semibold text-emerald-300">
                {energyLeader ? `${energyLeader.name} · ${energyLeader.energy}` : '待结算'}
              </p>
            </div>
          </div>

          <section className="mt-5 rounded-2xl bg-white/10 p-4 shadow-inner backdrop-blur">
            <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-200">今日亮点</h4>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-100">
              {highlightItems.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-2">
                  <span className="mt-[2px] text-pink-200">★</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl bg-white/10 p-4 shadow-inner backdrop-blur">
            <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">勇士之星</h4>
            <ul className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-100">
              {starItems.map((item, index) => {
                const rawValue = Number.isFinite(item.stars) ? Number(item.stars) : 0;
                const starCount = Math.min(5, Math.max(1, Math.round(rawValue || 0)));
                const starLabel = Number.isFinite(rawValue) ? rawValue.toFixed(1) : '-';
                return (
                  <li
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-3 py-2 backdrop-blur"
                  >
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="flex items-center gap-1 text-[11px] text-amber-200">
                      <span className="text-base leading-none">{'⭐'.repeat(starCount)}</span>
                      <span className="rounded-full bg-amber-200/10 px-2 py-[2px] text-[10px] text-amber-100">
                        {starLabel}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-4 rounded-2xl bg-white/10 p-4 shadow-inner backdrop-blur">
            <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">教练评语</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-100">{commentText}</p>
          </section>
          <section className="mt-4 rounded-2xl bg-white/10 p-4 shadow-inner backdrop-blur">
            <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">课后提醒</h4>
            <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-slate-100">
              {reminderItems.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-start gap-2 rounded-2xl bg-sky-500/15 px-3 py-2"
                >
                  <span className="mt-[2px] text-sky-200">✔</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <footer className="mt-5 text-[11px] text-slate-200">
            {allAbsent.length ? (
              <p>
                {`未到：${allAbsent.join('、')}。`}
                <span className="ml-1 text-emerald-200">期待下次并肩作战！</span>
              </p>
            ) : (
              <p className="text-emerald-200">全员到齐，保持这份专注与默契，下一堂课继续发光！</p>
            )}
          </footer>
        </section>
      </div>
    );
  },
);

ClassShareCard.displayName = 'ClassShareCard';
