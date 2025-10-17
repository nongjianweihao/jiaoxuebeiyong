
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { NameType, TooltipProps, ValueType } from 'recharts';

import { EnergyBoard } from '../../components/EnergyBoard';
import { db } from '../../store/db';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { classesRepo } from '../../store/repositories/classesRepo';
import type {
  ClassEntity,
  LessonLedgerEntry,
  LessonPackage,
  PaymentRecord,
  SessionRecord,
  Student,
} from '../../types';

interface MonthlyOpsPoint {
  monthKey: string;
  monthLabel: string;
  consumption: number;
  revenue: number;
  purchased: number;
}



interface SegmentRow {
  label: string;
  min: number;
  max: number;
  ratio: number;
  count: number;
}

interface ClassStat {
  id: string;
  name: string;
  coach: string;
  headcount: number;
  consumption: number;
  revenue: number;
  activeCount: number;
  avgLessons: number;
}

interface OutstandingRow {
  studentId: string;
  name: string;
  remaining: number;
  className?: string;
  purchased: number;
  consumed: number;
}

function toMonthKey(iso?: string) {
  return iso ? iso.slice(0, 7) : '';
}

function formatMonthLabel(monthKey: string) {
  if (!monthKey) return '未记录';
  const [year, month] = monthKey.split('-');
  if (!year || !month) return monthKey;
  return `${year}年${Number(month)}月`;
}

function round1(value: number) {
  return Number(value.toFixed(1));
}


function formatCurrency(amount: number) {
  return `¥ ${amount.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`;
}

function formatLessons(value: number) {
  return `${value.toFixed(1)} 课时`;
}

function MonthlyOpsTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as MonthlyOpsPoint | undefined;
  if (!data) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-3 text-xs text-slate-600 shadow">
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="mt-1">课消：{formatLessons(data.consumption)}</p>
      <p>收入：{formatCurrency(data.revenue)}</p>
      <p>课包购买：{formatLessons(data.purchased)}</p>
    </div>

    

  );
}

function SegmentTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload as SegmentRow | undefined;
  if (!datum) return null;
  return (
    <div className="rounded-xl border border-emerald-100 bg-white/95 p-3 text-xs text-slate-600 shadow">
      <p className="font-semibold text-emerald-600">{datum.label}</p>
      <p className="mt-1">人数：{datum.count} 人</p>
      <p>占比：{datum.ratio}%</p>
    </div>
  );
}

