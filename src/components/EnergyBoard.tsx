import { useEffect, useMemo, useState } from 'react';
import type { PointEvent, Student } from '../types';
import type { MissionProgress, EnergyLog } from '../types.gamify';
import { db } from '../store/db';
import { buildPointsSnapshot } from '../utils/points';
import { evaluateGrowthProjection, type GrowthProjectionState } from '../utils/growthProjection';


import { StudentAvatar } from './StudentAvatar';


interface EnergyBoardProps {
  students: Student[];
}

interface LeaderboardEntry {
  id: string;
  name: string;
  rank?: number;
  energy: number;
  weeklyEnergy: number;
  points: number;
  honorTitle?: string;
  projection: GrowthProjectionState;

  
  avatarUrl?: string;
  avatarPresetId?: string;

}

function groupByStudent<T extends { studentId: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const list = map.get(item.studentId) ?? [];
    list.push(item);
    map.set(item.studentId, list);
  });
  return map;
}

function pickLatestHonor(records: MissionProgress[]): string | undefined {
  let latest: { title: string; at: string } | undefined;
  records.forEach((record) => {
    if (!record.honorTitle || record.status !== 'completed') return;
    const timestamp = record.completedAt ?? record.date;
    if (!latest || timestamp > latest.at) {
      latest = { title: record.honorTitle, at: timestamp };
    }
  });
  return latest?.title;
}

function sumWeeklyEnergy(logs: EnergyLog[]): number {
  if (!logs.length) return 0;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const iso = cutoff.toISOString();
  return logs.reduce((sum, log) => {
    if (log.createdAt >= iso) {
      return sum + log.delta;
    }
    return sum;
  }, 0);
}

function formatHonorLabel(honor?: string) {
  return honor ? `荣誉「${honor}」` : '荣誉待点亮';
}

export function EnergyBoard({ students }: EnergyBoardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function load() {
      if (!students.length) {
        setEntries([]);
        return;
      }

      setLoading(true);

      try {
        const studentIds = students.map((student) => student.id);

        const [pointEvents, missionProgress, energyLogs] = await Promise.all([
          db.pointEvents.where('studentId').anyOf(studentIds).toArray(),
          db.missionsProgress.where('studentId').anyOf(studentIds).toArray(),
          db.energyLogs.where('studentId').anyOf(studentIds).toArray(),
        ]);

        if (disposed) return;

        const pointMap = groupByStudent(pointEvents as PointEvent[]);
        const missionMap = groupByStudent(missionProgress as MissionProgress[]);
        const energyMap = groupByStudent(energyLogs as EnergyLog[]);

        const nextEntries = students.map((student) => {
          const energy = student.energy ?? 0;
          const studentPoints = pointMap.get(student.id) ?? [];
          const { total } = buildPointsSnapshot(studentPoints);
          const projection = evaluateGrowthProjection(total, energy);
          const weeklyEnergy = sumWeeklyEnergy(energyMap.get(student.id) ?? []);
          const honorTitle = pickLatestHonor(missionMap.get(student.id) ?? []);

          return {
            id: student.id,
            name: student.name,
            rank: student.currentRank,
            energy,
            weeklyEnergy,
            points: total,
            honorTitle,
            projection,

            
            avatarUrl: student.avatarUrl,
            avatarPresetId: student.avatarPresetId,

          };
        });

        if (!disposed) {
          setEntries(nextEntries);
        }
      } catch (error) {
        console.error('加载能量榜数据失败', error);
        if (!disposed) {
          setEntries([]);
        }
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
  }, [students]);

  const leaderboard = useMemo(
    () =>
      [...entries]
        .sort((a, b) => {
          if (b.energy !== a.energy) return b.energy - a.energy;
          if (b.points !== a.points) return b.points - a.points;
          return (b.weeklyEnergy ?? 0) - (a.weeklyEnergy ?? 0);
        })
        .slice(0, 5),
    [entries],
  );

  const honorCount = useMemo(() => entries.filter((entry) => Boolean(entry.honorTitle)).length, [entries]);
  const averageEnergy = useMemo(() => {
    if (!students.length) return 0;
    const total = students.reduce((sum, student) => sum + (student.energy ?? 0), 0);
    return Math.round(total / students.length);
  }, [students]);
  const averagePoints = useMemo(() => {
    if (!entries.length) return 0;
    const total = entries.reduce((sum, entry) => sum + entry.points, 0);
    return Math.round(total / entries.length);
  }, [entries]);
  const leadingSynergy = leaderboard[0]?.projection.synergy;

  return (
    <div className="rounded-3xl border border-amber-100/80 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-amber-500">Coach View</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">班级能量荣誉榜</h2>
          <p className="mt-1 text-xs text-slate-500">
            聚焦能量、积分与荣誉三条线，让每位勇士都在榜上看到自己的成长信号。
          </p>
        </div>
        <div className="grid gap-2 text-right text-xs text-slate-500">
          <span className="inline-flex items-center justify-end gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-amber-600 shadow">
            ⚡ 班均能量 {averageEnergy}
          </span>
          <span className="inline-flex items-center justify-end gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-emerald-600 shadow">
            🌳 人均积分 {averagePoints}
          </span>
          <span className="inline-flex items-center justify-end gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-violet-600 shadow">
            🏅 荣誉点亮 {honorCount}
          </span>
        </div>
      </div>

      {leadingSynergy ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/70 px-4 py-3 text-xs text-emerald-600">
          <span className="font-semibold">班级共鸣 · {leadingSynergy.title}</span>
          <span className="ml-2 text-emerald-500/70">{leadingSynergy.description}</span>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {loading && !leaderboard.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-xs text-slate-400">
            正在同步勇士数据…
          </div>
        ) : null}

        {!loading && !leaderboard.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-xs text-slate-400">
            暂无能量记录，派发挑战或签到即可点亮第一位勇士。
          </div>
        ) : null}

        {leaderboard.map((entry, index) => (
          <div
            key={entry.id}
            className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/90 px-5 py-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    index === 0
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  #{index + 1}
                </span>

                
                <StudentAvatar
                  name={entry.name}
                  avatarUrl={entry.avatarUrl}
                  avatarPresetId={entry.avatarPresetId}
                  size="sm"
                  badge={entry.rank ? `L${entry.rank}` : undefined}
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">{entry.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    段位 L{entry.rank ?? '-'} · {formatHonorLabel(entry.honorTitle)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-amber-600">⚡ {entry.energy}</p>
                <p className="text-xs text-slate-500">近7天 +{entry.weeklyEnergy}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">
                {entry.projection.tree.current.icon} {entry.projection.tree.current.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-600">
                {entry.projection.hero.current.icon} {entry.projection.hero.current.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                🎯 勇士进阶积分 {entry.points}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-sky-600">
                🔥 动能共振 {entry.projection.synergy.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
