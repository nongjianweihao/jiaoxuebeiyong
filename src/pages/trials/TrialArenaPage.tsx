


import { useEffect, useMemo, useState } from 'react';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { NameType, TooltipProps, ValueType } from 'recharts';




import { db } from '../../store/db';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { classesRepo } from '../../store/repositories/classesRepo';
import type { ClassEntity, FitnessTestItem, FitnessTestResult, Student } from '../../types';

const dimensionLabels: Record<string, string> = {
  speed: '速度',
  power: '力量',
  endurance: '耐力',
  coordination: '协调',
  agility: '灵敏',
  balance: '平衡',
  flexibility: '柔韧',
  core: '核心',
  accuracy: '准确',
  morphology: '形态',
};

interface MonthlyCoveragePoint {
  monthKey: string;
  monthLabel: string;
  coverageRate: number;
  testers: number;
  sessions: number;
}



interface SkillStat {
  itemId: string;
  name: string;
  unit?: string;
  quality?: string;
  testers: number;
  average: number;
  improvement: number;
  bestClass?: string;
}

interface RosterRow {
  id: string;
  name: string;
  className: string;
  status: '已完成' | '待安排';
  latestDate?: string;
  latestQuarter?: string;
  coachComment?: string;
  score: number | null;
  improvement: number | null;
}

interface ImprovementRow {
  studentId: string;
  name: string;
  delta: number;
  className?: string;
  latestDate?: string;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-');
  if (!year || !month) return monthKey;
  return `${year}年${Number(month)}月`;
}

function formatDateLabel(iso?: string, withYear = false) {
  if (!iso) return '暂无记录';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '暂无记录';
  return date.toLocaleDateString('zh-CN', withYear ? { year: 'numeric', month: 'long', day: 'numeric' } : { month: 'long', day: 'numeric' });
}

function safeAverage(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;

}

function compositeScore(result?: FitnessTestResult) {
  if (!result?.radar) return null;
  const values = Object.values(result.radar).filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
  if (!values.length) return null;
  return safeAverage(values);
}



function formatNumber(value: number | null, digits = 1) {
  if (value == null || Number.isNaN(value)) return '--';
  return value.toFixed(digits);
}

function CoverageTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {

  if (!active || !payload?.length) return null;
  const testers = payload.find((item) => item.dataKey === 'testers');
  const coverage = payload.find((item) => item.dataKey === 'coverageRate');
  const sessions = payload.find((item) => item.dataKey === 'sessions');
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-3 text-xs text-slate-600 shadow">
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="mt-1">覆盖率：{coverage?.value}%</p>
      <p>完成测评人数：{testers?.value} 人</p>
      <p>测评记录：{sessions?.value} 次</p>
    </div>
  );
}

function DimensionTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const datum = payload[0];
  return (
    <div className="rounded-xl border border-indigo-100 bg-white/95 p-3 text-xs text-slate-600 shadow">
      <p className="font-semibold text-indigo-600">{datum.name}</p>
      <p className="mt-1">平均得分：{datum.value}</p>
    </div>
  );
}

