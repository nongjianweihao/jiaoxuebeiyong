import type { SessionReview, RetrospectiveActionItem, Student } from '../../types';
import { RETRO_FOCUS_TAGS, RETRO_MOODS } from '../../config/retrospective';

interface RetrospectiveCardProps {
  review: SessionReview;
  classLabel?: string;
  studentsLookup: Record<string, Student>;
  onEdit?: (review: SessionReview) => void;
  onDelete?: (review: SessionReview) => void;
  onToggleAction?: (review: SessionReview, action: RetrospectiveActionItem) => void;
  compact?: boolean;
}

export function RetrospectiveCard({
  review,
  classLabel,
  studentsLookup,
  onEdit,
  onDelete,
  onToggleAction,
  compact,
}: RetrospectiveCardProps) {
  const moodMeta = RETRO_MOODS.find((item) => item.id === review.mood) ?? RETRO_MOODS[1];
  const focusMeta = (review.focusTags ?? []).map(
    (id) => RETRO_FOCUS_TAGS.find((tag) => tag.id === id) ?? { id, label: id, icon: '🧩' },
  );
  const actions = review.nextActions ?? [];
  const wins = review.wins ?? [];
  const blockers = review.blockers ?? [];
  const experiments = review.experiments ?? [];

  return (
    <article
      className={`flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm backdrop-blur ${
        compact ? '' : 'lg:grid lg:grid-cols-[2fr,1fr]'
      }`}
    >
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {classLabel ?? '勇士训练营'} · {new Date(review.date).toLocaleDateString('zh-CN')}
            </p>
            <h3 className="text-xl font-bold text-slate-900">{review.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span
                className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold ${moodMeta.textClass}`}
              >
                <span aria-hidden="true">{moodMeta.icon}</span>
                {moodMeta.label}
              </span>
              {typeof review.energyPulse === 'number' && (
                <span className="rounded-full bg-purple-100 px-2 py-1 font-semibold text-purple-600">
                  能量感受：{review.energyPulse} / 5
                </span>
              )}
              {focusMeta.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-1 font-medium text-purple-600"
                >
                  <span aria-hidden="true">{tag.icon}</span>
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(review)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  编辑
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(review)}
                  className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-500 hover:bg-red-50"
                >
                  删除
                </button>
              )}
            </div>
          )}
        </header>

        <div className={`grid gap-4 ${compact ? 'lg:grid-cols-2' : 'md:grid-cols-3'}`}>
          <SummaryList title="今日亮点" items={wins} empty="填写今日亮点帮助积累成功模式" accent="text-emerald-500" />
          <SummaryList title="待优化点" items={blockers} empty="记录问题，下一次即有参考" accent="text-rose-500" />
          <SummaryList title="下一次尝试" items={experiments} empty="给下一次课程一个明确发力点" accent="text-purple-500" />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <h4 className="text-sm font-semibold text-slate-700">勇士闪光时刻</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {review.studentHighlights.length ? (
              review.studentHighlights.map((item) => {
                const student = studentsLookup[item.studentId];
                return (
                  <li key={item.id} className="flex items-start gap-2">
                    <span className="mt-0.5 text-base" aria-hidden="true">
                      ✨
                    </span>
                    <span>
                      <span className="font-semibold text-slate-800">{student?.name ?? '勇士'}</span>
                      <span className="mx-1 text-slate-400">·</span>
                      {item.note}
                    </span>
                  </li>
                );
              })
            ) : (
              <li className="text-slate-400">暂未记录勇士个人表现</li>
            )}
          </ul>
        </section>
      </div>

      <aside className={`flex flex-col gap-4 ${compact ? 'lg:border-l lg:border-slate-100 lg:pl-4' : ''}`}>
        <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <h4 className="text-sm font-semibold text-slate-700">行动待办</h4>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {actions.length ? (
              actions.map((action) => {
                const ownerLabel = getOwnerLabel(action, studentsLookup);
                return (
                  <li
                    key={action.id}
                    className={`flex items-start justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                      action.status === 'done' ? 'border-emerald-200 bg-emerald-50/70 text-emerald-600' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700">{ownerLabel}</p>
                      <p className="mt-1 text-slate-500">{action.content}</p>
                      {action.dueDate && (
                        <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                          截止 {new Date(action.dueDate).toLocaleDateString('zh-CN')}
                        </p>
                      )}
                    </div>
                    {onToggleAction && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleAction(
                            review,
                            action.status === 'done'
                              ? { ...action, status: 'pending' }
                              : { ...action, status: 'done' },
                          )
                        }
                        className={`h-8 w-8 rounded-full border text-sm font-semibold transition ${
                          action.status === 'done'
                            ? 'border-emerald-400 bg-emerald-500 text-white'
                            : 'border-emerald-200 text-emerald-500 hover:bg-emerald-50'
                        }`}
                        aria-label={action.status === 'done' ? '标记为未完成' : '标记为完成'}
                      >
                        {action.status === 'done' ? '✓' : '→'}
                      </button>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-slate-400">
                暂无待办，复盘专注于经验总结
              </li>
            )}
          </ul>
        </section>
        <footer className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
          最近更新：{new Date(review.updatedAt).toLocaleString('zh-CN')}
        </footer>
      </aside>
    </article>
  );
}

function SummaryList({
  title,
  items,
  empty,
  accent,
}: {
  title: string;
  items: string[];
  empty: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <h4 className={`text-sm font-semibold ${accent}`}>{title}</h4>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-start gap-2">
              <span className="mt-1 text-[10px] text-slate-400">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-400">{empty}</p>
      )}
    </div>
  );
}

function getOwnerLabel(action: RetrospectiveActionItem, studentsLookup: Record<string, Student>) {
  if (action.owner === 'coach') return '教练团队执行';
  if (action.owner === 'team') return '训练营全员协作';
  const student = action.studentId ? studentsLookup[action.studentId] : undefined;
  return student ? `${student.name} 自驱行动` : '指定勇士行动';
}
