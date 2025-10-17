import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { billingRepo } from '../../store/repositories/billingRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import type { LessonWallet, PaymentRecord, Student } from '../../types';
import type { Badge, MissionProgress } from '../../types.gamify';
import { db } from '../../store/db';

export function FinanceDashboardPage() {
  const [wallets, setWallets] = useState<LessonWallet[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [missionProgress, setMissionProgress] = useState<MissionProgress[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    async function load() {
      const [walletList, studentList, paymentList, missionList, badgeList] = await Promise.all([
        billingRepo.calcAllWallets(),
        studentsRepo.list(),
        billingRepo.listPayments(),
        db.missionsProgress.toArray(),
        db.badges.toArray(),
      ]);
      setWallets(walletList);
      setStudents(studentList);
      setPayments(paymentList);
      setMissionProgress(missionList);
      setBadges(badgeList);
    }
    void load();
  }, []);

  const totals = useMemo(() => {
    const totalPurchased = wallets.reduce((sum, wallet) => sum + wallet.totalPurchased, 0);
    const totalConsumed = wallets.reduce((sum, wallet) => sum + wallet.totalConsumed, 0);
    const totalRemaining = wallets.reduce((sum, wallet) => sum + wallet.remaining, 0);
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const payingStudents = new Set(payments.map((payment) => payment.studentId));
    const arpu = payingStudents.size ? totalRevenue / payingStudents.size : 0;
    const consumeRate = totalPurchased ? totalConsumed / totalPurchased : 0;
    return {
      totalPurchased,
      totalConsumed,
      totalRemaining,
      totalRevenue,
      arpu,
      consumeRate,
      payingCount: payingStudents.size,
    };
  }, [wallets, payments]);

  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((payment) => {
      const month = payment.paidAt.slice(0, 7);
      map.set(month, (map.get(month) ?? 0) + payment.amount);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([month, amount]) => ({ month, amount }));
  }, [payments]);

  const remainingDistribution = useMemo(() => {
    const buckets = { small: 0, medium: 0, large: 0 };
    wallets.forEach((wallet) => {
      if (wallet.remaining <= 5) buckets.small += 1;
      else if (wallet.remaining <= 10) buckets.medium += 1;
      else buckets.large += 1;
    });
    return buckets;
  }, [wallets]);

  const growthStats = useMemo(() => {
    const totalEnergy = students.reduce((sum, student) => sum + (student.energy ?? 0), 0);
    const filteredMissions = missionProgress.filter((row) => row.missionId !== 'attendance');
    const totalMissions = filteredMissions.length;
    const totalStars = filteredMissions.reduce((sum, row) => sum + row.stars, 0);
    const avgEnergy = students.length ? Math.round(totalEnergy / students.length) : 0;
    return {
      totalEnergy,
      totalMissions,
      totalStars,
      badgeCount: badges.length,
      avgEnergy,
    };
  }, [students, missionProgress, badges]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">成长指挥塔</h1>
        <p className="text-sm text-slate-500">汇总成长币、能量消耗与勇士余额，辅助制定补给策略。</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="成长币收入" value={`¥${totals.totalRevenue.toFixed(0)}`} accent="gold" />
        <MetricCard
          label="已消能量 / 总能量"
          value={`${totals.totalConsumed.toFixed(1)} / ${totals.totalPurchased.toFixed(1)}`}
          accent="sky"
        />
        <MetricCard label="剩余能量" value={`${totals.totalRemaining.toFixed(1)}`} accent="emerald" />
        <MetricCard label="勇士人数" value={`${students.length} 人`} accent="violet" />


      <MetricCard
        label={`勇士客单价（付费 ${totals.payingCount}）`}
        value={totals.payingCount ? `¥${totals.arpu.toFixed(0)}` : '—'}
        accent="rose"
      />
      <MetricCard
        label="能量消耗率"
        value={`${Math.round(totals.consumeRate * 100)}%`}
        accent="indigo"
      />
    </section>
      <section className="rounded-2xl border border-white/50 bg-white/80 p-6 shadow-lg backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-800">成长经济总览</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GrowthCard label="累计能量" value={`${growthStats.totalEnergy} ⚡`} hint="勇士总能量储备" />
          <GrowthCard
            label="已完成任务"
            value={`${growthStats.totalMissions} 次`}
            hint={`累计星级 ${growthStats.totalStars}`}
          />
          <GrowthCard label="勋章总数" value={`${growthStats.badgeCount} 枚`} hint="段位徽章点亮数" />
          <GrowthCard label="人均能量" value={`${growthStats.avgEnergy} ⚡`} hint="按勇士人数均摊" />
        </div>

      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">月度成长币趋势</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {monthlyRevenue.map((item) => (
              <li key={item.month} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{item.month}</span>
                <span>¥{item.amount.toFixed(0)}</span>
              </li>
            ))}
            {!monthlyRevenue.length && <li className="text-slate-400">暂无数据</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">剩余能量分布</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <DistributionBar label="≤5 能量" value={remainingDistribution.small} total={wallets.length} />
            <DistributionBar label="6-10 能量" value={remainingDistribution.medium} total={wallets.length} />
            <DistributionBar label=">10 能量" value={remainingDistribution.large} total={wallets.length} />
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">能量补给提醒</h2>
        <DataTable
          data={wallets.filter((wallet) => wallet.remaining <= 3)}
          columns={[
            {
              key: 'student',
              header: '勇士',
              cell: (item) => students.find((student) => student.id === item.studentId)?.name ?? '',
            },
            {
              key: 'remaining',
              header: '剩余能量',
              cell: (item) => item.remaining.toFixed(1),
            },
            {
              key: 'contact',
              header: '联系方式',
              cell: (item) => students.find((student) => student.id === item.studentId)?.guardian?.phone ?? '—',
            },
          ]}
          emptyMessage="暂无需要补给的勇士"
        />
      </section>
    </div>
  );
}

type Accent = 'gold' | 'sky' | 'emerald' | 'violet' | 'rose' | 'indigo';

function GrowthCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: Accent }) {
  const palette: Record<Accent, string> = {
    gold: 'from-amber-200 to-amber-400 text-amber-900',
    sky: 'from-sky-200 to-sky-400 text-sky-900',
    emerald: 'from-emerald-200 to-emerald-400 text-emerald-900',
    violet: 'from-violet-200 to-violet-400 text-violet-900',
    rose: 'from-rose-200 to-rose-400 text-rose-900',
    indigo: 'from-indigo-200 to-indigo-400 text-indigo-900',
  } as const;
  return (
    <div className={`rounded-xl border border-slate-200 bg-gradient-to-br ${palette[accent]} px-4 py-3 shadow-sm`}>
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function DistributionBar({ label, value, total }: { label: string; value: number; total: number }) {
  const ratio = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value} 位勇士</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}
