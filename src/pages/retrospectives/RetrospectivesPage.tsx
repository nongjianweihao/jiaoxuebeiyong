import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { classesRepo } from '../../store/repositories/classesRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { retrospectivesRepo } from '../../store/repositories/retrospectivesRepo';
import { db } from '../../store/db';
import type { ClassEntity, SessionRecord, SessionReview, Student } from '../../types';
import { RetrospectiveModal } from '../../components/retrospective/RetrospectiveModal';
import { RetrospectiveCard } from '../../components/retrospective/RetrospectiveCard';
import { RETRO_FOCUS_TAGS } from '../../config/retrospective';

export function RetrospectivesPage() {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [reviews, setReviews] = useState<SessionReview[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SessionReview | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    async function load() {
      const [classList, studentList, sessionList, reviewList] = await Promise.all([
        classesRepo.list(),
        studentsRepo.list(),
        db.sessions.toArray(),
        retrospectivesRepo.list(),
      ]);
      setClasses(classList);
      setStudents(studentList);
      setSessions(sessionList);
      setReviews(
        [...reviewList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      );
      const paramClass = searchParams.get('classId');
      if (paramClass && classList.some((cls) => cls.id === paramClass)) {
        setFilterClass(paramClass);
      }
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (filterClass === 'all') {
      next.delete('classId');
    } else {
      next.set('classId', filterClass);
    }
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClass]);

  const studentsLookup = useMemo(
    () => Object.fromEntries(students.map((student) => [student.id, student])),
    [students],
  );

  const studentsByClass = useMemo(() => {
    const map: Record<string, Student[]> = {};
    classes.forEach((cls) => {
      map[cls.id] = cls.studentIds
        .map((id) => studentsLookup[id])
        .filter((item): item is Student => Boolean(item));
    });
    return map;
  }, [classes, studentsLookup]);

  const sessionsByClass = useMemo(() => {
    const map: Record<string, SessionRecord[]> = {};
    sessions.forEach((session) => {
      if (!map[session.classId]) {
        map[session.classId] = [];
      }
      map[session.classId].push(session);
    });
    return map;
  }, [sessions]);

  const classNameLookup = useMemo(
    () => Object.fromEntries(classes.map((cls) => [cls.id, cls.name])),
    [classes],
  );

  const filteredReviews = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return reviews.filter((review) => {
      if (filterClass !== 'all' && review.classId !== filterClass) {
        return false;
      }
      if (!searchText) return true;
      const haystack = [
        review.title,
        ...(review.wins ?? []),
        ...(review.blockers ?? []),
        ...(review.experiments ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchText);
    });
  }, [reviews, filterClass, search]);

  const last7DaysCount = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return reviews.filter((review) => new Date(review.date) >= cutoff).length;
  }, [reviews]);

  const openActionCount = useMemo(
    () =>
      reviews.reduce(
        (sum, review) => sum + review.nextActions.filter((action) => action.status !== 'done').length,
        0,
      ),
    [reviews],
  );

  const celebrateRate = useMemo(() => {
    if (!reviews.length) return 0;
    const celebrateCount = reviews.filter((review) => review.mood === 'celebrate').length;
    return Math.round((celebrateCount / reviews.length) * 100);
  }, [reviews]);

  const focusLeaders = useMemo(() => {
    const counter = new Map<string, number>();
    reviews.forEach((review) => {
      review.focusTags?.forEach((tag) => {
        counter.set(tag, (counter.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [reviews]);

  const handleSave = async (review: SessionReview) => {
    await retrospectivesRepo.upsert(review);
    setReviews((prev) => {
      const exists = prev.some((item) => item.id === review.id);
      const next = exists
        ? prev.map((item) => (item.id === review.id ? review : item))
        : [...prev, review];
      return next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (review: SessionReview) => {
    const confirmed = window.confirm('确定删除这次复盘记录吗？该操作无法撤销。');
    if (!confirmed) return;
    await retrospectivesRepo.remove(review.id);
    setReviews((prev) => prev.filter((item) => item.id !== review.id));
  };

  const handleToggleAction = async (review: SessionReview, action: SessionReview['nextActions'][number]) => {
    const updated: SessionReview = {
      ...review,
      nextActions: review.nextActions.map((item) => (item.id === action.id ? action : item)),
      updatedAt: new Date().toISOString(),
    };
    await retrospectivesRepo.upsert(updated);
    setReviews((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const disableCreate = !classes.length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Review Engine</p>
          <h1 className="text-3xl font-bold text-slate-900">复盘智库</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            每次课程 3 分钟复盘：记录亮点、识别阻碍、生成下一步行动，让勇士训练营持续迭代升级。
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <select
            value={filterClass}
            onChange={(event) => setFilterClass(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">全部训练营</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="搜索亮点、阻碍或标题"
          />
          <button
            type="button"
            onClick={() => {
              if (disableCreate) {
                window.alert('请先在系统中创建训练营，再进行复盘。');
                return;
              }
              setEditing(null);
              setModalOpen(true);
            }}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:from-purple-600 hover:to-pink-600 disabled:opacity-60"
            disabled={disableCreate}
          >
            + 记录课后复盘
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-4">
        <StatCard label="近7天复盘次数" value={last7DaysCount} description="坚持复盘的天数越多，课堂越稳" accent="text-purple-600" />
        <StatCard
          label="待跟进行动"
          value={openActionCount}
          description="确保每条行动项都有闭环"
          accent="text-rose-600"
        />
        <StatCard
          label="能量爆表占比"
          value={`${celebrateRate}%`}
          description="保持高能量课堂体验"
          accent="text-emerald-600"
        />
        <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">关注焦点 TOP</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {focusLeaders.length ? (
              focusLeaders.map(([tag, count]) => {
                const meta = RETRO_FOCUS_TAGS.find((item) => item.id === tag);
                return (
                  <li key={tag} className="flex items-center justify-between rounded-2xl bg-purple-50/60 px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden="true">
                        {meta?.icon ?? '🧩'}
                      </span>
                      {meta?.label ?? tag}
                    </span>
                    <span className="text-xs font-semibold text-purple-600">{count} 次</span>
                  </li>
                );
              })
            ) : (
              <li className="rounded-2xl border border-dashed border-purple-200 px-3 py-4 text-xs text-purple-400">
                开始记录复盘即可生成关注焦点榜单
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">复盘时间线</h2>
          <p className="text-xs text-slate-400">共 {filteredReviews.length} 条记录</p>
        </div>
        <div className="space-y-6">
          {filteredReviews.length ? (
            filteredReviews.map((review) => (
              <RetrospectiveCard
                key={review.id}
                review={review}
                classLabel={classNameLookup[review.classId]}
                studentsLookup={studentsLookup}
                onEdit={(item) => {
                  setEditing(item);
                  setModalOpen(true);
                }}
                onDelete={handleDelete}
                onToggleAction={handleToggleAction}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-400">
              暂无复盘记录，点击右上角按钮开启第一次课后复盘。
            </div>
          )}
        </div>
      </section>

      <RetrospectiveModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        classes={classes}
        studentsByClass={studentsByClass}
        sessionsByClass={sessionsByClass}
        initial={editing ?? undefined}
        defaultClassId={filterClass !== 'all' ? filterClass : undefined}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  accent,
}: {
  label: string;
  value: number | string;
  description: string;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}