export function TrialArenaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [items, setItems] = useState<FitnessTestItem[]>([]);
  const [results, setResults] = useState<FitnessTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [rosterExpanded, setRosterExpanded] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function load() {
      setLoading(true);
      try {
        const [studentList, classList, itemList, resultList] = await Promise.all([
          studentsRepo.list(),
          classesRepo.list(),
          db.fitnessTestItems.toArray(),
          db.fitnessTests.orderBy('date').toArray(),
        ]);
        if (disposed) return;
        setStudents(studentList);
        setClasses(classList);
        setItems(itemList as FitnessTestItem[]);
        setResults(resultList as FitnessTestResult[]);
      } catch (error) {
        console.error('加载体能测评数据失败', error);
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      disposed = true;
    };
  }, []);

  const totalStudents = students.length;

  const classById = useMemo(() => new Map(classes.map((cls) => [cls.id, cls])), [classes]);

  const classByStudent = useMemo(() => {
    const map = new Map<string, ClassEntity>();
    classes.forEach((cls) => {
      cls.studentIds.forEach((studentId) => map.set(studentId, cls));
    });
    return map;
  }, [classes]);

  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);

  const resultsByStudent = useMemo(() => {
    const map = new Map<string, FitnessTestResult[]>();
    results.forEach((result) => {
      const list = map.get(result.studentId) ?? [];
      list.push(result);
      map.set(result.studentId, list);
    });
    map.forEach((list, key) => {
      list.sort((a, b) => a.date.localeCompare(b.date));
      map.set(key, list);
    });
    return map;
  }, [results]);

  const latestResults = useMemo(() => {
    const map = new Map<string, FitnessTestResult>();
    resultsByStudent.forEach((list, studentId) => {
      if (list.length) {
        map.set(studentId, list[list.length - 1]);
      }
    });
    return map;
  }, [resultsByStudent]);

  const previousResults = useMemo(() => {
    const map = new Map<string, FitnessTestResult>();
    resultsByStudent.forEach((list, studentId) => {
      if (list.length > 1) {
        map.set(studentId, list[list.length - 2]);
      }
    });
    return map;
  }, [resultsByStudent]);

  const coverageRate = totalStudents ? Math.round((latestResults.size / totalStudents) * 100) : 0;
  const pendingCount = Math.max(totalStudents - latestResults.size, 0);
  const lastTestDate = useMemo(() => {
    if (!results.length) return null;
    return results.reduce((latest, result) => (latest && latest > result.date ? latest : result.date), results[0].date);
  }, [results]);

  const compositeAverage = useMemo(() => {
    const scores: number[] = [];
    latestResults.forEach((result) => {
      const score = compositeScore(result);
      if (score != null) {
        scores.push(score);
      }
    });
    if (!scores.length) return null;
    return parseFloat(safeAverage(scores).toFixed(1));
  }, [latestResults]);

  const monthlySeries: MonthlyCoveragePoint[] = useMemo(() => {
    if (!results.length) return [];
    const map = new Map<string, { results: number; testers: Set<string> }>();
    results.forEach((result) => {
      const monthKey = result.date.slice(0, 7);
      const bucket = map.get(monthKey) ?? { results: 0, testers: new Set<string>() };
      bucket.results += 1;
      bucket.testers.add(result.studentId);
      map.set(monthKey, bucket);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, bucket]) => ({
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        coverageRate: totalStudents ? Math.round((bucket.testers.size / totalStudents) * 100) : 0,
        testers: bucket.testers.size,
        sessions: bucket.results,
      }));
  }, [results, totalStudents]);

  const dimensionAverages = useMemo(() => {
    const totals = new Map<string, { sum: number; count: number }>();
    latestResults.forEach((result) => {
      Object.entries(result.radar ?? {}).forEach(([quality, value]) => {
        if (typeof value !== 'number' || Number.isNaN(value)) return;
        const bucket = totals.get(quality) ?? { sum: 0, count: 0 };
        bucket.sum += value;
        bucket.count += 1;
        totals.set(quality, bucket);
      });
    });
    return Array.from(totals.entries())
      .map(([quality, { sum, count }]) => ({
        quality,
        label: dimensionLabels[quality] ?? quality,
        value: count ? parseFloat((sum / count).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [latestResults]);

  const improvementLeaders: ImprovementRow[] = useMemo(() => {
    const rows: ImprovementRow[] = [];
    students.forEach((student) => {
      const latest = latestResults.get(student.id);
      const previous = previousResults.get(student.id);
      if (!latest || !previous) return;
      const latestScore = compositeScore(latest);
      const previousScore = compositeScore(previous);
      if (latestScore == null || previousScore == null) return;
      rows.push({
        studentId: student.id,
        name: student.name,
        delta: parseFloat((latestScore - previousScore).toFixed(1)),
        className: classByStudent.get(student.id)?.name,
        latestDate: latest.date,
      });
    });
    return rows.sort((a, b) => b.delta - a.delta).slice(0, 4);
  }, [students, latestResults, previousResults, classByStudent]);

  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const skillStats: SkillStat[] = useMemo(() => {
    if (!items.length) return [];
    const totals = new Map<string, { sum: number; count: number; classTotals: Map<string, { sum: number; count: number }>; improvements: number[] }>();

    latestResults.forEach((result, studentId) => {
      result.items.forEach(({ itemId, value }) => {
        const stat = totals.get(itemId) ?? {
          sum: 0,
          count: 0,
          classTotals: new Map<string, { sum: number; count: number }>(),
          improvements: [] as number[],
        };
        stat.sum += value;
        stat.count += 1;
        const classId = classByStudent.get(studentId)?.id;
        if (classId) {
          const classStat = stat.classTotals.get(classId) ?? { sum: 0, count: 0 };
          classStat.sum += value;
          classStat.count += 1;
          stat.classTotals.set(classId, classStat);
        }
        totals.set(itemId, stat);
      });
    });

    resultsByStudent.forEach((list) => {
      if (list.length < 2) return;
      const previous = list[list.length - 2];
      const latest = list[list.length - 1];
      latest.items.forEach((item) => {
        const previousItem = previous.items.find((entry) => entry.itemId === item.itemId);
        if (!previousItem) return;
        const stat = totals.get(item.itemId);
        if (stat) {
          stat.improvements.push(item.value - previousItem.value);
        }
      });
    });

    return Array.from(totals.entries())
      .map(([itemId, stat]) => {
        const item = itemMap.get(itemId);
        let bestClass: string | undefined;
        let bestAverage = -Infinity;
        stat.classTotals.forEach((value, classId) => {
          if (!value.count) return;
          const avg = value.sum / value.count;
          if (avg > bestAverage) {
            bestAverage = avg;
            bestClass = classById.get(classId)?.name ?? classId;
          }
        });
        const average = stat.count ? stat.sum / stat.count : 0;
        const improvement = stat.improvements.length
          ? stat.improvements.reduce((sum, value) => sum + value, 0) / stat.improvements.length
          : 0;
        return {
          itemId,
          name: item?.name ?? itemId,
          unit: item?.unit,
          quality: item?.quality,
          testers: stat.count,
          average: parseFloat(average.toFixed(1)),
          improvement: parseFloat(improvement.toFixed(1)),
          bestClass,
        };
      })
      .sort((a, b) => b.average - a.average);
  }, [items, latestResults, resultsByStudent, classByStudent, classById, itemMap]);

  const classAssessments = useMemo(() => {
    return classes.map((cls) => {
      const roster = cls.studentIds
        .map((studentId) => studentById.get(studentId))
        .filter((student): student is Student => Boolean(student));
      const tested = roster.filter((student) => latestResults.has(student.id));
      const coverage = roster.length ? Math.round((tested.length / roster.length) * 100) : 0;
      let compositeTotal = 0;
      let compositeCount = 0;
      let lastDate: string | undefined;
      tested.forEach((student) => {
        const result = latestResults.get(student.id);
        const score = compositeScore(result);
        if (score != null) {
          compositeTotal += score;
          compositeCount += 1;
        }
        if (result?.date && (!lastDate || result.date > lastDate)) {
          lastDate = result.date;
        }
      });
      return {
        id: cls.id,
        name: cls.name,
        headcount: roster.length,
        coverage,
        testedCount: tested.length,
        averageScore: compositeCount ? parseFloat((compositeTotal / compositeCount).toFixed(1)) : null,
        lastTestDate: lastDate,
      };
    });
  }, [classes, studentById, latestResults]);

  const rosterRows: RosterRow[] = useMemo(() => {
    return students
      .map((student) => {
        const latest = latestResults.get(student.id);
        const previous = previousResults.get(student.id);
        const score = compositeScore(latest);
        const improvement = latest && previous ? compositeScore(latest)! - (compositeScore(previous) ?? 0) : null;
        return {
          id: student.id,
          name: student.name,
          className: classByStudent.get(student.id)?.name ?? '未分班',
          status: latest ? '已完成' : '待安排',
          latestDate: latest?.date,
          latestQuarter: latest?.quarter,
          coachComment: latest?.coachComment,
          score: score != null ? parseFloat(score.toFixed(1)) : null,
          improvement: improvement != null ? parseFloat(improvement.toFixed(1)) : null,
        };
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === '待安排' ? 1 : -1;
        if (a.latestDate && b.latestDate) return b.latestDate.localeCompare(a.latestDate);
        if (a.latestDate) return -1;
        if (b.latestDate) return 1;
        return a.name.localeCompare(b.name, 'zh-CN');
      });
  }, [students, latestResults, previousResults, classByStudent]);

  const visibleRoster = rosterExpanded ? rosterRows : rosterRows.slice(0, 6);
  const hasMoreRoster = rosterRows.length > 6;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/85 p-8 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="uppercase tracking-[0.4em] text-slate-400">Warrior Performance Lab</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">勇士试炼场 · 体能测评塔</h1>
            <p className="mt-2 text-sm text-slate-500">
              实时汇总学员测评覆盖率、专项指标与班级体能表现，帮助教练精准安排下一轮测评计划。
            </p>
          </div>
          <div className="grid gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              总学员 {totalStudents} 人 · 覆盖 {coverageRate}%
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-600">
              最近测评 {lastTestDate ? formatDateLabel(lastTestDate, true) : '尚未开展'}
            </span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm text-slate-500">
          正在加载体能测评数据…
        </div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-[0.3em] text-slate-400">覆盖率</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">测评进行中</span>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-900">{coverageRate}%</p>
              <p className="mt-2 text-sm text-slate-500">已完成 {latestResults.size} / {totalStudents} 名勇士的体能测评。</p>
            </article>
            <article className="rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-[0.3em] text-slate-400">综合得分</span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">雷达均值</span>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-900">{formatNumber(compositeAverage)}</p>
              <p className="mt-2 text-sm text-slate-500">结合 10 大体能维度的最新雷达均分。</p>
            </article>
            <article className="rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold uppercase tracking-[0.3em] text-slate-400">待安排</span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-600">提醒排期</span>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-900">{pendingCount} 人</p>
              <p className="mt-2 text-sm text-slate-500">尚未完成本周期测评的勇士，建议优先跟进。</p>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
            <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">测评进度</h2>
                  <p className="text-sm text-slate-500">按月追踪覆盖率与测评场次，辅助排期节奏。</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">最近 {monthlySeries.length} 个月</span>
              </header>
              {monthlySeries.length ? (
                <div className="h-64 rounded-2xl bg-white/60 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="monthLabel" stroke="#94a3b8" tickLine={false} />
                      <YAxis yAxisId="left" stroke="#94a3b8" tickLine={false} tickFormatter={(value) => `${value}%`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tickLine={false} />
                      <Tooltip content={<CoverageTooltip />} />
                      <Legend verticalAlign="top" height={32} />
                      <Line yAxisId="left" type="monotone" dataKey="coverageRate" stroke="#6366f1" strokeWidth={3} name="覆盖率" />
                      <Line yAxisId="right" type="monotone" dataKey="testers" stroke="#0ea5e9" strokeWidth={2} name="测评人数" />
                      <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="#f97316" strokeWidth={2} strokeDasharray="6 3" name="测评次数" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-xs text-slate-500">
                  尚无测评记录，完成首次测评后即可查看趋势。
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-900">进步最快的勇士</h3>
                {improvementLeaders.length ? (
                  <ul className="mt-3 grid gap-3 md:grid-cols-2">
                    {improvementLeaders.map((row) => (
                      <li key={row.studentId} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-700">
                        <div className="flex items-center justify-between text-sm font-semibold text-emerald-700">
                          <span>{row.name}</span>
                          <span>+{row.delta} 分</span>
                        </div>
                        <p className="mt-1 text-[11px] text-emerald-500">{row.className ?? '未分班'}</p>
                        <p className="mt-2 leading-relaxed text-emerald-700/80">最新测评：{formatDateLabel(row.latestDate)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">等待第二次测评后即可自动计算进步幅度。</p>
                )}
              </div>
            </div>

            <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">体能维度雷达</h2>
                  <p className="text-sm text-slate-500">展示当前雷达均分，定位优势与短板。</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-500">最新测评</span>
              </header>
              {dimensionAverages.length ? (
                <>
                  <div className="h-72 rounded-2xl bg-white/60 p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={dimensionAverages} outerRadius="70%">
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <Tooltip content={<DimensionTooltip />} />
                        <Radar name="体能维度" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {dimensionAverages.map((dimension) => (
                      <li key={dimension.quality} className="flex items-center justify-between rounded-xl bg-indigo-50/50 px-3 py-2">
                        <span>{dimension.label}</span>
                        <span className="font-semibold text-indigo-600">{dimension.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-indigo-100 bg-white/70 p-6 text-center text-xs text-indigo-500">
                  暂无雷达数据，完成测评后自动生成。
                </div>
              )}
            </div>
          </section>

          <section className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">专项测评指标</h2>
                <p className="text-sm text-slate-500">基于最新测评结果的专项平均值与进步幅度。</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">含 {skillStats.length} 项</span>
            </header>
            {skillStats.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">专项指标</th>
                      <th className="px-4 py-3 text-right font-semibold">平均</th>
                      <th className="px-4 py-3 text-right font-semibold">平均进步</th>
                      <th className="px-4 py-3 text-right font-semibold">测评人数</th>
                      <th className="px-4 py-3 text-left font-semibold">表现最佳班级</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {skillStats.map((stat) => (
                      <tr key={stat.itemId}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{stat.name}</div>
                          <div className="mt-1 text-[11px] text-slate-400">维度：{stat.quality ?? '未标注'} · 单位：{stat.unit ?? '--'}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatNumber(stat.average)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">{formatNumber(stat.improvement)}</td>
                        <td className="px-4 py-3 text-right">{stat.testers}</td>
                        <td className="px-4 py-3">{stat.bestClass ?? '尚无班级完成'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-xs text-slate-500">
                当前暂无专项测评数据，请安排测评任务后查看表现。
              </div>
            )}
          </section>

          <section className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">班级体能概览</h2>
                <p className="text-sm text-slate-500">统计每个班级的测评覆盖率与综合得分。</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">{classes.length} 个班级</span>
            </header>
            {classAssessments.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {classAssessments.map((cls) => (
                  <article key={cls.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-slate-800">{cls.name}</h3>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs text-slate-500">{cls.headcount} 人</span>
                    </div>
                    <div className="grid gap-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>覆盖率</span>
                        <span className="font-semibold text-emerald-600">{cls.coverage}% ({cls.testedCount}/{cls.headcount})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>综合体能</span>
                        <span className="font-semibold text-indigo-600">{formatNumber(cls.averageScore)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>最近测评</span>
                        <span>{formatDateLabel(cls.lastTestDate)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-xs text-slate-500">
                暂无班级信息，创建班级后即可查看测评概览。
              </div>
            )}
          </section>

          <section className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
            <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">学员测评清单</h2>
                <p className="text-sm text-slate-500">支持折叠的测评名单，便于快速查看待安排学员。</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">共 {rosterRows.length} 位</span>
            </header>
            {rosterRows.length ? (
              <>
                <ul className="space-y-4">
                  {visibleRoster.map((row) => (
                    <li key={row.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{row.name}</p>
                          <p className="text-xs text-slate-400">{row.className}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`rounded-full px-3 py-1 font-medium ${
                            row.status === '已完成'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {row.status}
                          </span>
                          {row.score != null && (
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">综合 {formatNumber(row.score)}</span>
                          )}
                          {row.improvement != null && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">提升 {formatNumber(row.improvement)}</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                        <div>最近测评：{formatDateLabel(row.latestDate)}</div>
                        <div>测评周期：{row.latestQuarter ?? '待安排'}</div>
                        <div>教练备注：{row.coachComment ?? '暂无'}</div>
                      </div>
                    </li>
                  ))}
                </ul>
                {hasMoreRoster ? (
                  <button
                    type="button"
                    onClick={() => setRosterExpanded((prev) => !prev)}
                    className="w-full rounded-2xl border border-dashed border-slate-300 bg-white/70 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white"
                  >
                    {rosterExpanded ? '收起学员清单' : `展开全部 ${rosterRows.length} 位学员`}
                  </button>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-xs text-slate-500">
                暂无学员数据，请先在成长营中添加勇士。
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
