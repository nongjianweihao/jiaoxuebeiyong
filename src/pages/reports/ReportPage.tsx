import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExportPdfButton } from '../../components/ExportPdfButton';
import { ProgressChart } from '../../components/ProgressChart';
import { RadarChart } from '../../components/RadarChart';
import { sessionsRepo } from '../../store/repositories/sessionsRepo';
import { studentsRepo } from '../../store/repositories/studentsRepo';
import { testsRepo } from '../../store/repositories/testsRepo';
import { trainingRepo } from '../../store/repositories/trainingRepo';
import { billingRepo } from '../../store/repositories/billingRepo';
import { pointEventsRepo } from '../../store/repositories/pointEventsRepo';
import { db } from '../../store/db';
import {
  buildFreestyleProgress,
  buildSpeedSeries,
  evalSpeedRank,
  normalizeByBenchmark,
} from '../../utils/calc';
import { buildPointsSnapshot } from '../../utils/points';
import type {
  AbilityKey,
  CycleReport,
  FitnessQuality,
  LessonWallet,
  PointEvent,
  SessionRecord,
  Student,
  TrainingQuality,
  WarriorPathNode,
  RankMove,
} from '../../types';

interface RadarView {
  normalized: Record<FitnessQuality, number>;
  reference?: Record<FitnessQuality, number>;
}