export function CommandCenterPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [packages, setPackages] = useState<LessonPackage[]>([]);
  const [ledger, setLedger] = useState<LessonLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function load() {
      setLoading(true);
      try {
        const [studentList, classList, sessionList, paymentList, packageList, ledgerList] = await Promise.all([
          studentsRepo.list(),
          classesRepo.list(),
          db.sessions.orderBy('date').toArray(),
          db.payments.orderBy('paidAt').toArray(),
          db.lessonPackages.orderBy('purchasedAt').toArray(),
          db.lessonLedger.orderBy('date').toArray(),
        ]);
        if (disposed) return;
        setStudents(studentList);
        setClasses(classList);
        setSessions(sessionList as SessionRecord[]);
        setPayments(paymentList as PaymentRecord[]);
        setPackages(packageList as LessonPackage[]);
        setLedger(ledgerList as LessonLedgerEntry[]);
      } catch (error) {
        console.error('加载运营数据失败', error);
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

  const classByStudent = useMemo(() => {
    const map = new Map<string, ClassEntity>();
    classes.forEach((cls) => {
      cls.studentIds.forEach((studentId) => map.set(studentId, cls));
    });
    return map;
  }, [classes]);

  const consumptionByStudent = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((session) => {
      const present = session.attendance.filter((entry) => entry.present).map((entry) => entry.studentId);
      if (!present.length) return;
      const overrides = new Map(session.consumeOverrides?.map((entry) => [entry.studentId, entry.consume]) ?? []);
      const base = session.lessonConsume && present.length ? session.lessonConsume / present.length : 1;
      present.forEach((studentId) => {
        const value = overrides.get(studentId) ?? base;
        map.set(studentId, (map.get(studentId) ?? 0) + value);
      });
    });
    ledger.forEach((entry) => {
      if (entry.type !== 'consume') return;
      map.set(entry.studentId, (map.get(entry.studentId) ?? 0) + entry.lessons);
    });
    return map;
  }, [sessions, ledger]);

  const paymentsByStudent = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((payment) => {
      map.set(payment.studentId, (map.get(payment.studentId) ?? 0) + payment.amount);
    });
    return map;
  }, [payments]);

  const packagesByStudent = useMemo(() => {
    const map = new Map<string, { lessons: number; amount: number }>();
    packages.forEach((pkg) => {
      const current = map.get(pkg.studentId) ?? { lessons: 0, amount: 0 };
      current.lessons += pkg.purchasedLessons;
      current.amount += pkg.price ?? 0;
      map.set(pkg.studentId, current);
    });
    return map;
  }, [packages]);

  const totalConsumption = useMemo(() => {
    let sum = 0;
    consumptionByStudent.forEach((value) => {
      sum += value;
    });
    return round1(sum);
  }, [consumptionByStudent]);

  const totalRevenue = useMemo(() => payments.reduce((sum, payment) => sum + payment.amount, 0), [payments]);

  const totalPurchasedLessons = useMemo(
    () => packages.reduce((sum, pkg) => sum + pkg.purchasedLessons, 0),
    [packages],
  );

  const remainingLessons = round1(Math.max(totalPurchasedLessons - totalConsumption, 0));
  const utilizationRate = totalPurchasedLessons
    ? Math.round((totalConsumption / totalPurchasedLessons) * 100)
    : 0;

  const activeStudents = useMemo(
    () => students.filter((student) => (consumptionByStudent.get(student.id) ?? 0) > 0).length,
    [students, consumptionByStudent],
  );
  const activeRatio = totalStudents ? Math.round((activeStudents / totalStudents) * 100) : 0;
  const avgLessonsPerActive = activeStudents ? round1(totalConsumption / activeStudents) : 0;

  const monthlySeries: MonthlyOpsPoint[] = useMemo(() => {
    if (!sessions.length && !ledger.length && !payments.length && !packages.length) return [];
    const consumptionMap = new Map<string, number>();
    sessions.forEach((session) => {
      const month = toMonthKey(session.date);
      if (!month) return;
      const sessionTotal = session.lessonConsume ?? session.attendance.filter((entry) => entry.present).length;
      consumptionMap.set(month, (consumptionMap.get(month) ?? 0) + sessionTotal);
    });
    ledger.forEach((entry) => {
      if (entry.type !== 'consume') return;
      const month = toMonthKey(entry.date);
      if (!month) return;
      consumptionMap.set(month, (consumptionMap.get(month) ?? 0) + entry.lessons);
    });
    const revenueMap = new Map<string, number>();
    payments.forEach((payment) => {
      const month = toMonthKey(payment.paidAt);
      if (!month) return;
      revenueMap.set(month, (revenueMap.get(month) ?? 0) + payment.amount);
    });
    const purchasedMap = new Map<string, number>();
    packages.forEach((pkg) => {
      const month = toMonthKey(pkg.purchasedAt);
      if (!month) return;
      purchasedMap.set(month, (purchasedMap.get(month) ?? 0) + pkg.purchasedLessons);
    });
    const keys = new Set<string>([
      ...consumptionMap.keys(),
      ...revenueMap.keys(),
      ...purchasedMap.keys(),
    ]);
    return [...keys]
      .sort()
      .map((monthKey) => ({
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        consumption: round1(consumptionMap.get(monthKey) ?? 0),
        revenue: Math.round(revenueMap.get(monthKey) ?? 0),
        purchased: round1(purchasedMap.get(monthKey) ?? 0),
      }));
  }, [sessions, ledger, payments, packages]);

  const segments: SegmentRow[] = useMemo(() => {
    const ranges: Array<Omit<SegmentRow, 'ratio' | 'count'>> = [
      { label: '≥ 12 课时', min: 12, max: Number.POSITIVE_INFINITY },
      { label: '8-11 课时', min: 8, max: 11.99 },
      { label: '4-7 课时', min: 4, max: 7.99 },
      { label: '≤ 3 课时', min: 0, max: 3.99 },
    ];
    return ranges.map((range) => {
      const count = students.filter((student) => {
        const value = consumptionByStudent.get(student.id) ?? 0;
        if (range.max === Number.POSITIVE_INFINITY) return value >= range.min;
        return value >= range.min && value <= range.max;
      }).length;
      const ratio = totalStudents ? Math.round((count / totalStudents) * 100) : 0;
      return { ...range, count, ratio };
    });
  }, [students, consumptionByStudent, totalStudents]);

  const classStats: ClassStat[] = useMemo(() => {
    return classes.map((cls) => {
      const headcount = cls.studentIds.length;
      const consumption = cls.studentIds.reduce((sum, studentId) => sum + (consumptionByStudent.get(studentId) ?? 0), 0);
      const revenue = cls.studentIds.reduce((sum, studentId) => sum + (paymentsByStudent.get(studentId) ?? 0), 0);
      const activeCount = cls.studentIds.filter((studentId) => (consumptionByStudent.get(studentId) ?? 0) > 0).length;
      return {
        id: cls.id,
        name: cls.name,
        coach: cls.coachName,
        headcount,
        consumption: round1(consumption),
        revenue,
        activeCount,
        avgLessons: headcount ? round1(consumption / headcount) : 0,
      };
    });
  }, [classes, consumptionByStudent, paymentsByStudent]);

  const outstanding: OutstandingRow[] = useMemo(() => {
    return students
      .map((student) => {
        const pkgInfo = packagesByStudent.get(student.id);
        const purchased = pkgInfo?.lessons ?? 0;
        const consumed = consumptionByStudent.get(student.id) ?? 0;
        const remaining = Math.max(purchased - consumed, 0);
        return {
          studentId: student.id,
          name: student.name,
          remaining: round1(remaining),
          className: classByStudent.get(student.id)?.name,
          purchased,
          consumed: round1(consumed),
        };
      })
      .filter((row) => row.remaining > 0.1)
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 5);
  }, [students, packagesByStudent, consumptionByStudent, classByStudent]);

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-white/85 p-8 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="uppercase tracking-[0.4em] text-slate-400">成长指挥塔</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">成长指挥塔 · 运营驾驶舱</h1>
            <p className="mt-2 text-sm text-slate-500">
              连接课消、营收、课包与学员分层的核心指标，帮助迅速定位增长机会与风险点。
            </p>
          </div>
          <div className="grid gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              累计课消 {formatLessons(totalConsumption)} · 活跃 {activeStudents} 人
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-600">
              课包利用率 {utilizationRate}% · 剩余 {formatLessons(remainingLessons)}
            </span>
          </div>
        </div>
      </header>


      
      {loading ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm text-slate-500">
          正在载入运营数据…

        </div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-4">
            <article className="rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">本季度课消</p>
              <p className="mt-4 text-3xl font-bold text-slate-900">{formatLessons(totalConsumption)}</p>
              <p className="mt-2 text-sm text-slate-500">含常规班 + 专项营的所有课消记录。</p>
            </article>
            <article className="rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">经营收入</p>
              <p className="mt-4 text-3xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
              <p className="mt-2 text-sm text-slate-500">含课包、营地与私教回款。</p>
            </article>
            <article className="rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">活跃学员</p>
              <p className="mt-4 text-3xl font-bold text-slate-900">{activeStudents} 人</p>
              <p className="mt-2 text-sm text-slate-500">占比 {activeRatio}% · 人均 {formatLessons(avgLessonsPerActive)}</p>
            </article>
            <article className="rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">课包利用率</p>
              <p className="mt-4 text-3xl font-bold text-slate-900">{utilizationRate}%</p>
              <p className="mt-2 text-sm text-slate-500">剩余 {formatLessons(remainingLessons)} · 总购 {formatLessons(totalPurchasedLessons)}</p>
            </article>
          </section>

          <section className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">课消与营收趋势</h2>
                <p className="text-sm text-slate-500">对比课消、收入与课包购买节奏，辅助排期与现金流管理。</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{monthlySeries.length} 个月</span>
            </header>
            {monthlySeries.length ? (
              <div className="h-72 rounded-2xl bg-white/60 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="monthLabel" stroke="#94a3b8" tickLine={false} />
                    <YAxis yAxisId="left" stroke="#94a3b8" tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tickLine={false} />
                    <Tooltip content={<MonthlyOpsTooltip />} />
                    <Legend verticalAlign="top" height={32} />
                    <Bar yAxisId="left" dataKey="consumption" name="课消 (课时)" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="purchased" name="课包购买 (课时)" stroke="#0ea5e9" strokeDasharray="6 3" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" name="收入 (¥)" stroke="#f97316" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-xs text-slate-500">
                尚无历史数据，录入课消与回款后即可查看趋势。
              </div>
            )}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
            <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">班级运营体检</h2>
                  <p className="text-sm text-slate-500">课消、活跃人数与营收贡献，帮助教练聚焦班级策略。</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{classes.length} 个班级</span>
              </header>
              {classStats.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">班级</th>
                        <th className="px-4 py-3 text-right font-semibold">课消</th>
                        <th className="px-4 py-3 text-right font-semibold">活跃/总人数</th>
                        <th className="px-4 py-3 text-right font-semibold">人均课时</th>
                        <th className="px-4 py-3 text-right font-semibold">营收</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                      {classStats.map((stat) => (
                        <tr key={stat.id}>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{stat.name}</div>
                            <div className="mt-1 text-[11px] text-slate-400">教练：{stat.coach}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatLessons(stat.consumption)}</td>
                          <td className="px-4 py-3 text-right">
                            {stat.activeCount}/{stat.headcount}
                          </td>
                          <td className="px-4 py-3 text-right">{formatLessons(stat.avgLessons)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(stat.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-xs text-slate-500">
                  暂无班级数据，建立班级后可查看运营体检。
                </div>
              )}
            </div>

            <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">学员课时分层</h2>
                  <p className="text-sm text-slate-500">识别高粘用户与预警梯队，制定触达策略。</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">总计 {totalStudents} 人</span>
              </header>
              {segments.length ? (
                <div className="h-72 rounded-2xl bg-white/60 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segments} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" tickLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <YAxis type="category" dataKey="label" stroke="#94a3b8" width={96} />
                      <Tooltip content={<SegmentTooltip />} />
                      <Bar dataKey="ratio" fill="#10b981" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-100 bg-white/70 p-6 text-center text-xs text-emerald-600">
                  暂无课时分层数据。
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-6 2xl:grid-cols-[1.4fr,1fr]">
            <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">班级能量荣誉榜</h2>
                  <p className="text-sm text-slate-500">实时同步能量、积分与荣誉状态，联动运营动作。</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">自动采集</span>
              </header>
              {students.length ? (
                <EnergyBoard students={students} maxCollapsedEntries={6} />
              ) : (
                <div className="rounded-3xl border border-dashed border-amber-200 bg-white/60 p-6 text-center text-xs text-amber-500">
                  暂无学员信息，添加学员后即可查看能量榜。
                </div>
              )}
            </div>

            <div className="space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg backdrop-blur">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">课包剩余预警</h2>
                  <p className="text-sm text-slate-500">提前锁定续费窗口，保障现金流稳定。</p>
                </div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-500">前5名</span>
              </header>
              {outstanding.length ? (
                <ul className="space-y-3 text-xs text-slate-600">
                  {outstanding.map((row) => (
                    <li key={row.studentId} className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                      <div className="flex items-center justify-between text-sm font-semibold text-rose-600">
                        <span>{row.name}</span>
                        <span>剩余 {formatLessons(row.remaining)}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-rose-400">{row.className ?? '未分班'}</p>
                      <p className="mt-2 text-[11px] text-rose-600/90">已消 {formatLessons(row.consumed)} · 购买 {formatLessons(row.purchased)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-rose-200 bg-white/70 p-6 text-center text-xs text-rose-500">
                  当前课包剩余量均衡，保持追踪即可。
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