export function ReportPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId!;
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [wallet, setWallet] = useState<LessonWallet | null>(null);
  const [radarView, setRadarView] = useState<RadarView | null>(null);
  const [nodes, setNodes] = useState<WarriorPathNode[]>([]);
  const [rankMoves, setRankMoves] = useState<RankMove[]>([]);
  const [pointsSummary, setPointsSummary] = useState(() => buildPointsSnapshot([]));
  const [cycleReports, setCycleReports] = useState<CycleReport[]>([]);
  const [trainingQualities, setTrainingQualities] = useState<TrainingQuality[]>([]);

  useEffect(() => {
    async function load() {
      const [
        stu,
        allSessions,
        walletInfo,
        nodesData,
        moves,
        items,
        tests,
        events,
        cycles,
        qualities,
      ] = await Promise.all([
        studentsRepo.get(studentId),
        sessionsRepo.listByStudent(studentId),
        billingRepo.calcWallet(studentId),
        db.warriorNodes.toArray(),
        db.rankMoves.toArray(),
        db.fitnessTestItems.toArray(),
        testsRepo.listResultsByStudent(studentId),
        pointEventsRepo.listByStudent(studentId),
        trainingRepo.listCycleReportsByStudent(studentId),
        trainingRepo.listQualities(),
      ]);

      setStudent(stu ?? null);
      const relevantSessions = allSessions.filter((session) =>
        session.attendance.some((a) => a.studentId === studentId),
      );
      setSessions(relevantSessions);
      setWallet(walletInfo);
      setNodes(nodesData);
      setRankMoves(moves);
      setPointsSummary(buildPointsSnapshot(events));
      setCycleReports(cycles);
      setTrainingQualities(qualities);

      const latest = [...tests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latest && stu?.birth) {
        const age = Math.max(
          4,
          Math.floor((Date.now() - new Date(stu.birth).getTime()) / (365 * 24 * 3600 * 1000)),
        );
        const normalized: Record<FitnessQuality, number> = {} as any;
        const reference: Record<FitnessQuality, number> = {} as any;
        latest.items.forEach((entry) => {
          const item = items.find((testItem) => testItem.id === entry.itemId);
          if (!item) return;
          const { score, ref } = normalizeByBenchmark(entry.value, item.quality, age, item.unit);
          normalized[item.quality] = Math.round(score);
          if (ref?.p50 !== undefined) {
            const refScore = normalizeByBenchmark(ref.p50, item.quality, age, item.unit).score;
            reference[item.quality] = Math.round(refScore);
          }
        });
        setRadarView({ normalized, reference: Object.keys(reference).length ? reference : undefined });
      } else {
        setRadarView(null);
      }
    }
    void load();
  }, [studentId]);

  const singleSeries = useMemo(() => buildSpeedSeries(sessions, 'single', 30, studentId), [sessions, studentId]);
  const doubleSeries = useMemo(() => buildSpeedSeries(sessions, 'double', 30, studentId), [sessions, studentId]);
  const freestyleSeries = useMemo(() => {
    const lookup = Object.fromEntries(rankMoves.map((move) => [move.id, { rank: move.rank, name: move.name }]));
    return buildFreestyleProgress(sessions, nodes, studentId, lookup);
  }, [sessions, nodes, studentId, rankMoves]);

  const passesByRank = useMemo(() => {
    const map = new Map<number, Set<string>>();
    sessions.forEach((session) => {
      session.freestyle
        .filter((record) => record.studentId === studentId && record.passed)
        .forEach((record) => {
          const meta = rankMoves.find((move) => move.id === record.moveId);
          if (!meta) return;
          const set = map.get(meta.rank) ?? new Set<string>();
          set.add(meta.name);
          map.set(meta.rank, set);
        });
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([rank, set]) => ({ rank, moves: Array.from(set).sort() }));
  }, [sessions, rankMoves, studentId]);

  const bestSingle = useMemo(() => singleSeries.reduce((max, row) => Math.max(max, row.score), 0), [singleSeries]);
  const speedRank = useMemo(() => evalSpeedRank(bestSingle), [bestSingle]);

  const latestComments = useMemo(() => {
    return sessions
      .flatMap((session) =>
        session.notes
          .filter((note) => note.studentId === studentId && note.comments)
          .map((note) => ({ comment: note.comments ?? '', date: session.date })),
      )
      .slice(-5)
      .reverse();
  }, [sessions, studentId]);

  const qualityLookup = useMemo(() => {
    const map: Record<string, TrainingQuality> = {};
    trainingQualities.forEach((quality) => {
      map[quality.id] = quality;
    });
    return map;
  }, [trainingQualities]);

  const abilityOrder: AbilityKey[] = ['speed', 'power', 'coordination', 'agility', 'endurance', 'flexibility'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">勇士成长报告</h1>
          <p className="text-sm text-slate-500">
            {student?.name ?? '勇士'} · 当前段位 L{student?.currentRank ?? '-'}
          </p>
        </div>
        <ExportPdfButton targetId="report-sheet" filename={`${student?.name ?? 'student'}-report.pdf`} />
      </div>

      <section id="report-sheet" className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-700">速度段位</p>
            <p className="text-2xl font-semibold text-brand-600">L{speedRank || student?.currentRank || '-'}</p>
            <p className="text-xs text-slate-500">30秒单摇最佳 {bestSingle ? `${bestSingle} 次` : '暂无成绩'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-700">能量与积分</p>
            <p className="text-xs text-slate-500">成长能量：{wallet?.remaining ?? 0} · 勇士进阶积分：{pointsSummary.total} 分</p>
            <p className="text-xs text-slate-500">累计能量：{wallet?.totalPurchased ?? 0} · 已消耗：{wallet?.totalConsumed ?? 0}</p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">速度曲线</h2>
            <ProgressChart title="30s 单摇" series={singleSeries} />
            <ProgressChart title="30s 双摇" series={doubleSeries} />
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">花样进阶与雷达</h2>
            <ProgressChart title="勇士进阶积分" series={freestyleSeries} />
            <RadarChart
              data={radarView?.normalized}
              reference={radarView?.reference}
              valueLabel="勇士"
              referenceLabel="同龄中位数"
            />
          </div>
        </div>

        {cycleReports.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">周期成长记录</h2>
            <div className="space-y-4">
              {cycleReports
                .slice()
                .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
                .map((report) => {
                  const abilityRows = abilityOrder
                    .map((ability) => ({
                      ability,
                      before: report.abilityBefore?.[ability],
                      after: report.abilityAfter?.[ability],
                      delta:
                        typeof report.abilityAfter?.[ability] === 'number' &&
                        typeof report.abilityBefore?.[ability] === 'number'
                          ? (report.abilityAfter?.[ability] ?? 0) - (report.abilityBefore?.[ability] ?? 0)
                          : undefined,
                    }))
                    .filter((row) => row.before !== undefined || row.after !== undefined);

                  const beforeRadar: Record<FitnessQuality, number> = {} as Record<FitnessQuality, number>;
                  const afterRadar: Record<FitnessQuality, number> = {} as Record<FitnessQuality, number>;
                  abilityOrder.forEach((ability) => {
                    const before = report.abilityBefore?.[ability];
                    const after = report.abilityAfter?.[ability];
                    if (typeof before === 'number') beforeRadar[ability as FitnessQuality] = before;
                    if (typeof after === 'number') afterRadar[ability as FitnessQuality] = after;
                  });

                  const start = new Date(report.startDate).toLocaleDateString();
                  const end = new Date(report.endDate).toLocaleDateString();

                  return (
                    <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm text-slate-500">{start} - {end}</p>
                          <h3 className="text-lg font-semibold text-slate-900">{report.cycleName}</h3>
                          <p className="text-xs text-slate-400">专项速度指数：{report.sriBefore ?? '—'} → {report.sriAfter ?? '—'}</p>
                        </div>
                        <RadarChart
                          data={Object.keys(afterRadar).length ? afterRadar : undefined}
                          reference={Object.keys(beforeRadar).length ? beforeRadar : undefined}
                          valueLabel="周期后"
                          referenceLabel="周期前"
                        />
                      </div>
                      {abilityRows.length > 0 && (
                        <table className="mt-4 w-full text-left text-xs text-slate-600">
                          <thead>
                            <tr className="text-slate-400">
                              <th className="py-1 font-semibold">素质</th>
                              <th className="py-1 font-semibold">周期前</th>
                              <th className="py-1 font-semibold">周期后</th>
                              <th className="py-1 font-semibold">变化</th>
                            </tr>
                          </thead>
                          <tbody>
                            {abilityRows.map((row) => {
                              const meta = qualityLookup[row.ability];
                              return (
                                <tr key={row.ability} className="border-t border-slate-100">
                                  <td className="py-1 font-semibold text-slate-700">
                                    {meta?.icon ?? '🏋️'} {meta?.name ?? row.ability.toUpperCase()}
                                  </td>
                                  <td className="py-1">{row.before !== undefined ? Math.round(row.before) : '—'}</td>
                                  <td className="py-1">{row.after !== undefined ? Math.round(row.after) : '—'}</td>
                                  <td className={`py-1 ${row.delta && row.delta > 0 ? 'text-emerald-600' : row.delta && row.delta < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                                    {row.delta !== undefined ? `${row.delta > 0 ? '+' : ''}${row.delta.toFixed(1)}` : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div>
                          <h4 className="text-xs font-semibold text-emerald-600">亮点</h4>
                          <ul className="mt-1 space-y-1 text-xs text-slate-500">
                            {(report.highlights.length ? report.highlights : ['持续保持训练节奏，完成全部任务卡']).map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-purple-600">下周期建议</h4>
                          <ul className="mt-1 space-y-1 text-xs text-slate-500">
                            {(report.suggestions.length ? report.suggestions : ['维持测评频率，巩固节奏与爆发训练']).map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">花样通过清单</h2>
          <div className="grid gap-3">
            {passesByRank.length ? (
              passesByRank.map((group) => (
                <div key={group.rank} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">段位 L{group.rank}</p>
                  <p className="mt-1 text-xs text-slate-500">{group.moves.join(' · ')}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-slate-400">
                暂无挑战记录
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">积分与记录</h2>
          <ProgressChart
            title="积分曲线"
            series={pointsSummary.series.map((row) => ({ date: row.date, score: row.total }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs text-slate-500">积分明细</p>
              <ul className="mt-2 space-y-1 text-slate-600">
                {Object.entries(pointsSummary.breakdown).map(([type, value]) => (
                  <li key={type} className="flex items-center justify-between text-xs">
                    <span>{labelForPointType(type as PointEvent['type'])}</span>
                    <span>{value} 分</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="text-xs text-slate-500">积分流水</p>
              <ul className="mt-2 space-y-1 text-slate-600">
                {pointsSummary.series.slice(-5).reverse().map((row) => (
                  <li key={row.date} className="text-xs">
                    <span className="text-slate-400">{new Date(row.date).toLocaleDateString()} · </span>
                    <span>积分 {row.delta >= 0 ? '+' : ''}{row.delta}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">教练鼓励</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {latestComments.length ? (
              latestComments.map((item, index) => (
                <li key={`${item.date}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</div>
                  <div>{item.comment}</div>
                </li>
              ))
            ) : (
              <li className="text-slate-400">暂无鼓励记录</li>
            )}
          </ul>
        </section>
      </section>
    </div>
  );
}

function labelForPointType(type: PointEvent['type']): string {
  switch (type) {
    case 'attendance':
      return '出勤';
    case 'pr':
      return '个人纪录 (PR)';
    case 'freestyle_pass':
      return '花样通过';
    case 'excellent':
      return '作战点评（优秀）';
    case 'challenge':
      return '挑战加分';
    default:
      return type;
  }
}
